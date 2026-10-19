// Adapted from the CEF binary distribution sample `tests/cefsimple`.
// Original copyright (c) 2013 The Chromium Embedded Framework Authors.
// Licensed under the BSD-style license shipped with the CEF distribution.

#include "simple_app.h"

// OS_WIN comes from include/base/cef_build.h, pulled in by simple_app.h above.
#if defined(OS_WIN)
#include <windows.h>  // For VK_RETURN.
#endif

#include <algorithm>
#include <string>
#include <vector>

#include "include/cef_browser.h"
#include "include/cef_command_line.h"
#include "include/cef_cookie.h"
#include "include/views/cef_box_layout.h"
#include "include/views/cef_browser_view.h"
#include "include/views/cef_fill_layout.h"
#include "include/views/cef_label_button.h"
#include "include/views/cef_panel.h"
#include "include/views/cef_textfield.h"
#include "include/views/cef_window.h"
#include "include/wrapper/cef_helpers.h"
#include "simple_handler.h"
#include "storage.h"

namespace my_browser {

namespace {

// Tab strip colours. The active tab is lighter than its neighbours.
constexpr cef_color_t kActiveTabColor = CefColorSetARGB(255, 250, 250, 250);
constexpr cef_color_t kInactiveTabColor = CefColorSetARGB(255, 200, 200, 200);

// Longest tab label before it gets cut short, in UTF-16 code units.
constexpr size_t kMaxTabTitleChars = 20;

// Star button labels. U+2606 / U+2605, both present in the default Windows UI
// fonts. The source file is UTF-8 and the build passes /utf-8.
constexpr char kStarEmpty[] = "\xE2\x98\x86";  // U+2606 WHITE STAR
constexpr char kStarFilled[] = "\xE2\x98\x85";  // U+2605 BLACK STAR

// Accelerator command IDs, unrelated to the view IDs.
constexpr int kShowHistoryCommandId = 1;

// Download row text colours.
constexpr cef_color_t kDownloadActiveColor = CefColorSetARGB(255, 32, 33, 36);
constexpr cef_color_t kDownloadDoneColor = CefColorSetARGB(255, 24, 128, 56);
constexpr cef_color_t kDownloadFailedColor = CefColorSetARGB(255, 197, 34, 31);
constexpr cef_color_t kDownloadBarColor = CefColorSetARGB(255, 240, 240, 240);
constexpr cef_color_t kSettingsBgColor = CefColorSetARGB(255, 250, 250, 250);

// Turn what the user typed into something LoadURL() will accept. LoadURL() does
// no guessing of its own: it needs an absolute URL, so bare "google.com" would
// simply fail to load.
std::string NormalizeURL(const std::string& input) {
  // Trim surrounding whitespace (easy to pick up when pasting).
  const auto first = input.find_first_not_of(" \t\r\n");
  if (first == std::string::npos) {
    return std::string();
  }
  const auto last = input.find_last_not_of(" \t\r\n");
  std::string url = input.substr(first, last - first + 1);

  // Already has a scheme plus authority, e.g. "http://x", "file:///c:/x".
  if (url.find("://") != std::string::npos) {
    return url;
  }

  // Schemes with no authority component. "javascript:" is deliberately absent:
  // letting it through the address bar is a self-XSS footgun, and Chrome strips
  // it from the omnibox for the same reason.
  for (const char* scheme : {"about:", "chrome:", "data:"}) {
    if (url.starts_with(scheme)) {
      return url;
    }
  }

  return "https://" + url;
}

// Page titles are arbitrarily long; tab labels are not. Work in UTF-16 rather
// than UTF-8 bytes so a cut never lands in the middle of a character.
std::wstring TruncateTitle(const CefString& title) {
  std::wstring text = title.ToWString();
  if (text.empty()) {
    return L"New Tab";
  }
  if (text.size() <= kMaxTabTitleChars) {
    return text;
  }

  size_t cut = kMaxTabTitleChars - 3;  // Room for "...".
  // Never split a surrogate pair (an emoji, say) down the middle.
  if (cut > 0 && text[cut - 1] >= 0xD800 && text[cut - 1] <= 0xDBFF) {
    --cut;
  }
  return text.substr(0, cut) + L"...";
}

#if DCHECK_IS_ON()
// Smallest thing that fails if the helpers above break. Runs once at startup in
// Debug builds; compiled out of Release.
void VerifyHelpers() {
  DCHECK_EQ("https://google.com", NormalizeURL("google.com"));
  DCHECK_EQ("https://google.com", NormalizeURL("  google.com \t"));
  DCHECK_EQ("http://example.com/a?b=c", NormalizeURL("http://example.com/a?b=c"));
  DCHECK_EQ("https://example.com:8080/x", NormalizeURL("example.com:8080/x"));
  DCHECK_EQ("about:blank", NormalizeURL("about:blank"));
  DCHECK_EQ("https://javascript:alert(1)", NormalizeURL("javascript:alert(1)"));
  DCHECK(NormalizeURL("   ").empty());

  DCHECK(TruncateTitle(CefString()) == L"New Tab");
  DCHECK(TruncateTitle(CefString("short")) == L"short");
  // 25 characters in, 20 out (17 kept plus "...").
  DCHECK(TruncateTitle(CefString("0123456789012345678901234")) ==
         L"01234567890123456...");
}
#endif  // DCHECK_IS_ON()

// Delegate for each tab's BrowserView.
class BrowserViewDelegate : public CefBrowserViewDelegate {
 public:
  BrowserViewDelegate() = default;

  BrowserViewDelegate(const BrowserViewDelegate&) = delete;
  BrowserViewDelegate& operator=(const BrowserViewDelegate&) = delete;

  bool OnPopupBrowserViewCreated(CefRefPtr<CefBrowserView> browser_view,
                                 CefRefPtr<CefBrowserView> popup_browser_view,
                                 bool is_devtools) override {
    // Returning false lets CEF put the popup in its own default window, so
    // target="_blank" and window.open() keep working. Adopting popups as tabs
    // is a separate feature and is not done here.
    return false;
  }

  cef_runtime_style_t GetBrowserRuntimeStyle() override {
    // Required for tabs: a Chrome style Window can host at most one Chrome
    // style BrowserView, but any number of Alloy style ones.
    return CEF_RUNTIME_STYLE_ALLOY;
  }

 private:
  IMPLEMENT_REFCOUNTING(BrowserViewDelegate);
};

class BrowserWindowDelegate;

// The single tabbed window. BrowserHandler has no pointer to it, so the
// Notify* functions at the bottom of this file go through here. Same pattern as
// BrowserHandler::GetInstance().
BrowserWindowDelegate* g_window_delegate = nullptr;

// Delegate for the CefWindow that hosts the tabs. CEF's Views framework is a
// cross-platform widget toolkit, so using it means we do not have to write
// per-platform window code.
//
// This object wears three hats: it is the delegate for the window, for the
// address bar (CefTextfieldDelegate), and for every button
// (CefButtonDelegate). All three delegate interfaces share CefViewDelegate as a
// base, so watch out for callbacks they all declare -- see GetPreferredSize()
// below.
class BrowserWindowDelegate : public CefWindowDelegate,
                              public CefTextfieldDelegate,
                              public CefButtonDelegate {
 public:
  BrowserWindowDelegate(CefRefPtr<BrowserHandler> handler,
                        cef_show_state_t initial_show_state,
                        const std::string& startup_url)
      : handler_(handler),
        initial_show_state_(initial_show_state),
        startup_url_(startup_url) {}

  BrowserWindowDelegate(const BrowserWindowDelegate&) = delete;
  BrowserWindowDelegate& operator=(const BrowserWindowDelegate&) = delete;

  // --- CefWindowDelegate ---------------------------------------------------

  void OnWindowCreated(CefRefPtr<CefWindow> window) override {
    window_ = window;
    window_->SetID(kWindowViewId);
    g_window_delegate = this;

    // A CefWindow is a Panel, and a Panel positions its children using a
    // layout object rather than absolute coordinates. A vertical box layout
    // stacks children top to bottom and re-runs on every resize.
    CefBoxLayoutSettings layout_settings;
    layout_settings.horizontal = false;
    layout_settings.between_child_spacing = 2;
    CefRefPtr<CefBoxLayout> layout = window_->SetToBoxLayout(layout_settings);

    BuildTabBar();
    CefRefPtr<CefPanel> toolbar = BuildToolbar();

    // All BrowserViews live stacked inside this panel. A fill layout sizes
    // every child to the panel's full bounds, so they overlap exactly -- and
    // since only the active one is visible, that is the tab switch.
    content_ = CefPanel::CreatePanel(nullptr);
    content_->SetToFillLayout();

    // Download rows stack up here. Hidden until the first download starts; an
    // invisible view is skipped by the layout entirely, so it takes no space.
    download_bar_ = CefPanel::CreatePanel(nullptr);
    CefBoxLayoutSettings download_settings;
    download_settings.horizontal = false;
    download_bar_->SetToBoxLayout(download_settings);
    download_bar_->SetBackgroundColor(kDownloadBarColor);
    download_bar_->SetVisible(false);

    window_->AddChildView(tab_bar_);
    window_->AddChildView(toolbar);
    window_->AddChildView(download_bar_);
    window_->AddChildView(content_);

    // Flex 1 means "take all the space the other children don't want", so the
    // web content absorbs everything the two toolbars leave over, on resize
    // too. The bars keep their natural height at the default flex of 0.
    layout->SetFlexForView(content_, 1);

    // Ctrl+H opens history. high_priority=true so the page cannot swallow it.
    window_->SetAccelerator(kShowHistoryCommandId, 'H', /*shift=*/false,
                            /*ctrl=*/true, /*alt=*/false,
                            /*high_priority=*/true);

    AddTab(startup_url_);

    if (initial_show_state_ != CEF_SHOW_STATE_HIDDEN) {
      window_->Show();
    }
  }

  bool OnAccelerator(CefRefPtr<CefWindow> window, int command_id) override {
    if (command_id == kShowHistoryCommandId) {
      ShowHistoryPage();
      return true;
    }
    return false;
  }

  void OnWindowDestroyed(CefRefPtr<CefWindow> window) override {
    g_window_delegate = nullptr;
    tabs_.clear();
    tab_bar_ = nullptr;
    content_ = nullptr;
    address_bar_ = nullptr;
    star_button_ = nullptr;
    new_tab_button_ = nullptr;
    downloads_.clear();
    download_bar_ = nullptr;
    settings_panel_ = nullptr;
    settings_url_field_ = nullptr;
    settings_status_ = nullptr;
    settings_clear_history_button_ = nullptr;
    window_ = nullptr;
  }

  bool CanClose(CefRefPtr<CefWindow> window) override {
    // Every tab gets asked, not just the active one. TryCloseBrowser() returns
    // false the first time (it kicks off an async close) and true once that
    // browser is finished, so the window stays open until every tab is done.
    // Every tab gets asked, not just the active one.
    // TryCloseBrowser() returns false the first time (it kicks off an async
    // close) and true once that browser is finished, so the window stays open
    // until every tab is done.
    bool can_close = true;
    for (const auto& tab : tabs_) {
      if (auto browser = tab.browser_view->GetBrowser()) {
        if (!browser->GetHost()->TryCloseBrowser()) {
          can_close = false;
        }
      }
    }
    return can_close;
  }

  // Initial window size.
  //
  // GetPreferredSize() is declared by CefViewDelegate, which is a base of all
  // three delegate interfaces above. This one override therefore answers for
  // the window *and* every button and textfield -- returning 1024x768
  // unconditionally would make each of them 768 pixels tall. Gate on the view
  // ID and return an empty CefSize() for everything else, which means "no
  // opinion, use the view's own preferred size".
  CefSize GetPreferredSize(CefRefPtr<CefView> view) override {
    if (view->GetID() == kWindowViewId) {
      return CefSize(1024, 768);
    }
    return CefSize();
  }

  cef_show_state_t GetInitialShowState(CefRefPtr<CefWindow> window) override {
    return initial_show_state_;
  }

  cef_runtime_style_t GetWindowRuntimeStyle() override {
    // The Window stays Chrome style; only the BrowserViews inside it have to
    // be Alloy style (see AddTab). Making the Window Alloy too was tried and
    // changed nothing about tab close behaviour.
    return CEF_RUNTIME_STYLE_DEFAULT;
  }

  // --- CefTextfieldDelegate ------------------------------------------------

  // Called for every keystroke in the address bar. Returning true means "I
  // handled this key, don't process it further".
  bool OnKeyEvent(CefRefPtr<CefTextfield> textfield,
                  const CefKeyEvent& event) override {
    CEF_REQUIRE_UI_THREAD();

    // Only react to Enter going down. Without the type check this would fire
    // twice per press (key down and key up).
    if (event.type != KEYEVENT_RAWKEYDOWN ||
        event.windows_key_code != VK_RETURN) {
      return false;
    }

    // The same delegate serves both textfields, so ask which one this is.
    if (textfield->GetID() == kSettingsUrlFieldViewId) {
      SaveSettings();
      return true;
    }

    CefRefPtr<CefBrowser> browser = ActiveBrowser();
    if (!browser) {
      return false;
    }

    const std::string url = NormalizeURL(textfield->GetText());
    if (!url.empty()) {
      // Show the user what we actually navigated to, schema and all.
      textfield->SetText(url);
      browser->GetMainFrame()->LoadURL(url);
    }

    // Swallow the Enter either way, so an empty address bar does nothing.
    return true;
  }

  // --- CefButtonDelegate ---------------------------------------------------

  void OnButtonPressed(CefRefPtr<CefButton> button) override {
    CEF_REQUIRE_UI_THREAD();

    // Fixed controls carry a view ID.
    switch (button->GetID()) {
      case kNewTabButtonViewId:
        // Read the preference every time, so a change in Settings takes effect
        // straight away without restarting.
        AddTab(NewTabUrl());
        return;
      case kBookmarkStarViewId:
        ToggleBookmark();
        return;
      case kHistoryButtonViewId:
        ShowHistoryPage();
        return;
      case kBookmarksButtonViewId:
        ShowBookmarksPage();
        return;
      case kSettingsButtonViewId:
        ShowSettingsPanel();
        return;
      case kSettingsSaveViewId:
        SaveSettings();
        return;
      case kSettingsCloseViewId:
        // Re-activating the tab hides the settings panel and shows the web
        // content again.
        ActivateTab(active_index_);
        return;
      case kSettingsClearHistoryViewId:
        ClearHistoryWithConfirmation();
        return;
      case kSettingsClearCacheViewId:
        ClearCache();
        return;
      case kSettingsClearCookiesViewId:
        ClearCookies();
        return;
      case kBackButtonViewId:
      case kForwardButtonViewId:
      case kReloadButtonViewId: {
        // Navigation lives on CefBrowser, not on a frame: history is per
        // browser, and going back may replace the whole frame tree. A disabled
        // button never gets here, so no CanGoBack() check is needed.
        CefRefPtr<CefBrowser> browser = ActiveBrowser();
        if (!browser) {
          return;
        }
        if (button->GetID() == kBackButtonViewId) {
          browser->GoBack();
        } else if (button->GetID() == kForwardButtonViewId) {
          browser->GoForward();
        } else {
          browser->Reload();
        }
        return;
      }
      default:
        break;
    }

    // Tab strip buttons have no ID because tabs are created and destroyed at
    // runtime; match them by object identity instead.
    for (size_t i = 0; i < tabs_.size(); ++i) {
      if (button->IsSame(tabs_[i].title_button)) {
        ActivateTab(i);
        return;
      }
      if (button->IsSame(tabs_[i].close_button)) {
        CloseTab(i);
        return;
      }
    }
  }

  // --- Called from the Notify* functions -----------------------------------

  // Returns false if |browser| is not one of our tabs, so the caller can fall
  // back to its own handling (popups live in a plain CEF window).
  bool OnTabTitleChanged(CefRefPtr<CefBrowser> browser, const CefString& title) {
    const int index = IndexOfBrowser(browser);
    if (index < 0) {
      return false;
    }
    tabs_[index].title = title.ToString();
    tabs_[index].title_button->SetText(TruncateTitle(title));
    // Only the tab on screen may rename the window.
    if (static_cast<size_t>(index) == active_index_ && window_) {
      window_->SetTitle(title);
    }
    // A longer or shorter label changes the tab's preferred width.
    RelayoutWindow();
    return true;
  }

  void OnTabAddressChanged(CefRefPtr<CefBrowser> browser, const CefString& url) {
    const int index = IndexOfBrowser(browser);
    // Background tabs navigate too (redirects, in-page scripts). Only the tab
    // the user is looking at may touch the address bar.
    if (index < 0 || static_cast<size_t>(index) != active_index_) {
      return;
    }
    SetAddressBarText(url);
    UpdateBookmarkStar();
  }

  void OnTabLoadingStateChanged(CefRefPtr<CefBrowser> browser,
                                bool can_go_back,
                                bool can_go_forward) {
    const int index = IndexOfBrowser(browser);
    if (index < 0 || static_cast<size_t>(index) != active_index_) {
      return;
    }
    SetControlEnabled(kBackButtonViewId, can_go_back);
    SetControlEnabled(kForwardButtonViewId, can_go_forward);
  }

  void OnDownloadUpdated(uint32_t download_id,
                         const std::string& file_name,
                         int percent,
                         bool complete,
                         bool canceled) {
    if (!download_bar_) {
      return;
    }

    // One row per download, created the first time we hear about it.
    CefRefPtr<CefLabelButton> row;
    for (const DownloadRow& existing : downloads_) {
      if (existing.id == download_id) {
        row = existing.label;
        break;
      }
    }
    if (!row) {
      row = MakeButton(file_name, 0);
      downloads_.push_back({download_id, row});
      download_bar_->AddChildView(row);
      download_bar_->SetVisible(true);
    }

    std::string text = file_name;
    if (canceled) {
      text += "  -  cancelled";
      row->SetEnabledTextColors(kDownloadFailedColor);
    } else if (complete) {
      text += "  -  done";
      row->SetEnabledTextColors(kDownloadDoneColor);
    } else if (percent < 0) {
      // Server sent no Content-Length, so there is no percentage to show.
      text += "  -  downloading...";
      row->SetEnabledTextColors(kDownloadActiveColor);
    } else {
      text += "  -  " + std::to_string(percent) + "%";
      row->SetEnabledTextColors(kDownloadActiveColor);
    }
    row->SetText(text);
    RelayoutWindow();
  }

  void OnBookmarksChanged() { UpdateBookmarkStar(); }

  void OnTabClosed(CefRefPtr<CefBrowser> browser) {
    // A tab closed by CloseTab() is already out of tabs_, so index < 0 is the
    // normal case there. This path matters when a browser closes on its own:
    // the window shutting down, or a page calling window.close().
    const int index = IndexOfBrowser(browser);
    if (index < 0) {
      return;
    }

    // The browser is gone by now, so its views can go too.
    if (tab_bar_) {
      tab_bar_->RemoveChildView(tabs_[index].strip);
    }
    if (content_) {
      content_->RemoveChildView(tabs_[index].browser_view);
    }
    tabs_.erase(tabs_.begin() + index);

    if (tabs_.empty()) {
      // The window is already on its way out; nothing left to show.
      return;
    }

    // Closing a tab to the left of the active one shifts every later index
    // down by one, so recompute rather than reusing active_index_.
    ActivateTab(std::min(static_cast<size_t>(index), tabs_.size() - 1));
    RelayoutWindow();
  }

 private:
  struct Tab {
    CefRefPtr<CefBrowserView> browser_view;
    CefRefPtr<CefPanel> strip;              // The tab's slot in the tab bar.
    CefRefPtr<CefLabelButton> title_button;  // Click to activate.
    CefRefPtr<CefLabelButton> close_button;  // Click to close.
    int browser_id = 0;                      // CefBrowser::GetIdentifier().
    int serial = 0;  // Never reused, unlike the position in tabs_.
    std::string title;  // Full page title; the button label is truncated.
  };

  void BuildTabBar() {
    tab_bar_ = CefPanel::CreatePanel(nullptr);
    CefBoxLayoutSettings settings;
    settings.horizontal = true;
    settings.between_child_spacing = 2;
    tab_bar_->SetToBoxLayout(settings);
    tab_bar_->SetBackgroundColor(kInactiveTabColor);

    // The "+" button stays pinned as the last child; new tabs are inserted
    // before it.
    new_tab_button_ = MakeButton("+", kNewTabButtonViewId);
    tab_bar_->AddChildView(new_tab_button_);
  }

  CefRefPtr<CefPanel> BuildToolbar() {
    CefRefPtr<CefPanel> toolbar = CefPanel::CreatePanel(nullptr);
    CefBoxLayoutSettings settings;
    settings.horizontal = true;
    settings.between_child_spacing = 2;
    CefRefPtr<CefBoxLayout> toolbar_layout = toolbar->SetToBoxLayout(settings);

    CefRefPtr<CefLabelButton> back = MakeButton("Back", kBackButtonViewId);
    CefRefPtr<CefLabelButton> forward =
        MakeButton("Forward", kForwardButtonViewId);

    // Nothing to go back or forward to yet. OnLoadingStateChange() and
    // ActivateTab() take over from here.
    back->SetEnabled(false);
    forward->SetEnabled(false);

    toolbar->AddChildView(back);
    toolbar->AddChildView(forward);
    toolbar->AddChildView(MakeButton("Reload", kReloadButtonViewId));

    address_bar_ = CefTextfield::CreateTextfield(this);
    address_bar_->SetID(kAddressBarViewId);
    address_bar_->SetPlaceholderText("Type a URL and press Enter");
    address_bar_->SetAccessibleName("Address bar");
    toolbar->AddChildView(address_bar_);

    // Star sits right next to the address bar, like every other browser.
    star_button_ = MakeButton(kStarEmpty, kBookmarkStarViewId);
    star_button_->SetAccessibleName("Bookmark this page");
    toolbar->AddChildView(star_button_);

    toolbar->AddChildView(MakeButton("History", kHistoryButtonViewId));
    toolbar->AddChildView(MakeButton("Bookmarks", kBookmarksButtonViewId));
    CefRefPtr<CefLabelButton> settings_button =
        MakeButton("Settings", kSettingsButtonViewId);
    // Distinct from the panel's own "Settings" heading, so screen readers (and
    // the UI tests) can tell the two apart.
    settings_button->SetAccessibleName("Open settings");
    toolbar->AddChildView(settings_button);

    // Buttons keep their natural width; the address bar swallows the rest.
    toolbar_layout->SetFlexForView(address_bar_, 1);
    return toolbar;
  }

  CefRefPtr<CefLabelButton> MakeButton(const CefString& label, int id) {
    CefRefPtr<CefLabelButton> button =
        CefLabelButton::CreateLabelButton(this, label);
    button->SetID(id);
    button->SetInkDropEnabled(true);  // Click ripple, so presses feel handled.
    button->SetFocusable(false);      // Keep Tab going to the address bar.
    return button;
  }

  void AddTab(const std::string& url) {
    CefBrowserSettings browser_settings;

    // Alloy style is not a preference here, it is a requirement: a Chrome style
    // Window can host at most ONE Chrome style BrowserView, but any number of
    // Alloy style ones. See include/internal/cef_types_runtime.h.
    CefRefPtr<CefBrowserView> browser_view = CefBrowserView::CreateBrowserView(
        handler_, url, browser_settings, nullptr, nullptr,
        new BrowserViewDelegate());

    Tab tab;
    tab.serial = ++last_tab_serial_;
    tab.browser_view = browser_view;
    // The title button's label is the page title, which is what assistive
    // technology should read, so it gets no accessible name override. A button
    // labelled just "x" is useless to a screen reader, so that one does.
    tab.title_button = MakeButton("New Tab", 0);
    tab.close_button = MakeButton("x", 0);
    tab.close_button->SetAccessibleName("Close tab " +
                                        std::to_string(tab.serial));

    tab.strip = CefPanel::CreatePanel(nullptr);
    CefBoxLayoutSettings strip_settings;
    strip_settings.horizontal = true;
    tab.strip->SetToBoxLayout(strip_settings);
    tab.strip->AddChildView(tab.title_button);
    tab.strip->AddChildView(tab.close_button);

    // Insert before the trailing "+" button.
    tab_bar_->AddChildViewAt(tab.strip, static_cast<int>(tabs_.size()));

    // The browser itself is created when its view joins a Window, so the
    // identifier only becomes available after this call.
    content_->AddChildView(browser_view);
    if (auto browser = browser_view->GetBrowser()) {
      tab.browser_id = browser->GetIdentifier();
    }

    tabs_.push_back(tab);
    ActivateTab(tabs_.size() - 1);
    RelayoutWindow();
  }

  void ActivateTab(size_t index) {
    if (index >= tabs_.size()) {
      return;
    }
    active_index_ = index;

    // Touching a tab always leaves settings.
    HideSettingsPanel();

    for (size_t i = 0; i < tabs_.size(); ++i) {
      const bool active = (i == index);
      // Hiding a view takes it out of the layout entirely, so the inactive
      // BrowserViews stop being drawn. They are NOT suspended -- see the notes
      // in the write-up: background tabs keep running.
      tabs_[i].browser_view->SetVisible(active);
      tabs_[i].strip->SetBackgroundColor(active ? kActiveTabColor
                                               : kInactiveTabColor);
    }

    SyncToolbarToActiveTab();
    tabs_[index].browser_view->RequestFocus();
    RelayoutWindow();
  }

  void CloseTab(size_t index) {
    if (index >= tabs_.size()) {
      return;
    }

    if (tabs_.size() == 1) {
      // Closing the last tab means closing the app. Route it through the
      // window so the normal shutdown path runs (CanClose -> TryCloseBrowser
      // -> OnBeforeClose -> CefQuitMessageLoop) instead of tearing the browser
      // down underneath a window that is still alive.
      if (window_) {
        window_->Close();
      }
      return;
    }

    // Detach this tab's views from the window BEFORE closing its browser.
    // Order matters: while a BrowserView is still a child of the Window, CEF
    // closes the entire Window as soon as the browser inside it is destroyed,
    // taking every other tab down with it.
    // Take the tab out of the window and drop our references to it. A
    // CefBrowserView owns its browser, so releasing the last reference is what
    // destroys the browser -- and unlike CloseBrowser(), it does not drag the
    // whole Window into the close.
    Tab tab = tabs_[index];
    tabs_.erase(tabs_.begin() + index);

    if (tab_bar_) {
      tab_bar_->RemoveChildView(tab.strip);
    }
    if (content_) {
      content_->RemoveChildView(tab.browser_view);
    }

    ActivateTab(std::min(index, tabs_.size() - 1));
    RelayoutWindow();
    // |tab| dies at the end of this scope, taking the BrowserView with it.
  }

  // Pushes the active tab's state into the shared toolbar. Called on tab
  // switch, where CanGoBack()/CanGoForward() are the right API: there is no
  // navigation event to wait for, we need the answer right now.
  void SyncToolbarToActiveTab() {
    CefRefPtr<CefBrowser> browser = ActiveBrowser();
    if (!browser) {
      // A tab's browser does not exist yet for a moment after its view is
      // added to the window. Leave the old text alone -- OnAddressChange()
      // fills it in as soon as the new tab starts loading.
      SetControlEnabled(kBackButtonViewId, false);
      SetControlEnabled(kForwardButtonViewId, false);
      return;
    }

    if (auto frame = browser->GetMainFrame()) {
      SetAddressBarText(frame->GetURL());
    }
    SetControlEnabled(kBackButtonViewId, browser->CanGoBack());
    SetControlEnabled(kForwardButtonViewId, browser->CanGoForward());
    UpdateBookmarkStar();
  }

  // URL of the page in the active tab, empty if there is none yet.
  std::string ActiveUrl() {
    CefRefPtr<CefBrowser> browser = ActiveBrowser();
    if (!browser) {
      return std::string();
    }
    if (auto frame = browser->GetMainFrame()) {
      return frame->GetURL();
    }
    return std::string();
  }

  void UpdateBookmarkStar() {
    if (!star_button_) {
      return;
    }
    const std::string url = ActiveUrl();
    const bool marked = !url.empty() && Bookmarks().Contains(url);
    star_button_->SetText(marked ? kStarFilled : kStarEmpty);
    star_button_->SetAccessibleName(marked ? "Remove bookmark"
                                           : "Bookmark this page");
    RelayoutWindow();
  }

  void ToggleBookmark() {
    const std::string url = ActiveUrl();
    if (url.empty() || IsInternalPageUrl(url)) {
      return;  // Nothing useful to bookmark.
    }

    if (Bookmarks().Contains(url)) {
      Bookmarks().Remove(url);
    } else {
      std::string title;
      if (active_index_ < tabs_.size()) {
        title = tabs_[active_index_].title;
      }
      Bookmarks().Add(url, title.empty() ? url : title);
    }
    UpdateBookmarkStar();
  }

  // --- Settings panel -------------------------------------------------
  //
  // Built with CEF Views rather than as an HTML page like history/bookmarks.
  // Those two only display data, so HTML is ideal. Settings has to send values
  // back into C++, and an HTML page can only do that through a JS bridge --
  // CefMessageRouter needs a render-process app object registered via
  // CefExecuteProcess, which currently gets nullptr. Views needs none of that:
  // the textfield and buttons talk to this class directly.

  void EnsureSettingsPanel() {
    if (settings_panel_) {
      return;
    }

    settings_panel_ = CefPanel::CreatePanel(nullptr);
    CefBoxLayoutSettings panel_settings;
    panel_settings.horizontal = false;
    panel_settings.between_child_spacing = 6;
    panel_settings.inside_border_insets = CefInsets(16, 16, 16, 16);
    settings_panel_->SetToBoxLayout(panel_settings);
    settings_panel_->SetBackgroundColor(kSettingsBgColor);

    settings_panel_->AddChildView(MakeButton("Settings", 0));
    settings_panel_->AddChildView(MakeButton("Default URL for new tabs:", 0));

    settings_url_field_ = CefTextfield::CreateTextfield(this);
    settings_url_field_->SetID(kSettingsUrlFieldViewId);
    settings_url_field_->SetAccessibleName("Default new tab URL");
    settings_url_field_->SetPlaceholderText("https://example.com");
    settings_panel_->AddChildView(settings_url_field_);

    settings_panel_->AddChildView(MakeButton("Save", kSettingsSaveViewId));

    // The three clear buttons share one row.
    CefRefPtr<CefPanel> clear_row = CefPanel::CreatePanel(nullptr);
    CefBoxLayoutSettings row_settings;
    row_settings.horizontal = true;
    row_settings.between_child_spacing = 6;
    clear_row->SetToBoxLayout(row_settings);
    settings_clear_history_button_ =
        MakeButton("Clear History", kSettingsClearHistoryViewId);
    clear_row->AddChildView(settings_clear_history_button_);
    clear_row->AddChildView(MakeButton("Clear Cache", kSettingsClearCacheViewId));
    clear_row->AddChildView(
        MakeButton("Clear Cookies", kSettingsClearCookiesViewId));
    settings_panel_->AddChildView(clear_row);

    // CefLabelButton::SetText has DCHECK(!text.empty()), so this label always
    // carries some text.
    settings_status_ = MakeButton("Ready.", 0);
    settings_panel_->AddChildView(settings_status_);

    settings_panel_->AddChildView(
        MakeButton("Close settings", kSettingsCloseViewId));

    // Lives in the same fill-layout container as the BrowserViews, so showing
    // it is the same trick as switching tabs.
    settings_panel_->SetVisible(false);
    content_->AddChildView(settings_panel_);
  }

  void SetSettingsStatus(const std::string& text) {
    if (settings_status_ && !text.empty()) {
      settings_status_->SetText(text);
      RelayoutWindow();
    }
  }

  void ShowSettingsPanel() {
    EnsureSettingsPanel();

    // Reset the two-step confirmation each time the panel opens.
    clear_history_armed_ = false;
    settings_clear_history_button_->SetText("Clear History");

    settings_url_field_->SetText(NewTabUrl());
    SetSettingsStatus("Ready.");

    for (Tab& tab : tabs_) {
      tab.browser_view->SetVisible(false);
    }
    settings_panel_->SetVisible(true);
    settings_url_field_->RequestFocus();
    RelayoutWindow();
  }

  void HideSettingsPanel() {
    if (settings_panel_) {
      settings_panel_->SetVisible(false);
    }
  }

  void SaveSettings() {
    if (!settings_url_field_) {
      return;
    }
    // Same normalisation as the address bar, so "example.com" is accepted.
    const std::string url = NormalizeURL(settings_url_field_->GetText());
    if (url.empty()) {
      SetSettingsStatus("Enter a URL first.");
      return;
    }
    Preferences().Set(kPrefNewTabUrl, url);
    settings_url_field_->SetText(url);
    SetSettingsStatus("Saved. New tabs will open " + url);
  }

  // Two-step confirmation. A modal dialog would need its own Window and
  // delegate; making the button ask again is enough to stop an accidental
  // click from wiping the history.
  void ClearHistoryWithConfirmation() {
    if (!clear_history_armed_) {
      clear_history_armed_ = true;
      settings_clear_history_button_->SetText("Click again to confirm");
      SetSettingsStatus("This erases all browsing history. Click again.");
      RelayoutWindow();
      return;
    }

    History().Clear();
    clear_history_armed_ = false;
    settings_clear_history_button_->SetText("Clear History");
    SetSettingsStatus("History cleared.");
  }

  void ClearCache() {
    CefRefPtr<CefBrowser> browser = ActiveBrowser();
    if (!browser) {
      SetSettingsStatus("No active tab to clear the cache through.");
      return;
    }
    // CEF exposes no direct "clear cache" call. The DevTools protocol does,
    // and ExecuteDevToolsMethod is the supported way to reach it. Passing 0 as
    // the message id lets CEF assign the next one.
    //
    // The return value only says the message was submitted -- validation
    // happens asynchronously and a bad message is dropped without notice -- so
    // the status says "requested" rather than claiming the cache is empty.
    const int message_id = browser->GetHost()->ExecuteDevToolsMethod(
        /*message_id=*/0, "Network.clearBrowserCache", nullptr);
    SetSettingsStatus(message_id != 0 ? "Cache clear requested."
                                      : "Cache clear could not be submitted.");
  }

  void ClearCookies() {
    CefRefPtr<CefCookieManager> manager =
        CefCookieManager::GetGlobalManager(nullptr);
    if (!manager) {
      SetSettingsStatus("Cookie manager unavailable.");
      return;
    }
    // Empty url and name mean "every cookie for every host".
    const bool started =
        manager->DeleteCookies(CefString(), CefString(), nullptr);
    SetSettingsStatus(started ? "Cookies cleared."
                              : "Could not access cookies.");
  }

  // Both internal pages open in a new tab, the way Ctrl+H does in Chrome: the
  // page you were reading stays put.
  void ShowHistoryPage() {
    AddTab(WriteListPage("history.html", "History", History().entries()));
  }

  void ShowBookmarksPage() {
    AddTab(WriteListPage("bookmarks.html", "Bookmarks", Bookmarks().entries()));
  }

  // Every address bar write goes through here. CefTextfield::SetText() has a
  // DCHECK(!text.empty()) in its auto-generated parameter validation, so an
  // empty string is a hard crash in a Debug build and a silent no-op in
  // Release.
  void SetAddressBarText(const CefString& text) {
    if (address_bar_ && !text.empty()) {
      address_bar_->SetText(text);
    }
  }

  CefRefPtr<CefBrowser> ActiveBrowser() {
    if (active_index_ >= tabs_.size()) {
      return nullptr;
    }
    return tabs_[active_index_].browser_view->GetBrowser();
  }

  // Returns the tab index for |browser|, or -1 if it is not one of ours.
  int IndexOfBrowser(CefRefPtr<CefBrowser> browser) {
    const int id = browser->GetIdentifier();
    for (size_t i = 0; i < tabs_.size(); ++i) {
      if (tabs_[i].browser_id == id) {
        return static_cast<int>(i);
      }
      // A tab whose browser was not ready at creation time gets its identifier
      // filled in the first time we look for it.
      if (tabs_[i].browser_id == 0) {
        if (auto tab_browser = tabs_[i].browser_view->GetBrowser()) {
          tabs_[i].browser_id = tab_browser->GetIdentifier();
          if (tabs_[i].browser_id == id) {
            return static_cast<int>(i);
          }
        }
      }
    }
    return -1;
  }

  void SetControlEnabled(int id, bool enabled) {
    if (!window_) {
      return;
    }
    if (auto view = window_->GetViewForID(id)) {
      view->SetEnabled(enabled);
    }
  }

  void RelayoutWindow() {
    if (window_) {
      window_->Layout();
    }
  }

  CefRefPtr<BrowserHandler> handler_;
  CefRefPtr<CefWindow> window_;
  CefRefPtr<CefPanel> tab_bar_;
  CefRefPtr<CefPanel> content_;
  CefRefPtr<CefTextfield> address_bar_;
  CefRefPtr<CefLabelButton> new_tab_button_;
  CefRefPtr<CefLabelButton> star_button_;
  CefRefPtr<CefPanel> download_bar_;
  CefRefPtr<CefPanel> settings_panel_;
  CefRefPtr<CefTextfield> settings_url_field_;
  CefRefPtr<CefLabelButton> settings_status_;
  CefRefPtr<CefLabelButton> settings_clear_history_button_;
  bool clear_history_armed_ = false;

  struct DownloadRow {
    uint32_t id;
    CefRefPtr<CefLabelButton> label;
  };
  std::vector<DownloadRow> downloads_;
  std::vector<Tab> tabs_;
  size_t active_index_ = 0;
  int last_tab_serial_ = 0;
  const cef_show_state_t initial_show_state_;
  const std::string startup_url_;

  IMPLEMENT_REFCOUNTING(BrowserWindowDelegate);
};

}  // namespace

BrowserApp::BrowserApp() = default;

void BrowserApp::OnContextInitialized() {
  CEF_REQUIRE_UI_THREAD();

#if DCHECK_IS_ON()
  VerifyHelpers();
#endif
  RunStorageSelfCheck();

  CefRefPtr<CefCommandLine> command_line =
      CefCommandLine::GetGlobalCommandLine();

  // Tabs require Alloy style BrowserViews, so the handler is told to expect
  // Alloy (it sanity-checks the style in OnAfterCreated).
  CefRefPtr<BrowserHandler> handler(new BrowserHandler(/*is_alloy_style=*/true));

  // `--url=` wins for this launch; otherwise the saved preference decides.
  std::string url = command_line->GetSwitchValue("url");
  if (url.empty()) {
    url = NewTabUrl();
  }

  // Optionally configure the initial show state.
  cef_show_state_t initial_show_state = CEF_SHOW_STATE_NORMAL;
  const std::string& show_state_value =
      command_line->GetSwitchValue("initial-show-state");
  if (show_state_value == "minimized") {
    initial_show_state = CEF_SHOW_STATE_MINIMIZED;
  } else if (show_state_value == "maximized") {
    initial_show_state = CEF_SHOW_STATE_MAXIMIZED;
  }

  // The window builds its own tabs in OnWindowCreated().
  CefWindow::CreateTopLevelWindow(
      new BrowserWindowDelegate(handler, initial_show_state, url));
}

CefRefPtr<CefClient> BrowserApp::GetDefaultClient() {
  // Called when a new browser window is created via Chrome style UI.
  return BrowserHandler::GetInstance();
}

bool NotifyTabTitleChanged(CefRefPtr<CefBrowser> browser,
                           const CefString& title) {
  return g_window_delegate &&
         g_window_delegate->OnTabTitleChanged(browser, title);
}

void NotifyTabAddressChanged(CefRefPtr<CefBrowser> browser,
                             const CefString& url) {
  if (g_window_delegate) {
    g_window_delegate->OnTabAddressChanged(browser, url);
  }
}

void NotifyTabLoadingStateChanged(CefRefPtr<CefBrowser> browser,
                                  bool can_go_back,
                                  bool can_go_forward) {
  if (g_window_delegate) {
    g_window_delegate->OnTabLoadingStateChanged(browser, can_go_back,
                                                can_go_forward);
  }
}

void NotifyTabClosed(CefRefPtr<CefBrowser> browser) {
  if (g_window_delegate) {
    g_window_delegate->OnTabClosed(browser);
  }
}

void NotifyDownloadUpdated(uint32_t download_id,
                           const std::string& file_name,
                           int percent,
                           bool complete,
                           bool canceled) {
  if (g_window_delegate) {
    g_window_delegate->OnDownloadUpdated(download_id, file_name, percent,
                                         complete, canceled);
  }
}

void NotifyBookmarksChanged() {
  if (g_window_delegate) {
    g_window_delegate->OnBookmarksChanged();
  }
}

}  // namespace my_browser
