@echo off
if "%~1"=="" (
    echo Usage: push-both.bat "commit message"
    exit /b 1
)

echo Adding changes...
git add backend-go/

echo Committing changes...
git commit -m "%~1"

echo Pushing to both repositories automatically...
git push origin main

echo Successfully pushed to both repositories!
echo - https://github.com/Aew-Work/internship.git
echo - https://github.com/aewaew419/internship.git