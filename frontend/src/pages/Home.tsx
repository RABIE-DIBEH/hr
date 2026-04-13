import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
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
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();

  const features = [
    {
      icon: <Fingerprint size={32} />,
      title: t('home.features.nfc.title'),
      description: t('home.features.nfc.desc')
    },
    {
      icon: <Users size={32} />,
      title: t('home.features.employees.title'),
      description: t('home.features.employees.desc')
    },
    {
      icon: <Clock size={32} />,
      title: t('home.features.leaves.title'),
      description: t('home.features.leaves.desc')
    },
    {
      icon: <CreditCard size={32} />,
      title: t('home.features.payroll.title'),
      description: t('home.features.payroll.desc')
    },
    {
      icon: <BarChart3 size={32} />,
      title: t('home.features.analytics.title'),
      description: t('home.features.analytics.desc')
    },
    {
      icon: <Lock size={32} />,
      title: t('home.features.security.title'),
      description: t('home.features.security.desc')
    }
  ];

  const roles = [
    {
      title: t('home.roles.employee.title'),
      description: t('home.roles.employee.desc'),
      color: 'from-emerald-500/20 to-teal-500/20',
      borderColor: 'border-emerald-500/30'
    },
    {
      title: t('home.roles.manager.title'),
      description: t('home.roles.manager.desc'),
      color: 'from-blue-500/20 to-indigo-500/20',
      borderColor: 'border-blue-500/30'
    },
    {
      title: t('home.roles.hr.title'),
      description: t('home.roles.hr.desc'),
      color: 'from-purple-500/20 to-pink-500/20',
      borderColor: 'border-purple-500/30'
    },
    {
      title: t('home.roles.admin.title'),
      description: t('home.roles.admin.desc'),
      color: 'from-amber-500/20 to-orange-500/20',
      borderColor: 'border-amber-500/30'
    }
  ];

  const stats = [
    { value: '+99%', label: t('home.stats.accuracy') },
    { value: '-80%', label: t('home.stats.processing') },
    { value: '+100%', label: t('home.stats.transparency') },
    { value: '24/7', label: t('home.stats.availability') }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white overflow-hidden" dir={i18n.dir()}>
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
              {t('home.hrmsPro')}
            </span>
          </motion.div>

          <motion.button
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            onClick={() => navigate('/login')}
            className="flex items-center gap-2 px-5 py-2.5 bg-white/10 hover:bg-white/20 border border-white/10 rounded-xl transition-all font-medium text-sm"
          >
            <span>{t('home.login')}</span>
            <ArrowLeft className={i18n.language === 'ar' ? '' : 'rotate-180'} size={16} />
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
              {t('home.tagline')}
            </span>
          </div>

          <h1 className="text-5xl lg:text-7xl font-black mb-6 leading-tight">
            <span className="bg-gradient-to-r from-white via-white/90 to-white/60 bg-clip-text text-transparent">
              {t('home.heroTitle')}
            </span>
            <br />
            <span className="bg-gradient-to-r from-emerald-400 via-teal-400 to-blue-400 bg-clip-text text-transparent">
              {t('home.heroTitleAccent')}
            </span>
          </h1>

          <p className="text-xl text-white/50 max-w-3xl mx-auto mb-10 leading-relaxed">
            {t('home.heroSubtitle')}
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={() => navigate('/login')}
              className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white rounded-2xl font-bold shadow-[0_10px_40px_rgba(16,185,129,0.3)] hover:shadow-[0_15px_50px_rgba(16,185,129,0.4)] transition-all active:scale-[0.98] flex items-center justify-center gap-3"
            >
              <span>{t('home.startNow')}</span>
              <ArrowLeft className={i18n.language === 'ar' ? '' : 'rotate-180'} size={20} strokeWidth={3} />
            </button>
            <button className="w-full sm:w-auto px-8 py-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl font-bold transition-all flex items-center justify-center gap-2">
              <Smartphone size={20} />
              <span>{t('home.mobileApp')}</span>
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
              {t('home.features.title')}
            </span>
          </h2>
          <p className="text-lg text-white/40 max-w-2xl mx-auto">
            {t('home.features.subtitle')}
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
              {t('home.roles.title')}
            </span>
          </h2>
          <p className="text-lg text-white/40 max-w-2xl mx-auto">
            {t('home.roles.subtitle')}
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
                <span className="text-xs font-bold text-emerald-400">{t('home.cta.ready')}</span>
              </div>

              <h2 className="text-4xl lg:text-5xl font-black mb-6">
                <span className="bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent">
                  {t('home.cta.title')}
                </span>
              </h2>

              <p className="text-lg text-white/40 max-w-2xl mx-auto mb-10">
                {t('home.cta.subtitle')}
              </p>

              <button
                onClick={() => navigate('/login')}
                className="px-10 py-5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white rounded-2xl font-bold shadow-[0_10px_40px_rgba(16,185,129,0.3)] hover:shadow-[0_15px_50px_rgba(16,185,129,0.4)] transition-all active:scale-[0.98] inline-flex items-center gap-3"
              >
                <span>{t('home.cta.button')}</span>
                <ArrowLeft className={i18n.language === 'ar' ? '' : 'rotate-180'} size={20} strokeWidth={3} />
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
                <div className="font-bold">{t('home.hrmsPro')}</div>
                <div className="text-xs text-white/40">{t('home.footer.description')}</div>
              </div>
            </div>

            <div className="flex items-center gap-8 text-sm text-white/40">
              <div className="flex items-center gap-2">
                <FileText size={16} />
                <span>{t('home.footer.privacy')}</span>
              </div>
              <div className="flex items-center gap-2">
                <TrendingUp size={16} />
                <span>{t('home.footer.terms')}</span>
              </div>
              <div className="flex items-center gap-2">
                <Lock size={16} />
                <span>{t('home.footer.security')}</span>
              </div>
            </div>

            <div className="text-sm text-white/30 font-medium">
              {t('home.footer.rights')}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;
