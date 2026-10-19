// Adapted from the CEF binary distribution sample `tests/cefsimple`.
// Original copyright (c) 2013 The Chromium Embedded Framework Authors.
// Licensed under the BSD-style license shipped with the CEF distribution.
//
// Note: upstream cefsimple splits the platform-specific parts into
// simple_handler_win.cc / _linux.cc / _mac.mm. This project is Windows-only for
// now, so the Windows bits live at the bottom of this file behind an OS_WIN
// guard.

#include "simple_handler.h"

// OS_WIN comes from include/base/cef_build.h, pulled in by simple_handler.h
// above, so this guard must come *after* that include.
#if defined(OS_WIN)
#include <windows.h>
#endif

#include <sstream>
#include <string>

#include "include/base/cef_callback.h"
#include "include/cef_app.h"
#include "include/cef_parser.h"
#include "include/views/cef_browser_view.h"
#include "include/views/cef_window.h"
#include "include/wrapper/cef_closure_task.h"
#include "include/wrapper/cef_helpers.h"
#include "simple_app.h"  // For the NotifyTab* functions.
#include "storage.h"

namespace my_browser {

namespace {

BrowserHandler* g_instance = nullptr;

// Custom context menu command IDs. CEF reserves everything below
// MENU_ID_USER_FIRST for Chromium's own items.
enum ContextMenuCommand {
  kMenuIdToggleBookmark = MENU_ID_USER_FIRST,
  kMenuIdCopyLinkAddress,
  kMenuIdSaveImageAs,
};

#if defined(OS_WIN)
// CEF has no clipboard API, so use the Win32 one directly.
void CopyTextToClipboard(const CefString& text) {
  const std::wstring wide = text.ToWString();
  if (wide.empty() || !::OpenClipboard(nullptr)) {
    return;
  }
  ::EmptyClipboard();

  const size_t bytes = (wide.size() + 1) * sizeof(wchar_t);
  if (HGLOBAL handle = ::GlobalAlloc(GMEM_MOVEABLE, bytes)) {
    if (void* buffer = ::GlobalLock(handle)) {
      memcpy(buffer, wide.c_str(), bytes);
      ::GlobalUnlock(handle);
      // The clipboard owns |handle| after this succeeds; do not free it.
      if (!::SetClipboardData(CF_UNICODETEXT, handle)) {
        ::GlobalFree(handle);
      }
    } else {
      ::GlobalFree(handle);
    }
  }
  ::CloseClipboard();
}
#endif  // defined(OS_WIN)

// Returns a data: URI with the specified contents.
std::string GetDataURI(const std::string& data, const std::string& mime_type) {
  return "data:" + mime_type + ";base64," +
         CefURIEncode(CefBase64Encode(data.data(), data.size()), false)
             .ToString();
}

}  // namespace

BrowserHandler::BrowserHandler(bool is_alloy_style)
    : is_alloy_style_(is_alloy_style) {
  DCHECK(!g_instance);
  g_instance = this;
}

BrowserHandler::~BrowserHandler() {
  g_instance = nullptr;
}

// static
BrowserHandler* BrowserHandler::GetInstance() {
  return g_instance;
}

void BrowserHandler::OnTitleChange(CefRefPtr<CefBrowser> browser,
                                   const CefString& title) {
  CEF_REQUIRE_UI_THREAD();

  // Remember the title so OnLoadEnd() can file it with the history entry, and
  // patch it into history when it arrives after the visit was recorded.
  browser_titles_[browser->GetIdentifier()] = title;
  if (auto frame = browser->GetMainFrame()) {
    const std::string url = frame->GetURL();
    if (!url.empty() && !IsInternalPageUrl(url)) {
      History().UpdateNewestTitle(url, title);
    }
  }

  // Tabs own their own label, and only the active tab renames the window.
  if (NotifyTabTitleChanged(browser, title)) {
    return;
  }

  // Not a tab: a popup living in a plain CEF window.
  if (auto browser_view = CefBrowserView::GetForBrowser(browser)) {
    CefRefPtr<CefWindow> window = browser_view->GetWindow();
    if (window) {
      window->SetTitle(title);
    }
  } else if (is_alloy_style_) {
    // Set the title of the window using platform APIs.
    PlatformTitleChange(browser, title);
  }
}

void BrowserHandler::OnAddressChange(CefRefPtr<CefBrowser> browser,
                                     CefRefPtr<CefFrame> frame,
                                     const CefString& url) {
  CEF_REQUIRE_UI_THREAD();

  // CEF fires this for every frame. Iframes navigate on their own and their
  // URLs do not belong in the address bar, so ignore anything but the main
  // frame. This is what makes clicking a link update the address bar.
  if (!frame->IsMain()) {
    return;
  }

  // The window decides what to do with this: a background tab navigating must
  // not touch the address bar, which belongs to whichever tab is on screen.
  NotifyTabAddressChanged(browser, url);
}

void BrowserHandler::OnAfterCreated(CefRefPtr<CefBrowser> browser) {
  CEF_REQUIRE_UI_THREAD();

  // Sanity-check the configured runtime style.
  CHECK_EQ(is_alloy_style_ ? CEF_RUNTIME_STYLE_ALLOY : CEF_RUNTIME_STYLE_CHROME,
           browser->GetHost()->GetRuntimeStyle());

  // Add to the list of existing browsers.
  browser_list_.push_back(browser);
}

bool BrowserHandler::DoClose(CefRefPtr<CefBrowser> browser) {
  CEF_REQUIRE_UI_THREAD();

  // Closing the main window requires special handling. See the DoClose()
  // documentation in the CEF header for a detailed description of this process.
  if (browser_list_.size() == 1) {
    // Set a flag to indicate that the window close should be allowed.
    is_closing_ = true;
  }

  // Allow the close. For windowed browsers this will result in the OS close
  // event being sent.
  return false;
}

void BrowserHandler::OnBeforeClose(CefRefPtr<CefBrowser> browser) {
  CEF_REQUIRE_UI_THREAD();

  // Remove from the list of existing browsers.
  BrowserList::iterator bit = browser_list_.begin();
  for (; bit != browser_list_.end(); ++bit) {
    if ((*bit)->IsSame(browser)) {
      browser_list_.erase(bit);
      break;
    }
  }

  browser_titles_.erase(browser->GetIdentifier());

  // Let the window drop this tab's views now that the browser is really gone,
  // and pick a neighbouring tab to show.
  NotifyTabClosed(browser);

  if (browser_list_.empty()) {
    // All browsers have closed. Quit the application message loop.
    CefQuitMessageLoop();
  }
}

void BrowserHandler::OnLoadingStateChange(CefRefPtr<CefBrowser> browser,
                                          bool isLoading,
                                          bool canGoBack,
                                          bool canGoForward) {
  CEF_REQUIRE_UI_THREAD();

  // CEF hands us canGoBack/canGoForward directly, so there is no need to call
  // browser->CanGoBack() ourselves. This fires on every navigation start and
  // finish, which is exactly when the history state can change. The window
  // drops it unless this browser is the active tab.
  NotifyTabLoadingStateChanged(browser, canGoBack, canGoForward);
}

bool BrowserHandler::OnBeforeDownload(
    CefRefPtr<CefBrowser> browser,
    CefRefPtr<CefDownloadItem> download_item,
    const CefString& suggested_name,
    CefRefPtr<CefBeforeDownloadCallback> callback) {
  CEF_REQUIRE_UI_THREAD();

  // Returning true is not optional here: with Alloy style, returning false
  // means "default handling", and Alloy's default is to cancel the download.
  //
  // show_dialog=false saves straight into the Downloads folder. Pass true to
  // get the system "Save As" dialog instead.
  callback->Continue(UniqueDownloadPath(suggested_name), /*show_dialog=*/false);
  return true;
}

void BrowserHandler::OnDownloadUpdated(
    CefRefPtr<CefBrowser> browser,
    CefRefPtr<CefDownloadItem> download_item,
    CefRefPtr<CefDownloadItemCallback> callback) {
  CEF_REQUIRE_UI_THREAD();

  std::string name = download_item->GetSuggestedFileName();
  if (name.empty()) {
    // Falls back to the name CEF actually settled on.
    const std::string full_path = download_item->GetFullPath();
    const size_t slash = full_path.find_last_of("\\/");
    name = (slash == std::string::npos) ? full_path
                                        : full_path.substr(slash + 1);
  }
  if (name.empty()) {
    name = "download";
  }

  NotifyDownloadUpdated(download_item->GetId(), name,
                        download_item->GetPercentComplete(),
                        download_item->IsComplete(),
                        download_item->IsCanceled());
}

void BrowserHandler::OnBeforeContextMenu(CefRefPtr<CefBrowser> browser,
                                         CefRefPtr<CefFrame> frame,
                                         CefRefPtr<CefContextMenuParams> params,
                                         CefRefPtr<CefMenuModel> model) {
  CEF_REQUIRE_UI_THREAD();

  // |model| arrives holding Chromium's default items. Nothing is removed here,
  // so Back/Forward/Reload/View source/Inspect stay where they were; our items
  // are inserted at the top with a separator beneath them.
  size_t index = 0;

  if (params->GetTypeFlags() & CM_TYPEFLAG_LINK) {
    model->InsertItemAt(index++, kMenuIdCopyLinkAddress, "Copy link address");
  }

  if (params->GetMediaType() == CM_MEDIATYPE_IMAGE &&
      !params->GetSourceUrl().empty()) {
    model->InsertItemAt(index++, kMenuIdSaveImageAs, "Save image as...");
  }

  const std::string page_url = params->GetPageUrl();
  if (!page_url.empty() && !IsInternalPageUrl(page_url)) {
    model->InsertItemAt(
        index++, kMenuIdToggleBookmark,
        Bookmarks().Contains(page_url) ? "Remove bookmark" : "Add to bookmark");
  }

  if (index > 0) {
    model->InsertSeparatorAt(index);
  }
}

bool BrowserHandler::OnContextMenuCommand(
    CefRefPtr<CefBrowser> browser,
    CefRefPtr<CefFrame> frame,
    CefRefPtr<CefContextMenuParams> params,
    int command_id,
    EventFlags event_flags) {
  CEF_REQUIRE_UI_THREAD();

  switch (command_id) {
    case kMenuIdCopyLinkAddress:
#if defined(OS_WIN)
      CopyTextToClipboard(params->GetLinkUrl());
#endif
      return true;

    case kMenuIdSaveImageAs:
      // Goes through the same OnBeforeDownload path as any other download.
      browser->GetHost()->StartDownload(params->GetSourceUrl());
      return true;

    case kMenuIdToggleBookmark: {
      const std::string url = params->GetPageUrl();
      if (Bookmarks().Contains(url)) {
        Bookmarks().Remove(url);
      } else {
        const auto it = browser_titles_.find(browser->GetIdentifier());
        const std::string title =
            (it != browser_titles_.end() && !it->second.empty()) ? it->second
                                                                 : url;
        Bookmarks().Add(url, title);
      }
      // Keep the star button in sync with what just happened.
      NotifyBookmarksChanged();
      return true;
    }

    default:
      return false;  // Let Chromium handle its own items.
  }
}

void BrowserHandler::OnLoadEnd(CefRefPtr<CefBrowser> browser,
                               CefRefPtr<CefFrame> frame,
                               int httpStatusCode) {
  CEF_REQUIRE_UI_THREAD();

  // Sub-frames load too; only the page the user navigated to is a visit.
  if (!frame->IsMain()) {
    return;
  }

  const std::string url = frame->GetURL();
  // Skip our own generated pages and the data: URI error page from
  // OnLoadError, neither of which is somewhere the user went.
  if (url.empty() || IsInternalPageUrl(url) || url.starts_with("data:")) {
    return;
  }

  const auto it = browser_titles_.find(browser->GetIdentifier());
  History().Add(url, it != browser_titles_.end() ? it->second : std::string());
}

void BrowserHandler::OnLoadError(CefRefPtr<CefBrowser> browser,
                                 CefRefPtr<CefFrame> frame,
                                 ErrorCode errorCode,
                                 const CefString& errorText,
                                 const CefString& failedUrl) {
  CEF_REQUIRE_UI_THREAD();

  // Allow Chrome to show the error page.
  if (!is_alloy_style_) {
    return;
  }

  // Don't display an error for downloaded files.
  if (errorCode == ERR_ABORTED) {
    return;
  }

  // Display a load error message using a data: URI.
  std::stringstream ss;
  ss << "<html><body bgcolor=\"white\">"
        "<h2>Failed to load URL "
     << std::string(failedUrl) << " with error " << std::string(errorText)
     << " (" << errorCode << ").</h2></body></html>";

  frame->LoadURL(GetDataURI(ss.str(), "text/html"));
}

void BrowserHandler::ShowMainWindow() {
  if (!CefCurrentlyOn(TID_UI)) {
    // Execute on the UI thread.
    CefPostTask(TID_UI, base::BindOnce(&BrowserHandler::ShowMainWindow, this));
    return;
  }

  if (browser_list_.empty()) {
    return;
  }

  auto main_browser = browser_list_.front();

  if (auto browser_view = CefBrowserView::GetForBrowser(main_browser)) {
    // Show the window using the Views framework.
    if (auto window = browser_view->GetWindow()) {
      window->Show();
    }
  } else if (is_alloy_style_) {
    PlatformShowWindow(main_browser);
  }
}

void BrowserHandler::CloseAllBrowsers(bool force_close) {
  if (!CefCurrentlyOn(TID_UI)) {
    // Execute on the UI thread.
    CefPostTask(TID_UI, base::BindOnce(&BrowserHandler::CloseAllBrowsers, this,
                                       force_close));
    return;
  }

  if (browser_list_.empty()) {
    return;
  }

  for (const auto& browser : browser_list_) {
    browser->GetHost()->CloseBrowser(force_close);
  }
}

#if defined(OS_WIN)

// Platform-specific implementations. Only reached in Alloy style (i.e. when
// launched with `--use-native`); in Chrome/Views style the CefWindow APIs above
// handle this instead.

void BrowserHandler::PlatformTitleChange(CefRefPtr<CefBrowser> browser,
                                         const CefString& title) {
  CefWindowHandle hwnd = browser->GetHost()->GetWindowHandle();
  if (hwnd) {
    SetWindowText(hwnd, std::wstring(title).c_str());
  }
}

void BrowserHandler::PlatformShowWindow(CefRefPtr<CefBrowser> browser) {
  CefWindowHandle hwnd = browser->GetHost()->GetWindowHandle();
  if (hwnd) {
    ShowWindow(hwnd, SW_SHOW);
    SetForegroundWindow(hwnd);
  }
}

#endif  // defined(OS_WIN)

}  // namespace my_browser
