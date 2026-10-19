// Local persistence for history and bookmarks.

#ifndef MY_BROWSER_SRC_STORAGE_H_
#define MY_BROWSER_SRC_STORAGE_H_

#include <map>
#include <string>
#include <vector>

namespace my_browser {

struct Entry {
  std::string url;
  std::string title;
  double time_seconds = 0;  // Unix epoch, seconds.
};

// A list of {url, title, time} persisted as a JSON array. Loaded once on first
// use and rewritten in full on every change. See the note in storage.cpp for
// why rewriting the whole file is good enough here.
//
// Browser process UI thread only -- there is no locking.
class EntryStore {
 public:
  // |max_entries| of 0 means unlimited; anything else drops the oldest entries
  // once the list grows past it.
  EntryStore(std::string file_name, size_t max_entries);

  // Oldest first.
  const std::vector<Entry>& entries() const { return entries_; }

  void Add(const std::string& url, const std::string& title);
  void Remove(const std::string& url);
  void Clear();
  bool Contains(const std::string& url) const;

  // Fills in the title of the newest entry for |url|. Page titles often arrive
  // after the visit has already been recorded.
  void UpdateNewestTitle(const std::string& url, const std::string& title);

 private:
  void Load();
  void Save();

  const std::string file_name_;
  const size_t max_entries_;
  std::vector<Entry> entries_;
};

// User settings, persisted as a JSON object next to history.json.
//
// Deliberately a plain string key/value map rather than a struct with named
// fields: adding a setting later means adding a key and a default, with no
// change to the file format and no migration for files written by an older
// build. Unknown keys in the file are preserved.
class PrefStore {
 public:
  PrefStore();

  std::string Get(const std::string& key, const std::string& fallback) const;
  void Set(const std::string& key, const std::string& value);

 private:
  void Load();
  void Save();

  std::map<std::string, std::string> values_;
};

// Known setting keys.
inline constexpr char kPrefNewTabUrl[] = "new_tab_url";

// Process-wide stores.
EntryStore& History();
EntryStore& Bookmarks();
PrefStore& Preferences();

// The configured new tab URL, or the built-in default if none is set.
std::string NewTabUrl();

// Directory holding history.json, bookmarks.json and the generated pages.
// Created on first use.
std::string StorageDir();

// The user's Downloads folder. Created on first use.
std::string DownloadsDir();

// Full path to save a download under, inside DownloadsDir(). |suggested_name|
// comes from the server, so it is stripped of anything that could escape the
// folder, and a " (2)" suffix is added rather than overwriting an existing file.
std::string UniqueDownloadPath(const std::string& suggested_name);

// Renders |entries| newest-first into an HTML file inside StorageDir() and
// returns a file:// URL for it.
std::string WriteListPage(const std::string& file_name,
                          const std::string& heading,
                          const std::vector<Entry>& entries);

// True for the pages WriteListPage() generates. They must not be recorded as
// history themselves.
bool IsInternalPageUrl(const std::string& url);

// Asserts on the string handling above. No-op in Release.
void RunStorageSelfCheck();

}  // namespace my_browser

#endif  // MY_BROWSER_SRC_STORAGE_H_
