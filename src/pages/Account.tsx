import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { User, Mail, Shield, LogOut, Clock } from 'lucide-react';
import { motion } from 'motion/react';

export default function AccountPage() {
  const { user, logout } = useAuth();

  return (
    <div className="space-y-8 max-w-2xl">
      <header>
        <h1 className="text-4xl font-bold text-white tracking-tight uppercase">Researcher Profile</h1>
        <p className="text-slate-500 mt-2 text-lg">Identity and authorization settings.</p>
      </header>

      <div className="bg-bg-panel border border-white/10 rounded-2xl overflow-hidden shadow-xl">
        <div className="h-32 bg-brand relative">
          <div className="absolute -bottom-10 left-8">
            <div className="w-24 h-24 bg-bg-panel rounded-2xl p-1.5 shadow-2xl">
               <div className="w-full h-full bg-white/5 rounded-xl flex items-center justify-center text-brand">
                 <User size={48} />
               </div>
            </div>
          </div>
        </div>
        
        <div className="pt-16 pb-8 px-8 space-y-8">
          <div>
            <h2 className="text-2xl font-bold text-white tracking-tight">{user?.username}</h2>
            <p className="text-slate-500 text-sm font-mono uppercase tracking-widest mt-1">Status: Active Geometric Theorist</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-4 bg-black/40 border border-white/5 rounded-xl flex items-center gap-4">
              <div className="w-10 h-10 bg-white/5 rounded-lg flex items-center justify-center text-slate-500">
                <User size={20} />
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Handle</p>
                <p className="text-slate-200 font-semibold">{user?.username}</p>
              </div>
            </div>

            <div className="p-4 bg-black/40 border border-white/5 rounded-xl flex items-center gap-4">
              <div className="w-10 h-10 bg-white/5 rounded-lg flex items-center justify-center text-slate-500">
                <Shield size={20} />
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Clearance</p>
                <p className="text-slate-200 font-semibold">Tier 1 Access</p>
              </div>
            </div>
          </div>

          <div className="pt-4 flex gap-4">
             <button 
              onClick={logout}
              className="flex items-center gap-2 text-white bg-red-600/10 hover:bg-red-600/20 border border-red-500/20 font-bold px-6 py-3 rounded-xl transition-all active:scale-95"
             >
               <LogOut size={20} />
               TERMINATE SESSION
             </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-bg-panel p-6 rounded-2xl border border-white/10 shadow-xl flex items-start gap-4">
          <div className="w-12 h-12 bg-white/5 rounded-xl flex items-center justify-center text-brand shrink-0">
             <Clock size={24} />
          </div>
          <div>
            <h3 className="font-bold text-white tracking-tight">Computation Log</h3>
            <p className="text-slate-500 text-sm mt-1 leading-relaxed">Neural processing cores are active. Periodic reconstructions logged this period.</p>
          </div>
        </div>
        
        <div className="bg-bg-panel p-6 rounded-2xl border border-white/10 shadow-xl flex items-start gap-4">
          <div className="w-12 h-12 bg-white/5 rounded-xl flex items-center justify-center text-emerald-500 shrink-0">
             <Mail size={24} />
          </div>
          <div>
            <h3 className="font-bold text-white tracking-tight">Comms Link</h3>
            <p className="text-slate-500 text-sm mt-1 leading-relaxed">Secure communication channel established. Opting in for intelligence updates.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
