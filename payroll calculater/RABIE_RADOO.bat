@echo off
cd /d "%~dp0"
title RABIE RADOO - معالج كشوف الرواتب
color 0B

echo.
echo ==========================================
echo         RABIE RADOO PAYROLL SYSTEM
echo           معالج كشوف الرواتب الاحترافي
echo            Developed by TKMASTER
echo ==========================================
echo.

REM محاولة تحديد مسار بايثون أولاً
set "PYTHON="
REM Prefer bundled python3.11 from WindowsApps if available (matches tested environment)
if exist "C:\Users\RABIE\AppData\Local\Microsoft\WindowsApps\python3.11.exe" (
    set "PYTHON=C:\Users\RABIE\AppData\Local\Microsoft\WindowsApps\python3.11.exe"
) else (
    for /f "usebackq delims=" %%p in (`where python 2^>nul`) do if not defined PYTHON set "PYTHON=%%p"
)
if not defined PYTHON (
    echo ❌ Python غير مثبت أو غير موجود في PATH!
    echo.
    if exist "tools\INSTALL_PYTHON.bat" (
        echo 🔧 يمكنك تشغيل tools\INSTALL_PYTHON.bat لتثبيت Python
    ) else (
        echo 📥 ثبت Python من: https://python.org/downloads
    )
    pause
    exit /b 1
)

echo ✅ Python found at: %PYTHON%
%PYTHON% --version

REM التأكد من وجود مجلد app وملف البرنامج
if not exist "app" (
    echo ❌ خطأ: مجلد app غير موجود!
    echo 💡 تأكد من وجود مجلد app مع ملفات البرنامج
    pause
    exit /b 1
)

if not exist "app\payroll_gui.py" (
    echo ❌ خطأ: ملف payroll_gui.py غير موجود!
    echo 💡 تأكد من وجود جميع ملفات البرنامج في مجلد app
    pause
    exit /b 1
)

REM تثبيت المتطلبات مع إظهار المخرجات للتحقق
echo.
echo 📦 تحديث pip وتثبيت المتطلبات الأساسية (openpyxl, Pillow, pywin32)...
"%PYTHON%" -m pip install --upgrade pip
"%PYTHON%" -m pip install --prefer-binary openpyxl Pillow pywin32

REM تشغيل البرنامج
pushd app
echo.
echo 🎯 بدء تشغيل البرنامج...
"%PYTHON%" payroll_gui.py
set "LASTERR=%ERRORLEVEL%"
popd

if %LASTERR% neq 0 (
    echo.
    echo ❌ حدث خطأ في التشغيل (رمز الخروج: %LASTERR%)
    echo 💡 راجع رسائل الخطأ أعلاه ومجلد tools\ للمساعدة
    pause
)
exit /b %LASTERR%