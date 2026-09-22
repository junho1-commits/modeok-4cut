@echo off
rem ===== Print station launcher: prints photos sent from the phone app (app window, silent print) =====
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
for /f "usebackq delims=" %%u in (`powershell -NoProfile -Command "([System.Uri]'%~dp0print-station\index.html').AbsoluteUri"`) do set "URL=%%u"
if not defined URL (
  echo Could not build the app URL. Check that PowerShell is available.
  pause
  exit /b 1
)
start "" %CHROME% --app="%URL%" --window-size=1000,800 --kiosk-printing --disable-features=Translate --no-first-run --user-data-dir="%TEMP%\photobooth_station_profile"
