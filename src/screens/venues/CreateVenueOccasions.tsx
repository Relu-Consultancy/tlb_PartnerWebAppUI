import React, { useState } from 'react';
import { ArrowLeft, ArrowRight, Users, Sparkles, CheckSquare, Square } from 'lucide-react';
import { Screen, VenueOccasion } from '../../types';

interface Props { onNavigate: (screen: Screen) => void; }

const OCCASIONS: VenueOccasion[] = ['Birthday', 'Playdate', 'Celebration', 'Workshop', 'Meetup', 'Showcase'];
const ATTENDEE_FIELDS = ['Child Name', 'Child Age', 'Parent Name', 'Contact Number', 'Email ID'];

export const CreateVenueOccasions: React.FC<Props> = ({ onNavigate }) => {
    const [selectedOccasions, setSelectedOccasions] = useState<VenueOccasion[]>(['Birthday']);
    const [minKids, setMinKids] = useState('10');
    const [maxKids, setMaxKids] = useState('50');
    const [requiredFields, setRequiredFields] = useState<string[]>(['Child Name', 'Contact Number']);

    const toggleOccasion = (occ: VenueOccasion) => {
        setSelectedOccasions(prev => prev.includes(occ) ? prev.filter(o => o !== occ) : [...prev, occ]);
    };

    const toggleField = (field: string) => {
        setRequiredFields(prev => prev.includes(field) ? prev.filter(f => f !== field) : [...prev, field]);
    };

    return (
        <div className="min-h-screen bg-gray-50 pb-8">
            <header className="bg-white p-6 flex items-center justify-between sticky top-0 z-30 border-b border-gray-100">
                <button onClick={() => onNavigate('CREATE_VENUE_DETAILS')} className="p-2 -ml-2"><ArrowLeft size={24} /></button>
                <div className="text-center">
                    <h1 className="font-black text-lg">Configuration</h1>
                    <p className="text-[10px] font-bold text-amber-500 uppercase tracking-widest">Step 2 of 5</p>
                </div>
                <div className="w-10" />
            </header>

            <div className="w-full h-1.5 bg-gray-100">
                <div className="h-full bg-gradient-to-r from-amber-400 to-amber-600 w-[40%] transition-all duration-500 rounded-r-full" />
            </div>

            <main className="p-6">
                <div className="tlb-content space-y-8">
                    <div className="space-y-1">
                        <h2 className="text-2xl font-black">Occasions & Capacity</h2>
                        <p className="text-sm text-gray-400">What types of events do you host?</p>
                    </div>

                    {/* Supported Occasions */}
                    <div>
                        <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 block">Supported Occasions</label>
                        <div className="grid grid-cols-2 gap-3">
                            {OCCASIONS.map((occ) => (
                                <button
                                    key={occ}
                                    onClick={() => toggleOccasion(occ)}
                                    className={`p-4 rounded-2xl border-2 flex items-center gap-3 transition-all ${
                                        selectedOccasions.includes(occ)
                                            ? 'border-amber-400 bg-amber-50'
                                            : 'border-gray-100 bg-white hover:border-amber-200'
                                    }`}
                                >
                                    <div className={selectedOccasions.includes(occ) ? 'text-amber-500' : 'text-gray-300'}>
                                        {selectedOccasions.includes(occ) ? <CheckSquare size={20} /> : <Square size={20} />}
                                    </div>
                                    <span className={`text-sm font-bold ${selectedOccasions.includes(occ) ? 'text-amber-900' : 'text-gray-600'}`}>
                                        {occ}
                                    </span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Capacity */}
                    <div>
                        <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 block">Guest Capacity (Number of Kids/People)</label>
                        <div className="flex items-center gap-4">
                            <div className="flex-1 relative">
                                <label className="absolute -top-2 left-3 bg-white px-1 text-[10px] font-bold text-gray-400 uppercase">Min</label>
                                <div className="flex items-center bg-white border border-gray-200 rounded-2xl overflow-hidden focus-within:border-amber-400 focus-within:ring-2 focus-within:ring-amber-400/20">
                                    <div className="pl-4 text-gray-400"><Users size={16} /></div>
                                    <input 
                                        type="number" 
                                        className="w-full p-4 pl-2 outline-none text-sm font-bold text-gray-700" 
                                        value={minKids} 
                                        onChange={(e) => setMinKids(e.target.value)} 
                                    />
                                </div>
                            </div>
                            <span className="text-gray-400 font-bold">-</span>
                            <div className="flex-1 relative">
                                <label className="absolute -top-2 left-3 bg-white px-1 text-[10px] font-bold text-gray-400 uppercase">Max</label>
                                <div className="flex items-center bg-white border border-gray-200 rounded-2xl overflow-hidden focus-within:border-amber-400 focus-within:ring-2 focus-within:ring-amber-400/20">
                                    <div className="pl-4 text-gray-400"><Users size={16} /></div>
                                    <input 
                                        type="number" 
                                        className="w-full p-4 pl-2 outline-none text-sm font-bold text-gray-700" 
                                        value={maxKids} 
                                        onChange={(e) => setMaxKids(e.target.value)} 
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Required Attendee Info */}
                    <div>
                        <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 block">Require from user at Checkout</label>
                        <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
                            {ATTENDEE_FIELDS.map((field, idx) => (
                                <button
                                    key={field}
                                    onClick={() => toggleField(field)}
                                    className={`w-full flex items-center justify-between p-4 transition-colors ${
                                        idx !== ATTENDEE_FIELDS.length - 1 ? 'border-b border-gray-50' : ''
                                    } hover:bg-gray-50`}
                                >
                                    <span className="text-sm font-semibold text-gray-700">{field}</span>
                                    <div className={`w-12 h-6 rounded-full p-1 transition-colors ${
                                        requiredFields.includes(field) ? 'bg-amber-400' : 'bg-gray-200'
                                    }`}>
                                        <div className={`w-4 h-4 bg-white rounded-full transition-transform ${
                                            requiredFields.includes(field) ? 'translate-x-6' : 'translate-x-0'
                                        }`} />
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Next Button */}
                    <button
                        onClick={() => onNavigate('CREATE_VENUE_AVAILABILITY')}
                        className="tlb-button w-full py-4 shadow-lg shadow-amber-200 text-base gap-2 bg-gradient-to-r from-amber-500 to-amber-600 text-white hover:from-amber-600 hover:to-amber-700 mt-4"
                    >
                        Next: Availability <ArrowRight size={20} />
                    </button>
                </div>
            </main>
        </div>
    );
};
