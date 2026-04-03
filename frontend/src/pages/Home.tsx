import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  ShieldCheck,
  Users,
  Clock,
  CreditCard,
  CheckCircle2,
  TrendingUp,
  Lock,
  Smartphone,
  ArrowLeft,
  Building2,
  Fingerprint,
  FileText,
  BarChart3
} from 'lucide-react';

const Home = () => {
  const navigate = useNavigate();

  const features = [
    {
      icon: <Fingerprint size={32} />,
      title: 'تسجيل الحضور بالبصمة',
      description: 'نظام NFC متطور لتسجيل الحضور والانصراف بدقة عالية'
    },
    {
      icon: <Users size={32} />,
      title: 'إدارة الموظفين',
      description: 'لوحة تحكم شاملة لإدارة بيانات الموظفين والفرق'
    },
    {
      icon: <Clock size={32} />,
      title: 'متابعة الإجازات',
      description: 'نظام طلبات إجازات إلكتروني مع موافقة فورية'
    },
    {
      icon: <CreditCard size={32} />,
      title: 'الرواتب والأجور',
      description: 'حساب آلي للرواتب بناءً على ساعات الحضور'
    },
    {
      icon: <BarChart3 size={32} />,
      title: 'تقارير تحليلية',
      description: 'إحصائيات ورسوم بيانية لتتبع الأداء'
    },
    {
      icon: <Lock size={32} />,
      title: 'أمان عالي',
      description: 'تشفير متقدم وحماية للبيانات الحساسة'
    }
  ];

  const roles = [
    {
      title: 'موظف',
      description: 'متابعة حضورك، طلب إجازات، وعرض راتبك',
      color: 'from-emerald-500/20 to-teal-500/20',
      borderColor: 'border-emerald-500/30'
    },
    {
      title: 'مدير',
      description: 'إدارة فريقك، الموافقة على الإجازات، ومتابعة الحضور',
      color: 'from-blue-500/20 to-indigo-500/20',
      borderColor: 'border-blue-500/30'
    },
    {
      title: 'موارد بشرية',
      description: 'إدارة شاملة للموظفين، الرواتب، والسياسات',
      color: 'from-purple-500/20 to-pink-500/20',
      borderColor: 'border-purple-500/30'
    },
    {
      title: 'مدير نظام',
      description: 'تحكم كامل في النظام والصلاحيات والإعدادات',
      color: 'from-amber-500/20 to-orange-500/20',
      borderColor: 'border-amber-500/30'
    }
  ];

  const stats = [
    { value: '+99%', label: 'دقة الحضور' },
    { value: '-80%', label: 'وقت المعالجة' },
    { value: '+100%', label: 'الشفافية' },
    { value: '24/7', label: 'متاح دائماً' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white overflow-hidden">
      {/* Background Effects */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-emerald-500/10 rounded-full blur-[150px] -mr-48 -mt-48" />
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-blue-500/10 rounded-full blur-[150px] -ml-48 -mb-48" />
      <div className="absolute top-1/2 left-1/2 w-[800px] h-[800px] bg-purple-500/5 rounded-full blur-[200px] -translate-x-1/2 -translate-y-1/2" />

      {/* Navigation */}
      <nav className="relative z-50 border-b border-white/5 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-3"
          >
            <div className="w-10 h-10 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-xl flex items-center justify-center shadow-lg">
              <Building2 size={22} className="text-white" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent">
              HRMS PRO
            </span>
          </motion.div>

          <motion.button
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            onClick={() => navigate('/login')}
            className="flex items-center gap-2 px-5 py-2.5 bg-white/10 hover:bg-white/20 border border-white/10 rounded-xl transition-all font-medium text-sm"
          >
            <span>تسجيل الدخول</span>
            <ArrowLeft size={16} />
          </motion.button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 py-20 lg:py-32">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-20"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-full mb-6">
            <ShieldCheck size={16} className="text-emerald-400" />
            <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
              نظام إدارة الموارد البشرية المتكامل
            </span>
          </div>

          <h1 className="text-5xl lg:text-7xl font-black mb-6 leading-tight">
            <span className="bg-gradient-to-r from-white via-white/90 to-white/60 bg-clip-text text-transparent">
              إدارة موارد بشرية
            </span>
            <br />
            <span className="bg-gradient-to-r from-emerald-400 via-teal-400 to-blue-400 bg-clip-text text-transparent">
              ذكية ومتطورة
            </span>
          </h1>

          <p className="text-xl text-white/50 max-w-3xl mx-auto mb-10 leading-relaxed">
            منصة شاملة لإدارة الموظفين، الحضور، الإجازات، والرواتب بتصميم عصري وأداء استثنائي
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={() => navigate('/login')}
              className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white rounded-2xl font-bold shadow-[0_10px_40px_rgba(16,185,129,0.3)] hover:shadow-[0_15px_50px_rgba(16,185,129,0.4)] transition-all active:scale-[0.98] flex items-center justify-center gap-3"
            >
              <span>ابدأ الآن</span>
              <ArrowLeft size={20} strokeWidth={3} />
            </button>
            <button className="w-full sm:w-auto px-8 py-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl font-bold transition-all flex items-center justify-center gap-2">
              <Smartphone size={20} />
              <span>تطبيق الجوال</span>
            </button>
          </div>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-32"
        >
          {stats.map((stat, index) => (
            <div
              key={index}
              className="p-6 bg-white/[0.02] border border-white/5 rounded-3xl backdrop-blur-sm hover:bg-white/[0.04] transition-all"
            >
              <div className="text-3xl lg:text-4xl font-black bg-gradient-to-r from-emerald-400 to-blue-400 bg-clip-text text-transparent mb-2">
                {stat.value}
              </div>
              <div className="text-sm text-white/40 font-bold">{stat.label}</div>
            </div>
          ))}
        </motion.div>
      </section>

      {/* Features Section */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 py-20">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl lg:text-5xl font-black mb-4">
            <span className="bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent">
              مميزات متكاملة
            </span>
          </h2>
          <p className="text-lg text-white/40 max-w-2xl mx-auto">
            كل ما تحتاجه لإدارة مواردك البشرية في مكان واحد
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="group p-8 bg-white/[0.02] border border-white/5 rounded-3xl backdrop-blur-sm hover:bg-white/[0.05] hover:border-emerald-500/30 transition-all duration-300"
            >
              <div className="w-14 h-14 bg-gradient-to-br from-emerald-500/20 to-teal-500/20 rounded-2xl flex items-center justify-center text-emerald-400 mb-6 group-hover:scale-110 transition-transform">
                {feature.icon}
              </div>
              <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
              <p className="text-white/40 leading-relaxed">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Roles Section */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 py-20">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl lg:text-5xl font-black mb-4">
            <span className="bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent">
              أدوار مخصصة
            </span>
          </h2>
          <p className="text-lg text-white/40 max-w-2xl mx-auto">
            واجهات مصممة خصيصاً لكل دور في المؤسسة
          </p>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {roles.map((role, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className={`p-8 bg-gradient-to-br ${role.color} ${role.borderColor} border rounded-3xl backdrop-blur-sm hover:scale-105 transition-all duration-300`}
            >
              <div className="text-2xl font-black mb-3">{role.title}</div>
              <p className="text-white/50 text-sm leading-relaxed">{role.description}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 py-20">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <div className="relative p-12 lg:p-20 bg-gradient-to-br from-emerald-500/10 via-teal-500/10 to-blue-500/10 border border-white/10 rounded-[40px] overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-blue-500/5" />
            <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-emerald-500/10 rounded-full blur-[100px]" />
            <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-blue-500/10 rounded-full blur-[100px]" />

            <div className="relative z-10 text-center">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 border border-white/20 rounded-full mb-6">
                <CheckCircle2 size={16} className="text-emerald-400" />
                <span className="text-xs font-bold text-emerald-400">جاهز للبدء</span>
              </div>

              <h2 className="text-4xl lg:text-5xl font-black mb-6">
                <span className="bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent">
                  ابدأ تحويل إدارة مواردك البشرية اليوم
                </span>
              </h2>

              <p className="text-lg text-white/40 max-w-2xl mx-auto mb-10">
                انضم إلى المؤسسات التي تثق في HRMS PRO لإدارة فرقها بكفاءة
              </p>

              <button
                onClick={() => navigate('/login')}
                className="px-10 py-5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white rounded-2xl font-bold shadow-[0_10px_40px_rgba(16,185,129,0.3)] hover:shadow-[0_15px_50px_rgba(16,185,129,0.4)] transition-all active:scale-[0.98] inline-flex items-center gap-3"
              >
                <span>سجل الدخول الآن</span>
                <ArrowLeft size={20} strokeWidth={3} />
              </button>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/5 mt-20">
        <div className="max-w-7xl mx-auto px-6 py-12">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-xl flex items-center justify-center">
                <Building2 size={22} className="text-white" />
              </div>
              <div>
                <div className="font-bold">HRMS PRO</div>
                <div className="text-xs text-white/40">نظام إدارة الموارد البشرية</div>
              </div>
            </div>

            <div className="flex items-center gap-8 text-sm text-white/40">
              <div className="flex items-center gap-2">
                <FileText size={16} />
                <span>سياسة الخصوصية</span>
              </div>
              <div className="flex items-center gap-2">
                <TrendingUp size={16} />
                <span>شروط الاستخدام</span>
              </div>
              <div className="flex items-center gap-2">
                <Lock size={16} />
                <span>الأمان</span>
              </div>
            </div>

            <div className="text-sm text-white/30 font-medium">
              © 2026 HRMS PRO. جميع الحقوق محفوظة
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;
