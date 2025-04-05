@echo off
REM Post-build script for Magic Tiles Content

echo Running obfuscator script...
node obfuscate.js /stagging

echo Replacing version timestamps in JSON files...
powershell -command "$timestamp = Get-Date -Format 'yyyyMMdd_HHmmss'; Get-ChildItem -Path 'stagging\assets\main\import' -Recurse -Filter '*.json' | ForEach-Object { (Get-Content $_.FullName) -replace '{app_version_timestamp}', $timestamp | Set-Content $_.FullName -Force }"

echo Creating zip file of stagging folder with timestamp...
powershell -command "$timestamp = Get-Date -Format 'yyyyMMdd_HHmmss'; Compress-Archive -Path stagging -DestinationPath ('stagging_' + $timestamp + '.zip') -Force"

echo Post-build process completed successfully.
pause
