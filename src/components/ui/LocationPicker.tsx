import React, { useEffect, useRef, useState, useCallback } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Search, MapPin, Loader2, X, Navigation, CheckCircle2 } from 'lucide-react';
import { autocompleteLocation, getPlaceDetails, reverseGeocodeLocation, LocationSuggestion, ResolvedLocation } from '../../api/location';

export interface PickedLocation extends ResolvedLocation {
    place_id?: string;
}

interface LocationPickerProps {
    /** Existing coordinates to center on and show a pin for (editing an already-located listing). */
    initialLatitude?: number | null;
    initialLongitude?: number | null;
    initialAddress?: string | null;
    onSelect: (location: PickedLocation) => void;
}

// Default view — centered on India, zoomed out, before any location is picked.
const INDIA_CENTER: [number, number] = [22.9734, 78.6569];
const INDIA_ZOOM = 4.5;
const PICKED_ZOOM = 16;

// A brand-colored teardrop pin, built as an inline SVG divIcon — avoids the
// classic Leaflet-in-a-bundler broken default-marker-image problem entirely.
const pinIcon = L.divIcon({
    className: 'tlb-map-pin',
    html: `<svg width="34" height="44" viewBox="0 0 34 44" xmlns="http://www.w3.org/2000/svg" style="filter: drop-shadow(0 4px 6px rgba(0,0,0,0.35))">
        <path d="M17 0C7.6 0 0 7.6 0 17c0 12.4 17 27 17 27s17-14.6 17-27C34 7.6 26.4 0 17 0z" fill="#141412"/>
        <circle cx="17" cy="17" r="8" fill="#FACC15"/>
    </svg>`,
    iconSize: [34, 44],
    iconAnchor: [17, 44],
});

// One-time global styling for Leaflet's chrome (zoom control, attribution)
// plus the pin-drop bounce — scoped to `.tlb-map` so it never leaks elsewhere.
let stylesInjected = false;
const injectMapStyles = () => {
    if (stylesInjected) return;
    stylesInjected = true;
    const style = document.createElement('style');
    style.textContent = `
        .tlb-map-pin { animation: tlb-pin-drop 0.5s cubic-bezier(0.34, 1.56, 0.64, 1); }
        @keyframes tlb-pin-drop { 0% { transform: translateY(-20px) scale(0.6); opacity: 0; } 60% { transform: translateY(2px) scale(1.08); opacity: 1; } 100% { transform: translateY(0) scale(1); } }
        .tlb-map .leaflet-control-zoom { border: none !important; box-shadow: 0 4px 14px rgba(0,0,0,0.14) !important; border-radius: 12px !important; overflow: hidden; margin-bottom: 10px !important; }
        .tlb-map .leaflet-control-zoom a { width: 32px !important; height: 32px !important; line-height: 32px !important; color: #141412 !important; font-weight: 700 !important; }
        .tlb-map .leaflet-control-zoom a:hover { background: #FFFBEB !important; }
        .tlb-map .leaflet-control-attribution { background: rgba(255,255,255,0.8) !important; backdrop-filter: blur(4px); border-radius: 8px; font-size: 9px !important; padding: 1px 6px !important; margin-left: 10px !important; }
    `;
    document.head.appendChild(style);
};

const debounce = <A extends any[]>(fn: (...args: A) => void, ms: number) => {
    let t: ReturnType<typeof setTimeout>;
    return (...args: A) => {
        clearTimeout(t);
        t = setTimeout(() => fn(...args), ms);
    };
};

export const LocationPicker: React.FC<LocationPickerProps> = ({
    initialLatitude, initialLongitude, initialAddress, onSelect,
}) => {
    const mapElRef = useRef<HTMLDivElement>(null);
    const mapRef = useRef<L.Map | null>(null);
    const markerRef = useRef<L.Marker | null>(null);
    const sessionTokenRef = useRef<string | undefined>(undefined);

    const hasInitialPin = initialLatitude != null && initialLongitude != null;

    const [query, setQuery] = useState('');
    const [suggestions, setSuggestions] = useState<LocationSuggestion[]>([]);
    const [searching, setSearching] = useState(false);
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [resolving, setResolving] = useState(false);
    const [locating, setLocating] = useState(false);
    const [hasPin, setHasPin] = useState(hasInitialPin);
    const [resolvedAddress, setResolvedAddress] = useState<string | null>(initialAddress || null);
    const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(
        hasInitialPin ? { lat: initialLatitude as number, lng: initialLongitude as number } : null
    );
    const [error, setError] = useState<string | null>(null);

    const newSessionToken = () => {
        sessionTokenRef.current = crypto.randomUUID();
        return sessionTokenRef.current;
    };

    // ─── Drop / move the pin, then resolve its address ────────────────────
    const resolvePin = useCallback(debounce(async (lat: number, lng: number) => {
        setResolving(true);
        setError(null);
        try {
            const loc = await reverseGeocodeLocation(lat, lng);
            // Google may snap to the nearest addressable point — re-center the
            // marker on the coordinates actually being saved, not the raw drop.
            if (markerRef.current) markerRef.current.setLatLng([loc.latitude, loc.longitude]);
            setResolvedAddress(loc.address);
            setCoords({ lat: loc.latitude, lng: loc.longitude });
            onSelect({ ...loc });
        } catch (err: any) {
            setError(err?.message || 'Could not resolve that location.');
        } finally {
            setResolving(false);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, 450), [onSelect]);

    const attachDragHandler = (marker: L.Marker) => {
        marker.on('dragend', () => {
            const pos = marker.getLatLng();
            resolvePin(pos.lat, pos.lng);
        });
    };

    const placePin = (lat: number, lng: number) => {
        const map = mapRef.current;
        if (!map) return;
        setHasPin(true);
        if (markerRef.current) {
            markerRef.current.setLatLng([lat, lng]);
            const el = markerRef.current.getElement();
            if (el) { el.classList.remove('tlb-map-pin'); void el.offsetWidth; el.classList.add('tlb-map-pin'); }
        } else {
            markerRef.current = L.marker([lat, lng], { icon: pinIcon, draggable: true }).addTo(map);
            attachDragHandler(markerRef.current);
        }
        resolvePin(lat, lng);
    };

    // ─── Map setup (once) ──────────────────────────────────────────────────
    useEffect(() => {
        if (!mapElRef.current || mapRef.current) return;
        injectMapStyles();
        const center: [number, number] = hasInitialPin ? [initialLatitude as number, initialLongitude as number] : INDIA_CENTER;
        const map = L.map(mapElRef.current, { zoomControl: false, attributionControl: false })
            .setView(center, hasInitialPin ? PICKED_ZOOM : INDIA_ZOOM);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; OpenStreetMap',
            maxZoom: 19,
        }).addTo(map);
        L.control.zoom({ position: 'bottomleft' }).addTo(map);
        L.control.attribution({ position: 'bottomleft', prefix: false }).addTo(map);

        if (hasInitialPin) {
            markerRef.current = L.marker(center, { icon: pinIcon, draggable: true }).addTo(map);
            attachDragHandler(markerRef.current);
        }

        map.on('click', (e: L.LeafletMouseEvent) => placePin(e.latlng.lat, e.latlng.lng));
        mapRef.current = map;

        return () => { map.remove(); mapRef.current = null; };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // ─── Search box ─────────────────────────────────────────────────────────
    const runSearch = useCallback(debounce(async (q: string) => {
        if (q.trim().length < 3) { setSuggestions([]); setSearching(false); return; }
        try {
            const token = sessionTokenRef.current || newSessionToken();
            const results = await autocompleteLocation(q, token);
            setSuggestions(results);
        } catch {
            setSuggestions([]);
        } finally {
            setSearching(false);
        }
    }, 350), []);

    const handleQueryChange = (v: string) => {
        setQuery(v);
        setDropdownOpen(true);
        if (v.trim().length < 3) { setSuggestions([]); return; }
        setSearching(true);
        runSearch(v);
    };

    const pickSuggestion = async (s: LocationSuggestion) => {
        setDropdownOpen(false);
        setQuery(s.description);
        setResolving(true);
        setError(null);
        try {
            const token = sessionTokenRef.current;
            const loc = await getPlaceDetails(s.place_id, token);
            sessionTokenRef.current = undefined; // session ends once a result is picked
            const map = mapRef.current;
            setHasPin(true);
            if (map) {
                map.setView([loc.latitude, loc.longitude], PICKED_ZOOM);
                if (markerRef.current) {
                    markerRef.current.setLatLng([loc.latitude, loc.longitude]);
                    const el = markerRef.current.getElement();
                    if (el) { el.classList.remove('tlb-map-pin'); void el.offsetWidth; el.classList.add('tlb-map-pin'); }
                } else {
                    markerRef.current = L.marker([loc.latitude, loc.longitude], { icon: pinIcon, draggable: true }).addTo(map);
                    attachDragHandler(markerRef.current);
                }
            }
            setResolvedAddress(loc.address);
            setCoords({ lat: loc.latitude, lng: loc.longitude });
            onSelect({ ...loc, place_id: s.place_id });
        } catch (err: any) {
            setError(err?.message || 'Could not resolve that location.');
        } finally {
            setResolving(false);
        }
    };

    // ─── Use my current location ────────────────────────────────────────────
    const useMyLocation = () => {
        if (!navigator.geolocation) { setError("Your browser doesn't support location access."); return; }
        setLocating(true);
        setError(null);
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                setLocating(false);
                const map = mapRef.current;
                if (map) map.setView([pos.coords.latitude, pos.coords.longitude], PICKED_ZOOM);
                placePin(pos.coords.latitude, pos.coords.longitude);
            },
            () => {
                setLocating(false);
                setError('Could not access your location — check your browser permissions.');
            },
            { enableHighAccuracy: true, timeout: 8000 },
        );
    };

    return (
        <div className="rounded-3xl border border-gray-200 bg-white shadow-sm overflow-hidden">
            {/* Map + floating controls */}
            <div className="relative tlb-map" style={{ height: 320 }}>
                <div ref={mapElRef} className="absolute inset-0" />

                {/* Floating search bar */}
                <div className="absolute top-3 left-3 right-3 z-[1000]">
                    <div className="flex items-center gap-2.5 bg-white/95 backdrop-blur-md border border-gray-100 rounded-2xl px-4 py-3 shadow-lg shadow-black/5 focus-within:ring-2 focus-within:ring-tlb-yellow/50 focus-within:border-tlb-yellow/60 transition-all">
                        <Search size={17} className="text-gray-400 shrink-0" />
                        <input
                            className="flex-1 bg-transparent border-none focus:outline-none text-sm font-semibold placeholder:text-gray-400 placeholder:font-medium"
                            placeholder="Search for the venue's address or area…"
                            value={query}
                            onChange={(e) => handleQueryChange(e.target.value)}
                            onFocus={() => query.trim().length >= 3 && setDropdownOpen(true)}
                        />
                        {searching && <Loader2 size={15} className="text-gray-300 animate-spin shrink-0" />}
                        {query && !searching && (
                            <button type="button" onClick={() => { setQuery(''); setSuggestions([]); }} className="text-gray-300 hover:text-gray-500 shrink-0">
                                <X size={15} />
                            </button>
                        )}
                    </div>

                    {dropdownOpen && suggestions.length > 0 && (
                        <div className="mt-2 bg-white rounded-2xl border border-gray-100 shadow-xl overflow-hidden max-h-64 overflow-y-auto">
                            {suggestions.map((s) => (
                                <button
                                    key={s.place_id}
                                    type="button"
                                    onClick={() => pickSuggestion(s)}
                                    className="w-full text-left flex items-center gap-3 px-4 py-3 hover:bg-amber-50/60 transition-colors border-b border-gray-50 last:border-b-0"
                                >
                                    <div className="w-7 h-7 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
                                        <MapPin size={13} className="text-gray-500" />
                                    </div>
                                    <span className="text-xs font-semibold text-gray-700 leading-snug">{s.description}</span>
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Empty-state hint */}
                {!hasPin && !dropdownOpen && (
                    <div className="absolute inset-x-0 bottom-4 flex justify-center z-[998] pointer-events-none">
                        <span className="bg-white/95 backdrop-blur-md shadow-lg rounded-full px-4 py-2 text-xs font-bold text-gray-500 flex items-center gap-1.5">
                            <MapPin size={13} className="text-tlb-yellow" /> Tap anywhere on the map to drop a pin
                        </span>
                    </div>
                )}

                {/* Use my current location */}
                <button
                    type="button"
                    onClick={useMyLocation}
                    disabled={locating}
                    title="Use my current location"
                    className="absolute bottom-3 right-3 z-[999] w-10 h-10 rounded-full bg-white shadow-lg shadow-black/10 border border-gray-100 flex items-center justify-center text-gray-600 hover:text-tlb-dark hover:shadow-xl hover:scale-105 transition-all disabled:opacity-60"
                >
                    {locating ? <Loader2 size={17} className="animate-spin" /> : <Navigation size={16} />}
                </button>

                {/* Resolving indicator — a small pill, not a full-map blur */}
                {resolving && (
                    <div className="absolute left-1/2 -translate-x-1/2 z-[997] pointer-events-none" style={{ top: 72 }}>
                        <span className="bg-tlb-dark text-white shadow-lg rounded-full px-3.5 py-1.5 flex items-center gap-2 text-[11px] font-bold">
                            <Loader2 size={12} className="animate-spin" /> Finding address…
                        </span>
                    </div>
                )}
            </div>

            {/* Resolved location footer */}
            <div className="px-4 py-3.5 border-t border-gray-100 bg-gray-50/60 space-y-1.5">
                {resolvedAddress ? (
                    <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                            <CheckCircle2 size={16} />
                        </div>
                        <div className="min-w-0 flex-1">
                            <p className="text-xs font-bold text-gray-800 leading-snug">{resolvedAddress}</p>
                            {coords && (
                                <p className="text-[10px] font-mono text-gray-400 mt-1">
                                    {coords.lat.toFixed(5)}°, {coords.lng.toFixed(5)}°
                                </p>
                            )}
                        </div>
                    </div>
                ) : !resolving && (
                    <p className="text-xs font-semibold text-gray-400 flex items-center gap-2">
                        <MapPin size={13} className="text-gray-300" /> Search above, tap the map, or use your current location to set this listing's spot.
                    </p>
                )}
                {error && <p className="text-xs font-semibold text-red-500 pl-11">{error}</p>}
            </div>
        </div>
    );
};
