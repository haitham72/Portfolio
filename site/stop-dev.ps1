# Stops any running next dev / node processes for this project so Windows
# releases file locks.

# Get-NetTCPConnection -LocalPort 3000 -State Listen -ErrorAction SilentlyContinue | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force }

$port = 3000
$connections = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue

if ($connections) {
    $pids = $connections.OwningProcess | Select-Object -Unique
    foreach ($ownerId in $pids) {
        Write-Host "Stopping process $ownerId (listening on port $port)"
        Stop-Process -Id $ownerId -Force -ErrorAction SilentlyContinue
    }
} else {
    Write-Host "Nothing listening on port $port."
}

# Sweep remaining node.exe worker processes
$nodeProcs = Get-Process -Name node -ErrorAction SilentlyContinue
if ($nodeProcs) {
    Write-Host "Also stopping $($nodeProcs.Count) node.exe process(es)..."
    $nodeProcs | Stop-Process -Force -ErrorAction SilentlyContinue
} else {
    Write-Host "No node.exe processes running."
}

Write-Host "Done. File locks should be released - safe to edit/rename/delete now."