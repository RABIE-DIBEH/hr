import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  IdCard, 
  CreditCard, 
  DollarSign, 
  RefreshCcw, 
  CheckCircle2, 
  AlertCircle,
  Link,
  Search,
  Download
} from 'lucide-react';
import Sidebar from '../components/Sidebar';

const HRDashboard = () => {
  const [bindingStatus, setBindingStatus] = useState('Idle'); // Idle, Reading, Success
  const [payrollLoading, setPayrollLoading] = useState(false);

  const employees = [
    { id: 1, name: 'أحمد علي', team: 'المبيعات', cardUid: '04:23:1A:FF', status: 'Linked' },
    { id: 2, name: 'سارة خالد', team: 'التسويق', cardUid: 'None', status: 'Pending' },
    { id: 3, name: 'محمد حسن', team: 'التقنية', cardUid: '04:B2:FF:11', status: 'Linked' },
  ];

  const handleBind = () => {
    setBindingStatus('Reading');
    setTimeout(() => {
      setBindingStatus('Success');
      setTimeout(() => setBindingStatus('Idle'), 3000);
    }, 2000);
  };

  const handlePayroll = () => {
    setPayrollLoading(true);
    setTimeout(() => setPayrollLoading(false), 2000);
  };

  return (
    <div className="flex min-h-screen bg-slate-50 font-sans" dir="rtl">
      <Sidebar />
      
      <main className="mr-64 flex-1 p-8">
        <div className="max-w-7xl mx-auto">
          <header className="mb-10">
            <h1 className="text-3xl font-black text-slate-900 tracking-tight arabic-text">إدارة الموارد البشرية (HR)</h1>
            <p className="text-slate-500 mt-1">إدارة البطاقات الذكية ومعالجة الرواتب الشهرية</p>
          </header>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
            {/* NFC Binding Tool */}
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-100 flex flex-col justify-between"
            >
              <div>
                <div className="flex justify-between items-start mb-6">
                  <div className="bg-blue-600 w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-200">
                    <CreditCard size={24} />
                  </div>
                  <span className="bg-blue-50 text-blue-600 px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-widest">NFC Pairing</span>
                </div>
                <h2 className="text-xl font-bold mb-2">ربط بطاقة NFC بموظف</h2>
                <p className="text-slate-500 text-sm mb-8 leading-relaxed">قم باختيار الموظف ثم مرر البطاقة على قارئ الـ USB المتصل بجهازك لإتمام عملية الربط.</p>

                <div className="space-y-4 mb-8">
                  <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <select className="w-full bg-slate-50 border-none rounded-xl py-4 pl-12 pr-4 text-sm focus:ring-2 focus:ring-blue-500/20 appearance-none">
                      <option disabled selected>اختر الموظف من القائمة...</option>
                      {employees.map(e => <option key={e.id}>{e.name} ({e.team})</option>)}
                    </select>
                  </div>
                  
                  <div className={`border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center gap-4 transition-all duration-300 ${
                    bindingStatus === 'Reading' ? 'border-blue-500 bg-blue-50/50' : 
                    bindingStatus === 'Success' ? 'border-green-500 bg-green-50/50' : 'border-slate-100'
                  }`}>
                    {bindingStatus === 'Reading' ? (
                      <>
                        <RefreshCcw className="text-blue-500 animate-spin" size={32} />
                        <p className="text-blue-600 font-bold text-sm">جاري القراءة...</p>
                      </>
                    ) : bindingStatus === 'Success' ? (
                      <>
                        <CheckCircle2 className="text-green-500" size={32} />
                        <p className="text-green-600 font-bold text-sm">تم الربط بنجاح! UID: 04:FF:A1:CC</p>
                      </>
                    ) : (
                      <>
                        <IdCard className="text-slate-300" size={40} />
                        <p className="text-slate-400 font-medium text-sm">جاهز لقراءة البطاقة</p>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <button 
                onClick={handleBind}
                disabled={bindingStatus !== 'Idle'}
                className="w-full bg-slate-900 text-white py-4 rounded-2xl font-bold hover:bg-slate-800 transition-all flex items-center justify-center gap-2"
              >
                <Link size={18} />
                <span>تأكيد عملية الربط</span>
              </button>
            </motion.div>

            {/* Payroll Management */}
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-100 flex flex-col justify-between"
            >
              <div>
                <div className="flex justify-between items-start mb-6">
                  <div className="bg-emerald-600 w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-emerald-200">
                    <DollarSign size={24} />
                  </div>
                  <span className="bg-emerald-50 text-emerald-600 px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-widest">Payroll Cycle</span>
                </div>
                <h2 className="text-xl font-bold mb-2">معالجة الرواتب الشهرية</h2>
                <p className="text-slate-500 text-sm mb-8 leading-relaxed">يقوم النظام بحساب الساعات الفعلية المؤكدة من قبل المديرين وتطبيق الخصومات والمكافآت تلقائياً.</p>

                <div className="grid grid-cols-2 gap-4 mb-8">
                  <div className="bg-slate-50 p-4 rounded-2xl">
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">الشهر المستهدف</p>
                    <p className="font-bold">مايو 2024</p>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-2xl">
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">موظفين مؤهلين</p>
                    <p className="font-bold">142 موظف</p>
                  </div>
                </div>

                <div className="p-5 bg-orange-50 border border-orange-100 rounded-2xl flex gap-4 items-start mb-8">
                  <AlertCircle className="text-orange-600 shrink-0" size={20} />
                  <p className="text-orange-800 text-xs leading-relaxed font-medium">
                    يوجد <span className="font-bold">4 موظفين</span> لم يتم تأكيد حضورهم اليومي من قبل مديريهم. قد يتأثر حساب الراتب النهائي.
                  </p>
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <button 
                  onClick={handlePayroll}
                  disabled={payrollLoading}
                  className="w-full bg-emerald-600 text-white py-4 rounded-2xl font-black shadow-xl shadow-emerald-100 hover:bg-emerald-700 transition-all flex items-center justify-center gap-2"
                >
                  {payrollLoading ? <RefreshCcw className="animate-spin" size={20} /> : <RefreshCcw size={20} />}
                  <span>توليد كشوف المرتبات (Batch Process)</span>
                </button>
                <button className="w-full bg-white border border-slate-200 text-slate-600 py-3 rounded-2xl font-bold hover:bg-slate-50 transition-all flex items-center justify-center gap-2">
                  <Download size={18} />
                  <span>تصدير ملف البنك (Excel)</span>
                </button>
              </div>
            </motion.div>
          </div>

          {/* Employee Status Table */}
          <section className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
            <div className="p-8 border-b border-slate-50">
              <h3 className="font-bold text-xl">قائمة ربط البطاقات</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-right border-collapse">
                <thead className="bg-slate-50/50 text-slate-400 text-[10px] font-black uppercase tracking-[0.15em]">
                  <tr>
                    <th className="p-6">الموظف</th>
                    <th className="p-6">الفريق</th>
                    <th className="p-6">معرف البطاقة UID</th>
                    <th className="p-6">حالة الربط</th>
                    <th className="p-6">الإجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {employees.map(emp => (
                    <tr key={emp.id} className="hover:bg-slate-50/50 transition-all">
                      <td className="p-6 font-bold text-slate-800">{emp.name}</td>
                      <td className="p-6 text-slate-500 text-sm font-medium">{emp.team}</td>
                      <td className="p-6 font-mono text-slate-600 text-sm">{emp.cardUid}</td>
                      <td className="p-6">
                        <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase ${
                          emp.status === 'Linked' ? 'bg-green-50 text-green-600' : 'bg-orange-50 text-orange-600 animate-pulse'
                        }`}>
                          {emp.status === 'Linked' ? 'مرتبط' : 'قيد الانتظار'}
                        </span>
                      </td>
                      <td className="p-6">
                        <button className="text-blue-600 font-bold text-xs hover:underline">تعديل الربط</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
};

export default HRDashboard;
