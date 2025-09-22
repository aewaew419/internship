# PowerShell script to push to both repositories automatically
param(
    [Parameter(Mandatory=$true)]
    [string]$CommitMessage
)

Write-Host "Adding changes..." -ForegroundColor Green
git add backend-go/

Write-Host "Committing changes..." -ForegroundColor Green
git commit -m $CommitMessage

Write-Host "Pushing to both repositories automatically..." -ForegroundColor Green
git push origin main

Write-Host "Successfully pushed to both repositories!" -ForegroundColor Green
Write-Host "- https://github.com/Aew-Work/internship.git" -ForegroundColor Yellow
Write-Host "- https://github.com/aewaew419/internship.git" -ForegroundColor Yellow