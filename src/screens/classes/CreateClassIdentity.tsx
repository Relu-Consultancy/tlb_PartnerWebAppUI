import React, { useState, useEffect } from 'react';
import { ArrowRight, MapPin, Tag, ChevronDown, Loader2 } from 'lucide-react';
import { Screen } from '../../types';
import { WizardLayout, WizardNavigation } from '../../components/ui';
import {
    getCurrentClassDraftId,
    setCurrentClassDraftId,
    createClassDraft,
    updateClassListing,
    getClassListingDetail,
} from '../../api/listings';

interface Props { onNavigate: (screen: Screen) => void; onOpenSidebar: () => void; }

const categories: Record<string, string[]> = {
    'Academic': ['School Subjects', 'Olympiad Preparation', 'Entrance Exam Preparation', 'Homework Support'],
    'Creative Arts': ['Painting', 'Pottery', 'Sketching', 'Clay Modelling', 'DIY Crafts', 'Origami', 'Sculpture', 'Calligraphy', 'Fashion Designing', 'Textile Art', 'Resin Art'],
    'Tech & Innovation': ['Coding', 'Robotics', 'Artificial Intelligence', 'Game Development', 'App Development', 'Web Development', 'Electronics', 'UI / UX Design', 'Cybersecurity'],
    'Performing Arts': ['Dance', 'Singing / Vocal Music', 'Instrument Learning', 'Theatre / Acting'],
    'Sports & Fitness': ['Football', 'Cricket', 'Basketball', 'Chess', 'Yoga', 'Martial Arts', 'Gymnastics', 'Skating', 'Pickle Ball', 'Golf', 'Hockey', 'Badminton', 'Tennis', 'Swimming'],
    'Speech & Communication': ['Public Speaking', 'Debate', 'Storytelling', 'Creative Writing', 'Spoken English', 'Foreign Languages', 'Indian Languages', 'Phonics'],
    'Life Skills & Personality Dev': ['Personality Development', 'Entrepreneurship', 'Financial Literacy', 'Emotional Intelligence'],
    'Creative Media': ['Photography', 'Video Creation', 'Graphic Design', 'Content Creation', 'Podcasting', 'Animation'],
    'Outdoor and Nature Learning': ['Gardening', 'Nature Exploration', 'Environmental Education', 'Adventure Skills', 'Wildlife Learning'],
    'Culinary': ['Cooking', 'Baking', 'Food Presentation & Styling'],
    'Brain Boosters': ['Abacus', 'Vedic Maths', 'Memory Skills', 'Problem Solving', 'Rubix Cube'],
};

const formats = ['Physical', 'Online', 'Hybrid', 'Trial'] as const;
type Format = typeof formats[number];
const formatToMode: Record<Format, string> = {
    Physical: 'offline',
    Online: 'online',
    Hybrid: 'hybrid',
    Trial: 'online',
};

const tagOptions = ['Beginner Friendly', 'Advanced', 'Certification', 'Weekend Only', 'Trial Available', 'Group Class', 'One-on-One'];

export const CreateClassIdentity: React.FC<Props> = ({ onNavigate }) => {
    const [title, setTitle] = useState('');
    const [shortDesc, setShortDesc] = useState('');
    const [description, setDescription] = useState('');
    const [minAge, setMinAge] = useState('');
    const [maxAge, setMaxAge] = useState('');
    const [format, setFormat] = useState<Format>('Physical');
    const [location, setLocation] = useState('');
    const [cat, setCat] = useState('');
    const [sub, setSub] = useState('');
    const [tag, setTag] = useState('');
    const [saving, setSaving] = useState(false);
    const [loadError, setLoadError] = useState('');

    useEffect(() => {
        const id = getCurrentClassDraftId();
        if (!id) return;
        (async () => {
            try {
                const res = await getClassListingDetail(id);
                const d = res.data || res;
                setTitle(d.title || '');
                setShortDesc(d.short_description || '');
                setDescription(d.description || '');
                setMinAge(d.min_age != null ? String(d.min_age) : '');
                setMaxAge(d.max_age != null ? String(d.max_age) : '');
                setLocation(d.city || d.address || '');
                if (d.tags?.length) setTag(d.tags[0]);
            } catch (e) {
                console.error('Failed to load class detail', e);
            }
        })();
    }, []);

    const handleNext = async () => {
        if (!title.trim()) { setLoadError('Service title is required.'); return; }
        if (saving) return;
        setLoadError('');
        setSaving(true);
        try {
            let draftId = getCurrentClassDraftId();
            if (!draftId) {
                const res = await createClassDraft({
                    title: title.trim(),
                    short_description: shortDesc.trim(),
                    description: description.trim(),
                });
                const d = res.data || res;
                draftId = d.id;
                setCurrentClassDraftId(draftId!);
            }
            await updateClassListing(draftId!, {
                title: title.trim(),
                short_description: shortDesc.trim(),
                description: description.trim(),
                mode: formatToMode[format],
                ...(minAge ? { min_age: Number(minAge) } : {}),
                ...(maxAge ? { max_age: Number(maxAge) } : {}),
                ...(location.trim() ? { city: location.trim() } : {}),
                ...(tag ? { tags: [tag] } : {}),
            });
            onNavigate('CREATE_CLASS_BATCH');
        } catch (e: any) {
            setLoadError(e?.message || 'Failed to save. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    return (
        <WizardLayout
            title="New Listing"
            stepText="Stage 1 of 5"
            subtitle="Identity"
            progressPercentage={20}
            themeColor="yellow"
            onBack={() => onNavigate('SERVICE_LISTINGS')}
        >
            <div className="space-y-1">
                <h2 className="text-2xl font-black">Identity & Story</h2>
                <p className="text-sm text-gray-400">Capture the "What" and "Why" of your class.</p>
            </div>

            {loadError && (
                <div className="bg-red-50 border border-red-200 rounded-2xl p-3 text-xs font-bold text-red-600">
                    {loadError}
                </div>
            )}

            {/* Service Title */}
            <div>
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 block">Service Title <span className="text-red-400">*</span></label>
                <input
                    className="tlb-input w-full"
                    placeholder="e.g. Advanced Robotics"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                />
            </div>

            {/* Short Description */}
            <div>
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 block">Short Summary</label>
                <input
                    className="tlb-input w-full"
                    placeholder="One-line description shown in search results"
                    value={shortDesc}
                    onChange={(e) => setShortDesc(e.target.value)}
                />
            </div>

            {/* Master Description */}
            <div>
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 block">The Master Description</label>
                <textarea
                    className="tlb-input w-full min-h-[160px] resize-y"
                    placeholder="Describe your class — curriculum, what to bring, certifications... Creative freedom is yours!"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                />
                <p className="text-xs text-gray-300 mt-1">One rich description replaces separate fields. Tell the full story.</p>
            </div>

            {/* Target Age Group */}
            <div>
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 block">Target Age Group</label>
                <div className="flex gap-3">
                    <div className="flex-1">
                        <input
                            className="tlb-input w-full"
                            type="number"
                            placeholder="Min (e.g. 8)"
                            min={0}
                            value={minAge}
                            onChange={(e) => setMinAge(e.target.value)}
                        />
                    </div>
                    <span className="self-center text-gray-300 font-bold">to</span>
                    <div className="flex-1">
                        <input
                            className="tlb-input w-full"
                            type="number"
                            placeholder="Max (e.g. 14)"
                            min={0}
                            value={maxAge}
                            onChange={(e) => setMaxAge(e.target.value)}
                        />
                    </div>
                    <span className="self-center text-sm text-gray-400 font-bold">Years</span>
                </div>
            </div>

            {/* Format */}
            <div>
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 block">Format</label>
                <div className="relative group">
                    <select
                        value={format}
                        onChange={(e) => setFormat(e.target.value as Format)}
                        className="tlb-input w-full bg-white appearance-none cursor-pointer pr-10"
                    >
                        {formats.map((f) => (
                            <option key={f} value={f}>{f}</option>
                        ))}
                    </select>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400 group-focus-within:text-tlb-yellow transition-colors">
                        <ChevronDown size={18} />
                    </div>
                </div>
                <div className="mt-2 flex gap-4">
                    {formats.map((f) => (
                        <div key={f} className={`flex items-center gap-1.5 transition-opacity ${format === f ? 'opacity-100' : 'opacity-20'}`}>
                            <div className={`w-1.5 h-1.5 rounded-full ${f === 'Physical' ? 'bg-blue-500' : f === 'Online' ? 'bg-emerald-500' : f === 'Hybrid' ? 'bg-purple-500' : 'bg-amber-500'}`} />
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{f}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Location */}
            {(format === 'Physical' || format === 'Hybrid') && (
                <div>
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 block">
                        <MapPin size={12} className="inline mr-1" /> Class Location
                    </label>
                    <input
                        className="tlb-input w-full"
                        placeholder="City or address of the venue"
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                    />
                </div>
            )}

            {/* Category & Sub-category */}
            <div className="grid grid-cols-2 gap-3">
                <div>
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 block">Category</label>
                    <div className="relative group">
                        <select value={cat} onChange={(e) => { setCat(e.target.value); setSub(''); }} className="tlb-input w-full bg-white appearance-none pr-10">
                            <option value="">Select...</option>
                            {Object.keys(categories).map((c) => (
                                <option key={c} value={c}>{c}</option>
                            ))}
                        </select>
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400 group-focus-within:text-tlb-yellow transition-colors">
                            <ChevronDown size={18} />
                        </div>
                    </div>
                </div>
                <div>
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 block">Sub-Category</label>
                    <div className="relative group">
                        <select value={sub} onChange={(e) => setSub(e.target.value)} className="tlb-input w-full bg-white appearance-none pr-10" disabled={!cat}>
                            <option value="">Select...</option>
                            {(categories[cat] || []).map((s) => (
                                <option key={s} value={s}>{s}</option>
                            ))}
                        </select>
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-300 group-focus-within:text-tlb-yellow transition-colors">
                            <ChevronDown size={18} />
                        </div>
                    </div>
                </div>
            </div>

            {/* Tags */}
            <div>
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 block">
                    <Tag size={12} className="inline mr-1" /> Tag
                </label>
                <div className="flex flex-wrap gap-2">
                    {tagOptions.map((t) => (
                        <button
                            key={t}
                            onClick={() => setTag(prev => prev === t ? '' : t)}
                            className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${tag === t
                                    ? 'bg-tlb-yellow text-tlb-dark'
                                    : 'bg-white border border-gray-200 text-gray-500 hover:border-tlb-yellow/30'
                                }`}
                        >
                            {t}
                        </button>
                    ))}
                </div>
            </div>

            <WizardNavigation
                onNext={handleNext}
                nextText={saving ? 'Saving...' : 'Next: Batch & Schedule'}
                nextIcon={saving ? <Loader2 size={20} className="animate-spin" /> : <ArrowRight size={20} />}
                themeColor="yellow"
            />
        </WizardLayout>
    );
};
