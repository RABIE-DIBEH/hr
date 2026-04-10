@echo off
cd /d "%~dp0"
title Create Desktop Shortcut

echo.
echo ==========================================
echo        CREATE DESKTOP SHORTCUT
echo          إنشاء اختصار سطح المكتب
echo ==========================================
echo.

echo 🔍 البحث عن سطح المكتب...
for /f "usebackq tokens=3*" %%i in (`reg query "HKCU\Software\Microsoft\Windows\CurrentVersion\Explorer\Shell Folders" /v Desktop`) do set DESKTOP=%%i %%j

if exist "%DESKTOP%" (
    echo ✅ تم العثور على سطح المكتب: %DESKTOP%
    echo.
    echo 📋 إنشاء اختصار...
    
    REM نسخ الـ shortcut لسطح المكتب
    copy "RABIE_RADOO.lnk" "%DESKTOP%\RABIE_RADOO.lnk" >nul
    
    if exist "%DESKTOP%\RABIE_RADOO.lnk" (
        echo ✅ تم إنشاء اختصار سطح المكتب بنجاح!
        echo 🎨 الاختصار يحتوي على أيقونة الشركة
        echo.
        echo 💡 يمكنك الآن تشغيل البرنامج من سطح المكتب
    ) else (
        echo ❌ فشل في إنشاء الاختصار
    )
) else (
    echo ❌ لم يتم العثور على مجلد سطح المكتب
)

echo.
pause