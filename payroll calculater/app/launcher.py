#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
RABIE&RADOO Launcher Script
مشغل RABIE&RADOO مع أيقونة الشركة
"""

import os
import sys
import subprocess
import tkinter as tk
from tkinter import messagebox
import webbrowser

def check_python_packages():
    """فحص وتثبيت المتطلبات"""
    try:
        packages = ['pandas', 'openpyxl', 'Pillow', 'pygame', 'pywin32']
        for package in packages:
            try:
                __import__(package.replace('-', '_'))
            except ImportError:
                print(f"Installing {package}...")
                subprocess.run([sys.executable, '-m', 'pip', 'install', package, '--quiet'], 
                             check=False, capture_output=True)
        return True
    except Exception:
        return False

def launch_payroll_app():
    """تشغيل برنامج كشوف الرواتب"""
    try:
        # التأكد من وجود مجلد app
        app_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'app')
        if not os.path.exists(app_dir):
            messagebox.showerror("خطأ", "مجلد البرنامج غير موجود!\nتأكد من وجود مجلد 'app'")
            return False
        
        # التأكد من وجود الملف الرئيسي
        main_file = os.path.join(app_dir, 'payroll_gui.py')
        if not os.path.exists(main_file):
            messagebox.showerror("خطأ", "ملف البرنامج الرئيسي غير موجود!\nتأكد من وجود 'payroll_gui.py'")
            return False
        
        # تثبيت المتطلبات
        check_python_packages()
        
        # تشغيل البرنامج
        os.chdir(app_dir)
        subprocess.Popen([sys.executable, 'payroll_gui.py'], 
                        creationflags=subprocess.CREATE_NO_WINDOW if os.name == 'nt' else 0)
        
        return True
        
    except Exception as e:
        messagebox.showerror("خطأ", f"فشل في تشغيل البرنامج:\n{str(e)}")
        return False

def show_help():
    """عرض المساعدة"""
    help_window = tk.Toplevel()
    help_window.title("مساعدة RABIE&RADOO")
    help_window.geometry("400x300")
    help_window.resizable(False, False)
    
    help_text = """
🏢 RABIE&RADOO معالج كشوف الرواتب

📋 في حالة المشاكل:
• راجع مجلد tools للأدوات المساعدة
• شغل tools/START_HERE.bat للمشاكل العامة
• شغل tools/INSTALL_PYTHON.bat إذا كان Python غير مثبت

💡 نصائح:
• تأكد من وجود مجلد app
• تأكد من تثبيت Python 3.11+
• راجع README.md للتفاصيل

🆘 للدعم الفني:
اتصل بـ TKMASTER
    """
    
    text_widget = tk.Text(help_window, wrap=tk.WORD, font=("Arial", 10))
    text_widget.insert(tk.END, help_text)
    text_widget.config(state=tk.DISABLED)
    text_widget.pack(fill=tk.BOTH, expand=True, padx=10, pady=10)

def main():
    """الدالة الرئيسية"""
    # إنشاء نافذة صغيرة مخفية لعرض الأخطاء
    root = tk.Tk()
    root.withdraw()  # إخفاء النافذة الرئيسية
    
    try:
        # محاولة تشغيل البرنامج مباشرة
        if launch_payroll_app():
            # إذا نجح التشغيل، أغلق المشغل
            root.quit()
        else:
            # إذا فشل، اعرض نافذة المساعدة
            root.deiconify()  # إظهار النافذة
            root.title("RABIE&RADOO - خطأ في التشغيل")
            root.geometry("300x150")
            
            tk.Label(root, text="❌ فشل في تشغيل البرنامج", 
                    font=("Arial", 12, "bold"), fg="red").pack(pady=10)
            
            tk.Button(root, text="📖 عرض المساعدة", 
                     command=show_help, font=("Arial", 10)).pack(pady=5)
            
            tk.Button(root, text="🛠️ فتح مجلد الأدوات", 
                     command=lambda: os.startfile("tools") if os.path.exists("tools") else None,
                     font=("Arial", 10)).pack(pady=5)
            
            tk.Button(root, text="❌ إغلاق", 
                     command=root.quit, font=("Arial", 10)).pack(pady=10)
            
            root.mainloop()
            
    except Exception as e:
        messagebox.showerror("خطأ خطير", f"خطأ في المشغل:\n{str(e)}")

if __name__ == "__main__":
    main()