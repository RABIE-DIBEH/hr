@echo off
cd /d "%~dp0"
title RABIE^&RADOO - Python Installer
chcp 65001 >nul 2>&1
color 0E

echo.
echo ===============================================
echo      RABIE^&RADOO PYTHON AUTO-INSTALLER
echo           مثبت Python التلقائي
echo ===============================================
echo.

REM فحص Python أولاً
python --version >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ Python مثبت بالفعل
    python --version
    echo 🚀 تشغيل البرنامج...
    call RABIE_RADOO.bat
    exit /b 0
)

echo ❌ Python غير مثبت أو غير موجود في PATH
echo.
echo 📥 سيتم تحميل وتثبيت Python تلقائياً...
echo.

REM إنشاء مجلد مؤقت للتحميل
if not exist "temp" mkdir temp
cd temp

echo 🔄 تحميل Python 3.11.9 (64-bit)...
powershell -Command "& {
    $url = 'https://www.python.org/ftp/python/3.11.9/python-3.11.9-amd64.exe'
    $output = 'python-installer.exe'
    try {
        Write-Host '📡 بدء التحميل من python.org...'
        Invoke-WebRequest -Uri $url -OutFile $output -UseBasicParsing
        Write-Host '✅ تم تحميل Python بنجاح'
    } catch {
        Write-Host '❌ فشل في التحميل: ' + $_.Exception.Message
        exit 1
    }
}"

if %errorlevel% neq 0 (
    echo.
    echo ❌ فشل في تحميل Python
    echo 💡 يرجى تحميل Python يدوياً من:
    echo    https://www.python.org/downloads/
    echo.
    echo ⚠️ تأكد من تحديد "Add Python to PATH" أثناء التثبيت
    pause
    cd ..
    rmdir /s /q temp 2>nul
    exit /b 1
)

echo.
echo 🔧 تثبيت Python...
echo    (هذا قد يستغرق بضع دقائق)
echo.

REM تثبيت Python مع إضافته للـ PATH تلقائياً
python-installer.exe /quiet InstallAllUsers=0 PrependPath=1 Include_test=0

REM انتظار انتهاء التثبيت
echo ⏳ انتظار انتهاء التثبيت...
timeout /t 30 >nul

REM تنظيف الملفات المؤقتة
cd ..
rmdir /s /q temp 2>nul

echo.
echo 🔄 إعادة تحميل PATH...
REM تحديث متغيرات البيئة
for /f "tokens=2*" %%a in ('reg query "HKCU\Environment" /v PATH 2^>nul') do set "UserPath=%%b"
for /f "tokens=2*" %%a in ('reg query "HKLM\SYSTEM\CurrentControlSet\Control\Session Manager\Environment" /v PATH 2^>nul') do set "SystemPath=%%b"
set "PATH=%SystemPath%;%UserPath%"

REM فحص Python مرة أخرى
echo 🔍 التحقق من تثبيت Python...
python --version >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ تم تثبيت Python بنجاح!
    python --version
    echo.
    echo 🚀 تشغيل البرنامج...
    call RABIE_RADOO.bat
) else (
    echo.
    echo ⚠️ Python مثبت لكن يحتاج إعادة تشغيل
    echo.
    echo 💡 الرجاء:
    echo    1. إعادة تشغيل الكمبيوتر
    echo    2. أو إغلاق وإعادة فتح موجه الأوامر
    echo    3. ثم تشغيل RABIE_RADOO.bat
    echo.
)

echo.
pause