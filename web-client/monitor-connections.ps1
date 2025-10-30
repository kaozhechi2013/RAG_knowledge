# Monitor API Server Connections
# Shows who is using the system in real-time

param(
    [int]$RefreshSeconds = 5
)

$ErrorActionPreference = "SilentlyContinue"

function Get-LocalIP {
    $ip = (Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.IPAddress -notlike "127.*" -and $_.IPAddress -notlike "169.*" } | Select-Object -First 1).IPAddress
    return $ip
}

function Get-ConnectionInfo {
    # Get active connections to ports 8080 and 8081
    $connections = Get-NetTCPConnection -State Established | Where-Object {
        ($_.LocalPort -eq 8080 -or $_.LocalPort -eq 8081) -and 
        $_.RemoteAddress -notlike "127.*" -and 
        $_.RemoteAddress -notlike "::1"
    }
    
    return $connections
}

Clear-Host

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Knowledge AI - Connection Monitor" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Server IP: $(Get-LocalIP)" -ForegroundColor Green
Write-Host "Refresh every $RefreshSeconds seconds (Press Ctrl+C to exit)" -ForegroundColor Yellow
Write-Host ""

while ($true) {
    $timestamp = Get-Date -Format "HH:mm:ss"
    
    Write-Host "[$timestamp] Active Connections:" -ForegroundColor Cyan
    Write-Host "----------------------------------------" -ForegroundColor Gray
    
    $connections = Get-ConnectionInfo
    
    if ($connections) {
        # Group by remote IP
        $grouped = $connections | Group-Object RemoteAddress
        
        $totalConnections = 0
        
        foreach ($group in $grouped) {
            $ip = $group.Name
            $webCount = ($group.Group | Where-Object { $_.LocalPort -eq 8081 }).Count
            $apiCount = ($group.Group | Where-Object { $_.LocalPort -eq 8080 }).Count
            
            $totalConnections += $webCount + $apiCount
            
            Write-Host "  IP: " -NoNewline -ForegroundColor White
            Write-Host $ip -ForegroundColor Yellow
            
            if ($webCount -gt 0) {
                Write-Host "    Web (8081): $webCount connection(s)" -ForegroundColor Green
            }
            if ($apiCount -gt 0) {
                Write-Host "    API (8080): $apiCount connection(s)" -ForegroundColor Cyan
            }
            Write-Host ""
        }
        
        Write-Host "Total: $totalConnections active connection(s)" -ForegroundColor Magenta
        
    }
    else {
        Write-Host "  No active connections" -ForegroundColor Gray
    }
    
    Write-Host "----------------------------------------" -ForegroundColor Gray
    Write-Host ""
    
    Start-Sleep -Seconds $RefreshSeconds
    
    # Clear only the connection info, keep header
    $cursorPos = [Console]::CursorTop - ($grouped.Count * 4 + 5)
    if ($cursorPos -gt 0) {
        [Console]::SetCursorPosition(0, $cursorPos)
    }
}
