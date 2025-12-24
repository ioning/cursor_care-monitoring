param(
  [int[]] $Ports
)

$ErrorActionPreference = "Stop"

function Stop-ListeningProcessByPort {
  param([int] $Port)

  try {
    $connections = Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue
  } catch {
    $connections = @()
  }

  if (-not $connections) {
    Write-Host "Port ${Port}: free"
    return
  }

  $pids = $connections | Select-Object -ExpandProperty OwningProcess -Unique
  foreach ($procId in $pids) {
    if (-not $procId) { continue }
    try {
      Write-Host "Port ${Port}: stopping PID ${procId}"
      taskkill /PID $procId /T /F | Out-Null
    } catch {
      Write-Host "Port ${Port}: failed to stop PID ${procId} ($($_.Exception.Message))"
    }
  }
}

if (-not $Ports -or $Ports.Count -eq 0) {
  throw "Ports list is empty. Pass -Ports 3000,3001,..."
}

Write-Host "Killing listeners on ports: $($Ports -join ', ')"
$Ports | Sort-Object -Unique | ForEach-Object { Stop-ListeningProcessByPort -Port $_ }
Write-Host "Done."


