import React, { useRef, useState } from 'react';
import { motion } from 'motion/react';
import { ChevronRight, Smartphone, Mail, ArrowRight, CheckCircle2, BarChart3, Shield, Headphones, ArrowLeft, MapPin, Users, Store } from 'lucide-react';
import { Screen } from '../types';

interface AuthProps {
  onNavigate: (screen: Screen) => void;
}

export const Landing: React.FC<AuthProps> = ({ onNavigate }) => (
  <div className="min-h-screen bg-[#FDFCF8] flex flex-col">
    <header className="px-4 sm:px-6 py-4 flex justify-between items-center">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 bg-tlb-dark rounded-lg flex items-center justify-center text-tlb-yellow font-black text-sm">TLB</div>
        <span className="font-bold text-lg tracking-tight">TLB</span>
      </div>
      <button onClick={() => onNavigate('LOGIN')} className="font-bold text-tlb-yellow uppercase tracking-widest text-sm">Login</button>
    </header>

    <main className="flex-1 px-4 sm:px-6 pb-12">
      <div className="max-w-lg mx-auto md:max-w-3xl">
        {/* Hero */}
        <div className="mt-6 mb-10">
          <span className="bg-tlb-yellow/20 text-tlb-yellow px-3 py-1 rounded-full text-[10px] font-bold tracking-widest uppercase">Partner Network</span>
          <h1 className="text-4xl sm:text-5xl font-extrabold mt-4 leading-[1.1]">Your Stage <br /><span className="text-tlb-yellow">Awaits</span></h1>
          <p className="text-gray-500 mt-4 text-base sm:text-lg leading-relaxed">The ultimate partner portal for Broadway events, classes, and venues. Manage your business with sophisticated, elite tools.</p>

          <button onClick={() => onNavigate('PARTNER_ACCESS')} className="tlb-button w-full sm:w-auto mt-8 py-4 sm:px-12 text-base shadow-lg shadow-tlb-yellow/20">
            Get Started
          </button>
          <p className="text-gray-400 text-xs mt-3">Join 500+ premium Broadway partners</p>
        </div>

        {/* Theater Image */}
        <div className="rounded-2xl sm:rounded-3xl overflow-hidden mb-12 shadow-xl">
          <img src="https://picsum.photos/seed/theater/800/450" alt="Theater" className="w-full h-52 sm:h-64 object-cover" referrerPolicy="no-referrer" />
        </div>

        {/* Empowering Broadway */}
        <section className="mb-12">
          <h2 className="text-2xl sm:text-3xl font-black mb-6">Empowering Broadway</h2>
          <div className="space-y-5">
            {[
              { icon: CheckCircle2, title: 'Partner Verification', desc: 'Build immediate trust within the exclusive Broadway community with our elite badge system.' },
              { icon: Smartphone, title: 'Event Management', desc: 'Seamlessly schedule and manage high-profile classes, workshops, and performance events.' },
              { icon: Mail, title: 'Venue Booking', desc: 'Direct access to list and book premium, high-end performance spaces across the district.' }
            ].map((item, i) => (
              <div key={i} className="flex gap-4 items-start">
                <div className="bg-tlb-yellow/10 p-2.5 rounded-xl text-tlb-yellow shrink-0">
                  <item.icon size={22} />
                </div>
                <div>
                  <h3 className="font-bold text-base mb-0.5">{item.title}</h3>
                  <p className="text-gray-500 text-sm leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Partner Benefits */}
        <section className="mb-12">
          <h2 className="text-2xl sm:text-3xl font-black mb-6">Partner Benefits</h2>
          <div className="space-y-5">
            {[
              { icon: BarChart3, title: 'Advanced Analytics', desc: 'Detailed real-time insights into attendance, revenue, and engagement metrics.' },
              { icon: Shield, title: 'Secure Payments', desc: 'Instant, secure financial transactions with integrated end-to-end encryption.' },
              { icon: Headphones, title: 'Priority Support', desc: '24/7 White-glove assistance dedicated to our premium venue and show partners.' }
            ].map((item, i) => (
              <div key={i} className="flex gap-4 items-start">
                <div className="bg-tlb-yellow/10 p-2.5 rounded-xl text-tlb-yellow shrink-0">
                  <item.icon size={22} />
                </div>
                <div>
                  <h3 className="font-bold text-base mb-0.5">{item.title}</h3>
                  <p className="text-gray-500 text-sm leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <div className="bg-tlb-dark rounded-[2rem] sm:rounded-[2.5rem] p-8 sm:p-10 text-center text-white">
          <h2 className="text-2xl sm:text-3xl font-black mb-3">Ready for the Spotlight?</h2>
          <p className="text-gray-400 mb-6 text-sm sm:text-base">Join the network that powers the next generation of Broadway excellence.</p>
          <button onClick={() => onNavigate('PARTNER_ACCESS')} className="tlb-button w-full sm:w-auto py-3 sm:px-12 mx-auto">Apply Now</button>
        </div>
      </div>
    </main>

    <footer className="px-4 sm:px-8 py-10 bg-gray-50 border-t border-gray-100">
      <div className="max-w-lg mx-auto md:max-w-3xl">
        <div className="flex items-center gap-2 mb-6">
          <div className="w-6 h-6 bg-gray-300 rounded flex items-center justify-center text-white font-bold text-[8px]">TLB</div>
          <span className="font-bold text-gray-400 text-sm">The Little Broadway</span>
        </div>
        <div className="grid grid-cols-2 gap-6">
          <div>
            <h4 className="font-bold mb-3 text-sm">Platform</h4>
            <ul className="space-y-1.5 text-gray-400 text-sm">
              <li>Venues</li>
              <li>Events</li>
              <li>Classes</li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold mb-3 text-sm">Company</h4>
            <ul className="space-y-1.5 text-gray-400 text-sm">
              <li>About</li>
              <li>Legal</li>
              <li>Privacy</li>
            </ul>
          </div>
        </div>
        <p className="mt-8 text-center text-gray-300 text-[10px]">© 2024 The Little Broadway. All rights reserved.</p>
      </div>
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

        <button onClick={() => onNavigate('OTP_VERIFY')} className="tlb-button w-full py-4 shadow-lg shadow-tlb-yellow/20">
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

export const OTPVerify: React.FC<AuthProps> = ({ onNavigate }) => {
  const [otp, setOtp] = useState<string[]>(['', '', '', '', '', '']);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const handleChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted) {
      const newOtp = [...otp];
      pasted.split('').forEach((char, i) => { newOtp[i] = char; });
      setOtp(newOtp);
      const focusIndex = Math.min(pasted.length, 5);
      inputRefs.current[focusIndex]?.focus();
    }
  };

  return (
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
          {otp.map((digit, i) => (
            <input
              key={i}
              ref={(el) => { inputRefs.current[i] = el; }}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleChange(i, e.target.value)}
              onKeyDown={(e) => handleKeyDown(i, e)}
              onPaste={i === 0 ? handlePaste : undefined}
              className="w-14 h-16 bg-gray-50 border border-gray-200 rounded-2xl text-center text-2xl font-black focus:outline-none focus:ring-2 focus:ring-tlb-yellow/50 focus:border-tlb-yellow transition-all"
            />
          ))}
        </div>

        <p className="text-center text-gray-400 font-medium mb-12">
          Didn't receive the code? <span className="text-tlb-yellow font-bold">Resend in 00:45</span>
          <br />
          <button className="text-xs underline mt-2 opacity-50">Change Number?</button>
        </p>

        <button onClick={() => onNavigate('DASHBOARD')} className="tlb-button w-full py-4 shadow-lg shadow-tlb-yellow/20">
          Verify Identity <ChevronRight size={20} />
        </button>

        <p className="mt-12 text-center text-gray-300 text-[10px] font-bold tracking-widest uppercase">
          The Little Broadway — Partner Portal V2.0
        </p>
      </div>
    </div>
  );
};

const X = ({ size }: { size: number }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>;

export const PartnerAccess: React.FC<AuthProps> = ({ onNavigate }) => {
  const [selectedCategory, setSelectedCategory] = useState('Events');

  const categories = [
    { name: 'Events', icon: CheckCircle2 },
    { name: 'Classes', icon: BarChart3 },
    { name: 'Programs', icon: Users },
    { name: 'Venues', icon: MapPin }
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white p-4 sm:p-6 flex items-center gap-4 sticky top-0 z-30 border-b border-gray-100">
        <button onClick={() => onNavigate('LANDING')} className="p-2 -ml-2"><ArrowLeft size={24} /></button>
        <h1 className="font-black text-lg">Partner Access</h1>
      </header>

      <main className="flex-1 px-4 sm:px-6 py-6">
        <div className="max-w-lg mx-auto space-y-6">
          {/* Theater Banner */}
          <div className="relative rounded-2xl overflow-hidden h-40">
            <img src="https://picsum.photos/seed/theater/800/450" alt="Theater" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex flex-col justify-end p-5">
              <span className="text-[10px] font-bold text-tlb-yellow uppercase tracking-widest mb-1">Business Portal</span>
              <h2 className="text-white text-xl font-black">The Little Broadway</h2>
            </div>
          </div>

          {/* Welcome */}
          <div>
            <h2 className="text-2xl font-black">Welcome Back</h2>
            <p className="text-gray-400 text-sm mt-1">Log in to manage your theatre business.</p>
          </div>

          {/* Mobile Number */}
          <div>
            <label className="text-sm font-bold text-tlb-dark mb-2 block">Mobile Number</label>
            <div className="relative">
              <input type="tel" placeholder="Enter 10-digit number" className="tlb-input w-full pr-12" />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 bg-tlb-yellow/10 p-1.5 rounded-lg text-tlb-yellow">
                <Smartphone size={18} />
              </div>
            </div>
          </div>

          {/* Divider */}
          <div className="flex items-center gap-3">
            <div className="flex-1 border-t border-gray-200"></div>
            <span className="text-[10px] font-bold text-gray-300 uppercase tracking-[0.2em]">Or login with email</span>
            <div className="flex-1 border-t border-gray-200"></div>
          </div>

          {/* Email */}
          <div>
            <label className="text-sm font-bold text-gray-400 mb-2 block">Email ID <span className="font-normal text-gray-300">(Optional)</span></label>
            <div className="relative">
              <input type="email" placeholder="partner@example.com" className="tlb-input w-full pr-12" />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-300">
                <Mail size={18} />
              </div>
            </div>
          </div>

          {/* Partner Category */}
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-black">Partner Category</h3>
              <span className="text-sm font-bold text-tlb-yellow">Select One</span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {categories.map((cat) => (
                <button
                  key={cat.name}
                  onClick={() => setSelectedCategory(cat.name)}
                  className={`relative p-5 rounded-2xl border-2 flex flex-col items-center gap-2 transition-all ${selectedCategory === cat.name
                      ? 'border-tlb-yellow bg-tlb-yellow/5'
                      : 'border-gray-100 bg-white hover:border-gray-200'
                    }`}
                >
                  {selectedCategory === cat.name && (
                    <div className="absolute top-2 right-2 w-5 h-5 bg-tlb-yellow rounded-full flex items-center justify-center">
                      <CheckCircle2 size={14} className="text-tlb-dark" />
                    </div>
                  )}
                  <div className={`p-2.5 rounded-xl ${selectedCategory === cat.name ? 'bg-tlb-yellow/20 text-tlb-yellow' : 'bg-gray-100 text-gray-400'
                    }`}>
                    <cat.icon size={24} />
                  </div>
                  <span className={`text-sm font-bold ${selectedCategory === cat.name ? 'text-tlb-dark' : 'text-gray-500'
                    }`}>{cat.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Merchandise Shop */}
          <button className="w-full flex items-center gap-4 p-4 bg-white border border-gray-100 rounded-2xl hover:bg-gray-50 transition-colors">
            <div className="bg-gray-100 p-2.5 rounded-xl text-gray-400">
              <Store size={22} />
            </div>
            <div className="text-left flex-1">
              <p className="font-bold text-sm">Merchandise Shop</p>
              <p className="text-xs text-gray-400">Manage inventory & orders</p>
            </div>
            <ChevronRight size={18} className="text-gray-300" />
          </button>

          {/* Continue Button */}
          <button onClick={() => onNavigate('REGISTRATION')} className="tlb-button w-full py-4 shadow-lg shadow-tlb-yellow/20">
            Continue <ArrowRight size={20} />
          </button>
        </div>
      </main>
    </div>
  );
};
