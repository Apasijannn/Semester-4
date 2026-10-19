// Adapted from the CEF binary distribution sample `tests/cefsimple`.
// Original copyright (c) 2013 The Chromium Embedded Framework Authors.
// Licensed under the BSD-style license shipped with the CEF distribution.

#ifndef MY_BROWSER_SRC_SIMPLE_APP_H_
#define MY_BROWSER_SRC_SIMPLE_APP_H_

#include <cstdint>
#include <string>

#include "include/cef_app.h"
#include "include/cef_browser.h"

namespace my_browser {

// IDs assigned to the Views that make up the window, so they can be found again
// later with CefView::GetViewForID(). 0 is the default ID for every view, so
// real IDs start at 1.
//
// Tab strip buttons deliberately have no ID: tabs come and go, so they are
// matched by object identity (CefView::IsSame) instead.
enum ViewId {
  kWindowViewId = 1,
  kAddressBarViewId,
  kBackButtonViewId,
  kForwardButtonViewId,
  kReloadButtonViewId,
  kNewTabButtonViewId,
  kBookmarkStarViewId,
  kHistoryButtonViewId,
  kBookmarksButtonViewId,
  kSettingsButtonViewId,
  kSettingsUrlFieldViewId,
  kSettingsSaveViewId,
  kSettingsClearHistoryViewId,
  kSettingsClearCacheViewId,
  kSettingsClearCookiesViewId,
  kSettingsCloseViewId,
};

// Application-level callbacks for the browser process.
//
// CefApp is the "process-wide" interface: CEF hands it to us in every process
// (browser, renderer, GPU, ...). CefBrowserProcessHandler is the slice of that
// interface that is only called in the browser process, which is where the
// first window gets created.
class BrowserApp : public CefApp, public CefBrowserProcessHandler {
 public:
  BrowserApp();

  // CefApp methods:
  CefRefPtr<CefBrowserProcessHandler> GetBrowserProcessHandler() override {
    return this;
  }

  // CefBrowserProcessHandler methods:
  // Called once CEF is fully initialized. This is where we create the window.
  void OnContextInitialized() override;
  CefRefPtr<CefClient> GetDefaultClient() override;

 private:
  // CEF objects are reference counted. This macro generates AddRef/Release.
  IMPLEMENT_REFCOUNTING(BrowserApp);
};

// Bridge from BrowserHandler to the tabbed window.
//
// BrowserHandler is the CefClient for *every* browser in the app, so its
// callbacks fire for background tabs too. It has no idea which tab a browser
// belongs to, or which tab is on screen. These functions hand the event to the
// window, which owns the tab list and decides what to do with it. Each one is a
// no-op if the browser is not (or is no longer) a tab.
//
// All must be called on the CEF UI thread.
// Returns false if the browser is not a tab, so the caller can fall back to
// handling the title itself.
bool NotifyTabTitleChanged(CefRefPtr<CefBrowser> browser,
                           const CefString& title);
void NotifyTabAddressChanged(CefRefPtr<CefBrowser> browser,
                             const CefString& url);
void NotifyTabLoadingStateChanged(CefRefPtr<CefBrowser> browser,
                                  bool can_go_back,
                                  bool can_go_forward);
void NotifyTabClosed(CefRefPtr<CefBrowser> browser);

// Adds or refreshes a row in the download panel. |percent| is -1 when the total
// size is unknown.
void NotifyDownloadUpdated(uint32_t download_id,
                           const std::string& file_name,
                           int percent,
                           bool complete,
                           bool canceled);

// Re-reads the bookmark state of the active tab, for when something other than
// the star button changed it (the context menu, say).
void NotifyBookmarksChanged();

}  // namespace my_browser

#endif  // MY_BROWSER_SRC_SIMPLE_APP_H_
