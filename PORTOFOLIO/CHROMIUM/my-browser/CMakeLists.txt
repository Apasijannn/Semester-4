# Top-level CMake configuration for my-browser.
#
# Modeled on "Example 2" from the CEF binary distribution's root CMakeLists.txt:
# the CEF binary distribution lives in a separate directory and is located via
# the CEF_ROOT variable. Nothing in this project modifies the CEF distribution.

cmake_minimum_required(VERSION 3.21)

# The CEF binary distribution only ships Debug and Release binaries. This must
# be set before project() so the generator picks it up.
set(CMAKE_CONFIGURATION_TYPES Debug Release CACHE STRING
    "Supported configurations" FORCE)

project(my_browser)

# Group targets into folders in the generated Visual Studio solution.
set_property(GLOBAL PROPERTY USE_FOLDERS ON)


#
# Locate the CEF binary distribution.
#

# Override on the command line with -DCEF_ROOT=... when the distribution moves.
set(CEF_ROOT "C:/Semester 4/PORTOFOLIO/CHROMIUM/cef_binary_151.3.12+gd9cea67+chromium-151.0.7922.47_windows64"
    CACHE PATH "Path to the CEF binary distribution")

if(NOT IS_DIRECTORY "${CEF_ROOT}/cmake")
  message(FATAL_ERROR "CEF_ROOT does not point at a CEF binary distribution: ${CEF_ROOT}")
endif()

# FindCEF.cmake lives in the distribution's cmake/ directory. It defines
# CEF_STANDARD_LIBS, CEF_BINARY_FILES, CEF_RESOURCE_FILES, the COPY_* macros,
# the compiler/linker flags, and so on.
set(CMAKE_MODULE_PATH ${CMAKE_MODULE_PATH} "${CEF_ROOT}/cmake")
find_package(CEF REQUIRED)

# libcef_dll_wrapper is the C++ convenience layer over CEF's C API. It is
# shipped as source and must be compiled with the same flags as our own code,
# which is why it is built here rather than linked prebuilt.
add_subdirectory(${CEF_LIBCEF_DLL_WRAPPER_PATH} libcef_dll_wrapper)


#
# my_browser target.
#

set(MY_BROWSER_SRCS
  src/main.cpp
  src/simple_app.h
  src/simple_app.cpp
  src/simple_handler.h
  src/simple_handler.cpp
  src/storage.h
  src/storage.cpp
  )
source_group(src FILES ${MY_BROWSER_SRCS})

set(CEF_TARGET "my_browser")

if(NOT OS_WINDOWS)
  message(FATAL_ERROR "my_browser currently only supports Windows. "
                      "See tests/cefsimple/CMakeLists.txt in the CEF "
                      "distribution for the Linux/macOS target setup.")
endif()

# Imported target wrapping the prebuilt libcef.lib (Debug/Release variants).
ADD_LOGICAL_TARGET("libcef_lib" "${CEF_LIB_DEBUG}" "${CEF_LIB_RELEASE}")

# Defines CEF_TARGET_OUT_DIR, e.g. <build>/Debug for Visual Studio generators.
SET_CEF_TARGET_OUT_DIR()

if(USE_SANDBOX)
  # With the sandbox enabled (the default), CEF 151 uses "bootstrap mode": our
  # code builds as a DLL and the prebuilt bootstrap.exe loads it and calls the
  # exported RunWinMain() in src/main.cpp.
  add_library(${CEF_TARGET} SHARED ${MY_BROWSER_SRCS})
  SET_LIBRARY_TARGET_PROPERTIES(${CEF_TARGET})

  # Copy bootstrap.exe next to the DLL, renamed to my_browser.exe.
  COPY_SINGLE_FILE(${CEF_TARGET} ${CEF_BINARY_DIR}/bootstrap.exe
                   ${CEF_TARGET_OUT_DIR}/${CEF_TARGET}.exe)

  if(CMAKE_GENERATOR MATCHES "Visual Studio")
    # F5 in Visual Studio must launch bootstrap, not the DLL.
    set_target_properties(${CEF_TARGET} PROPERTIES
      VS_DEBUGGER_COMMAND "$<TARGET_FILE_DIR:${CEF_TARGET}>/${CEF_TARGET}.exe"
      )
  endif()
else()
  # -DUSE_SANDBOX=OFF: plain executable with a wWinMain() entry point.
  add_executable(${CEF_TARGET} WIN32 ${MY_BROWSER_SRCS})
  SET_EXECUTABLE_TARGET_PROPERTIES(${CEF_TARGET})
endif()

add_dependencies(${CEF_TARGET} libcef_dll_wrapper)
# shell32 is for SHGetKnownFolderPath(), used to locate the Downloads folder.
# It is not part of CEF_STANDARD_LIBS.
target_link_libraries(${CEF_TARGET} libcef_lib libcef_dll_wrapper
                      ${CEF_STANDARD_LIBS} shell32.lib)


#
# Post-build: stage the CEF runtime next to the executable.
#

# libcef.dll, chrome_elf.dll, the ANGLE/SwiftShader DLLs, v8_context_snapshot.bin.
COPY_FILES("${CEF_TARGET}" "${CEF_BINARY_FILES}" "${CEF_BINARY_DIR}" "${CEF_TARGET_OUT_DIR}")
# *.pak, icudtl.dat, locales/.
COPY_FILES("${CEF_TARGET}" "${CEF_RESOURCE_FILES}" "${CEF_RESOURCE_DIR}" "${CEF_TARGET_OUT_DIR}")

# This project's own assets (icons, HTML, ...) land in <out>/resources.
add_custom_command(
  TARGET ${CEF_TARGET}
  POST_BUILD
  COMMAND ${CMAKE_COMMAND} -E copy_directory
          "${CMAKE_CURRENT_SOURCE_DIR}/resources"
          "${CEF_TARGET_OUT_DIR}/resources"
  COMMENT "Copying my_browser resources..."
  VERBATIM
  )

if(USE_SANDBOX)
  # Grant the LPAC ACLs the Windows sandbox needs to read the output directory.
  SET_LPAC_ACLS("${CEF_TARGET}")
endif()

PRINT_CEF_CONFIG()
