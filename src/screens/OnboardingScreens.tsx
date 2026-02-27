import React from 'react';
import { motion } from 'motion/react';
import {
  CheckCircle2,
  Clock,
  FileText,
  Upload,
  Building2,
  ChevronRight,
  ArrowLeft,
  ArrowRight,
  LayoutGrid,
  PlusCircle,
  Instagram,
  Facebook,
  Globe,
  Video,
  Image as ImageIcon
} from 'lucide-react';
import { Screen } from '../types';

interface OnboardingProps {
  onNavigate: (screen: Screen) => void;
}

export const Registration: React.FC<OnboardingProps> = ({ onNavigate }) => (
  <div className="min-h-screen bg-gray-50 flex flex-col">
    <header className="bg-white p-6 flex items-center justify-between border-b border-gray-100">
      <button onClick={() => onNavigate('OTP_VERIFY')}><ArrowLeft size={24} /></button>
      <h2 className="font-black text-lg">Partner Registration</h2>
      <div className="w-6"></div>
    </header>

    <div className="p-6 flex justify-between relative mb-4">
      <div className="absolute top-1/2 left-0 w-full h-0.5 bg-tlb-yellow/20 -translate-y-1/2 z-0"></div>
      {[
        { n: 1, label: 'Details' },
        { n: 2, label: 'Digital' },
        { n: 3, label: 'Work' },
        { n: 4, label: 'Safety' }
      ].map((s) => (
        <div key={s.n} className="relative z-10 flex flex-col items-center gap-1">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${s.n === 1 ? 'bg-tlb-yellow text-tlb-dark' : 'bg-white border-2 border-tlb-yellow/20 text-gray-300'}`}>
            {s.n}
          </div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">{s.label}</span>
        </div>
      ))}
    </div>

    <main className="flex-1 p-6 pb-24">
      <div className="tlb-content space-y-6">
        <section className="tlb-card space-y-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-tlb-yellow/10 p-2 rounded-lg text-tlb-yellow"><Building2 size={20} /></div>
            <h3 className="font-black text-xl">Business Details</h3>
          </div>
          <div className="space-y-4">
            <div>
              <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 block">Business / Brand Name</label>
              <input className="tlb-input" defaultValue="The Grand Theater" />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 block">Contact Person Name</label>
              <input className="tlb-input" defaultValue="Sarah Bernhardt" />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 block">Email ID</label>
              <div className="relative">
                <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                <input className="tlb-input pl-12" defaultValue="sarah@grandtheater.com" />
              </div>
            </div>
            <div>
              <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 block">City</label>
              <select className="tlb-input appearance-none">
                <option>New York</option>
              </select>
            </div>
          </div>
        </section>

        <section className="tlb-card space-y-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-tlb-yellow/10 p-2 rounded-lg text-tlb-yellow"><Globe size={20} /></div>
            <h3 className="font-black text-xl">Digital Presence</h3>
          </div>
          <br></br>
          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest -mt-4">* At least one field required</p>
          <div className="space-y-4">
            <div className="flex items-center gap-3 bg-gray-50 p-3 rounded-xl border border-gray-100">
              <Instagram size={18} className="text-pink-500" />
              <input className="bg-transparent flex-1 text-sm outline-none" placeholder="Instagram URL" defaultValue="https://instagram.com/thegrandtheater" />
            </div>
            <div className="flex items-center gap-3 bg-gray-50 p-3 rounded-xl border border-gray-100">
              <Facebook size={18} className="text-blue-600" />
              <input className="bg-transparent flex-1 text-sm outline-none" placeholder="https://facebook.com/..." />
            </div>
            <div className="flex items-center gap-3 bg-gray-50 p-3 rounded-xl border border-gray-100">
              <Globe size={18} className="text-tlb-dark" />
              <input className="bg-transparent flex-1 text-sm outline-none" placeholder="https://www.yourbusiness.com" />
            </div>
          </div>
        </section>

        <section className="tlb-card space-y-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-tlb-yellow/10 p-2 rounded-lg text-tlb-yellow"><CheckCircle2 size={20} /></div>
            <h3 className="font-black text-xl">Proof of Work</h3>
          </div>
          <div className="space-y-6">
            <div>
              <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 block">Experience</label>
              <div className="flex gap-2">
                <input className="tlb-input flex-1" placeholder="e.g. 5" />
                <div className="flex bg-gray-100 rounded-xl p-1">
                  <button className="px-4 py-2 bg-white rounded-lg text-xs font-bold shadow-sm">Years</button>
                  <button className="px-4 py-2 text-xs font-bold text-gray-400">Months</button>
                </div>
              </div>
            </div>
            <div>
              <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 block">Upload 3-5 Real Photos</label>
              <div className="border-2 border-dashed border-gray-200 rounded-2xl p-8 flex flex-col items-center justify-center gap-2 bg-gray-50/50">
                <div className="bg-tlb-yellow/10 p-3 rounded-xl text-tlb-yellow"><ImageIcon size={24} /></div>
                <p className="text-sm font-medium"><span className="text-tlb-yellow font-bold">Click to upload</span> or drag and drop</p>
                <p className="text-[10px] text-gray-400 font-bold uppercase">PNG, JPG up to 5MB each</p>
              </div>
            </div>
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest block">Upload Short Video</label>
                <span className="text-[10px] bg-gray-100 text-gray-400 px-2 py-0.5 rounded font-bold uppercase">Optional</span>
              </div>
              <div className="flex items-center gap-4 bg-gray-50 border border-gray-100 p-4 rounded-2xl">
                <div className="bg-gray-200 p-3 rounded-xl text-gray-500"><Video size={20} /></div>
                <div className="flex-1">
                  <p className="text-sm font-bold">Select video file</p>
                  <p className="text-[10px] text-gray-400 font-bold uppercase">MP4, MOV up to 50MB</p>
                </div>
                <button className="text-tlb-yellow font-bold text-sm">Browse</button>
              </div>
            </div>
          </div>
        </section>

        <section className="tlb-card">
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-tlb-yellow/10 p-2 rounded-lg text-tlb-yellow"><FileText size={20} /></div>
            <h3 className="font-black text-xl">Safety Confirmation</h3>
          </div>
          <label className="flex gap-4 items-start bg-tlb-yellow/5 border border-tlb-yellow/20 p-4 rounded-2xl cursor-pointer">
            <input type="checkbox" className="mt-1 w-5 h-5 rounded border-tlb-yellow text-tlb-yellow focus:ring-tlb-yellow" />
            <span className="text-sm font-medium leading-relaxed">I confirm that the information provided is genuine.</span>
          </label>
        </section>

        <button onClick={() => onNavigate('APP_SUBMITTED')} className="tlb-button w-full py-4 shadow-lg shadow-tlb-yellow/20">
          Submit Application <CheckCircle2 size={20} />
        </button>
      </div>
    </main>
  </div>
);

export const AppSubmitted: React.FC<OnboardingProps> = ({ onNavigate }) => (
  <div className="min-h-screen bg-[#FDFCF8] flex flex-col items-center p-6">
    <header className="w-full flex items-center justify-between mb-8">
      <button onClick={() => onNavigate('REGISTRATION')} className="p-2"><ArrowLeft size={24} className="text-tlb-yellow" /></button>
      <h2 className="font-black text-lg">Application Status</h2>
      <div className="w-10"></div>
    </header>

    <div className="w-full max-w-md">
      <div className="rounded-[2.5rem] overflow-hidden mb-10 shadow-2xl relative">
        <img src="https://picsum.photos/seed/theater-curtain/800/600" alt="Theater" className="w-full h-80 object-cover" referrerPolicy="no-referrer" />
        <div className="absolute inset-0 bg-black/20 flex items-end p-8">
          <div className="bg-tlb-yellow text-tlb-dark px-4 py-2 rounded-full flex items-center gap-2 text-xs font-black uppercase tracking-widest shadow-lg">
            <Clock size={14} /> Under Review
          </div>
        </div>
      </div>

      <h1 className="text-4xl font-black text-center mb-4">Application Submitted</h1>
      <p className="text-center text-gray-500 leading-relaxed mb-12 px-4">
        Your application is under review. Please wait 24-48 hours for our team to verify your credentials.
      </p>

      <div className="space-y-0 relative mb-12 px-8">
        <div className="absolute left-[47px] top-4 bottom-4 w-0.5 bg-gray-100"></div>
        {[
          { label: 'Submitted', time: 'Today, 10:24 AM', status: 'done' },
          { label: 'Review in Progress', time: 'Started immediately', status: 'current' },
          { label: 'Final Decision', time: 'Estimated 48h', status: 'pending' }
        ].map((step, i) => (
          <div key={i} className="flex gap-6 items-start py-4 relative z-10">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center shadow-sm ${step.status === 'done' ? 'bg-tlb-yellow text-tlb-dark' :
              step.status === 'current' ? 'bg-white border-2 border-tlb-yellow text-tlb-yellow' :
                'bg-white border-2 border-gray-100 text-gray-200'
              }`}>
              {step.status === 'done' ? <CheckCircle2 size={20} /> : step.status === 'current' ? <Clock size={20} /> : <CheckCircle2 size={20} />}
            </div>
            <div>
              <h4 className={`font-black text-lg ${step.status === 'pending' ? 'text-gray-300' : 'text-tlb-dark'}`}>{step.label}</h4>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-0.5">{step.time}</p>
            </div>
          </div>
        ))}
      </div>

      <button onClick={() => onNavigate('APP_APPROVED')} className="tlb-button w-full py-4 shadow-lg shadow-tlb-yellow/20">
        Back to Home
      </button>

      <button className="w-full mt-8 flex items-center justify-center gap-2 text-tlb-yellow font-bold text-sm">
        <span className="bg-tlb-yellow/10 p-1 rounded">?</span> Contact Support
      </button>
    </div>
  </div>
);

export const AppApproved: React.FC<OnboardingProps> = ({ onNavigate }) => (
  <div className="min-h-screen bg-[#FDFCF8] flex flex-col items-center p-6">
    <header className="w-full flex items-center justify-between mb-8">
      <button onClick={() => onNavigate('APP_SUBMITTED')} className="p-2"><ArrowLeft size={24} className="text-tlb-yellow" /></button>
      <h2 className="font-black text-lg">Application Status</h2>
      <div className="w-10"></div>
    </header>

    <div className="w-full max-w-md">
      <div className="rounded-[2.5rem] overflow-hidden mb-10 shadow-2xl relative">
        <img src="https://picsum.photos/seed/theater-approved/800/600" alt="Theater" className="w-full h-80 object-cover" referrerPolicy="no-referrer" />
        <div className="absolute inset-0 bg-black/20 flex items-end p-8">
          <div className="bg-tlb-yellow text-tlb-dark px-4 py-2 rounded-full flex items-center gap-2 text-xs font-black uppercase tracking-widest shadow-lg">
            <CheckCircle2 size={14} /> Approved
          </div>
        </div>
      </div>

      <h1 className="text-4xl font-black text-center mb-4 font-serif italic">Application Approved!</h1>
      <p className="text-center text-gray-500 leading-relaxed mb-12 px-4">
        Congratulations! Your expertise and brand align perfectly with our vision for The Little Broadway. We are thrilled to have you on board.
      </p>

      <div className="space-y-0 relative mb-12 px-8">
        <div className="absolute left-[47px] top-4 bottom-4 w-0.5 bg-tlb-yellow"></div>
        {[
          { label: 'Submitted', time: 'Oct 24, 10:24 AM', status: 'done' },
          { label: 'Review Completed', time: 'Oct 25, 02:15 PM', status: 'done' },
          { label: 'Final Decision', time: 'Approved Today', status: 'done' }
        ].map((step, i) => (
          <div key={i} className="flex gap-6 items-start py-4 relative z-10">
            <div className="w-10 h-10 rounded-full flex items-center justify-center shadow-sm bg-tlb-yellow text-tlb-dark">
              <CheckCircle2 size={20} />
            </div>
            <div>
              <h4 className="font-black text-lg">{step.label}</h4>
              <p className="text-xs font-bold text-tlb-yellow uppercase tracking-widest mt-0.5">{step.time}</p>
            </div>
          </div>
        ))}
      </div>

      <button onClick={() => onNavigate('AGREEMENT_SUBMIT')} className="tlb-button w-full py-4 shadow-lg shadow-tlb-yellow/20">
        Proceed to Submit Agreement <ChevronRight size={20} />
      </button>

      <button className="w-full mt-8 flex items-center justify-center gap-2 text-gray-400 font-bold text-sm">
        <LayoutGrid size={18} /> Back to Dashboard
      </button>

      <button className="w-full mt-4 flex items-center justify-center gap-2 text-tlb-yellow font-bold text-sm">
        <span className="bg-tlb-yellow/10 p-1 rounded">?</span> Contact Support
      </button>
    </div>
  </div>
);

export const AgreementSubmit: React.FC<OnboardingProps> = ({ onNavigate }) => (
  <div className="min-h-screen bg-gray-50 flex flex-col items-center p-6">
    <header className="w-full flex items-center justify-between mb-8">
      <button onClick={() => onNavigate('APP_APPROVED')} className="p-2"><ArrowLeft size={24} /></button>
      <h2 className="font-black text-lg">TLB Partner</h2>
      <div className="w-10"></div>
    </header>

    <div className="w-full max-w-md bg-white rounded-[2.5rem] p-8 shadow-xl">
      <div className="flex flex-col items-center mb-8">
        <div className="w-20 h-20 bg-tlb-yellow/10 rounded-full flex items-center justify-center mb-6">
          <FileText size={32} className="text-tlb-yellow" />
        </div>
        <h1 className="text-3xl font-black text-center">Agreement Submission</h1>
        <p className="text-center text-gray-400 mt-4 leading-relaxed">
          Upload the signed agreement between TLB and the Partner to complete your verification process.
        </p>
      </div>

      <div className="border-2 border-dashed border-tlb-yellow/30 rounded-3xl p-10 flex flex-col items-center justify-center gap-4 bg-tlb-yellow/5 mb-6">
        <div className="bg-tlb-yellow p-3 rounded-xl text-tlb-dark shadow-lg shadow-tlb-yellow/20">
          <Upload size={24} />
        </div>
        <div className="text-center">
          <p className="font-black text-lg">Upload Signed Agreement</p>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">PDF format only (Max 10MB)</p>
        </div>
        <button className="mt-2 px-8 py-3 bg-white border border-gray-200 rounded-xl font-bold text-sm shadow-sm">Select File</button>
      </div>

      <div className="bg-gray-50 border border-gray-100 p-4 rounded-2xl flex items-center gap-4 mb-8">
        <div className="bg-red-50 p-3 rounded-xl text-red-500"><FileText size={24} /></div>
        <div className="flex-1">
          <p className="text-sm font-bold truncate">partnership_agreement_2...</p>
          <p className="text-[10px] font-bold text-gray-400 uppercase">2.4 MB</p>
        </div>
        <button className="text-gray-300 hover:text-red-500"><X size={20} /></button>
      </div>

      <button onClick={() => onNavigate('BANK_SETUP')} className="tlb-button w-full py-4 shadow-lg shadow-tlb-yellow/20">
        Submit Document
      </button>

      <div className="mt-6 flex items-center justify-center gap-2 text-gray-400 text-xs font-bold uppercase tracking-widest italic animate-pulse">
        <div className="w-4 h-4 border-2 border-gray-200 border-t-tlb-yellow rounded-full animate-spin"></div>
        Verification in progress
      </div>
    </div>

    <p className="mt-12 text-center text-gray-400 font-medium">
      Need help? <button className="text-tlb-yellow font-bold underline">Contact TLB Support</button>
    </p>
  </div>
);

export const BankSetup: React.FC<OnboardingProps> = ({ onNavigate }) => (
  <div className="min-h-screen bg-gray-50 flex flex-col">
    <header className="bg-white p-6 flex items-center justify-between border-b border-gray-100">
      <button onClick={() => onNavigate('AGREEMENT_SUBMIT')}><ArrowLeft size={24} /></button>
      <h2 className="font-black text-lg">Payout Settings</h2>
      <div className="p-2 bg-gray-100 rounded-lg"><LayoutGrid size={20} className="text-gray-400" /></div>
    </header>

    <main className="p-6">
      <div className="tlb-content space-y-8">
        <div>
          <div className="flex items-center gap-2 text-[10px] font-black text-tlb-yellow uppercase tracking-widest mb-2">
            <CheckCircle2 size={12} /> Secure Channel
          </div>
          <h1 className="text-4xl font-black">Add Bank Account</h1>
          <p className="text-gray-400 mt-2 font-medium">Funds are settled within 24 hours of performance.</p>
        </div>

        <section className="tlb-card space-y-6">
          <div className="space-y-4">
            <div>
              <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 block">Account Holder Name</label>
              <input className="tlb-input" defaultValue="Julian Alexander Reed" />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 block">Bank Account Number</label>
              <input className="tlb-input" type="password" defaultValue="............" />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 block">IFSC Code</label>
              <div className="relative">
                <input className="tlb-input border-tlb-yellow pr-12" defaultValue="TLBNK0001234" />
                <CheckCircle2 size={20} className="absolute right-4 top-1/2 -translate-y-1/2 text-emerald-500" />
              </div>
              <p className="text-[10px] text-emerald-500 font-bold mt-2">Verified: Broadway Central Bank, New York Branch</p>
            </div>
          </div>

          <div className="border-2 border-dashed border-gray-100 rounded-2xl p-8 flex flex-col items-center justify-center gap-4 bg-gray-50/50">
            <div className="bg-gray-200 p-3 rounded-xl text-gray-400"><Upload size={24} /></div>
            <div className="text-center">
              <p className="font-bold">Verification Document</p>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">Upload a cancelled cheque or bank statement (PDF/JPG)</p>
            </div>
            <button className="px-8 py-2 border border-tlb-yellow text-tlb-yellow rounded-xl font-bold text-sm">Select File</button>

            <div className="w-full bg-white border border-gray-100 p-3 rounded-xl flex items-center gap-3">
              <div className="bg-tlb-yellow/10 p-2 rounded-lg text-tlb-yellow"><ImageIcon size={18} /></div>
              <div className="flex-1">
                <p className="text-xs font-bold">bank_statement_2024.pdf</p>
                <p className="text-[10px] text-gray-400 font-bold uppercase">1.2 MB • Ready</p>
              </div>
              <button className="text-gray-300"><X size={16} /></button>
            </div>
          </div>

          <button onClick={() => onNavigate('ONBOARDING_COMPLETE')} className="tlb-button w-full py-4 shadow-lg shadow-tlb-yellow/20">
            Link Payout Account
          </button>

          <p className="text-center text-[10px] text-gray-300 font-bold uppercase tracking-widest flex items-center justify-center gap-2">
            <LayoutGrid size={12} /> AES-256 Bit Encrypted Storage
          </p>
        </section>

        <section className="space-y-4">
          <h3 className="font-black text-xl">Saved Accounts</h3>
          <div className="tlb-card p-4 border-t-4 border-t-tlb-yellow">
            <div className="flex justify-between items-start mb-4">
              <div className="flex gap-4">
                <div className="w-12 h-12 bg-tlb-yellow/10 rounded-xl flex items-center justify-center text-tlb-yellow">
                  <Building2 size={24} />
                </div>
                <div>
                  <h4 className="font-bold">Chase Manhattan</h4>
                  <p className="text-xs text-gray-400 font-bold tracking-widest">•••• •••• 8821</p>
                </div>
              </div>
              <span className="bg-tlb-yellow text-tlb-dark text-[10px] font-black px-2 py-1 rounded uppercase tracking-widest">Default</span>
            </div>
            <div className="flex justify-between items-center pt-4 border-t border-gray-50">
              <div className="flex items-center gap-2 text-emerald-500 text-[10px] font-black uppercase tracking-widest">
                <CheckCircle2 size={12} /> Verified
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Active</span>
                <div className="w-10 h-5 bg-tlb-yellow rounded-full relative">
                  <div className="absolute right-1 top-1 w-3 h-3 bg-white rounded-full"></div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  </div>
);

export const OnboardingComplete: React.FC<OnboardingProps> = ({ onNavigate }) => (
  <div className="min-h-screen bg-white flex flex-col">
    <header className="p-6 flex justify-between items-center">
      <button onClick={() => onNavigate('BANK_SETUP')}><X size={24} /></button>
      <h2 className="font-black text-lg">Onboarding Complete</h2>
      <div className="w-6"></div>
    </header>

    <main className="flex-1 p-6">
      <div className="tlb-content">
        <div className="bg-tlb-dark rounded-[2.5rem] p-10 text-center text-white relative overflow-hidden mb-12">
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-tlb-yellow/20 to-transparent opacity-50"></div>
          <div className="relative z-10 flex flex-col items-center">
            <div className="bg-tlb-yellow text-tlb-dark px-4 py-2 rounded-full flex items-center gap-2 text-[10px] font-black uppercase tracking-widest mb-8 shadow-lg">
              <CheckCircle2 size={14} /> Verified Partner
            </div>

            <div className="w-32 h-32 rounded-full border-4 border-tlb-yellow p-1 mb-8 shadow-2xl shadow-tlb-yellow/20">
              <div className="w-full h-full rounded-full overflow-hidden relative">
                <img src="https://picsum.photos/seed/spotlight/200/200" alt="Spotlight" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
              </div>
            </div>

            <h1 className="text-4xl font-black mb-4 font-serif italic">Welcome to the Spotlight!</h1>
            <p className="text-gray-400 leading-relaxed max-w-xs mx-auto">
              Your journey with The Little Broadway officially begins now. Your profile is live and ready to reach your audience.
            </p>
          </div>
        </div>

        <h3 className="font-black text-xl mb-6">Next Steps</h3>
        <div className="space-y-4">
          {[
            { icon: PlusCircle, title: 'Create Your First Event', desc: 'Launch your show to the TLB community', screen: 'CREATE_EVENT_DETAILS' },
            { icon: UserCircle, title: 'Complete Your Profile', desc: 'Add photos and social media links', screen: 'EDIT_PROFILE' },
            { icon: BarChart3, title: 'Explore Dashboard', desc: 'View performance and ticket sales', screen: 'DASHBOARD' }
          ].map((item, i) => (
            <button
              key={i}
              onClick={() => onNavigate(item.screen as Screen)}
              className="w-full tlb-card p-4 flex items-center gap-4 text-left hover:border-tlb-yellow transition-colors group"
            >
              <div className="bg-tlb-yellow/10 p-3 rounded-xl text-tlb-yellow group-hover:bg-tlb-yellow group-hover:text-tlb-dark transition-colors">
                <item.icon size={24} />
              </div>
              <div className="flex-1">
                <h4 className="font-bold">{item.title}</h4>
                <p className="text-xs text-gray-400 font-medium">{item.desc}</p>
              </div>
              <ChevronRight size={20} className="text-gray-300" />
            </button>
          ))}
        </div>

        <button onClick={() => onNavigate('DASHBOARD')} className="tlb-button w-full py-4 mt-12 shadow-lg shadow-tlb-yellow/20">
          Go to My Dashboard <ArrowRight size={20} />
        </button>
      </div>
    </main>
  </div>
);

const X = ({ size }: { size: number }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>;
const Mail = ({ size, className }: { size: number, className?: string }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"></path><rect width="20" height="16" x="2" y="4" rx="2"></rect></svg>;
const UserCircle = ({ size }: { size: number }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><circle cx="12" cy="10" r="3"></circle><path d="M7 20.662V19a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v1.662"></path></svg>;
const BarChart3 = ({ size }: { size: number }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v18h18"></path><path d="M18 17V9"></path><path d="M13 17V5"></path><path d="M8 17v-3"></path></svg>;
