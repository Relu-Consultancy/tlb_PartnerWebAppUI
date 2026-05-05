import React, { useState } from 'react';
import { ArrowLeft, ArrowRight, Calendar, Clock, DollarSign, Users, Plus, Trash2, Tag } from 'lucide-react';
import { Screen, PricingType } from '../../types';
import { WizardLayout, WizardNavigation } from '../../components/ui';

interface Props { onNavigate: (screen: Screen) => void; onOpenSidebar: () => void; }

interface TicketDraft {
    id: number;
    name: string;
    price: string;
    quantity: string;
    description: string;
}

export const CreateEventSchedule: React.FC<Props> = ({ onNavigate }) => {
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [startTime, setStartTime] = useState('');
    const [endTime, setEndTime] = useState('');
    const [pricingType, setPricingType] = useState<PricingType>('Free');
    const [tickets, setTickets] = useState<TicketDraft[]>([
        { id: 1, name: 'General Admission', price: '', quantity: '50', description: '' }
    ]);
    const [seatsAvailable, setSeatsAvailable] = useState('100');
    const [deadline, setDeadline] = useState('');

    const addTicket = () => setTickets(prev => [...prev, { id: Date.now(), name: '', price: '', quantity: '', description: '' }]);
    const removeTicket = (id: number) => { if (tickets.length > 1) setTickets(prev => prev.filter(t => t.id !== id)); };
    const updateTicket = (id: number, field: keyof TicketDraft, value: string) => {
        setTickets(prev => prev.map(t => t.id === id ? { ...t, [field]: value } : t));
    };

    return (
        <WizardLayout
            title="New Event"
            stepText="Step 2 of 4"
            subtitle="Schedule & Pricing"
            progressPercentage={50}
            themeColor="purple"
            onBack={() => onNavigate('CREATE_EVENT_DETAILS')}
        >
            <div className="space-y-1">
                <h2 className="text-2xl font-black">Schedule & Pricing</h2>
                <p className="text-sm text-gray-400">When does your event happen and how much does it cost?</p>
            </div>

                    {/* Date Range */}
                    <div>
                        <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                            <Calendar size={12} /> Event Dates
                        </label>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="text-[10px] font-bold text-gray-300 uppercase tracking-widest mb-1 block">Start Date</label>
                                <input type="date" className="tlb-input w-full" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-gray-300 uppercase tracking-widest mb-1 block">End Date</label>
                                <input type="date" className="tlb-input w-full" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
                            </div>
                        </div>
                    </div>

                    {/* Time Range */}
                    <div>
                        <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                            <Clock size={12} /> Event Time
                        </label>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="text-[10px] font-bold text-gray-300 uppercase tracking-widest mb-1 block">Start Time</label>
                                <input type="time" className="tlb-input w-full" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-gray-300 uppercase tracking-widest mb-1 block">End Time</label>
                                <input type="time" className="tlb-input w-full" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
                            </div>
                        </div>
                    </div>

                    {/* Pricing Toggle */}
                    <div>
                        <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                            <DollarSign size={12} /> Pricing
                        </label>
                        <div className="grid grid-cols-2 gap-3 mb-4">
                            <button
                                onClick={() => setPricingType('Free')}
                                className={`p-4 rounded-2xl border-2 text-center transition-all ${pricingType === 'Free'
                                    ? 'border-emerald-400 bg-emerald-50'
                                    : 'border-gray-100 bg-white hover:border-gray-200'
                                }`}
                            >
                                <span className="text-lg">🎉</span>
                                <p className={`text-sm font-bold mt-1 ${pricingType === 'Free' ? 'text-emerald-600' : 'text-gray-500'}`}>Free Event</p>
                            </button>
                            <button
                                onClick={() => setPricingType('Paid')}
                                className={`p-4 rounded-2xl border-2 text-center transition-all ${pricingType === 'Paid'
                                    ? 'border-purple-400 bg-purple-50'
                                    : 'border-gray-100 bg-white hover:border-gray-200'
                                }`}
                            >
                                <span className="text-lg">🎟️</span>
                                <p className={`text-sm font-bold mt-1 ${pricingType === 'Paid' ? 'text-purple-600' : 'text-gray-500'}`}>Paid Event</p>
                            </button>
                        </div>
                    </div>

                    {/* Ticket Tiers (Paid only) */}
                    {pricingType === 'Paid' && (
                        <div className="space-y-4">
                            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
                                <Tag size={12} /> Ticket Tiers
                            </label>
                            {tickets.map((ticket, idx) => (
                                <div key={ticket.id} className="bg-white rounded-2xl border border-gray-100 p-5 space-y-3">
                                    <div className="flex items-center justify-between">
                                        <p className="text-[10px] font-black text-purple-500 uppercase tracking-widest">Tier {idx + 1}</p>
                                        {tickets.length > 1 && (
                                            <button onClick={() => removeTicket(ticket.id)} className="text-red-400 hover:text-red-600 p-1">
                                                <Trash2 size={16} />
                                            </button>
                                        )}
                                    </div>
                                    <input
                                        className="tlb-input w-full"
                                        placeholder="e.g. General Admission, VIP Pass"
                                        value={ticket.name}
                                        onChange={(e) => updateTicket(ticket.id, 'name', e.target.value)}
                                    />
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="text-[10px] font-bold text-gray-300 uppercase tracking-widest mb-1 block">Price (₹)</label>
                                            <input
                                                type="number"
                                                className="tlb-input w-full"
                                                placeholder="499"
                                                value={ticket.price}
                                                onChange={(e) => updateTicket(ticket.id, 'price', e.target.value)}
                                            />
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-bold text-gray-300 uppercase tracking-widest mb-1 block">Quantity</label>
                                            <input
                                                type="number"
                                                className="tlb-input w-full"
                                                placeholder="50"
                                                value={ticket.quantity}
                                                onChange={(e) => updateTicket(ticket.id, 'quantity', e.target.value)}
                                            />
                                        </div>
                                    </div>
                                    <input
                                        className="tlb-input w-full"
                                        placeholder="Short description (optional)"
                                        value={ticket.description}
                                        onChange={(e) => updateTicket(ticket.id, 'description', e.target.value)}
                                    />
                                </div>
                            ))}
                            <button
                                onClick={addTicket}
                                className="w-full py-3 border-2 border-dashed border-purple-200 rounded-2xl text-sm font-bold text-purple-400 flex items-center justify-center gap-2 hover:bg-purple-50 transition-colors"
                            >
                                <Plus size={18} /> Add Ticket Tier
                            </button>

                        </div>
                    )}

                    {/* Total Seats */}
                    <div>
                        <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                            <Users size={12} /> Total Seats Available
                        </label>
                        <input
                            type="number"
                            className="tlb-input w-full"
                            placeholder="e.g. 100"
                            value={seatsAvailable}
                            onChange={(e) => setSeatsAvailable(e.target.value)}
                        />
                    </div>

                    {/* Registration Deadline */}
                    <div>
                        <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 block">Registration Deadline</label>
                        <input type="date" className="tlb-input w-full" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
                    </div>

            <WizardNavigation 
                onBack={() => onNavigate('CREATE_EVENT_DETAILS')}
                onNext={() => onNavigate('CREATE_EVENT_MEDIA')}
                nextText="Next: Media"
                nextIcon={<ArrowRight size={18} />}
                themeColor="purple"
            />
        </WizardLayout>
    );
};
