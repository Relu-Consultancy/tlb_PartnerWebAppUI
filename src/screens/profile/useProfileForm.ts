import { useCallback, useEffect, useRef, useState } from 'react';
import {
    getBusinessProfile, getExtendedProfile, updateBusinessProfile, updateExtendedProfile,
    getPartnerMedia, uploadPartnerMedia, deletePartnerMedia,
} from '../../api/onboarding';
import { loadCurrentPartner, notifyPartnerUpdated } from '../../api/portalSummary';
import { toast } from '../../components/ui';
import { computeProfileCompletion } from './profileCompletion';

// ---------------------------------------------------------------------------
// My Profile form state: loads the partner's business + extended profile and
// media, tracks edits, and saves each backing endpoint only when it changed.
// ---------------------------------------------------------------------------

export interface BusinessFields {
    businessName: string;
    contactName: string;
    contactNumber: string;
    address: string;
    bio: string;
    websiteUrl: string;
    instagramUrl: string;
    facebookUrl: string;
}

type FieldKey = keyof BusinessFields;

const EMPTY_FIELDS: BusinessFields = {
    businessName: '', contactName: '', contactNumber: '', address: '',
    bio: '', websiteUrl: '', instagramUrl: '', facebookUrl: '',
};

// /partner/profile/ (JSON) owns these; the rest live on /partner/extended-profile/ (FormData).
const BUSINESS_KEYS: FieldKey[] = ['businessName', 'contactName', 'websiteUrl', 'instagramUrl', 'facebookUrl'];
const EXTENDED_KEYS: FieldKey[] = ['contactNumber', 'address', 'bio'];

const IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png'];
const VIDEO_TYPES = ['video/mp4', 'video/quicktime'];
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const MAX_VIDEO_BYTES = 100 * 1024 * 1024;

const unwrap = (json: any) => json?.data ?? json;
const toMb = (bytes: number) => (bytes / 1024 / 1024).toFixed(1);

const validateFile = (file: File, kind: 'image' | 'video'): boolean => {
    const [types, max, formats] = kind === 'image'
        ? [IMAGE_TYPES, MAX_IMAGE_BYTES, 'JPG or PNG']
        : [VIDEO_TYPES, MAX_VIDEO_BYTES, 'MP4 or MOV'];
    if (file.type && !types.includes(file.type)) {
        toast.warning(`${file.name}: unsupported format. Use ${formats}.`);
        return false;
    }
    if (file.size > max) {
        toast.warning(`${file.name} is too large (${toMb(file.size)} MB). Max is ${toMb(max)} MB.`);
        return false;
    }
    return true;
};

interface ImageAsset {
    /** Saved URL from the server. */
    savedUrl: string | null;
    /** Picked but not yet saved. */
    file: File | null;
    previewUrl: string | null;
}

const EMPTY_ASSET: ImageAsset = { savedUrl: null, file: null, previewUrl: null };

export const useProfileForm = () => {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [partner, setPartner] = useState<any>(null);
    const [fields, setFields] = useState<BusinessFields>(EMPTY_FIELDS);
    const [saved, setSaved] = useState<BusinessFields>(EMPTY_FIELDS);
    const [operatingCities, setOperatingCities] = useState<string[]>([]);
    const [logo, setLogo] = useState<ImageAsset>(EMPTY_ASSET);
    const [cover, setCover] = useState<ImageAsset>(EMPTY_ASSET);
    const [images, setImages] = useState<any[]>([]);
    const [video, setVideo] = useState<any | null>(null);
    const [uploadingMedia, setUploadingMedia] = useState(false);

    // Object URLs for unsaved picks — revoked when replaced and on unmount.
    const previewUrls = useRef<Set<string>>(new Set());
    useEffect(() => () => previewUrls.current.forEach(url => URL.revokeObjectURL(url)), []);

    useEffect(() => {
        let cancelled = false;
        Promise.allSettled([loadCurrentPartner(), getBusinessProfile(), getExtendedProfile(), getPartnerMedia()])
            .then(([partnerRes, profileRes, extRes, mediaRes]) => {
                if (cancelled) return;
                const p = partnerRes.status === 'fulfilled' ? partnerRes.value : null;
                const profile = profileRes.status === 'fulfilled' ? unwrap(profileRes.value) : {};
                const ext = extRes.status === 'fulfilled' ? unwrap(extRes.value) : {};
                if (profileRes.status === 'rejected') console.error('Profile: business profile load failed', profileRes.reason);

                const loaded: BusinessFields = {
                    businessName: profile?.business_name || p?.business_name || '',
                    contactName: profile?.contact_person_name || p?.contact_person_name || '',
                    contactNumber: ext?.contact_number || '',
                    address: ext?.address || '',
                    bio: ext?.bio || '',
                    websiteUrl: profile?.website_url || '',
                    instagramUrl: profile?.instagram_url || '',
                    facebookUrl: profile?.facebook_url || '',
                };
                setPartner(p);
                setFields(loaded);
                setSaved(loaded);
                setOperatingCities(Array.isArray(ext?.operating_cities) ? ext.operating_cities : []);
                setLogo({ ...EMPTY_ASSET, savedUrl: ext?.logo || ext?.logo_url || null });
                setCover({
                    ...EMPTY_ASSET,
                    savedUrl: ext?.cover_image || ext?.cover_image_url || ext?.cover || ext?.cover_photo || ext?.cover_url || null,
                });

                if (mediaRes.status === 'fulfilled') {
                    const media = unwrap(mediaRes.value);
                    if (Array.isArray(media)) {
                        setImages(media.filter((m: any) => m.media_type === 'image'));
                        setVideo(media.find((m: any) => m.media_type === 'video') ?? null);
                    }
                }
            })
            .finally(() => { if (!cancelled) setLoading(false); });
        return () => { cancelled = true; };
    }, []);

    const setField = useCallback((key: FieldKey, value: string) => {
        setFields(prev => ({ ...prev, [key]: value }));
    }, []);

    const discardDetails = useCallback(() => setFields(saved), [saved]);

    const pickImage = (setter: typeof setLogo) => (file: File) => {
        if (!validateFile(file, 'image')) return;
        const previewUrl = URL.createObjectURL(file);
        previewUrls.current.add(previewUrl);
        setter(prev => {
            if (prev.previewUrl) {
                URL.revokeObjectURL(prev.previewUrl);
                previewUrls.current.delete(prev.previewUrl);
            }
            return { ...prev, file, previewUrl };
        });
    };
    const selectLogo = pickImage(setLogo);
    const selectCover = pickImage(setCover);

    const changed = (keys: FieldKey[]) => keys.some(k => fields[k] !== saved[k]);
    const businessChanged = changed(BUSINESS_KEYS);
    const extendedChanged = changed(EXTENDED_KEYS) || !!logo.file || !!cover.file;
    const dirty = businessChanged || extendedChanged;

    /** Saves pending edits. Resolves true when everything that changed was stored. */
    const save = async (): Promise<boolean> => {
        if (!dirty || saving) return false;
        if (!fields.businessName.trim()) {
            toast.warning('Business name can’t be empty.');
            return false;
        }
        setSaving(true);
        let businessLocked = false;
        try {
            const jobs: Promise<unknown>[] = [];

            if (extendedChanged) {
                const form = new FormData();
                if (fields.bio) form.append('bio', fields.bio);
                if (fields.contactNumber) form.append('contact_number', fields.contactNumber);
                if (fields.address) form.append('address', fields.address);
                if (logo.file) form.append('logo', logo.file);
                if (cover.file) form.append('cover_image', cover.file);
                operatingCities.forEach(city => form.append('operating_cities', city));
                jobs.push(updateExtendedProfile(form));
            }

            if (businessChanged) {
                const payload: Record<string, string> = {
                    business_name: fields.businessName.trim(),
                    website_url: fields.websiteUrl.trim(),
                    instagram_url: fields.instagramUrl.trim(),
                    facebook_url: fields.facebookUrl.trim(),
                };
                if (fields.contactName !== saved.contactName) payload.contact_person_name = fields.contactName.trim();
                jobs.push(updateBusinessProfile(payload).catch((err: any) => {
                    // Core brand details lock after verification; other edits still save.
                    if (String(err?.message || '').toLowerCase().includes('locked')) { businessLocked = true; return; }
                    throw err;
                }));
            }

            await Promise.all(jobs);

            const stored: BusinessFields = { ...fields };
            if (businessLocked) BUSINESS_KEYS.forEach(k => { stored[k] = saved[k]; });
            setFields(stored);
            setSaved(stored);
            const commit = (asset: ImageAsset): ImageAsset =>
                asset.file ? { savedUrl: asset.previewUrl, file: null, previewUrl: asset.previewUrl } : asset;
            setLogo(commit);
            setCover(commit);
            notifyPartnerUpdated();

            if (businessLocked) {
                toast.warning('Your business name and links are locked after verification — contact support to change them. Other changes were saved.');
            } else {
                toast.success('Profile saved.');
            }
            return true;
        } catch (err: any) {
            console.error('Profile save failed', err);
            toast.error(err?.message ? `Couldn’t save your profile: ${err.message}` : 'Couldn’t save your profile. Please try again.');
            return false;
        } finally {
            setSaving(false);
        }
    };

    const addImages = async (files: FileList | File[]) => {
        const valid = Array.from(files).filter(f => validateFile(f, 'image'));
        if (valid.length === 0) return;
        setUploadingMedia(true);
        try {
            for (const file of valid) {
                const res = await uploadPartnerMedia(file, 'image');
                setImages(prev => [...prev, unwrap(res)]);
            }
        } catch (err: any) {
            console.error('Image upload failed', err);
            toast.error(err?.message || 'Couldn’t upload that image. Please try again.');
        } finally {
            setUploadingMedia(false);
        }
    };

    const addVideo = async (file: File) => {
        if (!validateFile(file, 'video')) return;
        setUploadingMedia(true);
        try {
            setVideo(unwrap(await uploadPartnerMedia(file, 'video')));
        } catch (err: any) {
            console.error('Video upload failed', err);
            toast.error(err?.message || 'Couldn’t upload that video. Please try again.');
        } finally {
            setUploadingMedia(false);
        }
    };

    const deleteMedia = async (id: number, kind: 'image' | 'video') => {
        try {
            await deletePartnerMedia(id);
            if (kind === 'image') setImages(prev => prev.filter(m => m.id !== id));
            else setVideo(null);
        } catch {
            toast.error('Couldn’t delete that file. Please try again.');
        }
    };

    const logoUrl = logo.previewUrl ?? logo.savedUrl;
    const coverUrl = cover.previewUrl ?? cover.savedUrl;

    const completion = computeProfileCompletion({
        hasCover: !!coverUrl,
        hasLogo: !!logoUrl,
        hasGallery: images.length > 0,
        ...fields,
    });

    return {
        loading, saving, dirty, partner, fields, completion,
        logoUrl, coverUrl, images, video, uploadingMedia,
        setField, discardDetails, selectLogo, selectCover, save,
        addImages, addVideo, deleteMedia,
    };
};

export type ProfileForm = ReturnType<typeof useProfileForm>;
