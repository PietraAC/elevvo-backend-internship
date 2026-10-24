@echo off
setlocal EnableExtensions
pushd "%~dp0"

set "INTERACTIVE=0"
if "%~1"=="" set "INTERACTIVE=1" & goto menu
set "COMMAND=%~1"
goto dispatch

:menu
cls
echo ============================================================
echo   Task 09 - AI-Powered Semantic Search
echo ============================================================
echo.
echo   [R] Run the API and Semantic Search Lab
echo   [D] Open or display the demo
echo   [T] Run automated tests
echo   [V] Verify the complete task
echo   [S] Migrate and seed the catalog
echo   [B] Run the warm-cache benchmark
echo   [X] Stop only Task 09
echo   [Q] Quit
echo.
choice /C RDTVSBXQ /N /M "Select an option: "
if errorlevel 8 goto success
if errorlevel 7 set "COMMAND=stop" & goto dispatch
if errorlevel 6 set "COMMAND=benchmark" & goto dispatch
if errorlevel 5 set "COMMAND=seed" & goto dispatch
if errorlevel 4 set "COMMAND=verify" & goto dispatch
if errorlevel 3 set "COMMAND=test" & goto dispatch
if errorlevel 2 set "COMMAND=demo" & goto dispatch
if errorlevel 1 set "COMMAND=run" & goto dispatch

:dispatch
if /I "%COMMAND%"=="run" goto run
if /I "%COMMAND%"=="demo" goto demo
if /I "%COMMAND%"=="test" goto test
if /I "%COMMAND%"=="verify" goto verify
if /I "%COMMAND%"=="seed" goto seed
if /I "%COMMAND%"=="benchmark" goto benchmark
if /I "%COMMAND%"=="stop" goto stop
if /I "%COMMAND%"=="help" goto help
goto unknown_command

:run
call :prepare_dev || goto failure
echo.
echo [Task 09] API:  http://localhost:3009
echo [Task 09] Demo: http://localhost:3009/demo
echo [Task 09] Press Ctrl+C to stop the API. Containers remain available.
echo.
call npm.cmd run dev
set "EXIT_CODE=%ERRORLEVEL%"
goto finish

:demo
powershell -NoProfile -Command "try { $r=Invoke-WebRequest -UseBasicParsing http://localhost:3009/health/ready -TimeoutSec 2; if($r.StatusCode -eq 200){ Start-Process 'http://localhost:3009/demo'; exit 0 } } catch {}; exit 1"
if errorlevel 1 (
  echo [Task 09] The API is not ready. Run "task.bat run" first.
  echo [Task 09] Demo URL: http://localhost:3009/demo
  goto failure
)
goto success

:test
call :check_tools || goto failure
call :ensure_dependencies || goto failure
call :ensure_docker || goto failure
echo [Task 09] Starting isolated test PostgreSQL and Redis...
docker compose up -d postgres-test redis || goto failure
call :wait_for_service postgres-test || goto failure
call :wait_for_service redis || goto failure
set "NODE_ENV=test"
set "RUN_TASK09_INTEGRATION=true"
call npm.cmd run migrate || goto test_failure
call npm.cmd test
set "EXIT_CODE=%ERRORLEVEL%"
docker compose stop postgres-test >nul 2>&1
goto finish

:test_failure
set "EXIT_CODE=1"
docker compose stop postgres-test >nul 2>&1
goto finish

:verify
call :check_tools || goto failure
call :ensure_dependencies || goto failure
echo [Task 09] 1/4 - Strict type checking...
call npm.cmd run typecheck || goto failure
echo [Task 09] 2/4 - Unit, HTTP, and integration tests...
call "%~f0" test || goto failure
echo [Task 09] 3/4 - Production build...
call npm.cmd run build || goto failure
echo [Task 09] 4/4 - Real-model relevance suite...
call :prepare_dev || goto failure
call npm.cmd run acceptance || goto failure
echo [Task 09] Complete verification passed.
goto success

:seed
call :prepare_dev || goto failure
call npm.cmd run seed || goto failure
goto success

:benchmark
call :prepare_dev || goto failure
call npm.cmd run benchmark || goto failure
goto success

:stop
call :check_docker_command || goto failure
if exist ".task09-api.pid" (
  powershell -NoProfile -Command "$p=[int](Get-Content -Raw '.task09-api.pid'); $proc=Get-CimInstance Win32_Process -Filter ('ProcessId='+$p) -ErrorAction SilentlyContinue; if($proc -and $proc.CommandLine -match 'task-09-semantic-search' -and $proc.CommandLine -match 'server'){ Stop-Process -Id $p -Force }; Remove-Item -LiteralPath '.task09-api.pid' -Force -ErrorAction SilentlyContinue"
)
call :ensure_docker || goto failure
echo [Task 09] Stopping only Task 09 containers...
docker compose stop || goto failure
goto success

:prepare_dev
call :check_tools || exit /b 1
call :ensure_dependencies || exit /b 1
call :ensure_docker || exit /b 1
docker compose up -d postgres redis || exit /b 1
call :wait_for_service postgres || exit /b 1
call :wait_for_service redis || exit /b 1
set "NODE_ENV=development"
call npm.cmd run migrate || exit /b 1
set "PRODUCT_COUNT="
for /f %%C in ('docker compose exec -T postgres psql -U internship -d task09 -tAc "SELECT COUNT(*) FROM products" 2^>nul') do set "PRODUCT_COUNT=%%C"
if "%PRODUCT_COUNT%"=="0" call npm.cmd run seed || exit /b 1
exit /b 0

:check_tools
where node.exe >nul 2>&1 || (echo ERROR: Node.js was not found in PATH. & exit /b 1)
where npm.cmd >nul 2>&1 || (echo ERROR: npm was not found in PATH. & exit /b 1)
call :check_docker_command
exit /b %ERRORLEVEL%

:check_docker_command
where docker.exe >nul 2>&1 || (echo ERROR: Docker was not found in PATH. & exit /b 1)
exit /b 0

:ensure_dependencies
if exist "node_modules\" exit /b 0
echo [Task 09] Installing dependencies...
if exist "package-lock.json" (call npm.cmd ci) else (call npm.cmd install)
exit /b %ERRORLEVEL%

:ensure_docker
docker info >nul 2>&1
if not errorlevel 1 exit /b 0
echo ERROR: Docker Desktop is not running. Start it and try again.
exit /b 1

:wait_for_service
echo [Task 09] Waiting for %~1...
for /L %%I in (1,1,30) do (
  for /f %%S in ('docker inspect --format "{{.State.Health.Status}}" task09-%~1 2^>nul') do if "%%S"=="healthy" exit /b 0
  ping 127.0.0.1 -n 3 >nul
)
echo ERROR: %~1 did not become healthy.
exit /b 1

:help
echo Usage: task.bat [run^|demo^|test^|verify^|seed^|benchmark^|stop^|help]
echo.
echo run        Starts infrastructure, migrates, warms the model, and runs the API.
echo demo       Opens the screenshot-ready Semantic Search Lab when the API is ready.
echo test       Runs unit, HTTP, pgvector, and Redis tests with the isolated test database.
echo verify     Runs typecheck, tests, build, and the real-model relevance suite.
echo seed       Creates deterministic products and their real 384-dimensional vectors.
echo benchmark  Measures 100 sequential Redis HIT requests and writes docs/BENCHMARK.md.
echo stop       Stops only the Task 09 API process and containers.
echo.
echo The first model use downloads public files into .cache/models. Later runs can set
echo ALLOW_REMOTE_MODELS=false to enforce local-only loading.
goto success

:unknown_command
echo ERROR: Unknown command: %COMMAND%
set "EXIT_CODE=1"
goto finish

:failure
set "EXIT_CODE=%ERRORLEVEL%"
if "%EXIT_CODE%"=="0" set "EXIT_CODE=1"
echo [Task 09] The command failed. Review the message above.
goto finish

:success
set "EXIT_CODE=0"

:finish
if "%INTERACTIVE%"=="1" pause
popd
exit /b %EXIT_CODE%
