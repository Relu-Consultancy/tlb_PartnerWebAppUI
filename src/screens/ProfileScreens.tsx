import React from 'react';
import {
  ArrowLeft,
  UserCircle,
  Camera,
  Instagram,
  Facebook,
  Globe,
  Save,
  Star,
  Plus,
  Mail,
  ArrowUpRight,
  CheckCircle2,
  Eye,
  Image as ImageIcon
} from 'lucide-react';
import { Screen } from '../types';

interface ProfileProps {
  onNavigate: (screen: Screen) => void;
}

export const EditProfile: React.FC<ProfileProps> = ({ onNavigate }) => (
  <div className="min-h-screen bg-gray-50 pb-24">
    <header className="bg-white p-6 flex items-center justify-between sticky top-0 z-30 border-b border-gray-100">
      <button onClick={() => onNavigate('DASHBOARD')} className="p-2 -ml-2"><ArrowLeft size={24} /></button>
      <h1 className="font-black text-lg">Edit Profile</h1>
      <button className="text-tlb-yellow font-black text-sm uppercase tracking-widest">Save</button>
    </header>

    <main className="p-6">
      <div className="tlb-content space-y-8">
        <section className="tlb-card p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-black text-sm uppercase tracking-widest text-gray-400">Completion</h3>
            <span className="text-sm font-black text-tlb-yellow">60%</span>
          </div>
          <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full bg-tlb-yellow w-[60%]"></div>
          </div>
        </section>

        <section className="space-y-6">
          <div className="flex items-center gap-2">
            <div className="bg-tlb-yellow/10 p-2 rounded-lg text-tlb-yellow"><UserCircle size={20} /></div>
            <h3 className="font-black text-xl">Identity</h3>
          </div>
          <div className="space-y-4">
            <div>
              <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 block">Brand Name</label>
              <input className="tlb-input" defaultValue="The Little Broadway" />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 block">About</label>
              <textarea className="tlb-input min-h-[120px]" placeholder="Describe your vision..."></textarea>
            </div>
          </div>
        </section>

        <section className="space-y-6">
          <div className="flex items-center gap-2">
            <div className="bg-tlb-yellow/10 p-2 rounded-lg text-tlb-yellow"><ImageIcon size={20} /></div>
            <h3 className="font-black text-xl">Gallery</h3>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="aspect-square bg-gray-100 rounded-2xl border-2 border-dashed border-gray-200 flex items-center justify-center text-tlb-yellow">
              <Camera size={24} />
            </div>
            <div className="aspect-square rounded-2xl overflow-hidden shadow-sm">
              <img src="https://picsum.photos/seed/gallery1/200/200" alt="Gallery" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            </div>
          </div>
        </section>

        <button onClick={() => onNavigate('DASHBOARD')} className="tlb-button w-full py-3 shadow-lg shadow-tlb-yellow/20">
          <Save size={20} /> Save Profile
        </button>
      </div>
    </main>
  </div>
);

export const PreviewProfile: React.FC<ProfileProps> = ({ onNavigate }) => (
  <div className="min-h-screen bg-[#FDFCF8] pb-24">
    <header className="p-6 flex items-center justify-between sticky top-0 z-30 bg-[#FDFCF8]/80 backdrop-blur-md">
      <button onClick={() => onNavigate('DASHBOARD')} className="p-2 bg-white rounded-full shadow-sm"><ArrowLeft size={24} /></button>
      <h1 className="font-black text-lg">Preview</h1>
      <button className="p-2 bg-white rounded-full shadow-sm"><ArrowUpRight size={24} className="rotate-45" /></button>
    </header>

    <main className="px-6">
      <div className="tlb-content space-y-8">
        <section className="relative pt-24">
          <div className="absolute top-0 left-0 w-full h-48 -mx-6 bg-tlb-dark overflow-hidden">
            <img src="https://picsum.photos/seed/stage/800/400" alt="Stage" className="w-full h-full object-cover opacity-40" referrerPolicy="no-referrer" />
          </div>
          <div className="relative z-10 tlb-card p-6 flex flex-col items-center text-center">
            <div className="w-24 h-24 bg-tlb-yellow rounded-3xl flex items-center justify-center text-tlb-dark font-black text-4xl border-4 border-white shadow-2xl -mt-16 mb-4">
              <img src="https://picsum.photos/seed/logo/100/100" alt="Logo" className="w-full h-full object-cover rounded-2xl" referrerPolicy="no-referrer" />
            </div>
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-black">The Little Broadway</h2>
              <CheckCircle2 size={18} className="text-blue-500 fill-blue-500" />
            </div>
            <p className="text-xs text-gray-400 font-bold mt-1">Verified Partner</p>

            <div className="flex gap-4 w-full mt-8">
              <button className="tlb-button flex-1 py-3 text-sm"><Plus size={18} /> Follow</button>
              <button className="bg-tlb-yellow/10 p-3 rounded-xl text-tlb-dark"><Mail size={20} /></button>
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <h3 className="font-black text-xl">About us</h3>
          <p className="text-gray-500 leading-relaxed text-sm">
            We bring the magic of Broadway to intimate venues across Manhattan. Specializing in off-Broadway showcases and premium theater experiences since 2012.
          </p>
        </section>
      </div>
    </main>
  </div>
);
