import React, { useState } from 'react';
import {
  ArrowLeft,
  Menu,
  Camera,
  Instagram,
  Facebook,
  Link2,
  Save,
  Star,
  UserPlus,
  Mail,
  Share2,
  CheckCircle2,
  Image as ImageIcon,
  ChevronDown,
  MapPin,
  MessageSquare
} from 'lucide-react';
import { Screen } from '../types';

interface ProfileProps {
  onNavigate: (screen: Screen) => void;
  onOpenSidebar: () => void;
}
export const EditProfile: React.FC<ProfileProps> = ({ onNavigate, onOpenSidebar }) => (
  <div className="min-h-screen bg-[#FDFCF8] pb-8">
    <header className="bg-white p-4 sm:p-6 flex items-center justify-between sticky top-0 z-30 border-b border-gray-100">
      <button onClick={() => onNavigate('DASHBOARD')} className="p-2 -ml-2"><ArrowLeft size={24} /></button>
      <h1 className="font-black text-lg">Edit Profile</h1>
      <button className="text-tlb-yellow font-black text-sm uppercase tracking-widest">Save</button>
    </header>

    <main className="px-4 sm:px-6 py-6">
      <div className="max-w-lg mx-auto space-y-8">
        {/* Profile Completion */}
        <section className="bg-white rounded-2xl p-5 border border-gray-100">
          <div className="flex justify-between items-center mb-2">
            <h3 className="font-bold text-sm">Profile Completion</h3>
            <span className="text-sm font-black text-tlb-yellow">60%</span>
          </div>
          <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden mb-2">
            <div className="h-full bg-tlb-yellow rounded-full w-[60%]"></div>
          </div>
          <p className="text-xs text-gray-400">Almost there! Complete your brand identity to go live.</p>
        </section>

        {/* Brand Identity */}
        <section className="space-y-5">
          <div className="flex items-center gap-2">
            <span className="text-xl">🏷️</span>
            <h3 className="font-black text-xl">Brand Identity</h3>
          </div>
          <div>
            <label className="text-sm font-bold text-gray-500 mb-2 block">Brand Name</label>
            <input className="tlb-input w-full" defaultValue="The Little Broadway" />
          </div>
          <div>
            <label className="text-sm font-bold text-gray-500 mb-2 block">About the Partner</label>
            <textarea className="tlb-input w-full min-h-[120px] resize-y" placeholder="Describe your theatre background and vision..."></textarea>
            <p className="text-xs text-gray-300 mt-1">Tell your story. This will be visible on your public partner page.</p>
          </div>
        </section>

        {/* Media Gallery */}
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <span className="text-xl">🖼️</span>
            <h3 className="font-black text-xl">Media Gallery</h3>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-2">
            <div className="w-24 h-24 shrink-0 bg-tlb-yellow/10 rounded-2xl border-2 border-dashed border-tlb-yellow/30 flex items-center justify-center text-tlb-yellow">
              <Camera size={24} />
            </div>
            <div className="w-24 h-24 shrink-0 rounded-2xl overflow-hidden shadow-sm">
              <img src="https://picsum.photos/seed/gallery1/200/200" alt="Gallery" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            </div>
            <div className="w-24 h-24 shrink-0 rounded-2xl overflow-hidden shadow-sm">
              <img src="https://picsum.photos/seed/gallery2/200/200" alt="Gallery" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            </div>
          </div>
        </section>

        {/* Social Media */}
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <span className="text-xl">🔗</span>
            <h3 className="font-black text-xl">Social Media</h3>
          </div>
          <div className="space-y-3">
            <div className="flex items-center gap-3 border border-gray-100 bg-white rounded-2xl px-4 py-3">
              <Link2 size={18} className="text-gray-300" />
              <input className="bg-transparent flex-1 text-sm outline-none" placeholder="Instagram URL" />
            </div>
            <div className="flex items-center gap-3 border border-gray-100 bg-white rounded-2xl px-4 py-3">
              <Link2 size={18} className="text-gray-300" />
              <input className="bg-transparent flex-1 text-sm outline-none" placeholder="Facebook Page" />
            </div>
          </div>
        </section>

        {/* Live Preview */}
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <span className="text-xl">👁️</span>
            <h3 className="font-black text-xl">Live Preview</h3>
          </div>
          <div className="bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm">
            <div className="h-32 relative">
              <img src="https://picsum.photos/seed/curtain/800/300" alt="Cover" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            </div>
            <div className="px-5 pb-5 -mt-6 relative z-10">
              <div className="w-14 h-14 bg-tlb-yellow rounded-xl flex items-center justify-center text-tlb-dark font-black text-lg border-2 border-white shadow-md mb-2">LB</div>
              <h4 className="font-black text-base">The Little Broadway</h4>
              <p className="text-xs text-gray-400">Theatre Partner • New York, NY</p>
              <div className="flex gap-2 mt-3">
                <button className="bg-tlb-yellow text-tlb-dark font-bold text-xs px-5 py-2 rounded-full">Follow</button>
                <button className="bg-gray-100 p-2 rounded-full text-gray-400"><MessageSquare size={14} /></button>
              </div>
            </div>
          </div>
        </section>

        {/* Save Profile Button */}
        <button onClick={() => onNavigate('DASHBOARD')} className="tlb-button w-full py-4 shadow-lg shadow-tlb-yellow/20">
          <Save size={20} /> Save Profile
        </button>
        <p className="text-center text-gray-300 text-[10px] font-bold tracking-widest uppercase">
          TLB Partner Dashboard V2.0
        </p>
      </div>
    </main>
  </div>
);

export const PreviewProfile: React.FC<ProfileProps> = ({ onNavigate, onOpenSidebar }) => {
  const [activeTab, setActiveTab] = useState('Photos');

  return (
    <div className="min-h-screen bg-[#FDFCF8] pb-8">
      <header className="p-4 sm:p-6 flex items-center justify-between sticky top-0 z-30 bg-[#FDFCF8]/80 backdrop-blur-md">
        <button onClick={onOpenSidebar} className="p-2 -ml-2"><Menu size={24} /></button>
        <h1 className="font-black text-lg">TLB Organizer</h1>
        <button className="p-2"><Share2 size={22} /></button>
      </header>

      <main className="px-4 sm:px-6">
        <div className="max-w-lg mx-auto space-y-8">
          {/* Cover + Profile */}
          <section className="relative">
            <div className="h-44 rounded-t-2xl overflow-hidden">
              <img src="https://picsum.photos/seed/curtain/800/400" alt="Cover" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            </div>
            <div className="flex flex-col items-center -mt-12 relative z-10">
              <div className="w-24 h-24 bg-gradient-to-br from-yellow-700 to-yellow-900 rounded-full flex items-center justify-center border-4 border-[#FDFCF8] shadow-xl">
                <img src="https://picsum.photos/seed/logo/100/100" alt="Logo" className="w-16 h-16 rounded-full object-cover" referrerPolicy="no-referrer" />
              </div>
              <h2 className="text-2xl font-black mt-3 text-center">The Little<br />Broadway</h2>
              <p className="text-xs text-gray-400 mt-1 text-center">Verified Broadway Partner • New York</p>

              <div className="flex gap-3 mt-4 w-full max-w-xs">
                <button className="tlb-button flex-1 py-2.5 text-sm gap-2"><UserPlus size={16} /> Follow</button>
                <button className="bg-white border border-gray-200 p-3 rounded-xl text-gray-500 shadow-sm"><Mail size={18} /></button>
              </div>

              <div className="grid grid-cols-3 gap-6 mt-6 w-full max-w-xs text-center">
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Events</p>
                  <p className="text-xl font-black">142</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Followers</p>
                  <p className="text-xl font-black">8.4k</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Rating</p>
                  <p className="text-xl font-black flex items-center justify-center gap-1">4.9 <Star size={14} className="text-tlb-yellow fill-tlb-yellow" /></p>
                </div>
              </div>
            </div>
          </section>

          {/* About */}
          <section>
            <h3 className="font-black text-xl mb-3">About us</h3>
            <p className="text-gray-500 leading-relaxed text-sm">
              We bring the magic of Broadway to intimate venues across Manhattan. Specializing in off-Broadway showcases and premium theater experiences since 2012. Our events feature award-winning casts and exclusive behind-the-scenes access.
            </p>
          </section>

          {/* Media Tabs */}
          <section>
            <div className="flex gap-6 border-b border-gray-100 mb-4">
              {['Photos', 'Videos', 'Press'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`pb-3 text-sm font-bold ${activeTab === tab ? 'text-tlb-dark border-b-2 border-tlb-yellow' : 'text-gray-300'}`}
                >{tab}</button>
              ))}
            </div>
            <div className="grid grid-cols-3 gap-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="aspect-square rounded-xl overflow-hidden">
                  <img src={`https://picsum.photos/seed/media${i}/200/200`} alt={`Media ${i}`} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                </div>
              ))}
            </div>
          </section>

          {/* Upcoming Events */}
          <section>
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-black text-xl">Upcoming Events</h3>
              <button className="text-sm font-bold text-tlb-yellow">View All</button>
            </div>
            <div className="space-y-4">
              {[
                { name: 'The Midnight Cabaret Series', date: 'NOV 24 • 7:30 PM', venue: 'The Spotlight Lounge, NYC', price: '$45.00+', img: 'cabaret' },
                { name: 'Gala Night: Broadway Legends', date: 'DEC 02 • 8:00 PM', venue: 'Lyric Theatre, Manhattan', price: '$120.00+', img: 'gala' }
              ].map((ev, i) => (
                <div key={i} className="bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm">
                  <div className="h-40 relative">
                    <img src={`https://picsum.photos/seed/${ev.img}/600/300`} alt={ev.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    <span className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm text-xs font-bold px-3 py-1 rounded-full text-tlb-dark">{ev.price}</span>
                  </div>
                  <div className="p-4">
                    <p className="text-[10px] font-bold text-tlb-yellow uppercase tracking-widest mb-1">{ev.date}</p>
                    <h4 className="font-black text-base mb-1">{ev.name}</h4>
                    <p className="text-xs text-gray-400 flex items-center gap-1"><MapPin size={12} /> {ev.venue}</p>
                    <button onClick={() => onNavigate('EVENT_DETAILS')} className="mt-3 w-full py-2 border-2 border-tlb-yellow text-tlb-dark rounded-full text-sm font-bold hover:bg-tlb-yellow/10 transition-colors">View Details</button>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* What people say */}
          <section>
            <h3 className="font-black text-xl mb-4">What people say</h3>
            <div className="bg-white rounded-2xl p-5 border border-gray-100">
              <div className="flex items-center justify-between mb-3">
                <div className="flex gap-0.5">
                  {[1, 2, 3, 4, 5].map(s => <Star key={s} size={14} className="text-tlb-yellow fill-tlb-yellow" />)}
                </div>
                <span className="text-xs text-gray-300">2 days ago</span>
              </div>
              <p className="text-sm text-gray-500 italic leading-relaxed">
                "An absolutely magical evening. The organization was flawless and the talent was top-tier Broadway quality."
              </p>
              <p className="text-xs font-bold text-gray-400 mt-3">— Sarah J., Member since 2021</p>
            </div>
          </section>

          {/* Past Events */}
          <section>
            <button className="w-full flex items-center justify-between py-4 border-t border-gray-100">
              <h3 className="font-black text-lg">Past Events (34)</h3>
              <ChevronDown size={20} className="text-gray-400" />
            </button>
          </section>
        </div>
      </main>
    </div>
  );
};
