@echo off
REM Post-build script for Magic Tiles Content

echo Running obfuscator script...
node obfuscate.js /staging

echo Replacing version timestamps in JSON files...
powershell -command "$timestamp = Get-Date -Format 'yyyyMMdd_HHmmss'; Get-ChildItem -Path 'staging\assets\main\import' -Recurse -Filter '*.json' | ForEach-Object { (Get-Content $_.FullName) -replace '{app_version_timestamp}', $timestamp | Set-Content $_.FullName -Force }"

@REM echo Creating zip file of staging folder with timestamp...
@REM powershell -command "$timestamp = Get-Date -Format 'yyyyMMdd_HHmmss'; Compress-Archive -Path staging -DestinationPath ('staging_' + $timestamp + '.zip') -Force"

echo Post-build process completed successfully.
pause
