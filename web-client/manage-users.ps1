# IP to User Mapping Tool
# Create a mapping of IP addresses to user names

$mappingFile = "ip-to-user.json"

function Load-Mapping {
    if (Test-Path $mappingFile) {
        return Get-Content $mappingFile | ConvertFrom-Json -AsHashtable
    }
    return @{}
}

function Save-Mapping {
    param($mapping)
    $mapping | ConvertTo-Json | Out-File $mappingFile -Encoding UTF8
}

function Show-Menu {
    Clear-Host
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "  IP to User Mapping Manager" -ForegroundColor Cyan
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host ""
    
    $mapping = Load-Mapping
    
    if ($mapping.Count -eq 0) {
        Write-Host "No mappings yet" -ForegroundColor Yellow
    }
    else {
        Write-Host "Current mappings:" -ForegroundColor Green
        Write-Host ""
        foreach ($ip in $mapping.Keys | Sort-Object) {
            Write-Host "  $ip -> " -NoNewline -ForegroundColor White
            Write-Host $mapping[$ip] -ForegroundColor Cyan
        }
    }
    
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Gray
    Write-Host "Options:" -ForegroundColor Yellow
    Write-Host "  1. Add new mapping" -ForegroundColor White
    Write-Host "  2. Remove mapping" -ForegroundColor White
    Write-Host "  3. Show current connections" -ForegroundColor White
    Write-Host "  4. Exit" -ForegroundColor White
    Write-Host ""
}

function Add-Mapping {
    Write-Host ""
    $ip = Read-Host "Enter IP address (e.g., 10.216.186.25)"
    
    if ($ip -match "^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$") {
        $name = Read-Host "Enter user name/identifier"
        
        $mapping = Load-Mapping
        $mapping[$ip] = $name
        Save-Mapping $mapping
        
        Write-Host ""
        Write-Host "Mapping added: $ip -> $name" -ForegroundColor Green
    }
    else {
        Write-Host "Invalid IP address format" -ForegroundColor Red
    }
    
    Read-Host "`nPress Enter to continue"
}

function Remove-Mapping {
    Write-Host ""
    $ip = Read-Host "Enter IP address to remove"
    
    $mapping = Load-Mapping
    if ($mapping.ContainsKey($ip)) {
        $mapping.Remove($ip)
        Save-Mapping $mapping
        Write-Host "Mapping removed" -ForegroundColor Green
    }
    else {
        Write-Host "IP not found in mappings" -ForegroundColor Yellow
    }
    
    Read-Host "`nPress Enter to continue"
}

function Show-Connections {
    Write-Host ""
    Write-Host "Active connections:" -ForegroundColor Cyan
    Write-Host ""
    
    $connections = Get-NetTCPConnection -State Established -ErrorAction SilentlyContinue | Where-Object {
        ($_.LocalPort -eq 8080 -or $_.LocalPort -eq 8081) -and 
        $_.RemoteAddress -notlike "127.*" -and 
        $_.RemoteAddress -notlike "::1"
    }
    
    if ($connections) {
        $mapping = Load-Mapping
        $grouped = $connections | Group-Object RemoteAddress
        
        foreach ($group in $grouped) {
            $ip = $group.Name
            $userName = if ($mapping.ContainsKey($ip)) { $mapping[$ip] } else { "Unknown" }
            
            Write-Host "  IP: $ip" -ForegroundColor Yellow
            Write-Host "  User: $userName" -ForegroundColor Cyan
            
            $webCount = ($group.Group | Where-Object { $_.LocalPort -eq 8081 }).Count
            $apiCount = ($group.Group | Where-Object { $_.LocalPort -eq 8080 }).Count
            
            if ($webCount -gt 0) { Write-Host "    Web connections: $webCount" -ForegroundColor Green }
            if ($apiCount -gt 0) { Write-Host "    API connections: $apiCount" -ForegroundColor Green }
            Write-Host ""
        }
    }
    else {
        Write-Host "  No active connections" -ForegroundColor Gray
    }
    
    Read-Host "Press Enter to continue"
}

# Main loop
while ($true) {
    Show-Menu
    $choice = Read-Host "Select option (1-4)"
    
    switch ($choice) {
        "1" { Add-Mapping }
        "2" { Remove-Mapping }
        "3" { Show-Connections }
        "4" { 
            Write-Host "Goodbye!" -ForegroundColor Green
            exit 
        }
        default { 
            Write-Host "Invalid option" -ForegroundColor Red
            Start-Sleep -Seconds 1
        }
    }
}
