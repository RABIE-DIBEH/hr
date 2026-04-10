@echo off
cd /d "%~dp0"
title RABIE^&RADOO - System Cleanup
color 0C

echo.
echo ============================================
echo        RABIE^&RADOO SYSTEM CLEANUP
echo           تنظيف النظام من المشاكل
echo ============================================
echo.

echo 🧹 تنظيف النظام من العمليات المعلقة...
echo.

REM إيقاف جميع عمليات البرنامج
echo 🔄 إيقاف عمليات RABIE&RADOO...
taskkill /f /im "RABIE&RADOO.exe" /t >nul 2>&1
powershell -Command "Get-Process | Where-Object {$_.ProcessName -like '*RABIE*'} | Stop-Process -Force" >nul 2>&1

echo 🔄 إيقاف عمليات Python...
taskkill /f /im "python.exe" /t >nul 2>&1
taskkill /f /im "pythonw.exe" /t >nul 2>&1

echo 🔄 إيقاف عمليات pygame...
powershell -Command "Get-Process | Where-Object {$_.ProcessName -like '*pygame*'} | Stop-Process -Force" >nul 2>&1

echo 🔄 انتظار تنظيف النظام...
timeout /t 3 >nul

echo ✅ تم تنظيف النظام
echo.

REM حذف الملف التنفيذي المشكل
if exist "RABIE&RADOO.exe" (
    echo 🗑️ حذف الملف التنفيذي المُشكِل...
    del /f /q "RABIE&RADOO.exe" >nul 2>&1
    echo ✅ تم حذف RABIE&RADOO.exe
)

REM تنظيف ملفات السجل
if exist "*.log" (
    echo 🧹 تنظيف ملفات السجل...
    del /f /q "*.log" >nul 2>&1
)

REM تنظيف ملفات مؤقتة
if exist "temp" (
    echo 🧹 تنظيف الملفات المؤقتة...
    rmdir /s /q "temp" >nul 2>&1
)

echo.
echo ✅ تم تنظيف النظام بالكامل
echo.
echo 📋 الملفات المتبقية (آمنة):
echo    ✅ RABIE_RADOO.bat (المشغل الآمن)
echo    ✅ START_HERE.bat (نقطة البداية)
echo    ✅ app\ (مجلد البرنامج)
echo.
echo 🚀 استخدم START_HERE.bat للتشغيل الآمن
echo.
pause