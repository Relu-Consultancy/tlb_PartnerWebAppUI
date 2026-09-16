import React from 'react';
import { Check, MessageCircle, CalendarCheck } from 'lucide-react';

export type BookingTypeValue = 'enquiry' | 'direct_booking';

interface BookingTypeCardsProps {
    value: BookingTypeValue;
    onChange: (value: BookingTypeValue) => void;
    enquiryDescription: string;
    directBookingDescription: string;
}

/** Shared Enquiry-vs-Direct-Booking picker — was near-identically duplicated per entity. */
export const BookingTypeCards: React.FC<BookingTypeCardsProps> = ({
    value, onChange, enquiryDescription, directBookingDescription,
}) => {
    const options: { value: BookingTypeValue; icon: React.ElementType; title: string; description: string }[] = [
        { value: 'enquiry', icon: MessageCircle, title: 'Enquiry', description: enquiryDescription },
        { value: 'direct_booking', icon: CalendarCheck, title: 'Direct booking', description: directBookingDescription },
    ];

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {options.map((opt) => {
                const on = value === opt.value;
                return (
                    <button
                        key={opt.value}
                        type="button"
                        onClick={() => onChange(opt.value)}
                        className={`pt-tile pt-tile-wide ${on ? 'is-on' : ''}`}
                    >
                        {on && <span className="pt-tile-check"><Check size={11} strokeWidth={3} /></span>}
                        <opt.icon size={19} strokeWidth={2} className="flex-none mt-0.5" />
                        <span className="min-w-0">
                            <span className="block">{opt.title}</span>
                            <span className="block text-[11px] font-medium text-tlb-muted mt-0.5 leading-snug">{opt.description}</span>
                        </span>
                    </button>
                );
            })}
        </div>
    );
};
