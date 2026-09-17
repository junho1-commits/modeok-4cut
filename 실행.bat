@echo off
rem ===== Photo booth launcher (movable app window, silent print) =====
set CHROME="C:\Program Files\Google\Chrome\Application\chrome.exe"
if not exist %CHROME% set CHROME="C:\Program Files (x86)\Google\Chrome\Application\chrome.exe"
if not exist %CHROME% set CHROME="%LocalAppData%\Google\Chrome\Application\chrome.exe"
if not exist %CHROME% (
  echo Chrome not found. Install Google Chrome first.
  pause
  exit /b 1
)
start "" %CHROME% --app="file:///%~dp0index.html" --window-size=1440,960 --kiosk-printing --use-fake-ui-for-media-stream --autoplay-policy=no-user-gesture-required --disable-features=Translate --no-first-run --user-data-dir="%TEMP%\photobooth_profile"
