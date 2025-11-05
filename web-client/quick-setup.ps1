# Quick Setup for LAN Access
# Run this script once to configure everything

$ErrorActionPreference = "Stop"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Knowledge LAN Setup - Quick Config" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Get local IP
$localIP = (Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.IPAddress -notlike "127.*" -and $_.IPAddress -notlike "169.*" } | Select-Object -First 1).IPAddress

if (-not $localIP) {
  Write-Host "[ERROR] Cannot find local IP address" -ForegroundColor Red
  pause
  exit 1
}

Write-Host "[INFO] Your IP address: $localIP" -ForegroundColor Green
Write-Host ""

# Check if running as administrator
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)

if (-not $isAdmin) {
  Write-Host "[WARNING] Not running as administrator" -ForegroundColor Yellow
  Write-Host "Firewall rules will be configured when you run setup-firewall.bat" -ForegroundColor Yellow
  Write-Host ""
}
else {
  Write-Host "[1/2] Configuring firewall..." -ForegroundColor Cyan
    
  # Remove old rules
  netsh advfirewall firewall delete rule name="Knowledge Web Client (8081)" 2>$null | Out-Null
  netsh advfirewall firewall delete rule name="Knowledge API Server (8080)" 2>$null | Out-Null
    
  # Add new rules
  netsh advfirewall firewall add rule name="Knowledge Web Client (8081)" dir=in action=allow protocol=TCP localport=8081 | Out-Null
  netsh advfirewall firewall add rule name="Knowledge API Server (8080)" dir=in action=allow protocol=TCP localport=8080 | Out-Null
    
  Write-Host "[OK] Firewall configured" -ForegroundColor Green
  Write-Host ""
}

Write-Host "[2/2] Creating configuration info..." -ForegroundColor Cyan

# Create info file for colleagues
$infoContent = @"
========================================
  Knowledge AI - LAN Access Info
========================================

Web Interface URL:
  http://${localIP}:8081

API Server URL (for settings):
  http://${localIP}:8080

Instructions for Colleagues:
1. Open the Web Interface URL in your browser
2. Click the settings icon (⚙️) in the top right
3. API URL will be automatically set to: http://${localIP}:8080
4. Enter the API Key (ask the administrator)
5. Select a model from the dropdown
6. Click "Save Settings"
7. Start chatting!

Note: Make sure you are on the same network as the administrator.

========================================
Generated on: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")
"@

$infoContent | Out-File -FilePath "LAN-ACCESS-INFO.txt" -Encoding UTF8

Write-Host "[OK] Configuration info saved to LAN-ACCESS-INFO.txt" -ForegroundColor Green
Write-Host ""

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Setup Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Share with colleagues:" -ForegroundColor Yellow
Write-Host "  Web URL: http://${localIP}:8081" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "  1. Start API Server (run: start Knowledge.bat)" -ForegroundColor White
Write-Host "  2. Start Web Server (run: start-server.bat)" -ForegroundColor White
Write-Host "  3. Get API Key from API Server console" -ForegroundColor White
Write-Host "  4. Share the info above with colleagues" -ForegroundColor White
Write-Host ""

if (-not $isAdmin) {
  Write-Host "[!] Remember to run setup-firewall.bat as administrator!" -ForegroundColor Yellow
  Write-Host ""
}

pause
