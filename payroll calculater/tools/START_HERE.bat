@echo off
cd /d "%~dp0"
title RABIE^&RADOO - Safe Launcher
color 0A

REM منع تشغيل عدة نسخ
tasklist /fi "imagename eq cmd.exe" /fi "windowtitle eq RABIE*" | find /i "cmd.exe" >nul && (
    echo ⚠️ البرنامج يعمل بالفعل
    pause
    exit /b 1
)

echo.
echo ==========================================
echo         RABIE^&RADOO SAFE LAUNCHER
echo           المشغل الآمن المحسن
echo ==========================================
echo.

REM محاولة تشغيل مباشر
python --version >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ Python متوفر - تشغيل البرنامج...
    cd app
    python payroll_gui.py
    cd ..
    goto :end
)

REM إذا لم يجد Python
echo ❌ Python غير مثبت
echo.
echo 🔧 الحلول المتاحة:
echo.
echo [1] تثبيت Python تلقائياً (موصى به)
echo [2] مشغل الطوارئ
echo [3] دليل التثبيت اليدوي  
echo [4] خروج
echo.
set /p choice="اختر رقم (1-4): "

if "%choice%"=="1" (
    if exist "INSTALL_PYTHON.bat" (
        call INSTALL_PYTHON.bat
    ) else (
        echo ❌ مثبت Python غير موجود
    )
) else if "%choice%"=="2" (
    if exist "EMERGENCY_START.bat" (
        call EMERGENCY_START.bat  
    ) else (
        echo ❌ مشغل الطوارئ غير موجود
    )
) else if "%choice%"=="3" (
    start notepad "حل_مشكلة_Python.md" 2>nul || echo "اذهب إلى https://python.org/downloads"
) else (
    echo 👋 وداعاً
    goto :end
)

:end
echo.
pause