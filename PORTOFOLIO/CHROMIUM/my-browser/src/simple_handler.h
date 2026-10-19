// Adapted from the CEF binary distribution sample `tests/cefsimple`.
// Original copyright (c) 2013 The Chromium Embedded Framework Authors.
// Licensed under the BSD-style license shipped with the CEF distribution.

#ifndef MY_BROWSER_SRC_SIMPLE_HANDLER_H_
#define MY_BROWSER_SRC_SIMPLE_HANDLER_H_

#include <list>
#include <map>
#include <string>

#include "include/cef_client.h"

namespace my_browser {

// Browser-level callbacks. CefClient is the object CEF calls back into for
// everything that happens to a specific browser: title changes, lifespan
// events, load errors, and so on. Each Get*Handler() below tells CEF "yes, I
// handle that category of event" by returning `this`.
class BrowserHandler : public CefClient,
                       public CefContextMenuHandler,
                       public CefDisplayHandler,
                       public CefDownloadHandler,
                       public CefLifeSpanHandler,
                       public CefLoadHandler {
 public:
  explicit BrowserHandler(bool is_alloy_style);
  ~BrowserHandler() override;

  // Provide access to the single global instance of this object.
  static BrowserHandler* GetInstance();

  // CefClient methods:
  CefRefPtr<CefContextMenuHandler> GetContextMenuHandler() override {
    return this;
  }
  CefRefPtr<CefDisplayHandler> GetDisplayHandler() override { return this; }
  CefRefPtr<CefDownloadHandler> GetDownloadHandler() override { return this; }
  CefRefPtr<CefLifeSpanHandler> GetLifeSpanHandler() override { return this; }
  CefRefPtr<CefLoadHandler> GetLoadHandler() override { return this; }

  // CefDownloadHandler methods:
  bool OnBeforeDownload(CefRefPtr<CefBrowser> browser,
                        CefRefPtr<CefDownloadItem> download_item,
                        const CefString& suggested_name,
                        CefRefPtr<CefBeforeDownloadCallback> callback) override;
  void OnDownloadUpdated(CefRefPtr<CefBrowser> browser,
                         CefRefPtr<CefDownloadItem> download_item,
                         CefRefPtr<CefDownloadItemCallback> callback) override;

  // CefContextMenuHandler methods:
  void OnBeforeContextMenu(CefRefPtr<CefBrowser> browser,
                           CefRefPtr<CefFrame> frame,
                           CefRefPtr<CefContextMenuParams> params,
                           CefRefPtr<CefMenuModel> model) override;
  bool OnContextMenuCommand(CefRefPtr<CefBrowser> browser,
                            CefRefPtr<CefFrame> frame,
                            CefRefPtr<CefContextMenuParams> params,
                            int command_id,
                            EventFlags event_flags) override;

  // CefDisplayHandler methods:
  void OnTitleChange(CefRefPtr<CefBrowser> browser,
                     const CefString& title) override;
  void OnAddressChange(CefRefPtr<CefBrowser> browser,
                       CefRefPtr<CefFrame> frame,
                       const CefString& url) override;

  // CefLifeSpanHandler methods:
  void OnAfterCreated(CefRefPtr<CefBrowser> browser) override;
  bool DoClose(CefRefPtr<CefBrowser> browser) override;
  void OnBeforeClose(CefRefPtr<CefBrowser> browser) override;

  // CefLoadHandler methods:
  void OnLoadingStateChange(CefRefPtr<CefBrowser> browser,
                            bool isLoading,
                            bool canGoBack,
                            bool canGoForward) override;
  void OnLoadEnd(CefRefPtr<CefBrowser> browser,
                 CefRefPtr<CefFrame> frame,
                 int httpStatusCode) override;
  void OnLoadError(CefRefPtr<CefBrowser> browser,
                   CefRefPtr<CefFrame> frame,
                   ErrorCode errorCode,
                   const CefString& errorText,
                   const CefString& failedUrl) override;

  void ShowMainWindow();

  // Request that all existing browser windows close.
  void CloseAllBrowsers(bool force_close);

  bool IsClosing() const { return is_closing_; }

 private:
  // Platform-specific implementation.
  void PlatformTitleChange(CefRefPtr<CefBrowser> browser,
                           const CefString& title);
  void PlatformShowWindow(CefRefPtr<CefBrowser> browser);

  // True if this client is Alloy style, otherwise Chrome style.
  const bool is_alloy_style_;

  // List of existing browser windows. Only accessed on the CEF UI thread.
  typedef std::list<CefRefPtr<CefBrowser>> BrowserList;
  BrowserList browser_list_;

  // Last title seen per browser id. OnLoadEnd() needs the title to record a
  // history entry, but CefBrowser has no GetTitle().
  std::map<int, std::string> browser_titles_;

  bool is_closing_ = false;

  // Include the default reference counting implementation.
  IMPLEMENT_REFCOUNTING(BrowserHandler);
};

}  // namespace my_browser

#endif  // MY_BROWSER_SRC_SIMPLE_HANDLER_H_
