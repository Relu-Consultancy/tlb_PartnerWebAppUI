import React from 'react';
import { ArrowRight, Camera, Play, Star, Link2 } from 'lucide-react';
import { Screen } from '../../types';
import { WizardLayout, WizardNavigation } from '../../components/ui';

interface Props { onNavigate: (screen: Screen) => void; onOpenSidebar: () => void; }

export const CreateListingMedia: React.FC<Props> = ({ onNavigate }) => (
    <WizardLayout
        title="New Listing"
        stepText="Stage 3 of 5"
        subtitle="Visual Storefront"
        progressPercentage={60}
        themeColor="yellow"
        onBack={() => onNavigate('CREATE_LISTING_BATCH')}
    >
        <div className="space-y-1">
            <h2 className="text-2xl font-black">Visual Storefront</h2>
            <p className="text-sm text-gray-400">High-conversion media assets that showcase your class.</p>
        </div>

                {/* Gallery Upload */}
                <div>
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 block">Gallery Photos / Short Teaser</label>
                    <div className="flex flex-wrap gap-3">
                        {/* Upload buttons */}
                        <div className="w-24 h-24 bg-tlb-yellow/10 rounded-2xl border-2 border-dashed border-tlb-yellow/30 flex flex-col items-center justify-center text-tlb-yellow cursor-pointer hover:bg-tlb-yellow/20 transition-colors">
                            <Camera size={24} />
                            <span className="text-[10px] font-bold mt-1">Add Photo</span>
                        </div>
                        <div className="w-24 h-24 bg-blue-50 rounded-2xl border-2 border-dashed border-blue-200 flex flex-col items-center justify-center text-blue-400 cursor-pointer hover:bg-blue-100 transition-colors">
                            <Play size={24} />
                            <span className="text-[10px] font-bold mt-1">Add Teaser</span>
                        </div>
                        {/* Mock uploaded photos */}
                        {[1, 2, 3, 4].map((i) => (
                            <div key={i} className="w-24 h-24 rounded-2xl overflow-hidden shadow-sm relative group cursor-pointer">
                                <img loading="lazy" src={`https://picsum.photos/seed/class${i}/400/400`} alt={`Photo ${i}`} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                                {i === 1 && (
                                    <div className="absolute top-2 right-2 bg-tlb-yellow p-1.5 rounded-lg shadow">
                                        <Star size={10} className="text-tlb-dark" />
                                    </div>
                                )}
                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                                    <Star size={16} className="text-white" />
                                </div>
                            </div>
                        ))}
                    </div>
                    <p className="text-xs text-gray-300 mt-2">⭐ Tap a photo to set it as the <strong>Feature Image</strong> (main thumbnail)</p>
                </div>

                {/* Video Link */}
                <div>
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 block">Video Link</label>
                    <div className="flex items-center gap-3 border border-gray-100 bg-white rounded-2xl px-4 py-3">
                        <Link2 size={18} className="text-gray-300" />
                        <input className="bg-transparent flex-1 text-sm outline-none" placeholder="YouTube or Instagram Reels URL" />
                    </div>
                    <p className="text-xs text-gray-300 mt-1">Paste a single video URL to embed on your listing page.</p>
                </div>

                {/* Feature Image note */}
                <div className="bg-tlb-yellow/5 border border-tlb-yellow/20 rounded-2xl p-4">
                    <div className="flex items-start gap-3">
                        <Star size={18} className="text-tlb-yellow shrink-0 mt-0.5" />
                        <div>
                            <p className="text-sm font-bold">Feature Image</p>
                            <p className="text-xs text-gray-500 mt-0.5">The starred photo will appear as the main thumbnail in search results and listings.</p>
                        </div>
                    </div>
                </div>

        <WizardNavigation 
            onBack={() => onNavigate('CREATE_LISTING_BATCH')}
            onNext={() => onNavigate('CREATE_LISTING_POLICIES')}
            nextText="Next: Policies"
            nextIcon={<ArrowRight size={18} />}
            themeColor="yellow"
        />
    </WizardLayout>
);
