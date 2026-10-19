#include "storage.h"

#include <windows.h>

#include <objbase.h>
#include <shlobj.h>

#include <cstdlib>
#include <ctime>
#include <filesystem>
#include <fstream>
#include <iterator>
#include <sstream>

#include "include/base/cef_logging.h"
#include "include/cef_parser.h"
#include "include/cef_values.h"

namespace my_browser {

namespace {

// History is capped so the file stays small and the full rewrite below stays
// cheap. Bookmarks are not capped.
//
// ponytail: whole-file rewrite on every visit, O(n) per page load. Fine at a
// few thousand entries (tens of KB); move to SQLite if history needs search,
// deduplication, or to grow past this cap.
constexpr size_t kMaxHistoryEntries = 2000;

// Used when settings.json has no new_tab_url yet.
constexpr char kDefaultNewTabUrl[] = "https://www.google.com";

std::filesystem::path StorageDirPath() {
  std::filesystem::path dir;
  if (const wchar_t* local_app_data = _wgetenv(L"LOCALAPPDATA")) {
    dir = std::filesystem::path(local_app_data) / L"my_browser" / L"storage";
  } else {
    dir = std::filesystem::temp_directory_path() / L"my_browser_storage";
  }
  std::error_code ec;
  std::filesystem::create_directories(dir, ec);
  return dir;
}

std::string ToUtf8(const std::filesystem::path& path) {
  const std::u8string utf8 = path.u8string();
  return std::string(utf8.begin(), utf8.end());
}

std::filesystem::path FromUtf8(const std::string& text) {
  return std::filesystem::path(
      std::u8string(reinterpret_cast<const char8_t*>(text.data()), text.size()));
}

// The user's real Downloads folder, which is not always %USERPROFILE%\Downloads
// -- it can be relocated, so ask the shell rather than guessing.
std::filesystem::path DownloadsDirPath() {
  std::filesystem::path dir;

  PWSTR known_path = nullptr;
  if (SUCCEEDED(SHGetKnownFolderPath(FOLDERID_Downloads, 0, nullptr,
                                     &known_path)) &&
      known_path) {
    dir = known_path;
  }
  if (known_path) {
    CoTaskMemFree(known_path);
  }

  if (dir.empty()) {
    if (const wchar_t* profile = _wgetenv(L"USERPROFILE")) {
      dir = std::filesystem::path(profile) / L"Downloads";
    }
  }
  if (dir.empty()) {
    dir = std::filesystem::temp_directory_path();
  }

  std::error_code ec;
  std::filesystem::create_directories(dir, ec);
  return dir;
}

// |name| arrives from the server (Content-Disposition), so it is untrusted.
// Path separators are replaced rather than kept, so a name like
// "..\..\Startup\evil.exe" cannot escape the Downloads folder.
std::string SanitizeFileName(const std::string& name) {
  std::string out;
  out.reserve(name.size());
  for (const char c : name) {
    switch (c) {
      case '/':
      case '\\':
      case ':':
      case '*':
      case '?':
      case '"':
      case '<':
      case '>':
      case '|':
        out += '_';
        break;
      default:
        out += (static_cast<unsigned char>(c) < 0x20) ? '_' : c;
        break;
    }
  }
  // Leading dots and spaces are trouble on Windows, and ".." must not survive.
  size_t start = 0;
  while (start < out.size() && (out[start] == '.' || out[start] == ' ')) {
    ++start;
  }
  out.erase(0, start);
  if (out.empty()) {
    out = "download";
  }
  return out;
}

std::string HtmlEscape(const std::string& text) {
  std::string out;
  out.reserve(text.size());
  for (const char c : text) {
    switch (c) {
      case '&': out += "&amp;"; break;
      case '<': out += "&lt;"; break;
      case '>': out += "&gt;"; break;
      case '"': out += "&quot;"; break;
      case '\'': out += "&#39;"; break;
      default: out += c; break;
    }
  }
  return out;
}

// "C:\a b\c.html" -> "file:///C:/a%20b/c.html"
std::string FileUrlFromPath(const std::string& utf8_path) {
  std::string url = "file:///";
  for (const char c : utf8_path) {
    switch (c) {
      case '\\': url += '/'; break;
      case ' ': url += "%20"; break;
      case '%': url += "%25"; break;
      case '#': url += "%23"; break;
      case '?': url += "%3F"; break;
      default: url += c; break;
    }
  }
  return url;
}

std::string FormatTime(double time_seconds) {
  const std::time_t seconds = static_cast<std::time_t>(time_seconds);
  std::tm local{};
  if (localtime_s(&local, &seconds) != 0) {
    return std::string();
  }
  char buffer[32] = {};
  std::strftime(buffer, sizeof(buffer), "%Y-%m-%d %H:%M", &local);
  return buffer;
}

std::string BuildListHtml(const std::string& heading,
                          const std::vector<Entry>& entries) {
  std::ostringstream out;
  out << "<!doctype html><html><head><meta charset=\"utf-8\"><title>"
      << HtmlEscape(heading) << "</title><style>"
         "body{font:14px system-ui,sans-serif;margin:24px;color:#202124}"
         "h1{font-size:20px}"
         "ol{list-style:none;padding:0}"
         "li{padding:8px 0;border-bottom:1px solid #eee}"
         "a{color:#1a0dab;text-decoration:none}a:hover{text-decoration:underline}"
         ".when{color:#70757a;font-size:12px;margin-right:10px}"
         ".url{color:#5f6368;font-size:12px}"
         "@media(prefers-color-scheme:dark){"
         "body{background:#202124;color:#e8eaed}"
         "li{border-bottom-color:#3c4043}a{color:#8ab4f8}"
         ".when,.url{color:#9aa0a6}}"
         "</style></head><body><h1>"
      << HtmlEscape(heading) << " (" << entries.size() << ")</h1>";

  if (entries.empty()) {
    out << "<p class=\"url\">Nothing here yet.</p>";
  } else {
    out << "<ol>";
    // Newest first.
    for (auto it = entries.rbegin(); it != entries.rend(); ++it) {
      const std::string& label = it->title.empty() ? it->url : it->title;
      out << "<li><span class=\"when\">" << HtmlEscape(FormatTime(it->time_seconds))
          << "</span><a href=\"" << HtmlEscape(it->url) << "\">"
          << HtmlEscape(label) << "</a><div class=\"url\">"
          << HtmlEscape(it->url) << "</div></li>";
    }
    out << "</ol>";
  }

  out << "</body></html>";
  return out.str();
}

}  // namespace

EntryStore::EntryStore(std::string file_name, size_t max_entries)
    : file_name_(std::move(file_name)), max_entries_(max_entries) {
  Load();
}

void EntryStore::Load() {
  const std::filesystem::path path = StorageDirPath() / file_name_;
  std::ifstream in(path, std::ios::binary);
  if (!in) {
    return;  // First run: no file yet.
  }
  const std::string text((std::istreambuf_iterator<char>(in)),
                         std::istreambuf_iterator<char>());
  if (text.empty()) {
    return;
  }

  // CEF ships a JSON parser, so no extra dependency is needed for this.
  CefRefPtr<CefValue> root =
      CefParseJSON(text.data(), text.size(), JSON_PARSER_RFC);
  if (!root || root->GetType() != VTYPE_LIST) {
    LOG(WARNING) << "Ignoring malformed " << file_name_;
    return;
  }

  CefRefPtr<CefListValue> list = root->GetList();
  for (size_t i = 0; i < list->GetSize(); ++i) {
    CefRefPtr<CefDictionaryValue> item = list->GetDictionary(i);
    if (!item) {
      continue;
    }
    Entry entry;
    entry.url = item->GetString("url").ToString();
    entry.title = item->GetString("title").ToString();
    entry.time_seconds = item->GetDouble("time");
    if (!entry.url.empty()) {
      entries_.push_back(entry);
    }
  }
}

void EntryStore::Save() {
  CefRefPtr<CefListValue> list = CefListValue::Create();
  for (size_t i = 0; i < entries_.size(); ++i) {
    CefRefPtr<CefDictionaryValue> item = CefDictionaryValue::Create();
    item->SetString("url", entries_[i].url);
    item->SetString("title", entries_[i].title);
    item->SetDouble("time", entries_[i].time_seconds);
    list->SetDictionary(i, item);
  }

  CefRefPtr<CefValue> root = CefValue::Create();
  root->SetList(list);

  const std::filesystem::path path = StorageDirPath() / file_name_;
  std::ofstream out(path, std::ios::binary | std::ios::trunc);
  if (!out) {
    LOG(ERROR) << "Could not write " << file_name_;
    return;
  }
  out << CefWriteJSON(root, JSON_WRITER_PRETTY_PRINT).ToString();
}

void EntryStore::Add(const std::string& url, const std::string& title) {
  if (url.empty()) {
    return;
  }
  Entry entry;
  entry.url = url;
  entry.title = title;
  entry.time_seconds = static_cast<double>(std::time(nullptr));
  entries_.push_back(entry);

  if (max_entries_ > 0 && entries_.size() > max_entries_) {
    entries_.erase(entries_.begin(),
                   entries_.begin() + (entries_.size() - max_entries_));
  }
  Save();
}

void EntryStore::Clear() {
  if (entries_.empty()) {
    return;
  }
  entries_.clear();
  Save();
}

void EntryStore::Remove(const std::string& url) {
  const size_t before = entries_.size();
  std::erase_if(entries_,
                [&url](const Entry& entry) { return entry.url == url; });
  if (entries_.size() != before) {
    Save();
  }
}

bool EntryStore::Contains(const std::string& url) const {
  for (const Entry& entry : entries_) {
    if (entry.url == url) {
      return true;
    }
  }
  return false;
}

void EntryStore::UpdateNewestTitle(const std::string& url,
                                   const std::string& title) {
  for (auto it = entries_.rbegin(); it != entries_.rend(); ++it) {
    if (it->url == url) {
      if (it->title != title) {
        it->title = title;
        Save();
      }
      return;
    }
  }
}

PrefStore::PrefStore() {
  Load();
}

void PrefStore::Load() {
  const std::filesystem::path path = StorageDirPath() / "settings.json";
  std::ifstream in(path, std::ios::binary);
  if (!in) {
    return;  // First run: defaults apply.
  }
  const std::string text((std::istreambuf_iterator<char>(in)),
                         std::istreambuf_iterator<char>());
  if (text.empty()) {
    return;
  }

  CefRefPtr<CefValue> root =
      CefParseJSON(text.data(), text.size(), JSON_PARSER_RFC);
  if (!root || root->GetType() != VTYPE_DICTIONARY) {
    LOG(WARNING) << "Ignoring malformed settings.json";
    return;
  }

  CefRefPtr<CefDictionaryValue> dict = root->GetDictionary();
  CefDictionaryValue::KeyList keys;
  if (!dict->GetKeys(keys)) {
    return;
  }
  // Every key is read back, including ones this build does not know about, so
  // settings written by a newer build survive a downgrade.
  for (const CefString& key : keys) {
    values_[key.ToString()] = dict->GetString(key).ToString();
  }
}

void PrefStore::Save() {
  CefRefPtr<CefDictionaryValue> dict = CefDictionaryValue::Create();
  for (const auto& [key, value] : values_) {
    dict->SetString(key, value);
  }
  CefRefPtr<CefValue> root = CefValue::Create();
  root->SetDictionary(dict);

  const std::filesystem::path path = StorageDirPath() / "settings.json";
  std::ofstream out(path, std::ios::binary | std::ios::trunc);
  if (!out) {
    LOG(ERROR) << "Could not write settings.json";
    return;
  }
  out << CefWriteJSON(root, JSON_WRITER_PRETTY_PRINT).ToString();
}

std::string PrefStore::Get(const std::string& key,
                           const std::string& fallback) const {
  const auto it = values_.find(key);
  return (it == values_.end() || it->second.empty()) ? fallback : it->second;
}

void PrefStore::Set(const std::string& key, const std::string& value) {
  values_[key] = value;
  Save();
}

EntryStore& History() {
  static EntryStore store("history.json", kMaxHistoryEntries);
  return store;
}

PrefStore& Preferences() {
  static PrefStore store;
  return store;
}

std::string NewTabUrl() {
  return Preferences().Get(kPrefNewTabUrl, kDefaultNewTabUrl);
}

EntryStore& Bookmarks() {
  static EntryStore store("bookmarks.json", 0);
  return store;
}

std::string StorageDir() {
  return ToUtf8(StorageDirPath());
}

std::string DownloadsDir() {
  return ToUtf8(DownloadsDirPath());
}

std::string UniqueDownloadPath(const std::string& suggested_name) {
  const std::filesystem::path dir = DownloadsDirPath();
  const std::filesystem::path name = FromUtf8(SanitizeFileName(suggested_name));

  std::filesystem::path candidate = dir / name;
  std::error_code ec;
  if (!std::filesystem::exists(candidate, ec)) {
    return ToUtf8(candidate);
  }

  // "report.pdf" -> "report (2).pdf". Never silently overwrite a file the user
  // already has.
  const std::filesystem::path stem = name.stem();
  const std::filesystem::path extension = name.extension();
  for (int n = 2; n < 1000; ++n) {
    std::filesystem::path attempt = stem;
    attempt += L" (" + std::to_wstring(n) + L")";
    attempt += extension;
    candidate = dir / attempt;
    if (!std::filesystem::exists(candidate, ec)) {
      break;
    }
  }
  return ToUtf8(candidate);
}

std::string WriteListPage(const std::string& file_name,
                          const std::string& heading,
                          const std::vector<Entry>& entries) {
  const std::filesystem::path path = StorageDirPath() / file_name;
  std::ofstream out(path, std::ios::binary | std::ios::trunc);
  if (out) {
    out << BuildListHtml(heading, entries);
  } else {
    LOG(ERROR) << "Could not write " << file_name;
  }
  return FileUrlFromPath(ToUtf8(path));
}

bool IsInternalPageUrl(const std::string& url) {
  const std::string prefix = FileUrlFromPath(StorageDir());
  return url.starts_with(prefix);
}

void RunStorageSelfCheck() {
#if DCHECK_IS_ON()
  DCHECK_EQ("a&amp;b", HtmlEscape("a&b"));
  DCHECK_EQ("&lt;script&gt;", HtmlEscape("<script>"));
  DCHECK_EQ("&quot;hi&quot;", HtmlEscape("\"hi\""));
  DCHECK_EQ("plain", HtmlEscape("plain"));

  DCHECK_EQ("file:///C:/a/b.html", FileUrlFromPath("C:\\a\\b.html"));
  DCHECK_EQ("file:///C:/a%20b/c.html", FileUrlFromPath("C:\\a b\\c.html"));

  DCHECK_EQ("report.pdf", SanitizeFileName("report.pdf"));
  // A server-supplied name must not be able to climb out of the folder: every
  // separator is replaced, so what is left is a single harmless file name.
  DCHECK_EQ("_.._Startup_evil.exe", SanitizeFileName("..\\..\\Startup\\evil.exe"));
  DCHECK_EQ("_.._.._Startup_evil.exe", SanitizeFileName("/../../Startup/evil.exe"));
  DCHECK_EQ("a_b.txt", SanitizeFileName("a:b.txt"));
  DCHECK_EQ("download", SanitizeFileName("   "));
  DCHECK_EQ("download", SanitizeFileName(""));

  // Round-trip a scratch store. An empty URL must never become an entry.
  {
    EntryStore probe("selfcheck.json", 0);
    probe.Add("", "ignored");
    DCHECK(probe.entries().empty());
    probe.Add("https://example.com/", "Example");
    DCHECK(probe.Contains("https://example.com/"));
    probe.UpdateNewestTitle("https://example.com/", "Renamed");
    DCHECK_EQ("Renamed", probe.entries().back().title);
    probe.Remove("https://example.com/");
    DCHECK(probe.entries().empty());
    probe.Add("https://a.test/", "A");
    probe.Add("https://b.test/", "B");
    probe.Clear();
    DCHECK(probe.entries().empty());
  }
  // Don't leave scratch files sitting in the user's data directory.
  std::error_code ec;
  std::filesystem::remove(StorageDirPath() / "selfcheck.json", ec);
#endif
}

}  // namespace my_browser
