@echo off
REM Post-build script for Magic Tiles Content

echo Running obfuscator script...
node obfuscate.js /Pitch

echo Copying required files to Pitch folder...
copy /Y game_macos.sh Pitch\
copy /Y game_readme.md Pitch\
copy /Y game_window.bat Pitch\

echo Creating zip file of Pitch folder with timestamp...
powershell -command "$timestamp = Get-Date -Format 'yyyyMMdd_HHmmss'; Compress-Archive -Path Pitch -DestinationPath ('Pitch_' + $timestamp + '.zip') -Force"

echo Post-build process completed successfully.
pause
