import React, { useState } from 'react';
import { ArrowLeft, ArrowRight, Calendar as CalendarIcon, Clock, Plus, Trash2 } from 'lucide-react';
import { Screen } from '../../types';

interface Props { onNavigate: (screen: Screen) => void; }

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export const CreateVenueAvailability: React.FC<Props> = ({ onNavigate }) => {
    // Mock simple calendar selection for UI demonstration
    const [selectedDates, setSelectedDates] = useState<number[]>([21, 23, 24, 25, 26, 27]); 
    const [selectedTimeSlots, setSelectedTimeSlots] = useState<string[]>(['Morning', 'Afternoon', 'Evening']);

    const toggleDate = (day: number) => {
        setSelectedDates(prev => prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]);
    };

    const toggleTimeSlot = (slot: string) => {
        setSelectedTimeSlots(prev => prev.includes(slot) ? prev.filter(s => s !== slot) : [...prev, slot]);
    };

    // Generate mock dates for February for UI consistency with design
    const mockDates = Array.from({ length: 14 }, (_, i) => {
        const d = new Date(2026, 1, 15 + i); // Feb 2026
        return {
            date: d.getDate(),
            dayStr: DAYS[d.getDay()],
            monthStr: MONTHS[d.getMonth()]
        };
    });

    return (
        <div className="min-h-screen bg-gray-50 pb-8">
            <header className="bg-white p-6 flex items-center justify-between sticky top-0 z-30 border-b border-gray-100">
                <button onClick={() => onNavigate('CREATE_VENUE_OCCASIONS')} className="p-2 -ml-2"><ArrowLeft size={24} /></button>
                <div className="text-center">
                    <h1 className="font-black text-lg">Availability</h1>
                    <p className="text-[10px] font-bold text-amber-500 uppercase tracking-widest">Step 3 of 5</p>
                </div>
                <div className="w-10" />
            </header>

            <div className="w-full h-1.5 bg-gray-100">
                <div className="h-full bg-gradient-to-r from-amber-400 to-amber-600 w-[60%] transition-all duration-500 rounded-r-full" />
            </div>

            <main className="p-6">
                <div className="tlb-content space-y-8">
                    <div className="space-y-1">
                        <h2 className="text-2xl font-black">Schedule & Availability</h2>
                        <p className="text-sm text-gray-400">When can users book your venue?</p>
                    </div>

                    {/* Available Dates */}
                    <div>
                        <div className="flex items-center justify-between mb-3">
                            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
                                <CalendarIcon size={14} /> Available Dates
                            </label>
                            <button className="text-xs font-bold text-amber-500 hover:text-amber-700">Select Range</button>
                        </div>
                        
                        {/* Horizontal Scrollable Calendar Strip */}
                        <div className="flex gap-3 overflow-x-auto pb-4 snap-x hide-scrollbar -mx-6 px-6">
                            {mockDates.map((item, idx) => {
                                const isSelected = selectedDates.includes(item.date);
                                return (
                                    <button
                                        key={idx}
                                        onClick={() => toggleDate(item.date)}
                                        className={`snap-center shrink-0 w-[4.5rem] py-3 rounded-2xl border-2 flex flex-col items-center justify-center transition-all ${
                                            isSelected 
                                                ? 'border-amber-400 bg-amber-400 text-white shadow-md' 
                                                : 'border-gray-100 bg-white text-gray-400 hover:border-amber-200 hover:text-amber-500'
                                        }`}
                                    >
                                        <span className={`text-[10px] font-bold uppercase tracking-widest mb-1 ${isSelected ? 'text-amber-900/60' : ''}`}>{item.dayStr}</span>
                                        <span className={`text-xl font-black leading-none ${isSelected ? 'text-white' : 'text-gray-700'}`}>{item.date}</span>
                                        <span className={`text-[10px] font-bold uppercase mt-1 ${isSelected ? 'text-amber-900/60' : ''}`}>{item.monthStr}</span>
                                    </button>
                                );
                            })}
                        </div>
                        <p className="text-xs text-gray-400 mt-1">Tap dates to toggle availability.</p>
                    </div>

                    {/* Time Slots */}
                    <div>
                        <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                            <Clock size={14} /> Available Time Slots
                        </label>
                        <div className="grid grid-cols-3 gap-3">
                            {['Morning', 'Afternoon', 'Evening'].map((slot) => {
                                const isSelected = selectedTimeSlots.includes(slot);
                                return (
                                    <button
                                        key={slot}
                                        onClick={() => toggleTimeSlot(slot)}
                                        className={`py-4 rounded-xl border-2 text-center transition-all ${
                                            isSelected
                                                ? 'border-amber-400 bg-amber-50 text-amber-600'
                                                : 'border-gray-100 bg-white text-gray-400 hover:border-amber-200 hover:text-amber-500'
                                        }`}
                                    >
                                        <span className="text-sm font-bold block">{slot}</span>
                                        <span className="text-[10px] font-semibold opacity-60">
                                            {slot === 'Morning' ? '8 AM - 12 PM' : slot === 'Afternoon' ? '12 PM - 4 PM' : '4 PM - 9 PM'}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Next Button */}
                    <button
                        onClick={() => onNavigate('CREATE_VENUE_PACKAGES')}
                        className="tlb-button w-full py-4 shadow-lg shadow-amber-200 text-base gap-2 bg-gradient-to-r from-amber-500 to-amber-600 text-white hover:from-amber-600 hover:to-amber-700 mt-8"
                    >
                        Next: Packages & Pricing <ArrowRight size={20} />
                    </button>
                </div>
            </main>
        </div>
    );
};
