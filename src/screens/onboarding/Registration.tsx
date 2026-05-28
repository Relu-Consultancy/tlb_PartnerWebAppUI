import React, { useState } from 'react';
import {
    CheckCircle2,
    FileText,
    Building2,
    ArrowLeft,
    Instagram,
    Facebook,
    Globe,
    Video,
    Image as ImageIcon
} from 'lucide-react';
import { Screen } from '../../types';
import { updateBusinessProfile, uploadPartnerMedia, deletePartnerMedia, getCurrentPartner } from '../../api/onboarding';

interface OnboardingProps {
    onNavigate: (screen: Screen) => void;
}

const Mail = ({ size, className }: { size: number, className?: string }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"></path><rect width="20" height="16" x="2" y="4" rx="2"></rect></svg>;
const Trash = ({ size, className }: { size: number, className?: string }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>;

export const Registration: React.FC<OnboardingProps> = ({ onNavigate }) => {
    const [formData, setFormData] = useState({
        business_name: '',
        business_type: 'Company',
        contact_person_name: '',
        email: '',
        base_city: '',
        instagram_url: '',
        is_info_correct: false,
        is_safety_confirmed: false,
    });
    const [loading, setLoading] = useState(false);
    
    // Media States
    const [uploadedImages, setUploadedImages] = useState<any[]>([]);
    const [uploadedVideo, setUploadedVideo] = useState<any | null>(null);
    const [uploadingMedia, setUploadingMedia] = useState(false);

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) return;
        setUploadingMedia(true);
        try {
            for (let i = 0; i < e.target.files.length; i++) {
                const file = e.target.files[i];
                if (file.size > 5 * 1024 * 1024) {
                    alert(`File ${file.name} is too large (max 5MB)`);
                    continue;
                }
                const res = await uploadPartnerMedia(file, 'image');
                const data = res.data || res;
                setUploadedImages(prev => [...prev, data]);
            }
        } catch (error) {
            console.error('Image upload failed', error);
            alert('Failed to upload image(s).');
        } finally {
            setUploadingMedia(false);
            e.target.value = ''; // Reset input
        }
    };

    const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) return;
        const file = e.target.files[0];
        if (file.size > 100 * 1024 * 1024) {
            alert(`Video ${file.name} is too large (max 100MB)`);
            return;
        }
        setUploadingMedia(true);
        try {
            const res = await uploadPartnerMedia(file, 'video');
            const data = res.data || res;
            setUploadedVideo(data);
        } catch (error) {
            console.error('Video upload failed', error);
            alert('Failed to upload video.');
        } finally {
            setUploadingMedia(false);
            e.target.value = ''; // Reset input
        }
    };

    const handleDeleteMedia = async (mediaId: number, type: 'image' | 'video') => {
        try {
            await deletePartnerMedia(mediaId);
            if (type === 'image') {
                setUploadedImages(prev => prev.filter(img => img.id !== mediaId));
            } else {
                setUploadedVideo(null);
            }
        } catch (error) {
            console.error('Delete media failed', error);
            alert('Failed to delete media.');
        }
    };

    const handleSubmit = async () => {
        if (!formData.is_info_correct || !formData.is_safety_confirmed) {
            alert('Please confirm the safety declarations.');
            return;
        }
        if (!formData.instagram_url) {
            alert('Please provide at least one social media link (Instagram).');
            return;
        }
        if (uploadedImages.length < 3) {
            alert('Please upload at least 3 images before submitting. This is required for account activation.');
            return;
        }

        setLoading(true);
        try {
            await updateBusinessProfile(formData);
            // Check if backend auto-activated us (profile_created + 3 images → activated_limited)
            const partnerRes = await getCurrentPartner();
            const partner = partnerRes.data || partnerRes;
            if (partner.is_active || partner.status === 'activated_limited') {
                onNavigate('APP_SUBMITTED');
            } else {
                // Not yet activated — might need more images
                onNavigate('APP_SUBMITTED');
            }
        } catch (error: any) {
            console.error('Failed to submit application', error);
            alert(error?.message || 'Failed to submit application. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
        <header className="bg-white p-4 sm:p-6 flex items-center justify-between border-b border-gray-100">
            <button type="button" onClick={() => onNavigate('LANDING')}><ArrowLeft size={24} /></button>
            <h2 className="font-black text-lg">Partner Registration</h2>
            <div className="w-6"></div>
        </header>

        <div className="p-4 sm:p-6 flex justify-between relative mb-4">
            <div className="absolute top-1/2 left-0 w-full h-0.5 bg-tlb-yellow/20 -translate-y-1/2 z-0"></div>
            {[
                { n: 1, label: 'Details' },
                { n: 2, label: 'Digital' },
                { n: 3, label: 'Work' },
                { n: 4, label: 'Safety' }
            ].map((s) => (
                <div key={s.n} className="relative z-10 flex flex-col items-center gap-1">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${s.n === 1 ? 'bg-tlb-yellow text-tlb-dark' : 'bg-white border-2 border-tlb-yellow/20 text-gray-300'}`}>
                        {s.n}
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">{s.label}</span>
                </div>
            ))}
        </div>

        <main className="flex-1 p-4 sm:p-6 pb-24">
            <div className="tlb-content space-y-6">
                <section className="tlb-card space-y-6">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="bg-tlb-yellow/10 p-2 rounded-lg text-tlb-yellow"><Building2 size={20} /></div>
                        <h3 className="font-black text-xl">Business Details</h3>
                    </div>
                    <div className="space-y-4">
                        <div>
                            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 block">Business / Brand Name</label>
                            <input 
                                className="tlb-input" 
                                placeholder="The Grand Theater" 
                                value={formData.business_name}
                                onChange={(e) => setFormData(prev => ({ ...prev, business_name: e.target.value }))}
                            />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 block">Contact Person Name</label>
                            <input 
                                className="tlb-input" 
                                placeholder="Sarah Bernhardt" 
                                value={formData.contact_person_name}
                                onChange={(e) => setFormData(prev => ({ ...prev, contact_person_name: e.target.value }))}
                            />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 block">Business Type</label>
                            <div className="flex flex-wrap gap-2">
                                {['Individual', 'Sole Proprietor', 'Partnership', 'Company', 'LLP'].map((type) => (
                                    <label key={type} className="flex items-center gap-2 bg-gray-50 border border-gray-100 px-4 py-3 rounded-xl cursor-pointer hover:border-gray-200 transition-colors">
                                        <input 
                                            type="radio" 
                                            name="businessType" 
                                            value={type} 
                                            checked={formData.business_type === type}
                                            onChange={() => setFormData(prev => ({ ...prev, business_type: type }))}
                                            className="text-tlb-yellow focus:ring-tlb-yellow mt-0.5" 
                                        />
                                        <span className="text-sm font-bold text-gray-700">{type}</span>
                                    </label>
                                ))}
                            </div>
                        </div>
                        <div>
                            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 block">Email ID</label>
                            <div className="relative">
                                <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                                <input 
                                    className="tlb-input pl-12" 
                                    placeholder="sarah@grandtheater.com" 
                                    value={formData.email}
                                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                                />
                            </div>
                        </div>
                        <div>
                            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 block">City</label>
                            <input
                                type="text"
                                className="tlb-input"
                                placeholder="Enter your city"
                                value={formData.base_city}
                                onChange={(e) => setFormData(prev => ({ ...prev, base_city: e.target.value }))}
                            />
                        </div>
                    </div>
                </section>

                <section className="tlb-card space-y-6">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="bg-tlb-yellow/10 p-2 rounded-lg text-tlb-yellow"><Globe size={20} /></div>
                        <h3 className="font-black text-xl">Digital Presence</h3>
                    </div>
                    <br></br>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest -mt-4">* At least one field required</p>
                    <div className="space-y-4">
                        <div className="flex items-center gap-3 bg-gray-50 p-3 rounded-xl border border-gray-100">
                            <Instagram size={18} className="text-pink-500" />
                            <input 
                                className="bg-transparent flex-1 text-sm outline-none" 
                                placeholder="Instagram URL" 
                                value={formData.instagram_url}
                                onChange={(e) => setFormData(prev => ({ ...prev, instagram_url: e.target.value }))}
                            />
                        </div>
                        <div className="flex items-center gap-3 bg-gray-50 p-3 rounded-xl border border-gray-100">
                            <Facebook size={18} className="text-blue-600" />
                            <input className="bg-transparent flex-1 text-sm outline-none" placeholder="https://facebook.com/..." />
                        </div>
                        <div className="flex items-center gap-3 bg-gray-50 p-3 rounded-xl border border-gray-100">
                            <Globe size={18} className="text-tlb-dark" />
                            <input className="bg-transparent flex-1 text-sm outline-none" placeholder="https://www.yourbusiness.com" />
                        </div>
                    </div>
                </section>

                <section className="tlb-card space-y-6">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="bg-tlb-yellow/10 p-2 rounded-lg text-tlb-yellow"><CheckCircle2 size={20} /></div>
                        <h3 className="font-black text-xl">Proof of Work</h3>
                    </div>
                    <div className="space-y-6">
                        <div>
                            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 block">Upload 3-5 Real Photos</label>
                            {uploadedImages.length > 0 && (
                                <div className="flex flex-wrap gap-4 mb-4">
                                    {uploadedImages.map((img) => (
                                        <div key={img.id} className="relative w-20 h-20 rounded-xl overflow-hidden border border-gray-200">
                                            <img src={img.file_url || img.file} alt="Upload" className="w-full h-full object-cover" />
                                            <button 
                                                onClick={() => handleDeleteMedia(img.id, 'image')}
                                                className="absolute top-1 right-1 bg-white/80 p-1 rounded-md text-red-500 hover:bg-white"
                                            >
                                                <Trash size={12} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                            <label className={`border-2 border-dashed border-gray-200 rounded-2xl p-8 flex flex-col items-center justify-center gap-2 bg-gray-50/50 transition-colors ${uploadingMedia ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:bg-gray-50'}`}>
                                <div className="bg-tlb-yellow/10 p-3 rounded-xl text-tlb-yellow"><ImageIcon size={24} /></div>
                                <p className="text-sm font-medium"><span className="text-tlb-yellow font-bold">Click to upload</span> or drag and drop</p>
                                <p className="text-[10px] text-gray-400 font-bold uppercase">PNG, JPG up to 5MB each</p>
                                <input type="file" multiple accept="image/png, image/jpeg" className="hidden" onChange={handleImageUpload} disabled={uploadingMedia} />
                            </label>
                        </div>
                        <div>
                            <div className="flex justify-between items-center mb-2">
                                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest block">Upload Short Video</label>
                                <span className="text-[10px] bg-gray-100 text-gray-400 px-2 py-0.5 rounded font-bold uppercase">Optional</span>
                            </div>
                            {uploadedVideo ? (
                                <div className="flex items-center gap-4 bg-gray-50 border border-gray-100 p-4 rounded-2xl">
                                    <div className="bg-gray-200 p-3 rounded-xl text-gray-500"><Video size={20} /></div>
                                    <div className="flex-1">
                                        <p className="text-sm font-bold">Video uploaded</p>
                                        <p className="text-[10px] text-gray-400 font-bold uppercase truncate max-w-[200px]">{uploadedVideo.file_url || uploadedVideo.file}</p>
                                    </div>
                                    <button onClick={() => handleDeleteMedia(uploadedVideo.id, 'video')} className="text-red-500 p-2"><Trash size={16} /></button>
                                </div>
                            ) : (
                                <label className={`flex items-center gap-4 bg-gray-50 border border-gray-100 p-4 rounded-2xl ${uploadingMedia ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:border-gray-200 transition-colors'}`}>
                                    <div className="bg-gray-200 p-3 rounded-xl text-gray-500"><Video size={20} /></div>
                                    <div className="flex-1">
                                        <p className="text-sm font-bold">Select video file</p>
                                        <p className="text-[10px] text-gray-400 font-bold uppercase">MP4, MOV up to 50MB</p>
                                    </div>
                                    <span className="text-tlb-yellow font-bold text-sm">Browse</span>
                                    <input type="file" accept="video/mp4, video/quicktime" className="hidden" onChange={handleVideoUpload} disabled={uploadingMedia} />
                                </label>
                            )}
                        </div>
                    </div>
                </section>

                <section className="tlb-card">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="bg-tlb-yellow/10 p-2 rounded-lg text-tlb-yellow"><FileText size={20} /></div>
                        <h3 className="font-black text-xl">Safety Confirmation</h3>
                    </div>
                    <label className="flex gap-4 items-start bg-tlb-yellow/5 border border-tlb-yellow/20 p-4 rounded-2xl cursor-pointer">
                        <input 
                            type="checkbox" 
                            className="mt-1 w-5 h-5 rounded border-tlb-yellow text-tlb-yellow focus:ring-tlb-yellow" 
                            checked={formData.is_info_correct}
                            onChange={(e) => setFormData(prev => ({ ...prev, is_info_correct: e.target.checked }))}
                        />
                        <span className="text-sm font-medium leading-relaxed">I confirm that the information provided is genuine.</span>
                    </label>
                    <br></br>
                    <label className="flex gap-4 items-start bg-tlb-yellow/5 border border-tlb-yellow/20 p-4 rounded-2xl cursor-pointer">
                        <input 
                            type="checkbox" 
                            className="mt-1 w-5 h-5 rounded border-tlb-yellow text-tlb-yellow focus:ring-tlb-yellow" 
                            checked={formData.is_safety_confirmed}
                            onChange={(e) => setFormData(prev => ({ ...prev, is_safety_confirmed: e.target.checked }))}
                        />
                        <span className="text-sm font-medium leading-relaxed">I confirm my offerings are safe and age-appropriate for children.</span>
                    </label>
                </section>

                <button 
                    onClick={handleSubmit} 
                    disabled={loading}
                    className={`tlb-button w-full py-4 shadow-lg shadow-tlb-yellow/20 ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                    {loading ? 'Submitting...' : 'Submit Application'} <CheckCircle2 size={20} />
                </button>
            </div>
        </main>
    </div>
    );
};
