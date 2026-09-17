@echo off
rem ===== Windowed test mode (normal browser window, print dialog shown) =====
set CHROME="C:\Program Files\Google\Chrome\Application\chrome.exe"
if not exist %CHROME% set CHROME="C:\Program Files (x86)\Google\Chrome\Application\chrome.exe"
if not exist %CHROME% set CHROME="%LocalAppData%\Google\Chrome\Application\chrome.exe"
rem Build a percent-encoded file:/// URL (folder path has spaces and Korean)
set "URL="
for /f "usebackq delims=" %%u in (`powershell -NoProfile -Command "([System.Uri]'%~dp0index.html').AbsoluteUri"`) do set "URL=%%u"
start "" %CHROME% --use-fake-ui-for-media-stream --no-first-run --user-data-dir="%TEMP%\photobooth_profile" "%URL%"
