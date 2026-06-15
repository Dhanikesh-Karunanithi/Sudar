# SudarSim — verify Oracle VM + sudar-sim service (run from your PC)
param(
  [Parameter(Mandatory = $true)]
  [string]$PublicIp,
  [string]$SshKeyPath = "$env:USERPROFILE\Downloads\ssh-key-2026-06-15.key",
  [string]$SshUser = "ubuntu",
  [int]$Port = 8090
)

Write-Host "==> HTTP health check http://${PublicIp}:${Port}/health"
try {
  $health = Invoke-RestMethod -Uri "http://${PublicIp}:${Port}/health" -TimeoutSec 10
  Write-Host "OK: $($health | ConvertTo-Json -Compress)"
} catch {
  Write-Host "FAIL: $($_.Exception.Message)"
  Write-Host "If connection timed out: assign a public IP and open TCP $Port in the VCN security list."
  exit 1
}

Write-Host "==> Service root http://${PublicIp}:${Port}/"
try {
  $root = Invoke-RestMethod -Uri "http://${PublicIp}:${Port}/" -TimeoutSec 10
  Write-Host "OK: $($root | ConvertTo-Json -Compress)"
} catch {
  Write-Host "WARN: root endpoint failed — $($_.Exception.Message)"
}

if (Test-Path $SshKeyPath) {
  Write-Host "==> SSH probe (optional)"
  ssh -i $SshKeyPath -o StrictHostKeyChecking=no -o ConnectTimeout=10 "${SshUser}@${PublicIp}" "systemctl is-active sudar-sim"
} else {
  Write-Host "SSH key not found at $SshKeyPath — skip SSH probe"
}

Write-Host ""
Write-Host "Learn .env.local:"
Write-Host "SUDAR_SIM_URL=http://${PublicIp}:${Port}"
Write-Host "NEXT_PUBLIC_SUDAR_SIM_WS_URL=ws://${PublicIp}:${Port}"
