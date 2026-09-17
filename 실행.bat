@echo off
rem ===== Photo booth launcher (app window, silent print) =====
set CHROME="C:\Program Files\Google\Chrome\Application\chrome.exe"
if not exist %CHROME% set CHROME="C:\Program Files (x86)\Google\Chrome\Application\chrome.exe"
if not exist %CHROME% set CHROME="%LocalAppData%\Google\Chrome\Application\chrome.exe"
if not exist %CHROME% (
  echo Chrome not found. Install Google Chrome first.
  pause
  exit /b 1
)
rem Folder path has spaces and Korean, so build a percent-encoded file:/// URL (Chrome rejects the raw path and opens an empty tab)
set "URL="
for /f "usebackq delims=" %%u in (`powershell -NoProfile -Command "([System.Uri]'%~dp0index.html').AbsoluteUri"`) do set "URL=%%u"
if not defined URL (
  echo Could not build the app URL. Check that PowerShell is available.
  pause
  exit /b 1
)
start "" %CHROME% --app="%URL%" --window-size=1440,960 --kiosk-printing --use-fake-ui-for-media-stream --autoplay-policy=no-user-gesture-required --disable-features=Translate --no-first-run --user-data-dir="%TEMP%\photobooth_profile"
