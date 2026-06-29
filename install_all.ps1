Write-Host "==========================================="
Write-Host " AI Electronics Doctor Pro"
Write-Host "==========================================="

$project = "C:\NNIT AI-Electronics-Doctor"
$backend = "$project\backend"

if (!(Test-Path $backend)) {
    Write-Host "Backend folder not found!"
    exit
}

Set-Location $backend

Write-Host ""
Write-Host "Installing requirements..."
python -m pip install -r requirements.txt

Write-Host ""
Write-Host "Starting FastAPI..."
python -m uvicorn main:app --reload