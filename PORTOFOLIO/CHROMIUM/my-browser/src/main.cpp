// Adapted from the CEF binary distribution sample `tests/cefsimple`
// (cefsimple_win.cc). Original copyright (c) 2013 The Chromium Embedded
// Framework Authors. Licensed under the BSD-style license shipped with the CEF
// distribution.
//
// Process model reminder: a CEF app runs as several processes (browser,
// renderer, GPU, utility) that all share the same binary. CefExecuteProcess()
// below is what decides "am I a sub-process?" and routes accordingly.

#include <windows.h>

#include <cstdlib>
#include <string>

#include "include/cef_command_line.h"
#include "include/cef_sandbox_win.h"
#include "include/cef_version_info.h"
#include "simple_app.h"

namespace {

int RunMain(HINSTANCE hInstance,
            LPTSTR lpCmdLine,
            int nCmdShow,
            void* sandbox_info) {
  // Provide CEF with command-line arguments.
  CefMainArgs main_args(hInstance);

  // If this process is a sub-process (render, GPU, ...), run its logic and
  // return. Only the browser process falls through past this point.
  int exit_code = CefExecuteProcess(main_args, nullptr, sandbox_info);
  if (exit_code >= 0) {
    return exit_code;
  }

  // Parse command-line arguments for use in this method.
  CefRefPtr<CefCommandLine> command_line = CefCommandLine::CreateCommandLine();
  command_line->InitFromString(::GetCommandLineW());

  // Process-wide CEF settings go here (cache path, locale, log file, ...).
  CefSettings settings;

  // Give this application its own cache directory. Chromium enforces a "process
  // singleton" per cache path: leaving this at the default means any other CEF
  // app already running (cefclient, for example) owns the singleton, and we
  // exit immediately with code 24 instead of opening a window.
  if (const wchar_t* local_app_data = _wgetenv(L"LOCALAPPDATA")) {
    CefString(&settings.root_cache_path) =
        std::wstring(local_app_data) + L"\\my_browser";
  }

  if (!sandbox_info) {
    settings.no_sandbox = true;
  }

  // BrowserApp creates the first window from OnContextInitialized(), which CEF
  // calls once initialization below has finished.
  CefRefPtr<my_browser::BrowserApp> app(new my_browser::BrowserApp);

  // Initialize the CEF browser process. May return false if initialization
  // fails or if early exit is desired (for example, due to process singleton
  // relaunch behavior).
  if (!CefInitialize(main_args, settings, app.get(), sandbox_info)) {
    return CefGetExitCode();
  }

  // Blocks until CefQuitMessageLoop() is called (see OnBeforeClose()).
  CefRunMessageLoop();

  CefShutdown();

  return 0;
}

}  // namespace

#if defined(CEF_USE_BOOTSTRAP)

// With the sandbox enabled on Windows, this target builds as a DLL and the
// prebuilt bootstrap.exe from the CEF distribution is the actual executable.
// bootstrap.exe loads the DLL and calls this exported entry point.
CEF_BOOTSTRAP_EXPORT int RunWinMain(HINSTANCE hInstance,
                                    LPTSTR lpCmdLine,
                                    int nCmdShow,
                                    void* sandbox_info,
                                    cef_version_info_t* /*version_info*/) {
  return ::RunMain(hInstance, lpCmdLine, nCmdShow, sandbox_info);
}

#else  // !defined(CEF_USE_BOOTSTRAP)

// Built with -DUSE_SANDBOX=OFF: a plain executable with a normal entry point.
int APIENTRY wWinMain(HINSTANCE hInstance,
                      HINSTANCE hPrevInstance,
                      LPTSTR lpCmdLine,
                      int nCmdShow) {
  UNREFERENCED_PARAMETER(hPrevInstance);

  void* sandbox_info = nullptr;

  return ::RunMain(hInstance, lpCmdLine, nCmdShow, sandbox_info);
}

#endif  // !defined(CEF_USE_BOOTSTRAP)
