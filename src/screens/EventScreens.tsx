import React, { useState } from 'react';
import {
  ArrowLeft,
  Plus,
  Search,
  Filter,
  Calendar,
  MapPin,
  Users,
  ChevronRight,
  Clock,
  Ticket,
  CheckCircle2,
  AlertCircle,
  ImageIcon,
  Save,
  Send,
  MoreHorizontal
} from 'lucide-react';
import { Screen, EventData, TicketTier } from '../types';

interface EventProps {
  onNavigate: (screen: Screen) => void;
}

export const EventListings: React.FC<EventProps> = ({ onNavigate }) => (
  <div className="min-h-screen bg-gray-50 pb-24">
    <header className="bg-white p-6 flex items-center justify-between sticky top-0 z-30 border-b border-gray-100">
      <button onClick={() => onNavigate('DASHBOARD')} className="p-2 -ml-2"><ArrowLeft size={24} /></button>
      <h1 className="font-black text-lg">Event Listings</h1>
      <button onClick={() => onNavigate('CREATE_EVENT_DETAILS')} className="bg-tlb-yellow p-2 rounded-xl text-tlb-dark shadow-lg shadow-tlb-yellow/20">
        <Plus size={24} />
      </button>
    </header>

    <main className="p-6">
      <div className="tlb-content space-y-8">
        <div className="flex gap-4">
          <div className="flex-1 bg-white border border-gray-100 rounded-2xl px-4 py-3 flex items-center gap-3 shadow-sm">
            <Search size={18} className="text-gray-400" />
            <input className="bg-transparent flex-1 text-sm outline-none" placeholder="Search events..." />
          </div>
          <button className="bg-white border border-gray-100 p-3 rounded-2xl text-gray-400 shadow-sm"><Filter size={20} /></button>
        </div>

        <div className="flex gap-4 border-b border-gray-100">
          {['Active', 'Drafts', 'Past'].map((tab, i) => (
            <button key={tab} className={`pb-4 text-xs font-black uppercase tracking-widest ${i === 0 ? 'text-tlb-dark border-b-2 border-tlb-yellow' : 'text-gray-300'}`}>
              {tab}
            </button>
          ))}
        </div>

        <div className="space-y-6">
          {[
            { name: 'Hamilton Workshop', date: 'Oct 28, 2023', status: 'LIVE', tickets: '124/150', img: 'hamilton' },
            { name: 'Youth Drama Class', date: 'Nov 02, 2023', status: 'DRAFT', tickets: '0/20', img: 'drama' }
          ].map((ev, i) => (
            <div key={i} onClick={() => onNavigate('EVENT_DETAILS')} className="tlb-card p-4 flex gap-4 items-center cursor-pointer hover:border-tlb-yellow transition-colors">
              <div className="w-20 h-20 rounded-2xl overflow-hidden shadow-md">
                <img src={`https://picsum.photos/seed/${ev.img}/200/200`} alt={ev.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-[8px] font-black px-1.5 py-0.5 rounded uppercase tracking-widest ${ev.status === 'LIVE' ? 'bg-emerald-50 text-emerald-500' : 'bg-gray-100 text-gray-400'}`}>
                    {ev.status}
                  </span>
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{ev.date}</p>
                </div>
                <h4 className="font-black text-base">{ev.name}</h4>
                <div className="flex items-center gap-3 mt-2">
                  <div className="flex items-center gap-1 text-[10px] font-bold text-gray-400">
                    <Ticket size={12} /> {ev.tickets}
                  </div>
                </div>
              </div>
              <ChevronRight size={20} className="text-gray-300" />
            </div>
          ))}
        </div>
      </div>
    </main>
  </div>
);

export const CreateEventDetails: React.FC<EventProps> = ({ onNavigate }) => (
  <div className="min-h-screen bg-gray-50 pb-24">
    <header className="bg-white p-6 flex items-center justify-between sticky top-0 z-30 border-b border-gray-100">
      <button onClick={() => onNavigate('EVENT_LISTINGS')} className="p-2 -ml-2"><ArrowLeft size={24} /></button>
      <h1 className="font-black text-lg">Event Details</h1>
      <span className="text-xs font-bold text-gray-300 uppercase tracking-widest">Step 1/3</span>
    </header>

    <main className="p-6">
      <div className="tlb-content space-y-8">
        <div className="space-y-6">
          <div className="aspect-video bg-gray-100 rounded-3xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center text-gray-400 gap-2">
            <ImageIcon size={32} />
            <p className="text-xs font-bold uppercase tracking-widest">Upload Cover Image</p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 block">Event Title</label>
              <input className="tlb-input" placeholder="e.g. Broadway Masterclass" />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 block">Category</label>
              <select className="tlb-input appearance-none">
                <option>Musical Theatre</option>
                <option>Drama Workshop</option>
                <option>Dance Class</option>
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 block">Date</label>
                <input type="date" className="tlb-input" />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 block">Time</label>
                <input type="time" className="tlb-input" />
              </div>
            </div>
            <div>
              <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 block">Location</label>
              <div className="relative">
                <MapPin size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                <input className="tlb-input pl-12" placeholder="Search venue..." />
              </div>
            </div>
            <div>
              <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 block">Description</label>
              <textarea className="tlb-input min-h-[150px]" placeholder="What makes this event special?"></textarea>
            </div>
          </div>
        </div>

        <button onClick={() => onNavigate('CREATE_EVENT_TICKETS')} className="tlb-button w-full py-4 shadow-lg shadow-tlb-yellow/20">
          Next: Ticket Setup <ChevronRight size={20} />
        </button>
      </div>
    </main>
  </div>
);

export const CreateEventTickets: React.FC<EventProps> = ({ onNavigate }) => (
  <div className="min-h-screen bg-gray-50 pb-24">
    <header className="bg-white p-6 flex items-center justify-between sticky top-0 z-30 border-b border-gray-100">
      <button onClick={() => onNavigate('CREATE_EVENT_DETAILS')} className="p-2 -ml-2"><ArrowLeft size={24} /></button>
      <h1 className="font-black text-lg">Ticket Setup</h1>
      <span className="text-xs font-bold text-gray-300 uppercase tracking-widest">Step 2/3</span>
    </header>

    <main className="p-6">
      <div className="tlb-content space-y-8">
        <div className="space-y-6">
          <div className="tlb-card p-6 border-tlb-yellow bg-tlb-yellow/5">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h4 className="font-black text-lg">General Admission</h4>
                <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1">Standard Entry</p>
              </div>
              <button className="text-red-500 p-2"><AlertCircle size={20} /></button>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 block">Price ($)</label>
                <input className="tlb-input" defaultValue="45.00" />
              </div>
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 block">Quantity</label>
                <input className="tlb-input" defaultValue="100" />
              </div>
            </div>
          </div>

          <button className="w-full py-4 border-2 border-dashed border-gray-200 rounded-2xl text-gray-400 font-black text-sm uppercase tracking-widest flex items-center justify-center gap-2">
            <Plus size={18} /> Add Ticket Tier
          </button>

          <div className="tlb-card p-6 space-y-4">
            <h4 className="font-black text-sm uppercase tracking-widest">Settings</h4>
            <div className="flex justify-between items-center">
              <span className="text-sm font-bold">Limit per user</span>
              <input className="w-16 tlb-input py-2 text-center" defaultValue="4" />
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-bold">Sales End Date</span>
              <input type="date" className="w-40 tlb-input py-2" />
            </div>
          </div>
        </div>

        <button onClick={() => onNavigate('CREATE_EVENT_REVIEW')} className="tlb-button w-full py-4 shadow-lg shadow-tlb-yellow/20">
          Review Event <ChevronRight size={20} />
        </button>
      </div>
    </main>
  </div>
);

export const CreateEventReview: React.FC<EventProps> = ({ onNavigate }) => (
  <div className="min-h-screen bg-gray-50 pb-24">
    <header className="bg-white p-6 flex items-center justify-between sticky top-0 z-30 border-b border-gray-100">
      <button onClick={() => onNavigate('CREATE_EVENT_TICKETS')} className="p-2 -ml-2"><ArrowLeft size={24} /></button>
      <h1 className="font-black text-lg">Review</h1>
      <span className="text-xs font-bold text-gray-300 uppercase tracking-widest">Step 3/3</span>
    </header>

    <main className="p-6">
      <div className="tlb-content space-y-8">
        <div className="tlb-card p-0 overflow-hidden">
          <div className="h-48 relative">
            <img src="https://picsum.photos/seed/review/800/400" alt="Review" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-6">
              <h2 className="text-white text-2xl font-black">Hamilton Masterclass</h2>
            </div>
          </div>
          <div className="p-6 space-y-6">
            <div className="grid grid-cols-2 gap-6">
              <div className="flex items-center gap-3">
                <div className="bg-gray-50 p-2 rounded-lg text-gray-400"><Calendar size={18} /></div>
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Date</p>
                  <p className="text-sm font-black">Oct 28, 2023</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="bg-gray-50 p-2 rounded-lg text-gray-400"><Clock size={18} /></div>
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Time</p>
                  <p className="text-sm font-black">10:00 AM</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="bg-gray-50 p-2 rounded-lg text-gray-400"><MapPin size={18} /></div>
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Venue</p>
                <p className="text-sm font-black">The Broadway Studio, NYC</p>
              </div>
            </div>
            <div className="pt-6 border-t border-gray-50">
              <h4 className="font-black text-sm uppercase tracking-widest mb-4">Tickets</h4>
              <div className="flex justify-between items-center">
                <p className="text-sm font-bold">General Admission</p>
                <p className="text-sm font-black">$45.00 × 100</p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex gap-4">
          <button onClick={() => onNavigate('EVENT_LISTINGS')} className="flex-1 bg-white border border-gray-100 rounded-2xl py-4 font-black text-sm uppercase tracking-widest text-gray-400">Save Draft</button>
          <button onClick={() => onNavigate('EVENT_REVIEW_STATUS')} className="flex-[2] tlb-button py-4 text-sm shadow-xl shadow-tlb-yellow/20">
            <Send size={18} /> Submit for Review
          </button>
        </div>
      </div>
    </main>
  </div>
);

export const EventReviewStatus: React.FC<EventProps> = ({ onNavigate }) => (
  <div className="min-h-screen bg-tlb-dark flex flex-col items-center justify-center p-8 text-center">
    <div className="w-32 h-32 bg-tlb-yellow/10 rounded-full flex items-center justify-center mb-8 relative">
      <div className="absolute inset-0 border-4 border-tlb-yellow/20 rounded-full border-t-tlb-yellow animate-spin"></div>
      <Clock size={48} className="text-tlb-yellow" />
    </div>
    <h2 className="text-3xl font-black text-white mb-4">Under Review</h2>
    <p className="text-gray-400 leading-relaxed mb-12">
      Our team is reviewing your event details. This usually takes 2-4 hours. You'll be notified once it's live!
    </p>
    <div className="w-full space-y-4 max-w-md">
      <button onClick={() => onNavigate('EVENT_LISTINGS')} className="tlb-button w-full py-4">Back to Listings</button>
      <button onClick={() => onNavigate('DASHBOARD')} className="w-full py-4 text-gray-400 font-black text-sm uppercase tracking-widest">Dashboard</button>
    </div>
  </div>
);

export const EventDetails: React.FC<EventProps> = ({ onNavigate }) => (
  <div className="min-h-screen bg-gray-50 pb-24">
    <header className="bg-white p-6 flex items-center justify-between sticky top-0 z-30 border-b border-gray-100">
      <button onClick={() => onNavigate('EVENT_LISTINGS')} className="p-2 -ml-2"><ArrowLeft size={24} /></button>
      <h1 className="font-black text-lg">Event Details</h1>
      <button className="p-2 text-gray-400"><MoreHorizontal size={24} /></button>
    </header>

    <main className="p-6">
      <div className="tlb-content space-y-8">
        <div className="tlb-card p-0 overflow-hidden">
          <img src="https://picsum.photos/seed/hamilton/800/400" alt="Hamilton" className="w-full h-48 object-cover" referrerPolicy="no-referrer" />
          <div className="p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <span className="bg-emerald-50 text-emerald-500 text-[8px] font-black px-2 py-1 rounded uppercase tracking-widest">Live</span>
                <h2 className="text-2xl font-black mt-2">Hamilton Workshop</h2>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Earnings</p>
                <p className="text-xl font-black text-emerald-500">$5,580</p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 py-6 border-y border-gray-50">
              <div className="text-center">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Sold</p>
                <p className="text-lg font-black">124</p>
              </div>
              <div className="text-center">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Capacity</p>
                <p className="text-lg font-black">150</p>
              </div>
              <div className="text-center">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Views</p>
                <p className="text-lg font-black">1.2k</p>
              </div>
            </div>

            <div className="pt-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className="bg-gray-50 p-2 rounded-lg text-gray-400"><Calendar size={18} /></div>
                <p className="text-sm font-bold">Oct 28, 2023 • 10:00 AM</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="bg-gray-50 p-2 rounded-lg text-gray-400"><MapPin size={18} /></div>
                <p className="text-sm font-bold">The Broadway Studio, NYC</p>
              </div>
            </div>
          </div>
        </div>

        <section className="space-y-4">
          <h3 className="font-black text-xl">Ticket Sales</h3>
          <div className="tlb-card p-6 space-y-6">
            <div className="flex justify-between items-end">
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">General Admission</p>
                <p className="text-sm font-black">124 / 150 sold</p>
              </div>
              <p className="text-lg font-black">$5,580</p>
            </div>
            <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full bg-tlb-yellow w-[82%]"></div>
            </div>
          </div>
        </section>

        <div className="flex gap-4">
          <button className="flex-1 bg-white border border-gray-100 rounded-2xl py-4 font-black text-sm uppercase tracking-widest text-gray-400">Edit Event</button>
          <button className="flex-1 tlb-button py-4 text-sm">Pause Sales</button>
        </div>
      </div>
    </main>
  </div>
);
