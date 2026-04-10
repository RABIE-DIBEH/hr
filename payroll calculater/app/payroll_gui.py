import tkinter as tk
from tkinter import ttk, filedialog, messagebox
import os
from datetime import datetime
import threading
from multi_sheet_payroll_processor import process_multi_sheet_payroll, validate_payroll_data

# دعم تشغيل الأصوات مع معالجة آمنة للأخطاء
HAS_PYGAME = False
HAS_WINSOUND = False

try:
    import pygame
    pygame.mixer.pre_init(frequency=22050, size=-16, channels=2, buffer=512)
    pygame.mixer.init()
    HAS_PYGAME = True
except (ImportError, pygame.error) as e:
    HAS_PYGAME = False
    
# بديل للأصوات إذا لم يكن pygame متوفر
try:
    import winsound
    HAS_WINSOUND = True
except ImportError:
    HAS_WINSOUND = False

class PayrollProcessorGUI:
    def __init__(self, root):
        self.root = root
        self.root.title("RABIE&RADOO - معالج كشوف الرواتب")
        self.root.geometry("700x650")
        self.root.resizable(True, True)
        
        # تعيين الأيقونة
        self.set_app_icon()
        
        # تعيين لون الخلفية الفضي الفاتح
        self.root.configure(bg='#F5F5F5')
        
        # متغيرات
        self.input_file = tk.StringVar()
        self.output_folder = tk.StringVar()
        self.output_excel = tk.StringVar()
        self.output_pdf = tk.StringVar()
        self.notes = tk.StringVar(value="لا يوجد")
        self.company_name = tk.StringVar(value="الإدارة العامة")
        self.department = tk.StringVar(value="قسم الحسابات")
        self.month = tk.StringVar(value="أكتوبر")
        self.year = tk.StringVar(value="2025")
        self.progress_var = tk.DoubleVar()
        
        # تعيين القيم الافتراضية
        self.output_folder.set(os.getcwd())  # المجلد الحالي
        self.output_excel.set("output-master.xlsx")
        self.output_pdf.set("output-master-final.pdf")
        
        # تعيين ملف الإدخال الافتراضي
        default_input = os.path.join(os.path.dirname(__file__), "resources", "input-master.xlsx")
        if os.path.exists(default_input):
            self.input_file.set(default_input)
        
        # متغير للتحقق من صحة البيانات
        self.data_validated = False
        
        # مسارات الأصوات
        self.sounds_dir = os.path.join(os.path.dirname(__file__), "sounds")
        self.check_sound = None
        self.start_sound = None
        
        # تحميل الأصوات
        self.load_sounds()
        
        self.create_widgets()
        
        # إعداد إيقاف الصوت عند إغلاق النافذة
        self.root.protocol("WM_DELETE_WINDOW", self.on_closing)
    
    def on_closing(self):
        """تشغيل عند إغلاق النافذة"""
        self.stop_sound()  # إيقاف أي صوت يعمل
        self.root.destroy()
    
    def load_sounds(self):
        """تحميل الملفات الصوتية"""
        if not os.path.exists(self.sounds_dir):
            return
            
        try:
            # البحث عن ملفات الأصوات
            sound_files = os.listdir(self.sounds_dir)
            
            # ملف صوت التحقق (يبحث عن أي ملف يحتوي على "check")
            check_files = [f for f in sound_files if 'check' in f.lower() and f.lower().endswith(('.mp3', '.wav', '.ogg'))]
            if check_files:
                self.check_sound = os.path.join(self.sounds_dir, check_files[0])
                print(f"✅ تم تحميل صوت التحقق: {check_files[0]}")
                
            # ملف صوت البدء (يبحث عن أي ملف يحتوي على "start")
            start_files = [f for f in sound_files if 'start' in f.lower() and f.lower().endswith(('.mp3', '.wav', '.ogg'))]
            if start_files:
                self.start_sound = os.path.join(self.sounds_dir, start_files[0])
                print(f"🚀 تم تحميل صوت البدء: {start_files[0]}")
        except Exception as e:
            print(f"تعذر تحميل الأصوات: {e}")
    
    def play_sound(self, sound_path, loop=False):
        """تشغيل ملف صوتي مع إمكانية التكرار - نسخة آمنة"""
        if not sound_path or not os.path.exists(sound_path):
            return
            
        # تشغيل في خيط منفصل لمنع التعليق
        def _play_in_thread():
            try:
                if HAS_PYGAME:
                    # إيقاف أي صوت يعمل حالياً
                    pygame.mixer.music.stop()
                    # تحميل الملف الجديد
                    pygame.mixer.music.load(sound_path)
                    # تشغيل مع معالجة آمنة للتكرار
                    if loop:
                        pygame.mixer.music.play(-1, fade_ms=100)
                    else:
                        pygame.mixer.music.play(fade_ms=100)
                elif HAS_WINSOUND and sound_path.lower().endswith('.wav'):
                    # استخدام winsound كبديل آمن
                    if loop:
                        winsound.PlaySound(sound_path, winsound.SND_FILENAME | winsound.SND_ASYNC | winsound.SND_LOOP)
                    else:
                        winsound.PlaySound(sound_path, winsound.SND_FILENAME | winsound.SND_ASYNC)
            except Exception as e:
                # في حالة فشل تشغيل الصوت، صوت النظام كبديل
                try:
                    if HAS_WINSOUND:
                        winsound.PlaySound("SystemAsterisk", winsound.SND_ALIAS | winsound.SND_ASYNC)
                except:
                    pass  # تجاهل الأخطاء نهائياً
        
        # تشغيل في خيط منفصل لمنع اللوب
        if HAS_PYGAME or HAS_WINSOUND:
            thread = threading.Thread(target=_play_in_thread, daemon=True)
            thread.start()
    
    def stop_sound(self):
        """إيقاف تشغيل الصوت"""
        try:
            if HAS_PYGAME:
                pygame.mixer.music.stop()
            elif HAS_WINSOUND:
                # إيقاف winsound
                winsound.PlaySound(None, winsound.SND_ASYNC)
        except:
            pass  # تجاهل الأخطاء
    
    def set_app_icon(self):
        """تعيين أيقونة للبرنامج"""
        try:
            # محاولة تحميل أيقونة ICO من مجلد icons
            icon_path = os.path.join(os.path.dirname(__file__), "icons", "rabie_radoo_icon.ico")
            if os.path.exists(icon_path):
                self.root.iconbitmap(icon_path)
                return
            
            # محاولة تحميل أيقونة PNG من مجلد icons
            png_path = os.path.join(os.path.dirname(__file__), "icons", "rabie_radoo_icon_64.png")
            if os.path.exists(png_path):
                from PIL import Image, ImageTk
                icon_image = Image.open(png_path)
                icon_photo = ImageTk.PhotoImage(icon_image)
                self.root.iconphoto(True, icon_photo)
                # حفظ المرجع لمنع حذف الصورة من الذاكرة
                self.icon_photo = icon_photo
                return
                
        except Exception as e:
            # إذا فشل تحميل الأيقونة، استخدم الأيقونة الافتراضية
            pass
        
    def create_widgets(self):
        # إطار رئيسي مع خلفية فضية وحدود سوداء
        main_frame = tk.Frame(self.root, bg='#F5F5F5', bd=2, relief='solid', padx=15, pady=15)
        main_frame.pack(fill=tk.BOTH, expand=True, padx=10, pady=10)
        
        # العنوان الرئيسي
        title_label = tk.Label(main_frame, text="RABIE&RADOO", 
                               font=("Arial", 24, "bold"), fg="#1E3A8A", bg='#F5F5F5')
        title_label.pack(pady=(0, 5))
        
        # العنوان الفرعي
        subtitle_label = tk.Label(main_frame, text="معالج كشوف الرواتب", 
                                  font=("Arial", 16, "bold"), fg="#374151", bg='#F5F5F5')
        subtitle_label.pack(pady=(0, 5))
        
        # معلومات المطور
        developer_label = tk.Label(main_frame, text="Developed by TKMASTER", 
                                   font=("Arial", 11, "italic"), fg="#6B7280", bg='#F5F5F5')
        developer_label.pack(pady=(0, 20))
        
        # إطار قسم ملف الإدخال
        input_section = tk.LabelFrame(main_frame, text="📁 ملف الإدخال", 
                                     font=("Arial", 12, "bold"), fg="#1F2937", 
                                     bg='#F5F5F5', bd=2, relief='solid')
        input_section.pack(fill=tk.X, pady=(0, 15))
        
        input_frame = tk.Frame(input_section, bg='#F5F5F5')
        input_frame.pack(fill=tk.X, padx=10, pady=10)
        
        self.input_entry = tk.Entry(input_frame, textvariable=self.input_file, 
                                   font=("Arial", 10), bd=2, relief='solid',
                                   bg='white', fg='black')
        self.input_entry.pack(side=tk.LEFT, fill=tk.X, expand=True, padx=(0, 10))
        
        browse_btn = tk.Button(input_frame, text="📂 تصفح", 
                              command=self.browse_input_file,
                              font=("Arial", 10, "bold"), 
                              bg='#3B82F6', fg='white', bd=2, relief='solid',
                              padx=15, pady=5)
        browse_btn.pack(side=tk.RIGHT)
        
        # إطار قسم ملفات الإخراج
        output_section = tk.LabelFrame(main_frame, text="💾 ملفات الإخراج", 
                                      font=("Arial", 12, "bold"), fg="#1F2937", 
                                      bg='#F5F5F5', bd=2, relief='solid')
        output_section.pack(fill=tk.X, pady=(0, 15))
        
        output_frame = tk.Frame(output_section, bg='#F5F5F5')
        output_frame.pack(fill=tk.X, padx=10, pady=10)
        
        # مجلد الإخراج
        folder_frame = tk.Frame(output_frame, bg='#F5F5F5')
        folder_frame.pack(fill=tk.X, pady=(0, 15))
        
        tk.Label(folder_frame, text="📁 مجلد الحفظ:", font=("Arial", 10, "bold"), 
                bg='#F5F5F5', fg="#374151").pack(side=tk.LEFT, padx=(0, 10))
        
        self.folder_entry = tk.Entry(folder_frame, textvariable=self.output_folder, 
                                    font=("Arial", 10), bd=2, relief='solid', 
                                    bg='white', fg='black')
        self.folder_entry.pack(side=tk.LEFT, fill=tk.X, expand=True, padx=(0, 10))
        
        folder_browse_btn = tk.Button(folder_frame, text="📂 اختر مجلد", 
                                     command=self.browse_output_folder,
                                     font=("Arial", 10, "bold"), 
                                     bg='#059669', fg='white', bd=2, relief='solid',
                                     padx=15, pady=5)
        folder_browse_btn.pack(side=tk.RIGHT)
        
        # ملف Excel
        excel_frame = tk.Frame(output_frame, bg='#F5F5F5')
        excel_frame.pack(fill=tk.X, pady=(0, 10))
        
        tk.Label(excel_frame, text="📊 ملف Excel:", font=("Arial", 10, "bold"), 
                bg='#F5F5F5', fg="#374151").pack(side=tk.LEFT, padx=(0, 10))
        tk.Entry(excel_frame, textvariable=self.output_excel, font=("Arial", 10),
                bd=2, relief='solid', bg='white', fg='black').pack(side=tk.LEFT, fill=tk.X, expand=True)
        
        # ملف PDF
        pdf_frame = tk.Frame(output_frame, bg='#F5F5F5')
        pdf_frame.pack(fill=tk.X)
        
        tk.Label(pdf_frame, text="📄 ملف PDF:", font=("Arial", 10, "bold"), 
                bg='#F5F5F5', fg="#374151").pack(side=tk.LEFT, padx=(0, 10))
        tk.Entry(pdf_frame, textvariable=self.output_pdf, font=("Arial", 10),
                bd=2, relief='solid', bg='white', fg='black').pack(side=tk.LEFT, fill=tk.X, expand=True)
        
        # إطار معلومات الشركة والتاريخ
        company_section = tk.LabelFrame(main_frame, text="🏢 معلومات الشركة والتاريخ", 
                                       font=("Arial", 12, "bold"), fg="#1F2937", 
                                       bg='#F5F5F5', bd=2, relief='solid')
        company_section.pack(fill=tk.X, pady=(0, 15))
        
        company_frame = tk.Frame(company_section, bg='#F5F5F5')
        company_frame.pack(fill=tk.X, padx=10, pady=10)
        
        # اسم الشركة
        comp_frame = tk.Frame(company_frame, bg='#F5F5F5')
        comp_frame.pack(fill=tk.X, pady=(0, 10))
        
        tk.Label(comp_frame, text="🏢 اسم الشركة:", font=("Arial", 10, "bold"), 
                bg='#F5F5F5', fg="#374151").pack(side=tk.LEFT, padx=(0, 10))
        tk.Entry(comp_frame, textvariable=self.company_name, font=("Arial", 10),
                bd=2, relief='solid', bg='white', fg='black').pack(side=tk.LEFT, fill=tk.X, expand=True)
        
        # اسم القسم
        dept_frame = tk.Frame(company_frame, bg='#F5F5F5')
        dept_frame.pack(fill=tk.X, pady=(0, 15))
        
        tk.Label(dept_frame, text="🏛️ اسم القسم:", font=("Arial", 10, "bold"), 
                bg='#F5F5F5', fg="#374151").pack(side=tk.LEFT, padx=(0, 10))
        tk.Entry(dept_frame, textvariable=self.department, font=("Arial", 10),
                bd=2, relief='solid', bg='white', fg='black').pack(side=tk.LEFT, fill=tk.X, expand=True)
        
        # الشهر والعام
        date_frame = tk.Frame(company_frame, bg='#F5F5F5')
        date_frame.pack(fill=tk.X)
        
        # الشهر
        month_frame = tk.Frame(date_frame, bg='#F5F5F5')
        month_frame.pack(side=tk.LEFT, fill=tk.X, expand=True, padx=(0, 10))
        
        tk.Label(month_frame, text="📅 الشهر:", font=("Arial", 10, "bold"), 
                bg='#F5F5F5', fg="#374151").pack(side=tk.LEFT, padx=(0, 5))
        
        months = ["يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو",
                 "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"]
        month_combo = ttk.Combobox(month_frame, textvariable=self.month, 
                                  values=months, state="readonly", width=18, height=12)
        month_combo.pack(side=tk.LEFT)
        
        # تحديد القيمة الافتراضية للشهر الحالي
        month_combo.set("أكتوبر")
        
        # العام  
        year_frame = tk.Frame(date_frame, bg='#F5F5F5')
        year_frame.pack(side=tk.LEFT, fill=tk.X, expand=True)
        
        tk.Label(year_frame, text="📆 العام:", font=("Arial", 10, "bold"), 
                bg='#F5F5F5', fg="#374151").pack(side=tk.LEFT, padx=(0, 5))
        tk.Entry(year_frame, textvariable=self.year, font=("Arial", 10),
                bd=2, relief='solid', bg='white', fg='black', width=10).pack(side=tk.LEFT)
        
        # إطار قسم الملاحظات
        notes_section = tk.LabelFrame(main_frame, text="📝 الملاحظات (ستظهر في جميع الصفحات)", 
                                     font=("Arial", 12, "bold"), fg="#1F2937", 
                                     bg='#F5F5F5', bd=2, relief='solid')
        notes_section.pack(fill=tk.X, pady=(0, 15))
        
        notes_frame = tk.Frame(notes_section, bg='#F5F5F5')
        notes_frame.pack(fill=tk.X, padx=10, pady=10)
        
        self.notes_text = tk.Text(notes_frame, height=4, wrap=tk.WORD, 
                                 font=("Arial", 11), bd=2, relief='solid',
                                 bg='white', fg='black')
        notes_scrollbar = tk.Scrollbar(notes_frame, orient=tk.VERTICAL, 
                                      command=self.notes_text.yview,
                                      bg='#E5E7EB', troughcolor='#F3F4F6')
        self.notes_text.configure(yscrollcommand=notes_scrollbar.set)
        
        self.notes_text.pack(side=tk.LEFT, fill=tk.X, expand=True, ipady=30)
        notes_scrollbar.pack(side=tk.RIGHT, fill=tk.Y)
        
        # تعيين النص الافتراضي للملاحظات
        self.notes_text.insert("1.0", "لا يوجد")
        
        # كبسات التحقق والمعالجة
        buttons_section = tk.Frame(main_frame, bg='#F5F5F5')
        buttons_section.pack(pady=(20, 20))
        
        # زر التحقق
        self.validate_button = tk.Button(buttons_section, text="✅ تحقق", 
                                        command=self.validate_data,
                                        font=("Arial", 18, "bold"), 
                                        bg='#3B82F6', fg='white', 
                                        bd=4, relief='raised',
                                        padx=40, pady=20,
                                        activebackground='#1D4ED8',
                                        activeforeground='white',
                                        cursor='hand2')
        self.validate_button.pack(side=tk.LEFT, padx=(0, 20))
        
        # زر START
        self.start_button = tk.Button(buttons_section, text="🚀 START", 
                                     command=self.start_processing,
                                     font=("Arial", 24, "bold"), 
                                     bg='#22C55E', fg='white', 
                                     bd=5, relief='raised',
                                     padx=60, pady=25,
                                     activebackground='#16A34A',
                                     activeforeground='white',
                                     cursor='hand2')
        self.start_button.pack(side=tk.LEFT)
        
        # إطار شريط التقدم
        progress_section = tk.LabelFrame(main_frame, text="📊 التقدم", 
                                        font=("Arial", 12, "bold"), fg="#1F2937", 
                                        bg='#F5F5F5', bd=2, relief='solid')
        progress_section.pack(fill=tk.X, pady=(0, 15))
        
        progress_frame = tk.Frame(progress_section, bg='#F5F5F5')
        progress_frame.pack(fill=tk.X, padx=10, pady=10)
        
        self.progress_bar = ttk.Progressbar(progress_frame, variable=self.progress_var, 
                                          maximum=100, length=500)
        self.progress_bar.pack(fill=tk.X, pady=(0, 10))
        
        # نص حالة المعالجة
        self.status_label = tk.Label(progress_frame, text="جاهز للمعالجة", 
                                    font=("Arial", 11, "bold"), bg='#F5F5F5', fg="#059669")
        self.status_label.pack()
        
        # أزرار التحكم الإضافية
        buttons_frame = tk.Frame(main_frame, bg='#F5F5F5')
        buttons_frame.pack(pady=(10, 15))
        
        open_btn = tk.Button(buttons_frame, text="📂 فتح مجلد الإخراج", 
                            command=self.open_output_folder,
                            font=("Arial", 12, "bold"), 
                            bg='#3B82F6', fg='white', 
                            bd=3, relief='raised',
                            padx=25, pady=12,
                            activebackground='#1D4ED8',
                            activeforeground='white',
                            cursor='hand2')
        open_btn.pack(side=tk.LEFT, padx=(0, 20))
        
        close_btn = tk.Button(buttons_frame, text="❌ إغلاق", 
                             command=self.root.quit,
                             font=("Arial", 12, "bold"), 
                             bg='#EF4444', fg='white', 
                             bd=3, relief='raised',
                             padx=25, pady=12,
                             activebackground='#DC2626',
                             activeforeground='white',
                             cursor='hand2')
        close_btn.pack(side=tk.LEFT, padx=(0, 20))
        
        # معلومات حقوق الطبع والنشر
        copyright_frame = tk.Frame(main_frame, bg='#F5F5F5')
        copyright_frame.pack(pady=(10, 0))
        
        tk.Label(copyright_frame, text="© 2025 RABIE&RADOO - All Rights Reserved", 
                font=("Arial", 9), fg="#6B7280", bg='#F5F5F5').pack()
        tk.Label(copyright_frame, text="Developed by TKMASTER", 
                font=("Arial", 9, "bold"), fg="#1E3A8A", bg='#F5F5F5').pack()
        
    def browse_input_file(self):
        """تصفح واختيار ملف الإدخال"""
        filename = filedialog.askopenfilename(
            title="اختر ملف الإدخال",
            filetypes=[
                ("ملفات Excel", "*.xlsx *.xls"),
                ("جميع الملفات", "*.*")
            ]
        )
        if filename:
            self.input_file.set(filename)
            
    def browse_output_folder(self):
        """تصفح واختيار مجلد الإخراج"""
        folder_path = filedialog.askdirectory(
            title="اختر مجلد الحفظ",
            initialdir=self.output_folder.get()
        )
        if folder_path:
            self.output_folder.set(folder_path)
            
    def open_output_folder(self):
        """فتح مجلد الإخراج"""
        output_path = self.output_folder.get()
        if os.path.exists(output_path):
            os.startfile(output_path)
        else:
            messagebox.showwarning("تحذير", "مجلد الإخراج غير موجود!")
            
    def validate_inputs(self):
        """التحقق من صحة المدخلات"""
        if not self.input_file.get().strip():
            messagebox.showerror("خطأ", "يرجى اختيار ملف الإدخال!")
            return False
            
        if not os.path.exists(self.input_file.get()):
            messagebox.showerror("خطأ", "ملف الإدخال غير موجود!")
            return False
            
        if not self.output_folder.get().strip():
            messagebox.showerror("خطأ", "يرجى تحديد مجلد الحفظ!")
            return False
            
        if not os.path.exists(self.output_folder.get()):
            try:
                os.makedirs(self.output_folder.get(), exist_ok=True)
            except Exception as e:
                messagebox.showerror("خطأ", f"لا يمكن إنشاء مجلد الحفظ!\n{str(e)}")
                return False
            
        if not self.output_excel.get().strip():
            messagebox.showerror("خطأ", "يرجى تحديد اسم ملف Excel للإخراج!")
            return False
            
        if not self.output_pdf.get().strip():
            messagebox.showerror("خطأ", "يرجى تحديد اسم ملف PDF للإخراج!")
            return False
            
        return True
        
    def validate_data(self):
        """التحقق من صحة بيانات الرواتب"""
        if not self.input_file.get().strip():
            messagebox.showerror("خطأ", "يرجى اختيار ملف الإدخال أولاً!")
            return
            
        if not os.path.exists(self.input_file.get()):
            messagebox.showerror("خطأ", "ملف الإدخال غير موجود!")
            return
        
        # إيقاف أي صوت يعمل حالياً
        self.stop_sound()
        
        # 🎵 تشغيل صوت التحقق مع التكرار (آمن)
        try:
            self.play_sound(self.check_sound, loop=True)
        except:
            pass  # تجاهل أخطاء الصوت
        
        # تعطيل زر التحقق
        self.validate_button.config(state="disabled", text="🔍 جاري الفحص...")
        self.progress_var.set(0)
        self.status_label.config(text="بدء فحص البيانات...")
        
        # تشغيل التحقق في thread منفصل
        thread = threading.Thread(target=self.run_validation)
        thread.daemon = True
        thread.start()
        
    def run_validation(self):
        """تشغيل عملية التحقق الفعلية"""
        try:
            # استدعاء دالة التحقق من المعالج الرئيسي
            from multi_sheet_payroll_processor import validate_payroll_data
            
            success, errors, warnings, report = validate_payroll_data(
                input_file=self.input_file.get(),
                progress_callback=self.update_progress,
                status_callback=self.update_status_only
            )
            
            # تحديث حالة التحقق
            self.data_validated = success
            
            if success:
                # نجح التحقق
                self.root.after(0, lambda: self.validation_success(report))
            else:
                # فشل التحقق
                self.root.after(0, lambda: self.validation_failed(errors, warnings, report))
                
        except Exception as e:
            self.root.after(0, lambda: self.validation_error(str(e)))
        finally:
            # إيقاف الصوت وإعادة تفعيل زر التحقق
            self.root.after(0, lambda: [
                self.stop_sound(),
                self.validate_button.config(state="normal", text="✅ تحقق")
            ])
    
    def validation_success(self, report):
        """عند نجاح التحقق من البيانات"""
        self.status_label.config(text="✅ جميع البيانات صحيحة - يمكنك الآن الضغط على START", fg="#059669")
        self.start_button.config(state="normal", bg='#22C55E')
        self.progress_var.set(100)
        
        # عرض التقرير
        messagebox.showinfo("✅ نجح الفحص", 
                           "جميع البيانات صحيحة!\n\nيمكنك الآن الضغط على START لبدء المعالجة.\n\nهل تريد عرض التقرير المفصل؟")
        
        # نافذة عرض التقرير
        self.show_report_window(report, "✅ تقرير الفحص - نجح", "#059669")
    
    def validation_failed(self, errors, warnings, report):
        """عند فشل التحقق من البيانات"""
        self.status_label.config(text=f"❌ تم اكتشاف {len(errors)} أخطاء - يرجى إصلاحها أولاً", fg="#DC2626")
        self.start_button.config(state="disabled", bg='#9CA3AF')
        self.progress_var.set(0)
        
        # عرض رسالة الخطأ
        messagebox.showerror("❌ أخطاء في البيانات", 
                            f"تم اكتشاف {len(errors)} أخطاء في البيانات!\n\nيرجى إصلاح الأخطاء قبل المتابعة.\n\nانقر OK لعرض التقرير المفصل.")
        
        # نافذة عرض التقرير
        self.show_report_window(report, "❌ تقرير الفحص - توجد أخطاء", "#DC2626")
    
    def validation_error(self, error_message):
        """عند حدوث خطأ في عملية التحقق"""
        self.status_label.config(text=f"❌ خطأ في الفحص: {error_message}", fg="#DC2626")
        self.progress_var.set(0)
        messagebox.showerror("خطأ", f"حدث خطأ أثناء فحص البيانات:\n{error_message}")
        
    def show_report_window(self, report, title, title_color):
        """عرض نافذة التقرير المفصل"""
        report_window = tk.Toplevel(self.root)
        report_window.title(title)
        report_window.geometry("800x600")
        report_window.configure(bg='#F5F5F5')
        
        # إطار العنوان
        title_frame = tk.Frame(report_window, bg=title_color, height=60)
        title_frame.pack(fill=tk.X, pady=(0, 10))
        title_frame.pack_propagate(False)
        
        title_label = tk.Label(title_frame, text=title, 
                              font=("Arial", 16, "bold"), 
                              fg='white', bg=title_color)
        title_label.pack(expand=True)
        
        # إطار النص
        text_frame = tk.Frame(report_window, bg='#F5F5F5')
        text_frame.pack(fill=tk.BOTH, expand=True, padx=20, pady=(0, 20))
        
        # منطقة النص مع شريط التمرير
        text_widget = tk.Text(text_frame, wrap=tk.WORD, font=("Consolas", 11), 
                             bg='white', fg='black', bd=2, relief='solid')
        scrollbar = tk.Scrollbar(text_frame, orient=tk.VERTICAL, command=text_widget.yview)
        text_widget.configure(yscrollcommand=scrollbar.set)
        
        text_widget.pack(side=tk.LEFT, fill=tk.BOTH, expand=True)
        scrollbar.pack(side=tk.RIGHT, fill=tk.Y)
        
        # إدراج التقرير
        text_widget.insert("1.0", report)
        text_widget.config(state=tk.DISABLED)
        
        # أزرار التحكم
        buttons_frame = tk.Frame(report_window, bg='#F5F5F5')
        buttons_frame.pack(pady=(0, 20))
        
        # زر حفظ التقرير
        save_btn = tk.Button(buttons_frame, text="💾 حفظ التقرير", 
                            command=lambda: self.save_report(report),
                            font=("Arial", 12, "bold"), 
                            bg='#3B82F6', fg='white', 
                            bd=2, relief='solid', padx=20, pady=8)
        save_btn.pack(side=tk.LEFT, padx=(0, 10))
        
        # زر إغلاق
        close_btn = tk.Button(buttons_frame, text="❌ إغلاق", 
                             command=report_window.destroy,
                             font=("Arial", 12, "bold"), 
                             bg='#EF4444', fg='white', 
                             bd=2, relief='solid', padx=20, pady=8)
        close_btn.pack(side=tk.LEFT)
        
        # توسيط النافذة
        report_window.update_idletasks()
        x = (report_window.winfo_screenwidth() // 2) - (report_window.winfo_width() // 2)
        y = (report_window.winfo_screenheight() // 2) - (report_window.winfo_height() // 2)
        report_window.geometry(f"+{x}+{y}")
    
    def save_report(self, report):
        """حفظ التقرير في ملف نصي"""
        try:
            from datetime import datetime
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            default_filename = f"تقرير_فحص_الرواتب_{timestamp}.txt"
            
            file_path = filedialog.asksaveasfilename(
                title="حفظ التقرير",
                defaultextension=".txt",
                initialname=default_filename,
                filetypes=[
                    ("ملفات نصية", "*.txt"),
                    ("جميع الملفات", "*.*")
                ]
            )
            
            if file_path:
                with open(file_path, 'w', encoding='utf-8') as f:
                    f.write(report)
                messagebox.showinfo("تم الحفظ", f"تم حفظ التقرير في:\n{file_path}")
                
        except Exception as e:
            messagebox.showerror("خطأ", f"فشل في حفظ التقرير:\n{str(e)}")

    def start_processing(self):
        """بدء معالجة الملفات"""
        if not self.validate_inputs():
            return
        
        # التحقق من أن البيانات تم فحصها
        if not self.data_validated:
            result = messagebox.askyesno("تحذير", 
                                        "لم يتم فحص البيانات بعد!\n\n" +
                                        "يُنصح بفحص البيانات أولاً للتأكد من صحتها.\n\n" +
                                        "هل تريد المتابعة بدون فحص؟")
            if not result:
                return
        
        # إيقاف أي صوت يعمل حالياً
        self.stop_sound()
        
        # 🎵 تشغيل صوت البدء مع التكرار (آمن)
        try:
            self.play_sound(self.start_sound, loop=True)
        except:
            pass  # تجاهل أخطاء الصوت
            
        # تعطيل زر المعالجة
        self.start_button.config(state="disabled", text="⏳ جاري المعالجة...")
        self.progress_var.set(0)
        self.status_label.config(text="جاري بدء المعالجة...")
        
        # تشغيل المعالجة في thread منفصل
        thread = threading.Thread(target=self.process_files)
        thread.daemon = True
        thread.start()
        
    def process_files(self):
        """معالجة الملفات الفعلية"""
        try:
            # الحصول على نص الملاحظات
            notes_content = self.notes_text.get("1.0", tk.END).strip()
            if not notes_content:
                notes_content = "لا يوجد"
            
            # تحديث حالة التقدم
            self.root.after(0, lambda: self.update_status("جاري قراءة الملف...", 10))
            
            # بناء المسارات الكاملة للملفات في المجلد المختار
            output_folder = self.output_folder.get()
            excel_file_path = os.path.join(output_folder, self.output_excel.get())
            pdf_file_path = os.path.join(output_folder, self.output_pdf.get())
            
            # استدعاء دالة المعالجة مع تمرير الملاحظات والشهر والعام
            from multi_sheet_payroll_processor import process_multi_sheet_payroll_with_gui
            
            success = process_multi_sheet_payroll_with_gui(
                input_file=self.input_file.get(),
                output_excel_file=excel_file_path,
                output_pdf_file=pdf_file_path,
                company_name=self.company_name.get(),
                department=self.department.get(),
                notes=notes_content,
                month=self.month.get(),
                year=self.year.get(),
                progress_callback=self.update_progress,
                status_callback=self.update_status_only
            )
            
            if success:
                self.root.after(0, lambda: self.update_status("✅ تمت المعالجة بنجاح!", 100))
                self.root.after(0, lambda: messagebox.showinfo("نجح", 
                    f"تمت معالجة الملفات بنجاح!\n\nالملفات المُنشأة:\n• {excel_file_path}\n• {pdf_file_path}"))
            else:
                self.root.after(0, lambda: self.update_status("❌ فشلت المعالجة!", 0))
                self.root.after(0, lambda: messagebox.showerror("خطأ", "حدث خطأ أثناء المعالجة!"))
                
        except Exception as e:
            self.root.after(0, lambda: self.update_status(f"❌ خطأ: {str(e)}", 0))
            self.root.after(0, lambda: messagebox.showerror("خطأ", f"حدث خطأ أثناء المعالجة:\n{str(e)}"))
        finally:
            # إيقاف الصوت وإعادة تفعيل زر المعالجة وإعادة تعيين حالة التحقق
            self.root.after(0, lambda: [
                self.stop_sound(),
                self.start_button.config(state="normal", text="🚀 START"),
                setattr(self, 'data_validated', False)  # إعادة تعيين حالة التحقق
            ])
            
    def update_progress(self, value):
        """تحديث شريط التقدم"""
        self.root.after(0, lambda: self.progress_var.set(value))
        
    def update_status_only(self, message):
        """تحديث نص الحالة فقط"""
        self.root.after(0, lambda: self.status_label.config(text=message))
        
    def update_status(self, message, progress):
        """تحديث الحالة وشريط التقدم"""
        self.root.after(0, lambda: [
            self.status_label.config(text=message),
            self.progress_var.set(progress)
        ])

def main():
    """تشغيل الواجهة الرسومية"""
    print("🚀 بدء تشغيل RABIE&RADOO...")
    
    try:
        root = tk.Tk()
        
        # تعيين خط افتراضي يدعم العربية
        try:
            root.option_add('*Font', 'Arial 10')
        except:
            pass
        
        # منع تشغيل عدة نسخ
        root.wm_attributes("-topmost", True)
        root.after(1000, lambda: root.wm_attributes("-topmost", False))
        
        app = PayrollProcessorGUI(root)
        
        # توسيط النافذة
        root.update_idletasks()
        x = (root.winfo_screenwidth() // 2) - (root.winfo_width() // 2)
        y = (root.winfo_screenheight() // 2) - (root.winfo_height() // 2)
        root.geometry(f"+{x}+{y}")
        
        print("✅ البرنامج جاهز للاستخدام")
        root.mainloop()
        print("🔚 تم إغلاق البرنامج")
        
    except Exception as e:
        print(f"❌ خطأ في تشغيل البرنامج: {e}")
        import sys
        sys.exit(1)

if __name__ == "__main__":
    main()