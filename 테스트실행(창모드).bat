@echo off
rem ===== Windowed test mode (no kiosk, print dialog shown) =====
set CHROME="C:\Program Files\Google\Chrome\Application\chrome.exe"
if not exist %CHROME% set CHROME="C:\Program Files (x86)\Google\Chrome\Application\chrome.exe"
if not exist %CHROME% set CHROME="%LocalAppData%\Google\Chrome\Application\chrome.exe"
start "" %CHROME% --use-fake-ui-for-media-stream --no-first-run --user-data-dir="%TEMP%\photobooth_profile" "file:///%~dp0index.html"
