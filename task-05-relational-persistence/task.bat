@echo off
setlocal EnableExtensions

pushd "%~dp0"

set "DEV_DATABASE_URL=postgresql://internship:internship@localhost:5432/task05?schema=public"
set "TEST_DATABASE_URL=postgresql://internship:internship@localhost:5433/task05_test?schema=public"
set "INTERACTIVE=0"

if "%~1"=="" (
  set "INTERACTIVE=1"
  goto menu
)

set "COMMAND=%~1"
goto dispatch

:menu
cls
echo ============================================================
echo   Task 05 - Relational Persistence
echo ============================================================
echo.
echo   [R] Run the API
echo   [D] Open the visual demo
echo   [T] Run the tests
echo   [V] Verify the complete task
echo   [S] Prepare and seed the development database
echo   [O] Stop this task's containers
echo   [Q] Quit
echo.
choice /C RDTVSOQ /N /M "Select an option: "
if errorlevel 7 goto success
if errorlevel 6 set "COMMAND=stop" & goto dispatch
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
if /I "%COMMAND%"=="stop" goto stop
if /I "%COMMAND%"=="help" goto help
goto unknown_command

:run
call :check_tools || goto failure
call :ensure_dependencies || goto failure
call :ensure_docker || goto failure

echo.
echo [Task 05] Starting only the development PostgreSQL service...
docker compose up -d postgres || goto failure
call :wait_for_postgres postgres task05 || goto failure

set "DATABASE_URL=%DEV_DATABASE_URL%"
set "PORT=3000"
call npm.cmd run db:deploy || goto failure

echo.
echo [Task 05] API available at http://localhost:3000
echo [Task 05] Press Ctrl+C to stop the API.
echo.
call npm.cmd run dev
set "EXIT_CODE=%ERRORLEVEL%"
goto finish

:demo
powershell -NoProfile -Command "try { $r=Invoke-WebRequest -UseBasicParsing http://localhost:3000/health -TimeoutSec 2; if($r.StatusCode -eq 200){ Start-Process 'http://localhost:3000/demo'; exit 0 } } catch {}; exit 1"
if errorlevel 1 (
  echo [Task 05] The API is not ready. Run "task.bat run" first.
  echo [Task 05] Demo URL: http://localhost:3000/demo
  goto failure
)
goto success

:test
call :check_tools || goto failure
call :ensure_dependencies || goto failure
call :ensure_docker || goto failure

echo.
echo [Task 05] Starting only this task's test database...
docker compose up -d postgres-test || goto failure
call :wait_for_postgres postgres-test task05_test || goto failure

set "DATABASE_URL=%TEST_DATABASE_URL%"
set "NODE_ENV=test"
call npm.cmd run db:deploy
if errorlevel 1 (
  set "EXIT_CODE=1"
  goto test_cleanup
)

call npm.cmd test
set "EXIT_CODE=%ERRORLEVEL%"

:test_cleanup
echo.
echo [Task 05] Stopping the test database...
docker compose stop postgres-test >nul 2>&1
goto finish

:verify
call :check_tools || goto failure
call :ensure_dependencies || goto failure

echo.
echo [Task 05] 1/3 - Checking types...
set "DATABASE_URL=%DEV_DATABASE_URL%"
call npm.cmd run typecheck || goto failure

echo.
echo [Task 05] 2/3 - Running the integration tests...
call "%~f0" test || goto failure

echo.
echo [Task 05] 3/3 - Building the application...
set "DATABASE_URL=%DEV_DATABASE_URL%"
call npm.cmd run build || goto failure

echo.
echo [Task 05] Validation completed successfully.
goto success

:seed
call :check_tools || goto failure
call :ensure_dependencies || goto failure
call :ensure_docker || goto failure

echo.
echo [Task 05] Preparing only this task's development database...
docker compose up -d postgres || goto failure
call :wait_for_postgres postgres task05 || goto failure

set "DATABASE_URL=%DEV_DATABASE_URL%"
call npm.cmd run db:deploy || goto failure
call npm.cmd run db:seed || goto failure

echo.
echo [Task 05] Database prepared and seeded successfully.
goto success

:stop
call :check_docker_command || goto failure
call :ensure_docker || goto failure

echo.
echo [Task 05] Stopping only this task's containers...
docker compose stop || goto failure
goto success

:help
echo Usage: task.bat [command]
echo.
echo   run      Starts the database, applies migrations, and runs the API
echo   demo     Opens the screenshot-ready Relational Persistence Lab
echo   test     Prepares the test database and runs the tests
echo   verify   Runs type checking, tests, and the build
echo   seed     Applies migrations and recreates demonstration data
echo   stop     Stops only this task's containers
echo   help     Displays this help
echo.
echo Without arguments, the file opens an interactive menu.
goto success

:check_tools
where node.exe >nul 2>&1
if errorlevel 1 (
  echo ERROR: Node.js was not found in PATH.
  exit /b 1
)

where npm.cmd >nul 2>&1
if errorlevel 1 (
  echo ERROR: npm was not found in PATH.
  exit /b 1
)

call :check_docker_command
exit /b %ERRORLEVEL%

:check_docker_command
where docker.exe >nul 2>&1
if errorlevel 1 (
  echo ERROR: Docker was not found in PATH.
  exit /b 1
)
exit /b 0

:ensure_dependencies
if exist "node_modules\" exit /b 0

echo.
echo [Task 05] Installing local dependencies...
if exist "package-lock.json" (
  call npm.cmd ci
) else (
  call npm.cmd install
)
exit /b %ERRORLEVEL%

:ensure_docker
docker info >nul 2>&1
if not errorlevel 1 exit /b 0

echo ERROR: Docker Desktop is not running.
echo Start Docker Desktop and try again.
exit /b 1

:wait_for_postgres
set "DB_SERVICE=%~1"
set "DB_NAME=%~2"
echo [Task 05] Waiting for PostgreSQL to become ready...

for /L %%I in (1,1,30) do (
  docker compose exec -T "%DB_SERVICE%" pg_isready -U internship -d "%DB_NAME%" >nul 2>&1 && exit /b 0
  ping 127.0.0.1 -n 3 >nul
)

echo ERROR: PostgreSQL did not become ready within the expected time.
exit /b 1

:unknown_command
echo ERROR: unknown command: %COMMAND%
echo Run "task.bat help" to see the available commands.
set "EXIT_CODE=1"
goto finish

:failure
set "EXIT_CODE=%ERRORLEVEL%"
if "%EXIT_CODE%"=="0" set "EXIT_CODE=1"
echo.
echo [Task 05] The command failed. Review the message above.
goto finish

:success
set "EXIT_CODE=0"

:finish
if "%INTERACTIVE%"=="1" (
  echo.
  pause
)
popd
exit /b %EXIT_CODE%
