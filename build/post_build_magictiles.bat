@echo off
REM Post-build script for Magic Tiles Content

echo Running obfuscator script...
node obfuscate.js /Tool-MagicTilesContent

echo Copying required files to Tool-MagicTilesContent folder...
copy /Y game_macos.sh Tool-MagicTilesContent\
copy /Y game_readme.md Tool-MagicTilesContent\
copy /Y game_window.bat Tool-MagicTilesContent\

echo Creating zip file of Tool-MagicTilesContent folder with timestamp...
powershell -command "$timestamp = Get-Date -Format 'yyyyMMdd_HHmmss'; Compress-Archive -Path Tool-MagicTilesContent -DestinationPath ('Tool-MagicTilesContent_' + $timestamp + '.zip') -Force"

echo Post-build process completed successfully.
pause
