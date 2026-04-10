@echo off
cd /d "%~dp0"
title RABIE^&RADOO - Emergency Launcher
chcp 65001 >nul 2>&1
color 0C

echo.
echo ===============================================
echo      RABIE^&RADOO EMERGENCY LAUNCHER
echo            مشغل الطوارئ
echo ===============================================
echo.

echo 🚨 هذا المشغل للطوارئ عند عدم توفر Python
echo.

REM التحقق من PowerShell
powershell -Command "Write-Host 'PowerShell متاح'" >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ PowerShell غير متاح
    echo 💡 يجب تثبيت Python أو PowerShell
    pause
    exit /b 1
)

echo ✅ PowerShell متاح
echo.

REM محاولة تشغيل Python عبر PowerShell
echo 🔍 البحث عن Python في النظام...
powershell -Command "
    $pythonPaths = @(
        'C:\Python*\python.exe',
        'C:\Program Files\Python*\python.exe', 
        'C:\Program Files (x86)\Python*\python.exe',
        '$env:LOCALAPPDATA\Programs\Python\Python*\python.exe',
        '$env:APPDATA\..\Local\Programs\Python\Python*\python.exe'
    )
    
    $found = $false
    foreach ($pattern in $pythonPaths) {
        $pythons = Get-ChildItem -Path $pattern -ErrorAction SilentlyContinue
        if ($pythons) {
            foreach ($python in $pythons) {
                if (Test-Path $python.FullName) {
                    Write-Host '✅ وجد Python في:' $python.FullName
                    $env:PYTHON_PATH = $python.FullName
                    & $python.FullName --version
                    $found = $true
                    
                    # تشغيل البرنامج
                    Set-Location 'app'
                    Write-Host '🚀 تشغيل البرنامج...'
                    & $python.FullName 'payroll_gui.py'
                    break
                }
            }
            if ($found) { break }
        }
    }
    
    if (-not $found) {
        Write-Host '❌ لم يتم العثور على Python'
        Write-Host '📥 يرجى تثبيت Python من https://python.org/downloads'
    }
"

if %errorlevel% neq 0 (
    echo.
    echo ❌ فشل في العثور على Python أو تشغيل البرنامج
    echo.
    echo 💡 الحلول المتاحة:
    echo    1. شغل INSTALL_PYTHON.bat لتثبيت Python تلقائياً
    echo    2. ثبت Python يدوياً من https://python.org/downloads
    echo    3. تأكد من إضافة Python للـ PATH أثناء التثبيت
    echo.
)

echo.
pause