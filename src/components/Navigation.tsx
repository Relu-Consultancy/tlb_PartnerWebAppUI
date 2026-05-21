import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Home,
  UserCircle,
  CalendarDays,
  Inbox,
  LogOut,
  X,
  Users,
  DollarSign,
  Package,
  BarChart3,
} from 'lucide-react';
import { Screen } from '../types';
import { usePartner } from '../context/PartnerContext';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  currentScreen: Screen;
  onNavigate: (screen: Screen) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose, currentScreen, onNavigate }) => {
  const { allowedEntities } = usePartner();

  // Build dynamic sidebar label for "My Listings"
  const listingsLabel = (() => {
    if (allowedEntities.length === 0) return 'My Listings';
    if (allowedEntities.length === 1) {
      const e = allowedEntities[0];
      if (e === 'Classes') return 'My Services';
      if (e === 'Events') return 'My Events';
      if (e === 'Programs') return 'My Programs';
      if (e === 'Venues') return 'My Venues';
    }
    return 'My Listings';
  })();

  const listingsSub = (() => {
    if (allowedEntities.length === 0) return 'ALL LISTINGS';
    if (allowedEntities.length === 1) {
      const e = allowedEntities[0];
      if (e === 'Classes') return 'CLASSES & BATCHES';
      if (e === 'Events') return 'EVENTS & SHOWS';
      if (e === 'Programs') return 'LONG-TERM PROGRAMS';
      if (e === 'Venues') return 'YOUR SPACES';
    }
    return allowedEntities.slice(0, 2).join(' & ').toUpperCase();
  })();

  const hasClasses = allowedEntities.includes('Classes');
  const hasPrograms = allowedEntities.includes('Programs');

    const menuItems = [
    { id: 'HOME', label: 'Home', icon: Home, sub: 'OVERVIEW & SUMMARY', visible: true },
    { id: 'STATISTICS', label: 'Statistics', icon: BarChart3, sub: 'ANALYTICS & TRENDS', visible: true },
    { id: 'BRAND_PROFILE', label: 'Brand Profile', icon: UserCircle, sub: 'YOUR STOREFRONT', visible: true },
    { id: 'SERVICE_LISTINGS', label: listingsLabel, icon: CalendarDays, sub: listingsSub, visible: true },
    { id: 'ATTENDEES', label: 'Attendees', icon: Users, sub: 'MANAGE GUESTS', visible: true },
    { id: 'ENQUIRIES', label: 'Class Enquiry Management', icon: Inbox, sub: 'CLASS LEAD INBOX', visible: hasClasses },
    { id: 'PROGRAM_ENQUIRIES', label: 'Program Enquiry Management', icon: Inbox, sub: 'PROGRAM CRM', visible: hasPrograms },
    { id: 'PACKAGES', label: 'Packages', icon: Package, sub: 'CREDITS & BILLING', visible: false },
    { id: 'FINANCIAL_HUB', label: 'Pay-outs & Finance', icon: DollarSign, sub: 'EARNINGS & TAX', visible: true },
  ];

  const visibleItems = menuItems.filter(item => item.visible);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 z-40 backdrop-blur-sm"
          />
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed top-0 left-0 bottom-0 w-80 bg-white z-50 flex flex-col p-6"
          >
            <div className="flex justify-between items-center mb-8">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-tlb-yellow">
                  <img loading="lazy" src="https://picsum.photos/seed/partner/100/100" alt="Profile" referrerPolicy="no-referrer" />
                </div>
                <div>
                  <h3 className="font-bold text-lg leading-tight">TLB Partner</h3>
                  <span className="text-[10px] font-bold text-tlb-yellow tracking-widest uppercase">Verified Partner</span>
                </div>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                <X size={24} />
              </button>
            </div>

            <nav className="flex-1 space-y-2">
              {visibleItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    onNavigate(item.id as Screen);
                    onClose();
                  }}
                  className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all ${currentScreen === item.id
                    ? 'bg-tlb-yellow/10 text-tlb-dark border-l-4 border-tlb-yellow'
                    : 'text-gray-500 hover:bg-gray-50'
                    }`}
                >
                  <div className={`p-2 rounded-xl ${currentScreen === item.id ? 'bg-tlb-yellow text-tlb-dark' : 'bg-gray-100 text-gray-400'}`}>
                    <item.icon size={20} />
                  </div>
                  <div className="text-left">
                    <p className="font-bold text-sm leading-none mb-1">{item.label}</p>
                    <p className="text-[10px] font-medium opacity-60 tracking-wider uppercase">{item.sub}</p>
                  </div>
                </button>
              ))}
            </nav>

            <div className="pt-6 border-t border-gray-100">
              <button
                onClick={() => { onClose(); onNavigate('LANDING'); }}
                className="w-full flex items-center gap-4 p-4 text-gray-400 hover:text-red-500 transition-colors"
              >
                <LogOut size={20} />
                <span className="font-bold text-sm uppercase tracking-widest">Sign Out</span>
              </button>
              <p className="text-[10px] text-gray-300 mt-4 text-center">TLB Partner Portal v3.0.0</p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
