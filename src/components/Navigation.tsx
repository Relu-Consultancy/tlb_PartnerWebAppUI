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
  ChevronRight,
  PanelLeftClose,
} from 'lucide-react';
import { Screen } from '../types';
import { usePartner } from '../context/PartnerContext';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  currentScreen: Screen;
  onNavigate: (screen: Screen) => void;
  desktopOpen?: boolean;
  onToggleDesktop?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose, currentScreen, onNavigate, desktopOpen = true, onToggleDesktop }) => {
  const { allowedEntities } = usePartner();

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

  const hasClasses = allowedEntities.includes('Classes');
  const hasPrograms = allowedEntities.includes('Programs');

  const menuItems = [
    { id: 'HOME', label: 'Dashboard', icon: Home, visible: true },
    { id: 'STATISTICS', label: 'Statistics', icon: BarChart3, visible: true },
    { id: 'BRAND_PROFILE', label: 'Brand Profile', icon: UserCircle, visible: true },
    { id: 'SERVICE_LISTINGS', label: listingsLabel, icon: CalendarDays, visible: true },
    { id: 'ATTENDEES', label: 'Attendees', icon: Users, visible: true },
    { id: 'ENQUIRIES', label: 'Class Enquiries', icon: Inbox, visible: hasClasses },
    { id: 'PROGRAM_ENQUIRIES', label: 'Program Enquiries', icon: Inbox, visible: hasPrograms },
    { id: 'PACKAGES', label: 'Packages', icon: Package, visible: false },
    { id: 'FINANCIAL_HUB', label: 'Finance', icon: DollarSign, visible: true },
  ];

  const visibleItems = menuItems.filter(item => item.visible);

  const handleNav = (screen: Screen) => {
    onNavigate(screen);
    onClose();
  };

  const sidebarContent = (
    <div className="flex flex-col h-full bg-[#0f1729] text-white">
      {/* Logo header */}
      <div className="px-5 py-5 flex items-center justify-between border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-tlb-yellow flex items-center justify-center">
            <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5">
              <path d="M9 12l2 2 4-4" stroke="#0f1729" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              <circle cx="12" cy="12" r="10" stroke="#0f1729" strokeWidth="2" />
            </svg>
          </div>
          <div>
            <h1 className="font-black text-base tracking-tight leading-none">TLB PARTNER</h1>
          </div>
        </div>
        <button onClick={onClose} className="lg:hidden p-1.5 hover:bg-white/10 rounded-lg transition-colors">
          <X size={18} />
        </button>
        {onToggleDesktop && (
          <button onClick={onToggleDesktop} className="hidden lg:flex p-1.5 hover:bg-white/10 rounded-lg transition-colors">
            <PanelLeftClose size={18} />
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        {visibleItems.map((item) => {
          const isActive = currentScreen === item.id;
          return (
            <button
              key={item.id}
              onClick={() => handleNav(item.id as Screen)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all group ${
                isActive
                  ? 'bg-tlb-yellow text-[#0f1729]'
                  : 'text-gray-400 hover:bg-white/5 hover:text-white'
              }`}
            >
              <item.icon size={18} className={isActive ? 'text-[#0f1729]' : 'text-gray-500 group-hover:text-gray-300'} />
              <span className={`text-sm font-semibold flex-1 ${isActive ? 'text-[#0f1729]' : ''}`}>{item.label}</span>
              {isActive && <ChevronRight size={14} className="text-[#0f1729]/50" />}
            </button>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-3 pb-4 pt-2 border-t border-white/10 mt-auto">
        <button
          onClick={() => handleNav('LANDING')}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-gray-500 hover:bg-white/5 hover:text-red-400 transition-all"
        >
          <LogOut size={18} />
          <span className="text-sm font-semibold">Logout</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop: fixed sidebar */}
      {desktopOpen && (
        <aside className="hidden lg:flex fixed top-0 left-0 bottom-0 w-60 z-40">
          {sidebarContent}
        </aside>
      )}

      {/* Mobile: animated drawer */}
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
              className="fixed inset-0 bg-black/50 z-40 backdrop-blur-sm lg:hidden"
            />
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 left-0 bottom-0 w-[280px] z-50 lg:hidden"
            >
              {sidebarContent}
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
};
