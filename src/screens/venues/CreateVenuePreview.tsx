import React from 'react';
import { ArrowLeft, Rocket, MapPin, Users, Calendar, Clock, CheckCircle2 } from 'lucide-react';
import { Screen } from '../../types';
import { WizardLayout, WizardNavigation } from '../../components/ui';

interface Props { onNavigate: (screen: Screen) => void; }

export const CreateVenuePreview: React.FC<Props> = ({ onNavigate }) => {
    return (
        <WizardLayout
            title="Review Listing"
            stepText="Step 5 of 5"
            subtitle="Preview & Publish"
            progressPercentage={100}
            themeColor="amber"
            onBack={() => onNavigate('CREATE_VENUE_PACKAGES')}
        >
            <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-xl shadow-gray-200/50">
                {/* Header Image */}
                <div className="h-48 rounded-2xl bg-gray-200 mb-6 overflow-hidden relative">
                    <img src="https://picsum.photos/seed/venue/800/600" alt="Venue Cover" className="w-full h-full object-cover" />
                    <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                        <span className="text-[10px] font-bold text-gray-700 uppercase tracking-widest">Preview</span>
                    </div>
                </div>

                <div className="space-y-6">
                    {/* Title & Location */}
                    <div>
                        <h2 className="text-2xl font-black text-gray-900 mb-2">Royal Kids Party Hall</h2>
                        <p className="text-gray-500 flex items-center gap-1.5 text-sm font-medium">
                            <MapPin size={16} /> Powai, Mumbai
                        </p>
                    </div>

                    <hr className="border-gray-100" />

                    {/* Key Stats */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-amber-50 p-4 rounded-2xl">
                            <Users size={20} className="text-amber-500 mb-2" />
                            <p className="text-[10px] font-bold text-amber-900/60 uppercase tracking-widest">Capacity</p>
                            <p className="font-black text-amber-900">10 - 50 Guests</p>
                        </div>
                        <div className="bg-blue-50 p-4 rounded-2xl">
                            <Calendar size={20} className="text-blue-500 mb-2" />
                            <p className="text-[10px] font-bold text-blue-900/60 uppercase tracking-widest">Occasions</p>
                            <p className="font-black text-blue-900">Birthday, Playdate</p>
                        </div>
                    </div>

                    {/* Packages Preview */}
                    <div>
                        <h3 className="font-bold text-sm text-gray-400 uppercase tracking-widest mb-3">Packages Starting From</h3>
                        <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 flex items-center justify-between">
                            <div>
                                <p className="font-bold text-gray-800">Basic Party</p>
                                <p className="text-xs text-gray-500 mt-0.5">Venue access, standard dec...</p>
                            </div>
                            <p className="font-black text-lg text-amber-600">₹15,000</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Publish */}
            <div className="pt-4">
                <WizardNavigation 
                    onNext={() => onNavigate('SERVICE_LISTINGS')}
                    nextText="Publish Venue"
                    nextIcon={<Rocket size={20} />}
                    themeColor="amber"
                />
                <p className="text-center text-xs text-gray-400 mt-4 font-medium">
                    Your venue will be reviewed and published instantly.
                </p>
            </div>
        </WizardLayout>
    );
};
