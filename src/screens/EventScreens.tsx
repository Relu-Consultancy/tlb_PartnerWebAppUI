import React, { useState } from 'react';
import {
  Menu,
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
  MoreHorizontal,
  Bell,
  Edit2,
  Copy,
  BarChart2
} from 'lucide-react';
import { Screen, EventData, TicketTier } from '../types';

interface EventProps {
  onNavigate: (screen: Screen) => void;
  onOpenSidebar: () => void;
}

export const EventListings: React.FC<EventProps> = ({ onNavigate, onOpenSidebar }) => (
  <div className="min-h-screen bg-[#FDFCF8] pb-12">
    <header className="bg-white p-4 sm:p-6 flex items-center justify-between sticky top-0 z-30 border-b border-gray-100">
      <button onClick={onOpenSidebar} className="p-2 -ml-2"><Menu size={24} /></button>
      <div className="flex flex-col">
        <span className="text-[10px] font-bold text-tlb-yellow uppercase tracking-widest">Partner Portal</span>
        <h1 className="font-black text-xl">My Listings</h1>
      </div>
      <button className="p-2 bg-white rounded-full shadow-sm relative">
        <Bell size={24} />
        <div className="absolute top-2.5 right-2.5 w-2 h-2 bg-red-500 rounded-full border border-white"></div>
      </button>
    </header>

    <main className="px-4 sm:px-6 py-6 border-t border-gray-100 bg-[#F8F9FA]">
      <div className="max-w-lg mx-auto space-y-6">
        {/* Search & Filter */}
        <div className="flex gap-3">
          <div className="flex-1 bg-white border border-gray-100 rounded-2xl px-4 py-3 flex items-center gap-3 shadow-sm">
            <Search size={18} className="text-gray-400" />
            <input className="bg-transparent flex-1 text-sm outline-none" placeholder="Search your listings..." />
          </div>
          <button className="bg-tlb-yellow p-3 rounded-2xl text-tlb-dark shadow-sm"><Filter size={20} /></button>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Advanced Filters</h3>
            <button className="text-[10px] font-bold text-tlb-yellow uppercase tracking-widest">Clear All</button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-xs text-tlb-dark mb-1.5 block">Date Range</label>
              <div className="flex items-center gap-2">
                <input type="text" placeholder="mm/dd/yyyy" className="tlb-input flex-1 bg-[#FDFCF8] border-gray-100 text-xs py-2" />
                <span className="text-gray-300">-</span>
                <input type="text" placeholder="mm/dd/yyyy" className="tlb-input flex-1 bg-[#FDFCF8] border-gray-100 text-xs py-2" />
              </div>
            </div>
            <div className="flex gap-3">
              <div className="flex-1">
                <label className="text-xs text-tlb-dark mb-1.5 block">Category</label>
                <select className="tlb-input w-full bg-[#FDFCF8] border-gray-100 text-xs py-2 text-gray-500 appearance-none">
                  <option>All Categories</option>
                </select>
              </div>
              <div className="flex-1">
                <label className="text-xs text-tlb-dark mb-1.5 block">Status</label>
                <select className="tlb-input w-full bg-[#FDFCF8] border-gray-100 text-xs py-2 text-gray-500 appearance-none">
                  <option>All Statuses</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 scrollbar-hide">
          {['All', 'Active', 'Draft', 'Past'].map((tab, i) => (
            <button key={tab} className={`px-5 py-2 rounded-full text-xs font-bold whitespace-nowrap ${i === 0 ? 'bg-tlb-yellow text-tlb-dark' : 'bg-white border border-gray-200 text-gray-500'}`}>
              {tab}
            </button>
          ))}
        </div>

        {/* Create Listing Button */}
        <button onClick={() => onNavigate('CREATE_EVENT_DETAILS')} className="tlb-button w-full py-4 text-sm shadow-sm flex items-center justify-center gap-2">
          <Plus size={18} /> Create New Listing
        </button>

        {/* Listings */}
        <div className="space-y-6">
          {/* Item 1 - Live */}
          <div className="bg-white rounded-[2rem] overflow-hidden border border-gray-100 shadow-sm">
            <div className="h-40 relative">
              <img src="https://picsum.photos/seed/stage1/800/400" alt="Cover" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              <span className="absolute top-4 right-4 bg-emerald-500 text-white text-[10px] font-black px-2 py-1 rounded">LIVE</span>
            </div>
            <div className="p-5">
              <div className="flex justify-between items-start mb-1">
                <span className="text-[10px] font-bold text-tlb-yellow uppercase tracking-widest">Theater Workshop</span>
                <span className="text-[10px] text-gray-400">Dec 15, 2023</span>
              </div>
              <h4 className="font-black text-lg mb-4 text-tlb-dark">Holiday Broadway Intensive</h4>

              <div className="flex gap-4 mb-5 border-t border-b border-gray-50 py-3 bg-[#FDFCF8] rounded-xl px-4">
                <div className="flex-1 border-r border-gray-100">
                  <p className="text-[8px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">Bookings</p>
                  <p className="font-black text-tlb-dark text-sm">45 / 50 <span className="text-[10px] text-gray-400 font-normal">(90%)</span></p>
                </div>
                <div className="flex-1">
                  <p className="text-[8px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">Revenue</p>
                  <p className="font-black text-tlb-dark text-sm">$2,250</p>
                </div>
              </div>

              <div className="flex justify-between items-center pt-2">
                <div className="flex gap-2">
                  <button className="p-2.5 bg-[#F8F9FA] rounded-xl text-tlb-dark border border-gray-100"><Edit2 size={16} /></button>
                  <button className="p-2.5 bg-[#F8F9FA] rounded-xl text-tlb-dark border border-gray-100"><Copy size={16} /></button>
                  <button className="p-2.5 bg-[#F8F9FA] rounded-xl text-tlb-dark border border-gray-100"><BarChart2 size={16} /></button>
                </div>
                <button onClick={() => onNavigate('EVENT_DETAILS')} className="text-xs font-black text-tlb-yellow uppercase tracking-widest pr-2">View Details</button>
              </div>
            </div>
          </div>

          {/* Item 2 - Draft */}
          <div className="bg-white rounded-[2rem] overflow-hidden border border-gray-100 shadow-sm opacity-80">
            <div className="h-40 relative">
              <img src="https://picsum.photos/seed/guitar/800/400" alt="Cover" className="w-full h-full object-cover grayscale" referrerPolicy="no-referrer" />
              <div className="absolute inset-0 bg-white/40 mix-blend-overlay"></div>
              <span className="absolute top-4 right-4 bg-slate-400 text-white text-[10px] font-black px-2 py-1 rounded">DRAFT</span>
            </div>
            <div className="p-5">
              <div className="flex justify-between items-start mb-1">
                <span className="text-[10px] font-bold text-tlb-yellow uppercase tracking-widest">Music Class</span>
                <span className="text-[10px] text-gray-400">Jan 10, 2024</span>
              </div>
              <h4 className="font-black text-lg mb-4 text-tlb-dark">Beginner Piano for Toddlers</h4>

              <div className="flex gap-4 mb-5 border-t border-b border-gray-50 py-3 bg-[#FDFCF8] rounded-xl px-4">
                <div className="flex-1 border-r border-gray-100">
                  <p className="text-[8px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">Bookings</p>
                  <p className="font-black text-tlb-dark text-sm">0 / 12</p>
                </div>
                <div className="flex-1">
                  <p className="text-[8px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">Status</p>
                  <p className="text-gray-500 italic text-sm">Not Started</p>
                </div>
              </div>

              <div className="flex justify-between items-center pt-2">
                <div className="flex gap-2">
                  <button className="p-2.5 bg-[#F8F9FA] rounded-xl text-tlb-dark border border-gray-100"><Edit2 size={16} /></button>
                  <button className="p-2.5 bg-[#F8F9FA] rounded-xl text-tlb-dark border border-gray-100"><Copy size={16} /></button>
                  <button className="p-2.5 bg-gray-50 rounded-xl text-gray-300 border border-gray-100" disabled><BarChart2 size={16} /></button>
                </div>
                <button className="text-xs font-black text-tlb-yellow uppercase tracking-widest pr-2">Complete Setup</button>
              </div>
            </div>
          </div>

          {/* Item 3 - Sold Out */}
          <div className="bg-white rounded-[2rem] overflow-hidden border border-gray-100 shadow-sm">
            <div className="h-40 relative">
              <img src="https://picsum.photos/seed/dance/800/400" alt="Cover" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              <span className="absolute top-4 right-4 bg-red-500 text-white text-[10px] font-black px-2 py-1 rounded">SOLD OUT</span>
            </div>
            <div className="p-5">
              <div className="flex justify-between items-start mb-1">
                <span className="text-[10px] font-bold text-tlb-yellow uppercase tracking-widest">Dance Program</span>
                <span className="text-[10px] text-gray-400">Every Tue/Thu</span>
              </div>
              <h4 className="font-black text-lg mb-4 text-tlb-dark">Advanced Tap Dance Techniques</h4>

              <div className="flex gap-4 mb-5 border-t border-b border-gray-50 py-3 bg-[#FDFCF8] rounded-xl px-4">
                <div className="flex-1 border-r border-gray-100">
                  <p className="text-[8px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">Bookings</p>
                  <p className="font-black text-tlb-dark text-sm">20 / 20</p>
                </div>
                <div className="flex-1">
                  <p className="text-[8px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">Waitlist</p>
                  <p className="font-black text-tlb-dark text-sm">4</p>
                </div>
              </div>

              <div className="flex justify-between items-center pt-2">
                <div className="flex gap-2">
                  <button className="p-2.5 bg-[#F8F9FA] rounded-xl text-tlb-dark border border-gray-100"><Edit2 size={16} /></button>
                  <button className="p-2.5 bg-[#F8F9FA] rounded-xl text-tlb-dark border border-gray-100"><Copy size={16} /></button>
                  <button className="p-2.5 bg-[#F8F9FA] rounded-xl text-tlb-dark border border-gray-100"><BarChart2 size={16} /></button>
                </div>
                <button onClick={() => onNavigate('EVENT_DETAILS')} className="text-xs font-black text-tlb-yellow uppercase tracking-widest pr-2">View Details</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  </div>
);

export const CreateEventDetails: React.FC<EventProps> = ({ onNavigate, onOpenSidebar }) => (
  <div className="min-h-screen bg-[#FDFCF8] pb-24">
    {/* Header & Stepper */}
    <header className="bg-white p-4 sm:p-6 sticky top-0 z-30 border-b border-gray-100">
      <div className="flex items-center justify-between mb-6">
        <button onClick={() => onNavigate('EVENT_LISTINGS')} className="p-2 -ml-2 rounded-full hover:bg-gray-50"><ArrowLeft size={24} /></button>
        <h1 className="font-black text-lg">Create New Event</h1>
        <div className="w-8"></div> {/* Spacer */}
      </div>

      {/* Stepper */}
      <div className="flex justify-between items-center relative max-w-xs mx-auto px-4">
        <div className="absolute left-[10%] right-[10%] top-4 h-0.5 bg-gray-100 -z-10"></div>
        <div className="absolute left-[10%] right-[50%] top-4 h-0.5 bg-tlb-yellow -z-10"></div>

        <div className="flex flex-col items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-tlb-yellow flex items-center justify-center text-sm font-black text-tlb-dark shadow-sm">1</div>
          <span className="text-[10px] font-bold text-tlb-yellow">Details</span>
        </div>
        <div className="flex flex-col items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-white border-2 border-gray-100 flex items-center justify-center text-sm font-black text-gray-300">2</div>
          <span className="text-[10px] font-bold text-gray-300">Tickets</span>
        </div>
        <div className="flex flex-col items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-white border-2 border-gray-100 flex items-center justify-center text-sm font-black text-gray-300">3</div>
          <span className="text-[10px] font-bold text-gray-300">Publish</span>
        </div>
      </div>
    </header>

    <main className="p-4 sm:p-6 max-w-3xl mx-auto space-y-6">

      {/* Basic Info */}
      <div className="bg-white rounded-[2rem] p-6 border border-gray-100 shadow-sm space-y-6">
        <div className="flex items-center gap-3">
          <div className="bg-tlb-yellow/10 p-2 rounded-xl text-tlb-yellow"><ImageIcon size={20} /></div>
          <h2 className="font-black text-lg">Basic Info</h2>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-xs font-bold text-tlb-dark mb-2 block">Event Name</label>
            <input className="tlb-input bg-[#F8F9FA] border-gray-100 text-sm" placeholder="e.g. The Midnight Masquerade" />
          </div>
          <div>
            <label className="text-xs font-bold text-tlb-dark mb-2 block">Event Banner</label>
            <div className="aspect-[2/1] bg-[#F8F9FA] rounded-[1.5rem] border-2 border-dashed border-gray-200 flex flex-col items-center justify-center text-gray-400 gap-3 cursor-pointer hover:bg-gray-50 transition-colors">
              <ImageIcon size={32} />
              <p className="text-[10px] font-bold">Recommended: 1200 x 675px</p>
            </div>
          </div>
        </div>
      </div>

      {/* Schedule */}
      <div className="bg-white rounded-[2rem] p-6 border border-gray-100 shadow-sm space-y-6">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="bg-tlb-yellow/10 p-2 rounded-xl text-tlb-yellow"><Calendar size={20} /></div>
            <h2 className="font-black text-lg">Schedule</h2>
          </div>
          <div className="bg-[#F8F9FA] flex rounded-lg p-1 border border-gray-100">
            <button className="px-3 py-1 text-[10px] font-black bg-white rounded-md shadow-sm">Single</button>
            <button className="px-3 py-1 text-[10px] font-black text-gray-400">Slots</button>
          </div>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-bold text-gray-400 mb-2 block">Date</label>
              <div className="relative">
                <input type="text" placeholder="mm/dd/yyyy" className="tlb-input bg-[#F8F9FA] border-gray-100 text-sm pr-10" />
                <Calendar size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
              </div>
            </div>
            <div>
              <label className="text-[10px] font-bold text-gray-400 mb-2 block">Time</label>
              <div className="relative">
                <input type="text" placeholder="-- : -- --" className="tlb-input bg-[#F8F9FA] border-gray-100 text-sm pl-10 text-center" />
                <Clock size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
              </div>
            </div>
          </div>

          <button className="w-full py-3 border-2 border-dashed border-gray-200 rounded-2xl text-tlb-dark font-black text-xs flex items-center justify-center gap-2 hover:bg-gray-50 transition-colors">
            <Plus size={16} /> Add Another Slot
          </button>
        </div>
      </div>

      {/* Category & Language */}
      <div className="bg-white rounded-[2rem] p-6 border border-gray-100 shadow-sm space-y-6">
        <div className="flex items-center gap-3">
          <div className="bg-tlb-yellow/10 p-2 rounded-xl text-tlb-yellow flex gap-0.5"><div className="w-1.5 h-1.5 bg-tlb-yellow rounded-full"></div><div className="w-1.5 h-1.5 bg-tlb-yellow rounded-full"></div><div className="w-1.5 h-1.5 bg-tlb-yellow rounded-full"></div></div>
          <h2 className="font-black text-lg">Category & Language</h2>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-[10px] font-bold text-tlb-dark mb-2 block">Event Category</label>
            <select className="tlb-input bg-[#F8F9FA] border-gray-100 text-sm appearance-none">
              <option>Musical Theater</option>
            </select>
          </div>
          <div>
            <label className="text-[10px] font-bold text-tlb-dark mb-2 block">Performance Language(s)</label>
            <div className="flex flex-wrap gap-2">
              {['English', 'Spanish', 'French'].map((lang, i) => (
                <button key={lang} className={`px-4 py-2 rounded-full text-xs font-bold border ${i === 0 ? 'border-tlb-yellow text-tlb-dark bg-tlb-yellow/5' : 'border-gray-200 text-gray-400'}`}>
                  {lang}
                </button>
              ))}
              <button className="px-4 py-2 rounded-full text-xs font-bold border border-gray-200 text-gray-500 uppercase tracking-widest">+ Add</button>
            </div>
          </div>
        </div>
      </div>

      {/* Age Groups */}
      <div className="bg-white rounded-[2rem] p-6 border border-gray-100 shadow-sm space-y-6">
        <div className="flex items-center gap-3">
          <div className="bg-tlb-yellow/10 p-2 rounded-xl text-tlb-yellow"><Users size={20} /></div>
          <h2 className="font-black text-lg">Age Groups</h2>
        </div>

        <div>
          <label className="text-[10px] font-bold text-tlb-dark mb-3 block">Target Audience</label>
          <div className="flex flex-wrap gap-2 mb-2">
            {[
              { label: '0-3', active: true },
              { label: '4-7', active: true },
              { label: '8-12', active: false },
              { label: '13-16', active: false },
              { label: '17-18', active: false },
              { label: '18+ (Parents)', active: false },
            ].map((age) => (
              <button key={age.label} className={`px-4 py-2 rounded-full text-xs font-bold border ${age.active ? 'border-tlb-yellow text-tlb-dark bg-tlb-yellow/5' : 'border-gray-200 text-gray-400'}`}>
                {age.label}
              </button>
            ))}
          </div>
          <p className="text-[10px] text-gray-400 italic">Select all that apply for your production.</p>
        </div>
      </div>

      {/* Location */}
      <div className="bg-white rounded-[2rem] p-6 border border-gray-100 shadow-sm space-y-6">
        <div className="flex items-center gap-3">
          <div className="bg-tlb-yellow/10 p-2 rounded-xl text-tlb-yellow"><MapPin size={20} /></div>
          <h2 className="font-black text-lg">Location</h2>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-[10px] font-bold text-tlb-dark mb-2 block">Venue Address</label>
            <div className="relative">
              <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
              <input className="tlb-input bg-[#F8F9FA] border-gray-100 text-sm pl-11" placeholder="Search for theater or address" />
            </div>
          </div>

          <div className="h-40 bg-[#E9ECEF] rounded-[1.5rem] relative overflow-hidden flex items-center justify-center">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">MAP PREVIEW</span>
            <div className="absolute bottom-3 left-3 bg-white p-2 rounded-xl shadow-sm">
              <p className="font-black text-[10px]">Majestic Theatre</p>
              <p className="text-[8px] text-gray-500">245 W 44th St, New York</p>
            </div>
          </div>
        </div>
      </div>

      {/* Description */}
      <div className="bg-white rounded-[2rem] p-6 border border-gray-100 shadow-sm space-y-6">
        <div className="flex items-center gap-3">
          <div className="bg-tlb-yellow/10 p-2 rounded-xl text-tlb-yellow"><span className="text-xl font-black">☰</span></div>
          <h2 className="font-black text-lg">Description</h2>
        </div>

        <div className="space-y-6">
          <div>
            <label className="text-[10px] font-bold text-tlb-dark mb-2 block">About the Event</label>
            <div className="border border-gray-100 rounded-2xl overflow-hidden bg-[#F8F9FA]">
              <div className="flex gap-4 p-3 border-b border-gray-100 bg-white">
                <button className="font-serif font-bold text-gray-700">B</button>
                <button className="italic font-serif text-gray-700">I</button>
                <button className="text-gray-700">≡</button>
              </div>
              <textarea className="w-full bg-transparent p-4 min-h-[120px] outline-none text-sm resize-y" placeholder="Tell your audience what makes this event special..."></textarea>
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-[10px] font-bold text-tlb-dark">Terms & Conditions</label>
              <button className="text-[8px] font-bold text-tlb-yellow uppercase tracking-widest">TEMPLATES</button>
            </div>
            <textarea className="tlb-input bg-[#F8F9FA] border-gray-100 text-sm min-h-[80px] resize-y" placeholder="Refund policy, age restrictions, etc."></textarea>
          </div>

          <button className="flex items-center gap-2 text-[10px] font-bold text-tlb-yellow uppercase tracking-widest">
            <Plus size={14} /> Add FAQ Section
          </button>
        </div>
      </div>

    </main>

    <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/80 backdrop-blur-md border-t border-gray-100 z-40">
      <div className="max-w-3xl mx-auto">
        <button onClick={() => onNavigate('CREATE_EVENT_TICKETS')} className="w-full bg-tlb-yellow text-tlb-dark font-black py-4 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-tlb-yellow/20">
          Next: Ticket Setup <ArrowLeft size={20} className="rotate-180" />
        </button>
      </div>
    </div>
  </div>
);

export const CreateEventTickets: React.FC<EventProps> = ({ onNavigate, onOpenSidebar }) => (
  <div className="min-h-screen bg-[#FDFCF8] pb-24">
    {/* Header & Stepper */}
    <header className="bg-white p-4 sm:p-6 sticky top-0 z-30 border-b border-gray-100">
      <div className="flex items-center justify-between mb-6">
        <button onClick={() => onNavigate('CREATE_EVENT_DETAILS')} className="p-2 -ml-2 rounded-full hover:bg-gray-50"><ArrowLeft size={24} /></button>
        <div className="flex flex-col items-center">
          <h1 className="font-black text-lg">CREATE EVENT</h1>
          <div className="flex items-center gap-1">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
            <span className="text-[8px] font-bold text-gray-400 uppercase tracking-widest">DRAFT AUTOSAVED 12:45</span>
          </div>
        </div>
        <button className="p-2 -mr-2 text-tlb-dark"><MoreHorizontal size={24} /></button>
      </div>

      {/* Stepper */}
      <div className="flex justify-between items-center relative max-w-xs mx-auto px-4">
        <div className="absolute left-[10%] right-[10%] top-4 h-0.5 bg-gray-100 -z-10"></div>
        <div className="absolute left-[10%] right-[50%] top-4 h-0.5 bg-tlb-yellow -z-10"></div>

        <div className="flex flex-col items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-tlb-yellow flex items-center justify-center text-sm font-black text-tlb-dark shadow-sm"><CheckCircle2 size={16} /></div>
          <span className="text-[10px] font-bold text-tlb-dark">Basics</span>
        </div>
        <div className="flex flex-col items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-tlb-yellow flex items-center justify-center text-sm font-black text-tlb-dark shadow-sm">2</div>
          <span className="text-[10px] font-bold text-tlb-yellow">Tickets</span>
        </div>
        <div className="flex flex-col items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-white border-2 border-gray-100 flex items-center justify-center text-sm font-black text-gray-300">3</div>
          <span className="text-[10px] font-bold text-gray-300">Publish</span>
        </div>
      </div>
    </header>

    <main className="p-4 sm:p-6 max-w-3xl mx-auto space-y-6">

      {/* Ticket Basics */}
      <div className="bg-white rounded-[2rem] p-6 border border-gray-100 shadow-sm space-y-6">
        <div className="flex items-center gap-3">
          <div className="bg-tlb-yellow/10 p-2 rounded-xl text-tlb-yellow"><Ticket size={20} /></div>
          <h2 className="font-black text-lg">Ticket Basics</h2>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 block">TICKET NAME</label>
            <input className="tlb-input bg-[#F8F9FA] border-gray-100 text-sm" defaultValue="Premium Broadway Experience" />
          </div>
          <div>
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 block">DESCRIPTION</label>
            <textarea className="tlb-input bg-[#F8F9FA] border-gray-100 text-sm min-h-[80px] resize-y" defaultValue="Includes backstage tour and welcome drink."></textarea>
          </div>
        </div>
      </div>

      {/* Ticket Quantity */}
      <div className="bg-white rounded-[2rem] p-6 border border-gray-100 shadow-sm space-y-6">
        <div className="flex items-center gap-3">
          <div className="bg-tlb-yellow/10 p-2 rounded-xl text-tlb-yellow"><span className="text-xl font-black">📦</span></div>
          <h2 className="font-black text-lg">Ticket Quantity</h2>
        </div>

        <div className="space-y-6">
          <div className="flex bg-[#F8F9FA] rounded-xl p-1 border border-gray-100">
            <button className="flex-1 py-3 text-xs font-bold text-gray-500 rounded-lg">Unlimited</button>
            <button className="flex-1 py-3 text-xs font-black bg-white shadow-sm rounded-lg text-tlb-dark">Limited</button>
          </div>

          <div>
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 block">TOTAL CAPACITY</label>
            <div className="relative">
              <input className="tlb-input bg-[#F8F9FA] border-gray-100 font-bold" defaultValue="150" />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400">Tickets</span>
            </div>
          </div>
        </div>
      </div>

      {/* Pricing Type */}
      <div className="bg-white rounded-[2rem] p-6 border border-gray-100 shadow-sm space-y-6">
        <div className="flex items-center gap-3">
          <div className="bg-tlb-yellow/10 p-2 rounded-xl text-tlb-yellow"><span className="text-xl font-black">💵</span></div>
          <h2 className="font-black text-lg">Pricing Type</h2>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <button className="flex flex-col items-center justify-center p-4 border border-gray-100 rounded-2xl bg-[#F8F9FA] gap-2">
            <span className="text-xl">🎁</span>
            <span className="text-[10px] font-black uppercase tracking-widest text-tlb-dark">FREE</span>
          </button>
          <button className="flex flex-col items-center justify-center p-4 border border-gray-100 rounded-2xl bg-[#F8F9FA] gap-2">
            <span className="text-xl text-gray-400 font-serif">$</span>
            <span className="text-[10px] font-black uppercase tracking-widest text-tlb-dark">FIXED</span>
          </button>
          <button className="flex flex-col items-center justify-center p-4 border-2 border-tlb-yellow rounded-2xl bg-white shadow-sm gap-2">
            <span className="text-xl text-tlb-yellow pt-1">📚</span>
            <span className="text-[10px] font-black uppercase tracking-widest text-tlb-yellow">MULTIPLE</span>
          </button>
        </div>

        <div className="bg-[#F8F9FA] rounded-2xl border border-gray-100 p-4">
          <div className="grid grid-cols-2 mb-4">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">TIER</span>
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest text-right pr-6">PRICE</span>
          </div>

          <div className="space-y-4 mb-6">
            <div className="flex justify-between items-center bg-white p-3 rounded-xl border border-gray-50 shadow-sm">
              <span className="text-sm font-bold text-tlb-dark">Early Bird</span>
              <div className="flex items-center gap-4">
                <span className="text-sm font-black text-emerald-500">$45.00</span>
                <span className="text-gray-300 font-bold">=</span>
              </div>
            </div>
            <div className="flex justify-between items-center bg-white p-3 rounded-xl border border-tlb-yellow/30 shadow-sm">
              <span className="text-sm font-bold text-tlb-dark">Regular</span>
              <div className="flex items-center gap-4">
                <span className="text-sm font-black text-tlb-dark">$65.00</span>
                <span className="text-gray-300 font-bold">=</span>
              </div>
            </div>
            <div className="flex justify-between items-center bg-white p-3 rounded-xl border border-gray-50 shadow-sm">
              <span className="text-sm font-bold text-tlb-dark">VIP / Gala</span>
              <div className="flex items-center gap-4">
                <span className="text-sm font-black text-tlb-yellow">$120.00</span>
                <span className="text-gray-300 font-bold">=</span>
              </div>
            </div>
          </div>

          <button className="w-full py-3 border-2 border-dashed border-tlb-yellow/30 rounded-xl text-tlb-yellow font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-white transition-colors">
            <Plus size={16} /> Add Pricing Tier
          </button>
        </div>
      </div>

      {/* Discount Setup */}
      <div className="bg-white rounded-[2rem] p-6 border border-gray-100 shadow-sm space-y-6">
        <div className="flex items-center gap-3">
          <div className="bg-tlb-yellow/10 p-2 rounded-xl text-tlb-yellow"><span className="text-xl font-black">🏷️</span></div>
          <h2 className="font-black text-lg">Discount Setup</h2>
        </div>

        <div className="space-y-4">
          <div className="bg-[#F8F9FA] border border-gray-100 rounded-2xl p-4 space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">COUPON CODE</span>
              <div className="w-10 h-5 bg-tlb-yellow rounded-full relative cursor-pointer">
                <div className="w-4 h-4 bg-white rounded-full absolute right-0.5 top-0.5 shadow-sm flex items-center justify-center">
                  <CheckCircle2 size={10} className="text-tlb-yellow" />
                </div>
              </div>
            </div>
            <input className="tlb-input bg-white font-black text-tlb-yellow tracking-widest text-sm" defaultValue="BROADWAY20" />

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-2 block">DISCOUNT</label>
                <div className="relative">
                  <input className="tlb-input bg-white text-sm" defaultValue="20" />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 font-black">%</span>
                </div>
              </div>
              <div>
                <label className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-2 block">MAX USES</label>
                <input className="tlb-input bg-white text-sm" defaultValue="50" />
              </div>
            </div>
          </div>

          <div className="bg-[#F8F9FA] border border-gray-100 rounded-2xl p-4 flex justify-between items-center">
            <div>
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">DIRECT DISCOUNT</span>
              <span className="text-[8px] text-gray-400 italic">Apply discount automatically to all tickets.</span>
            </div>
            <div className="w-10 h-5 bg-gray-200 rounded-full relative cursor-pointer">
              <div className="w-4 h-4 bg-white rounded-full absolute left-0.5 top-0.5 shadow-sm"></div>
            </div>
          </div>
        </div>
      </div>

    </main>

    <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/80 backdrop-blur-md border-t border-gray-100 z-40">
      <div className="max-w-3xl mx-auto flex gap-4">
        <button onClick={() => onNavigate('CREATE_EVENT_DETAILS')} className="bg-white border border-gray-200 px-6 py-4 rounded-xl font-black text-tlb-dark text-sm hover:bg-gray-50">
          Back
        </button>
        <button onClick={() => onNavigate('CREATE_EVENT_REVIEW')} className="flex-1 bg-tlb-yellow text-tlb-dark font-black py-4 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-tlb-yellow/20">
          Next: Review <ArrowLeft size={20} className="rotate-180" />
        </button>
      </div>
    </div>
  </div>
);

export const CreateEventReview: React.FC<EventProps> = ({ onNavigate, onOpenSidebar }) => (
  <div className="min-h-screen bg-[#FDFCF8] pb-24">
    {/* Header & Stepper */}
    <header className="bg-white p-4 sm:p-6 sticky top-0 z-30 border-b border-gray-100">
      <div className="flex items-center justify-between mb-6">
        <button onClick={() => onNavigate('CREATE_EVENT_TICKETS')} className="p-2 -ml-2 rounded-full hover:bg-gray-50"><ArrowLeft size={24} /></button>
        <div className="flex flex-col items-center">
          <h1 className="font-black text-lg">Review & Publish</h1>
          <span className="text-[8px] font-bold text-gray-400 uppercase tracking-widest bg-gray-100 px-2 py-0.5 rounded mt-1">DRAFT</span>
        </div>
        <div className="w-8"></div> {/* Spacer */}
      </div>

      {/* Stepper */}
      <div className="flex justify-between items-center relative max-w-xs mx-auto px-4">
        <div className="absolute left-[10%] right-[10%] top-4 h-0.5 bg-gray-100 -z-10"></div>
        <div className="absolute left-[10%] right-[90%] top-4 h-0.5 bg-tlb-yellow -z-10"></div>

        <div className="flex flex-col items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-tlb-yellow flex items-center justify-center text-sm font-black text-tlb-dark shadow-sm"><CheckCircle2 size={16} /></div>
          <span className="text-[10px] font-bold text-tlb-dark">Details</span>
        </div>
        <div className="flex flex-col items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-tlb-yellow flex items-center justify-center text-sm font-black text-tlb-dark shadow-sm"><CheckCircle2 size={16} /></div>
          <span className="text-[10px] font-bold text-tlb-dark">Tickets</span>
        </div>
        <div className="flex flex-col items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-tlb-yellow flex items-center justify-center text-sm font-black text-tlb-dark shadow-sm">3</div>
          <span className="text-[10px] font-bold text-tlb-dark">Review</span>
        </div>
      </div>
    </header>

    <main className="p-4 sm:p-6 max-w-3xl mx-auto space-y-6">

      {/* Main Preview Card */}
      <div className="bg-white rounded-[2rem] overflow-hidden border border-gray-100 shadow-sm">
        <div className="h-48 relative bg-gray-200">
          <div className="absolute top-4 right-4 bg-black/50 backdrop-blur-md text-white px-3 py-1 font-black text-[10px] uppercase tracking-widest rounded flex items-center gap-1 z-10">
            LIVE PREVIEW
          </div>
          <img src="https://picsum.photos/seed/jazz/1200/600" alt="Preview cover" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
          <div className="absolute inset-0 bg-gradient-to-t from-white via-white/20 to-transparent"></div>
        </div>
        <div className="p-6 relative">
          <div className="flex justify-between items-start mb-4">
            <h2 className="font-black text-2xl text-tlb-dark max-w-[80%]">The Midnight Jazz Spectacle</h2>
            <button className="text-tlb-yellow mt-1"><Edit2 size={20} /></button>
          </div>

          <div className="space-y-4">
            <div className="flex gap-4">
              <Calendar size={20} className="text-tlb-yellow shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-bold text-tlb-dark">Dec 24 - Dec 26, 2023</p>
                <p className="text-[10px] text-gray-500">Multiple Slots Available</p>
              </div>
            </div>
            <div className="flex gap-4">
              <MapPin size={20} className="text-tlb-yellow shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-bold text-tlb-dark">The Royal Majestic Theatre</p>
                <p className="text-[10px] text-gray-500">42nd Street, Manhattan, NY</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Description Section */}
      <div className="bg-white rounded-[2rem] p-6 border border-gray-100 shadow-sm space-y-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="bg-tlb-yellow/20 p-2 rounded-xl text-tlb-dark"><span className="text-lg font-serif italic text-center w-5 h-5 block leading-5">i</span></div>
            <h3 className="font-black text-tlb-dark text-lg">Event Description</h3>
          </div>
          <button className="text-gray-400"><Edit2 size={16} /></button>
        </div>
        <p className="text-sm text-gray-500 leading-relaxed">
          Step into a world of rhythm and soul as we bring you the most anticipated jazz event of the season. Featuring award-winning performers and an immersive stage setup that captures the essence of classic Broadway.
        </p>
      </div>

      {/* Pricing & Capacity Section */}
      <div className="bg-white rounded-[2rem] p-6 border border-gray-100 shadow-sm space-y-6">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="bg-tlb-yellow/10 p-2 rounded-xl text-tlb-dark"><Ticket size={20} /></div>
            <h3 className="font-black text-tlb-dark text-lg">Pricing & Capacity</h3>
          </div>
          <button className="text-gray-400"><Edit2 size={16} /></button>
        </div>

        <div className="rounded-2xl border border-gray-100 overflow-hidden bg-white">
          <div className="grid grid-cols-3 p-4 bg-[#F8F9FA] border-b border-gray-100 text-[10px] font-black text-gray-400 uppercase tracking-widest">
            <div>TIER</div>
            <div>PRICE</div>
            <div>SEATS</div>
          </div>
          <div className="divide-y divide-gray-50 text-sm">
            <div className="grid grid-cols-3 p-4 items-center">
              <div className="font-black text-tlb-dark">VIP Premiere</div>
              <div className="text-gray-500">$120.00</div>
              <div className="text-gray-500">50</div>
            </div>
            <div className="grid grid-cols-3 p-4 items-center">
              <div className="font-black text-tlb-dark">Standard</div>
              <div className="text-gray-500">$75.00</div>
              <div className="text-gray-500">150</div>
            </div>
            <div className="grid grid-cols-3 p-4 items-center bg-[#F8F9FA]">
              <div className="font-black text-tlb-dark">Early Bird</div>
              <div className="text-tlb-yellow font-bold">-$15.00</div>
              <div className="text-gray-400 italic text-[10px]">Promo</div>
            </div>
          </div>
        </div>
      </div>

      <div className="h-6"></div> {/* Bottom scroll padding before fixed footer */}
    </main>

    <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/80 backdrop-blur-md border-t border-gray-100 z-40">
      <div className="max-w-3xl mx-auto space-y-3">
        <div className="grid grid-cols-2 gap-4">
          <button className="py-4 rounded-xl border border-gray-200 bg-white font-black text-sm text-tlb-dark flex items-center justify-center gap-2 shadow-sm hover:bg-gray-50 uppercase tracking-widest"><span className="text-lg">👁️</span> Preview</button>
          <button className="py-4 rounded-xl border border-gray-200 bg-white font-black text-sm text-tlb-dark flex items-center justify-center gap-2 shadow-sm hover:bg-gray-50 uppercase tracking-widest"><Save size={18} /> Save Draft</button>
        </div>
        <button onClick={() => onNavigate('EVENT_REVIEW_STATUS')} className="w-full bg-tlb-yellow text-tlb-dark flex items-center justify-center gap-2 py-5 rounded-xl font-black text-lg shadow-lg shadow-tlb-yellow/20 hover:scale-[1.02] transition-transform">
          Submit for Review <Send size={20} className="ml-1" />
        </button>
      </div>
    </div>
  </div>
);

export const EventReviewStatus: React.FC<EventProps> = ({ onNavigate, onOpenSidebar }) => (
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

export const EventDetails: React.FC<EventProps> = ({ onNavigate, onOpenSidebar }) => (
  <div className="min-h-screen bg-[#FDFCF8] pb-12">
    <header className="bg-white p-4 sm:p-6 flex items-center justify-between sticky top-0 z-30 border-b border-gray-100">
      <div className="flex items-center gap-2 -ml-2">
        <button onClick={() => onNavigate('EVENT_LISTINGS')} className="p-2"><ArrowLeft size={24} /></button>
        <button onClick={onOpenSidebar} className="p-2"><Menu size={24} /></button>
      </div>
      <h1 className="font-black text-lg text-tlb-dark">Event Details</h1>
      <button className="p-2 text-gray-400"><MoreHorizontal size={24} /></button>
    </header>

    <main className="px-4 sm:px-6 py-6 border-t border-gray-100 bg-[#F8F9FA]">
      <div className="max-w-3xl mx-auto space-y-6">

        {/* Main Card */}
        <div className="bg-white rounded-[2rem] overflow-hidden border border-gray-100 shadow-sm">
          <div className="h-56 relative">
            <img src="https://picsum.photos/seed/hamilton/1200/600" alt="Hamilton" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
          </div>

          <div className="p-6 sm:p-8">
            <div className="flex justify-between items-start mb-6">
              <div>
                <span className="inline-block bg-emerald-50 text-emerald-500 text-[10px] font-black px-2 py-0.5 rounded mb-2 uppercase tracking-widest">Live</span>
                <h2 className="font-black text-2xl text-tlb-dark">Hamilton Workshop</h2>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-0.5">Earnings</span>
                <span className="font-black text-xl text-emerald-500">$5,580</span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 mb-8 text-center border-t border-b border-gray-50 py-4">
              <div>
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Sold</span>
                <span className="font-black text-lg text-tlb-dark">124</span>
              </div>
              <div className="border-l border-gray-100">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Capacity</span>
                <span className="font-black text-lg text-tlb-dark">150</span>
              </div>
              <div className="border-l border-gray-100">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Views</span>
                <span className="font-black text-lg text-tlb-dark">1.2k</span>
              </div>
            </div>

            <div className="space-y-4 pt-2">
              <div className="flex items-center gap-3">
                <div className="bg-[#F8F9FA] p-2.5 rounded-xl border border-gray-100 text-gray-400">
                  <Calendar size={18} />
                </div>
                <span className="text-sm font-bold text-tlb-dark">Oct 28, 2023 • 10:00 AM</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="bg-[#F8F9FA] p-2.5 rounded-xl border border-gray-100 text-gray-400">
                  <MapPin size={18} />
                </div>
                <span className="text-sm font-bold text-tlb-dark">The Broadway Studio, NYC</span>
              </div>
            </div>
          </div>
        </div>

        {/* Ticket Sales */}
        <div className="space-y-4 pt-2">
          <h3 className="font-black text-xl">Ticket Sales</h3>

          <div className="bg-white rounded-[2rem] p-6 border border-gray-100 shadow-sm">
            <div className="flex justify-between items-end mb-4">
              <div>
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">General Admission</span>
                <span className="font-black text-sm text-tlb-dark">124 / 150 sold</span>
              </div>
              <span className="font-black text-base text-tlb-dark">$5,580</span>
            </div>

            <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full bg-tlb-yellow rounded-full w-[82%]"></div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-4 pt-6">
          <button className="w-full py-4 text-gray-400 font-bold text-sm bg-white border border-gray-100 rounded-2xl hover:bg-gray-50 uppercase tracking-widest transition-colors">
            Edit Event
          </button>
          <button className="tlb-button w-full py-4 text-sm shadow-md flex items-center justify-center">
            Pause Sales
          </button>
        </div>

      </div>
    </main>
  </div>
);
