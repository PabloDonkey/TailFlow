param(
    [Parameter(Position = 0)]
    [ValidateSet('install', 'run', 'stop', 'test', 'lint', 'typecheck', 'build')]
    [string]$Command
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$RepoRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$BackendDir = Join-Path $RepoRoot 'backend'
$FrontendDir = Join-Path $RepoRoot 'frontend'
$BackendVenvDir = Join-Path $BackendDir '.venv'
$BackendPython = Join-Path $BackendVenvDir 'Scripts/python.exe'
$BackendAlembic = Join-Path $BackendVenvDir 'Scripts/alembic.exe'

function Write-Usage {
    Write-Host 'Usage: pwsh -File scripts/dev.ps1 <command>'
    Write-Host ''
    Write-Host 'Commands:'
    Write-Host '  install    Setup dependencies and enable repo git hooks'
    Write-Host '  run        Apply migrations and run backend + frontend dev servers'
    Write-Host '  stop       Stop backend/frontend processes on dev ports'
    Write-Host '  test       Run backend and frontend tests'
    Write-Host '  lint       Run backend and frontend linters'
    Write-Host '  typecheck  Run backend and frontend type checks'
    Write-Host '  build      Build frontend production bundle'
}

function Get-PythonBootstrapCommand {
    if (Get-Command py -ErrorAction SilentlyContinue) {
        return @('py', '-3')
    }
    if (Get-Command python -ErrorAction SilentlyContinue) {
        return @('python')
    }
    if (Get-Command python3 -ErrorAction SilentlyContinue) {
        return @('python3')
    }
    throw 'Python 3 was not found in PATH. Install Python 3.11+ and retry.'
}

function Invoke-CheckedCommand {
    param(
        [Parameter(Mandatory = $true)]
        [string]$Exe,
        [Parameter()]
        [string[]]$Args = @(),
        [Parameter()]
        [string]$WorkingDirectory = $RepoRoot
    )

    Push-Location $WorkingDirectory
    try {
        & $Exe @Args
        if ($LASTEXITCODE -ne 0) {
            throw "Command failed with exit code $LASTEXITCODE: $Exe $($Args -join ' ')"
        }
    }
    finally {
        Pop-Location
    }
}

function Test-PortListening {
    param(
        [Parameter(Mandatory = $true)]
        [int]$Port
    )

    $listeners = Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue
    return $null -ne $listeners
}

function Get-ListeningProcessIds {
    param(
        [Parameter(Mandatory = $true)]
        [int[]]$Ports
    )

    $ids = @()
    foreach ($port in $Ports) {
        $listeners = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue
        if ($listeners) {
            $ids += $listeners | Select-Object -ExpandProperty OwningProcess
        }
    }
    return $ids | Sort-Object -Unique
}

function Invoke-Install {
    if (-not (Test-Path $BackendVenvDir)) {
        Write-Host 'Setting up backend virtual environment...'
        $pythonCmd = Get-PythonBootstrapCommand
        $pythonExe = $pythonCmd[0]
        $pythonArgs = @()
        if ($pythonCmd.Count -gt 1) {
            $pythonArgs = $pythonCmd[1..($pythonCmd.Count - 1)]
        }
        Invoke-CheckedCommand -Exe $pythonExe -Args ($pythonArgs + @('-m', 'venv', $BackendVenvDir))
    }

    Write-Host 'Installing backend dependencies...'
    Invoke-CheckedCommand -Exe $BackendPython -Args @('-m', 'pip', 'install', '-e', '.[dev]') -WorkingDirectory $BackendDir

    Write-Host 'Bootstrapping backend environment...'
    Invoke-CheckedCommand -Exe $BackendPython -Args @(Join-Path $RepoRoot 'scripts/install_setup.py')

    Write-Host 'Enabling repository git hooks...'
    Invoke-CheckedCommand -Exe 'git' -Args @('config', 'core.hooksPath', '.githooks')

    Write-Host 'Installing frontend dependencies...'
    Invoke-CheckedCommand -Exe 'npm' -Args @('install') -WorkingDirectory $FrontendDir
}

function Invoke-Run {
    if (-not (Test-Path $BackendPython)) {
        throw 'Missing backend virtual environment at backend/.venv. Run: pwsh -File scripts/dev.ps1 install'
    }
    if (-not (Test-Path (Join-Path $FrontendDir 'node_modules'))) {
        throw 'Missing frontend dependencies. Run: pwsh -File scripts/dev.ps1 install'
    }
    if (Test-PortListening -Port 8000) {
        throw "Port 8000 is already in use. Stop the existing backend process and retry."
    }

    Write-Host 'Applying backend migrations...'
    Invoke-CheckedCommand -Exe $BackendAlembic -Args @('upgrade', 'head') -WorkingDirectory $BackendDir

    Write-Host 'Starting backend at http://0.0.0.0:8000...'
    $backendProcess = Start-Process -FilePath $BackendPython -ArgumentList @('-m', 'uvicorn', 'app.main:app', '--host', '0.0.0.0', '--port', '8000', '--reload') -WorkingDirectory $BackendDir -PassThru
    Write-Host "Backend running with PID $($backendProcess.Id)"
    Write-Host 'Starting frontend at http://0.0.0.0:5173...'

    try {
        Invoke-CheckedCommand -Exe 'npm' -Args @('run', 'dev') -WorkingDirectory $FrontendDir
    }
    finally {
        if (-not $backendProcess.HasExited) {
            Stop-Process -Id $backendProcess.Id -Force -ErrorAction SilentlyContinue
        }
    }
}

function Invoke-Stop {
    $processIds = Get-ListeningProcessIds -Ports @(8000, 5173, 5174)
    if (-not $processIds -or $processIds.Count -eq 0) {
        Write-Host 'No TailFlow dev processes found.'
        return
    }

    foreach ($processId in $processIds) {
        Stop-Process -Id $processId -Force -ErrorAction SilentlyContinue
    }

    Write-Host 'Stopped TailFlow dev process(es).'
}

function Invoke-Test {
    Invoke-CheckedCommand -Exe $BackendPython -Args @('-m', 'pytest') -WorkingDirectory $BackendDir
    Invoke-CheckedCommand -Exe 'npm' -Args @('run', 'test') -WorkingDirectory $FrontendDir
}

function Invoke-Lint {
    Invoke-CheckedCommand -Exe $BackendPython -Args @('-m', 'ruff', 'check', '.') -WorkingDirectory $BackendDir
    Invoke-CheckedCommand -Exe 'npm' -Args @('run', 'lint') -WorkingDirectory $FrontendDir
}

function Invoke-Typecheck {
    Invoke-CheckedCommand -Exe $BackendPython -Args @('-m', 'mypy', '.') -WorkingDirectory $BackendDir
    Invoke-CheckedCommand -Exe 'npm' -Args @('run', 'typecheck') -WorkingDirectory $FrontendDir
}

function Invoke-Build {
    Invoke-CheckedCommand -Exe 'npm' -Args @('run', 'build') -WorkingDirectory $FrontendDir
}

if (-not $Command) {
    Write-Usage
    exit 1
}

switch ($Command) {
    'install' { Invoke-Install }
    'run' { Invoke-Run }
    'stop' { Invoke-Stop }
    'test' { Invoke-Test }
    'lint' { Invoke-Lint }
    'typecheck' { Invoke-Typecheck }
    'build' { Invoke-Build }
    default { Write-Usage; exit 1 }
}
