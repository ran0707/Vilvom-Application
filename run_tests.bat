@echo off
setlocal enabledelayedexpansion

:: ============================================================
::  Vilvom Application — Full Test Suite Runner
::  Runs: Backend E2E, Security Tests, React Native Unit Tests
::  Optional: Detox Mobile E2E (requires emulator + built APK)
:: ============================================================

set PASS=0
set FAIL=0
set SKIP=0
set BACKEND_DIR=%~dp0backend
set FRONTEND_DIR=%~dp0

echo.
echo =====================================================
echo   VILVOM FULL TEST SUITE
echo =====================================================
echo.

:: ─── Helper: print section header ────────────────────────
:section
echo.
echo ─────────────────────────────────────────────────────
echo   %~1
echo ─────────────────────────────────────────────────────
goto :eof

:: ─── 1. Check backend is running ─────────────────────────
call :section "PRE-CHECK: Backend Health"
curl -s -o nul -w "%%{http_code}" http://localhost:5000/api/health > %TEMP%\health_check.txt 2>&1
set /p HEALTH_CODE=<%TEMP%\health_check.txt
if "%HEALTH_CODE%"=="200" (
    echo [OK] Backend is running on :5000
) else (
    echo [WARN] Backend not responding on :5000 ^(code: %HEALTH_CODE%^)
    echo        E2E tests will likely fail. Start backend first:
    echo        cd backend ^&^& npm run start:dev
    echo.
)

:: ─── 2. React Native Unit Tests ──────────────────────────
call :section "STEP 1/4: React Native Unit Tests (Jest)"
echo Running: services, config, screen component tests
cd /d "%FRONTEND_DIR%"
call npx jest --testPathPattern="src/__tests__" --passWithNoTests --forceExit 2>&1
if %ERRORLEVEL%==0 (
    echo [PASS] React Native unit tests
    set /a PASS+=1
) else (
    echo [FAIL] React Native unit tests
    set /a FAIL+=1
)

:: ─── 3. Backend E2E API Tests ────────────────────────────
call :section "STEP 2/4: Backend API E2E Tests (Jest + Supertest)"
cd /d "%BACKEND_DIR%"

:: Check if supertest is installed
if not exist node_modules\supertest (
    echo Installing backend test dependencies...
    call npm install --save-dev supertest @nestjs/testing 2>&1 | tail -3
)

echo Running: all endpoint tests (health, auth, pest, drone, users)
call npx jest --testPathPattern="test/api" --passWithNoTests --forceExit --testEnvironment=node 2>&1
if %ERRORLEVEL%==0 (
    echo [PASS] Backend API e2e tests
    set /a PASS+=1
) else (
    echo [FAIL] Backend API e2e tests ^(check backend is running on :5000^)
    set /a FAIL+=1
)

:: ─── 4. Security / Penetration Tests ─────────────────────
call :section "STEP 3/4: Security & Penetration Tests (Jest + Supertest)"
echo Running: JWT attacks, IDOR, NoSQL injection, XSS, rate limiting, headers
call npx jest --testPathPattern="test/security" --passWithNoTests --forceExit --testEnvironment=node 2>&1
if %ERRORLEVEL%==0 (
    echo [PASS] Security tests
    set /a PASS+=1
) else (
    echo [FAIL] Security tests
    set /a FAIL+=1
)

cd /d "%FRONTEND_DIR%"

:: ─── 5. Detox E2E (optional) ─────────────────────────────
call :section "STEP 4/4: Detox Mobile E2E Tests (optional)"

:: Check if detox is installed
if not exist node_modules\detox (
    echo [SKIP] Detox not installed. Install with:
    echo        npm install --save-dev detox jest-circus
    echo        npx detox build -c android.emu.debug
    set /a SKIP+=1
    goto :summary
)

:: Check if emulator is running
set ADB=C:\Users\Administrator\AppData\Local\Android\Sdk\platform-tools\adb.exe
"%ADB%" devices 2>&1 | find "emulator" >nul
if %ERRORLEVEL%==0 (
    echo [OK] Android emulator detected
    echo Running Detox E2E tests (auth, pest detection, drone, profile flows)...
    call npx detox test -c android.emu.debug --passWithNoTests 2>&1
    if %ERRORLEVEL%==0 (
        echo [PASS] Detox E2E tests
        set /a PASS+=1
    ) else (
        echo [FAIL] Detox E2E tests
        set /a FAIL+=1
    )
) else (
    echo [SKIP] No Android emulator running.
    echo        Start emulator first, then run: npx detox test -c android.emu.debug
    set /a SKIP+=1
)

:: ─── Summary ──────────────────────────────────────────────
:summary
echo.
echo =====================================================
echo   TEST RESULTS SUMMARY
echo =====================================================
echo   PASSED  : !PASS!
echo   FAILED  : !FAIL!
echo   SKIPPED : !SKIP!
echo =====================================================
echo.

if !FAIL! gtr 0 (
    echo OVERALL: FAILED — check output above for details
    exit /b 1
) else (
    echo OVERALL: PASSED
    exit /b 0
)
