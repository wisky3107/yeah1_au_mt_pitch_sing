@echo off
REM Post-build script for Magic Tiles Content

echo Running obfuscator script...
node obfuscate.js /Audition

echo Copying required files to Audition folder...
copy /Y game_macos.sh Audition\
copy /Y game_readme.md Audition\
copy /Y game_window.bat Audition\

echo Creating zip file of Audition folder with timestamp...
powershell -command "$timestamp = Get-Date -Format 'yyyyMMdd_HHmmss'; Compress-Archive -Path Audition -DestinationPath ('Audition_' + $timestamp + '.zip') -Force"

echo Post-build process completed successfully.
pause
