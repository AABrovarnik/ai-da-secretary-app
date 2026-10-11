param(
  [string]$ApiBase = "http://localhost:4000",
  [string]$Email = "smoke@example.com",
  [string]$Password = "smoke12345",
  [string]$AudioPath = "C:\Users\aabro\Downloads\audio_2026-10-06_16-15-16.ogg"
)

$ErrorActionPreference = "Stop"

function Invoke-Json {
  param(
    [string]$Method,
    [string]$Url,
    [object]$Body,
    [string]$Token
  )

  $headers = @{}
  if ($Token) { $headers["Authorization"] = "Bearer $Token" }

  if ($null -ne $Body) {
    return Invoke-RestMethod -Method $Method -Uri $Url -Headers $headers -ContentType "application/json" -Body ($Body | ConvertTo-Json -Depth 10)
  }

  return Invoke-RestMethod -Method $Method -Uri $Url -Headers $headers
}

Write-Host "[1/6] register"
try {
  Invoke-Json -Method POST -Url "$ApiBase/api/auth/register" -Body @{ email = $Email; password = $Password; displayName = "Smoke" } | Out-Null
} catch {
  Write-Host "register skipped: $($_.Exception.Message)"
}

Write-Host "[2/6] login"
$login = Invoke-Json -Method POST -Url "$ApiBase/api/auth/login" -Body @{ email = $Email; password = $Password }
$token = $login.accessToken

Write-Host "[3/6] create meeting"
$meeting = Invoke-Json -Method POST -Url "$ApiBase/api/meetings" -Body @{ title = "Smoke audio"; timeZone = "Europe/Moscow" } -Token $token
$meetingId = $meeting.item.id

Write-Host "[4/6] upload audio"
if (-not (Test-Path -LiteralPath $AudioPath)) {
  throw "Audio file not found: $AudioPath"
}
$uploadHeaders = @{ Authorization = "Bearer $token" }
Invoke-RestMethod -Method POST -Uri "$ApiBase/api/meetings/$meetingId/materials/audio" -Headers $uploadHeaders -Form @{ audio = Get-Item -LiteralPath $AudioPath } | Out-Null

Write-Host "[5/6] start audio processing"
$runStart = Invoke-Json -Method POST -Url "$ApiBase/api/meetings/$meetingId/process-latest-audio" -Body $null -Token $token
$runId = $runStart.runId

Write-Host "[6/6] poll run"
for ($i = 0; $i -lt 60; $i++) {
  Start-Sleep -Seconds 2
  $run = Invoke-Json -Method GET -Url "$ApiBase/api/meetings/processing/$runId" -Body $null -Token $token
  $status = $run.item.status
  Write-Host "status=$status"
  if ($status -in @("succeeded", "failed", "cancelled")) {
    $run.item | ConvertTo-Json -Depth 15
    if ($status -ne "succeeded") { exit 1 }
    exit 0
  }
}

throw "Timeout waiting for run completion"