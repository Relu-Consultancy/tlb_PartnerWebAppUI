import React from 'react';
import { CheckCircle2, Smartphone, Mail, BarChart3, Shield, Headphones } from 'lucide-react';
import { Screen } from '../../types';

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
