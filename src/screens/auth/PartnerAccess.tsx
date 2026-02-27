import React, { useState } from 'react';
import { ChevronRight, Smartphone, Mail, ArrowRight, CheckCircle2, BarChart3, ArrowLeft, MapPin, Users, Store } from 'lucide-react';
import { Screen } from '../../types';

interface AuthProps {
    onNavigate: (screen: Screen) => void;
}

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
