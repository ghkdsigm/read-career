# 포트 8001을 사용하는 프로세스 종료 스크립트

$port = 8001
$processes = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue |
    Where-Object { $_.OwningProcess -gt 0 } |
    Select-Object -ExpandProperty OwningProcess -Unique

if ($processes) {
    foreach ($procId in $processes) {
        $process = Get-Process -Id $procId -ErrorAction SilentlyContinue
        if ($process) {
            Write-Host "포트 $port 를 사용하는 프로세스 종료: $($process.ProcessName) (PID: $procId)"
            Stop-Process -Id $procId -Force -ErrorAction SilentlyContinue
        }
    }
    Write-Host "프로세스 종료 완료"
} else {
    Write-Host "포트 $port 를 사용하는 프로세스가 없습니다"
}

