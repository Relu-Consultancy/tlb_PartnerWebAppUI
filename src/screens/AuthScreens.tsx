import React from 'react';
import { motion } from 'motion/react';
import { ChevronRight, Smartphone, Mail, ArrowRight, CheckCircle2 } from 'lucide-react';
import { Screen } from '../types';

interface AuthProps {
  onNavigate: (screen: Screen) => void;
}

export const Landing: React.FC<AuthProps> = ({ onNavigate }) => (
  <div className="min-h-screen bg-[#FDFCF8] flex flex-col">
    <header className="p-6 flex justify-between items-center">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 bg-tlb-dark rounded-lg flex items-center justify-center text-tlb-yellow font-black text-xl">TLB</div>
        <span className="font-bold text-xl tracking-tight">TLB</span>
      </div>
      <button onClick={() => onNavigate('LOGIN')} className="font-bold text-tlb-yellow uppercase tracking-widest text-sm">Login</button>
    </header>

    <main className="flex-1 px-6 pb-12">
      <div className="mt-8 mb-12">
        <span className="bg-tlb-yellow/20 text-tlb-yellow px-3 py-1 rounded-full text-[10px] font-bold tracking-widest uppercase">Partner Network</span>
        <h1 className="text-5xl font-extrabold mt-4 leading-[1.1]">Your Stage <br/><span className="text-tlb-yellow">Awaits</span></h1>
        <p className="text-gray-500 mt-4 text-lg leading-relaxed">The ultimate partner portal for Broadway events, classes, and venues. Manage your business with sophisticated, elite tools.</p>
        
        <button onClick={() => onNavigate('LOGIN')} className="tlb-button w-full mt-8 py-5 text-lg shadow-xl shadow-tlb-yellow/20">
          Get Started
        </button>
        <p className="text-center text-gray-400 text-xs mt-4">Join 500+ premium Broadway partners</p>
      </div>

      <div className="rounded-3xl overflow-hidden mb-12 shadow-2xl">
        <img src="https://picsum.photos/seed/theater/800/450" alt="Theater" className="w-full h-64 object-cover" referrerPolicy="no-referrer" />
      </div>

      <section className="space-y-6">
        <h2 className="text-3xl font-black mb-8">Empowering Broadway</h2>
        {[
          { icon: CheckCircle2, title: 'Partner Verification', desc: 'Build immediate trust within the exclusive Broadway community with our elite badge system.' },
          { icon: Smartphone, title: 'Event Management', desc: 'Seamlessly schedule and manage high-profile classes, workshops, and performance events.' },
          { icon: Mail, title: 'Venue Booking', desc: 'Direct access to list and book premium, high-end performance spaces across the district.' }
        ].map((item, i) => (
          <div key={i} className="tlb-card flex gap-4 items-start">
            <div className="bg-tlb-yellow/10 p-3 rounded-xl text-tlb-yellow">
              <item.icon size={24} />
            </div>
            <div>
              <h3 className="font-bold text-lg mb-1">{item.title}</h3>
              <p className="text-gray-500 text-sm leading-relaxed">{item.desc}</p>
            </div>
          </div>
        ))}
      </section>

      <div className="mt-16 bg-tlb-dark rounded-[2.5rem] p-10 text-center text-white">
        <h2 className="text-3xl font-black mb-4">Ready for the Spotlight?</h2>
        <p className="text-gray-400 mb-8">Join the network that powers the next generation of Broadway excellence.</p>
        <button onClick={() => onNavigate('LOGIN')} className="tlb-button w-full py-5">Apply Now</button>
      </div>
    </main>

    <footer className="p-12 bg-gray-50 border-t border-gray-100">
      <div className="flex items-center gap-2 mb-8">
        <div className="w-6 h-6 bg-gray-300 rounded flex items-center justify-center text-white font-bold text-xs">TLB</div>
        <span className="font-bold text-gray-400">The Little Broadway</span>
      </div>
      <div className="grid grid-cols-2 gap-8">
        <div>
          <h4 className="font-bold mb-4 text-sm">Platform</h4>
          <ul className="space-y-2 text-gray-400 text-sm">
            <li>Venues</li>
            <li>Events</li>
            <li>Classes</li>
          </ul>
        </div>
        <div>
          <h4 className="font-bold mb-4 text-sm">Company</h4>
          <ul className="space-y-2 text-gray-400 text-sm">
            <li>About</li>
            <li>Legal</li>
            <li>Privacy</li>
          </ul>
        </div>
      </div>
      <p className="mt-12 text-center text-gray-300 text-[10px]">© 2024 The Little Broadway. All rights reserved.</p>
    </footer>
  </div>
);

export const Login: React.FC<AuthProps> = ({ onNavigate }) => (
  <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-md bg-white rounded-[2.5rem] p-8 shadow-2xl relative"
    >
      <button onClick={() => onNavigate('LANDING')} className="absolute top-8 left-8 text-gray-400"><X size={24} /></button>
      
      <div className="flex flex-col items-center mt-8">
        <div className="w-20 h-20 bg-tlb-yellow rounded-full flex items-center justify-center shadow-lg shadow-tlb-yellow/30 mb-6">
          <Smartphone size={32} className="text-tlb-dark" />
        </div>
        <h1 className="text-3xl font-black text-center">The Little Broadway</h1>
        <p className="text-gray-400 font-medium mt-1">Partner Portal Access</p>
      </div>

      <div className="mt-10 space-y-6">
        <div className="flex gap-4">
          <div className="w-24">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 block">Code</label>
            <div className="tlb-input flex items-center justify-between">
              <span>+91</span>
              <ChevronRight size={16} className="rotate-90 text-gray-400" />
            </div>
          </div>
          <div className="flex-1">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 block">Mobile Number</label>
            <input type="tel" placeholder="98765 43210" className="tlb-input" />
          </div>
        </div>

        <button onClick={() => onNavigate('OTP_VERIFY')} className="tlb-button w-full py-5 shadow-xl shadow-tlb-yellow/20">
          Send OTP <ArrowRight size={20} />
        </button>

        <div className="relative flex items-center justify-center py-4">
          <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-100"></div></div>
          <span className="relative bg-white px-4 text-[10px] font-bold text-gray-300 uppercase tracking-[0.2em]">OR</span>
        </div>

        <button className="w-full py-4 border border-gray-100 rounded-2xl font-bold text-gray-500 flex items-center justify-center gap-3 hover:bg-gray-50 transition-colors">
          <Mail size={20} /> Login with Email
        </button>
      </div>

      <p className="mt-12 text-center text-gray-400 font-medium">
        New to TLB? <button onClick={() => onNavigate('REGISTRATION')} className="text-tlb-yellow font-bold">Join as a Partner</button>
      </p>
    </motion.div>
  </div>
);

export const OTPVerify: React.FC<AuthProps> = ({ onNavigate }) => (
  <div className="min-h-screen bg-white flex flex-col items-center p-6">
    <div className="w-full flex items-center justify-between mb-12">
      <button onClick={() => onNavigate('LOGIN')} className="p-2"><ArrowRight size={24} className="rotate-180" /></button>
      <h2 className="font-black text-lg uppercase tracking-widest">Verify</h2>
      <div className="w-10"></div>
    </div>

    <div className="w-full max-w-md">
      <div className="bg-gray-100 rounded-3xl p-8 mb-12 flex items-center justify-center aspect-video relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
        <div className="w-24 h-24 bg-tlb-yellow rounded-full flex items-center justify-center shadow-2xl relative z-10">
          <Smartphone size={40} className="text-tlb-dark" />
        </div>
      </div>

      <h1 className="text-4xl font-black text-center mb-4">Secure Verification</h1>
      <p className="text-center text-gray-500 leading-relaxed mb-10">
        We've sent a 6-digit code to your registered mobile number for the <span className="font-bold text-tlb-dark">TLB Partner Portal</span>.
      </p>

      <div className="flex justify-between gap-2 mb-8">
        {[4, 2, '', '', '', ''].map((val, i) => (
          <div key={i} className="w-14 h-16 bg-gray-50 border border-gray-200 rounded-2xl flex items-center justify-center text-2xl font-black">
            {val || <div className="w-1.5 h-1.5 bg-gray-300 rounded-full"></div>}
          </div>
        ))}
      </div>

      <p className="text-center text-gray-400 font-medium mb-12">
        Didn't receive the code? <span className="text-tlb-yellow font-bold">Resend in 00:45</span>
        <br/>
        <button className="text-xs underline mt-2 opacity-50">Change Number?</button>
      </p>

      <button onClick={() => onNavigate('REGISTRATION')} className="tlb-button w-full py-5 shadow-xl shadow-tlb-yellow/20">
        Verify Identity <ChevronRight size={20} />
      </button>

      <p className="mt-12 text-center text-gray-300 text-[10px] font-bold tracking-widest uppercase">
        The Little Broadway — Partner Portal V2.0
      </p>
    </div>
  </div>
);

const X = ({ size }: { size: number }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>;
