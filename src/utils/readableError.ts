// ---------------------------------------------------------------------------
// Turns backend validation dumps into sentences a partner can act on.
//
// Some endpoints answer a 400 with Django REST Framework's errors stringified
// in Python repr form —
//   {'business_name': [ErrorDetail(string='This field may not be blank.', code='blank')], …}
// — and others with the raw JSON object, which several API helpers then
// JSON.stringify. Either way it used to land in a toast verbatim. Every toast
// passes its message through here, so no screen can show one again.
// ---------------------------------------------------------------------------

const FIELD_LABELS: Record<string, string> = {
    base_city: 'City',
    city: 'City',
    email: 'Email',
    instagram_url: 'Instagram link',
    facebook_url: 'Facebook link',
    website_url: 'Website',
    contact_person_name: 'Contact person name',
    business_name: 'Business / brand name',
    identifier: 'Email or mobile number',
    identifier_type: 'Sign-in method',
    phone: 'Mobile number',
    phone_number: 'Mobile number',
};

const NON_FIELD_KEYS = new Set(['non_field_errors', 'detail', '__all__', 'message', 'error']);

export const fieldLabel = (key: string): string => {
    if (FIELD_LABELS[key]) return FIELD_LABELS[key];
    const words = key
        .replace(/[_-]+/g, ' ')
        .trim()
        .replace(/\burl\b/gi, 'URL')
        .replace(/\bid\b/gi, 'ID');
    return words.charAt(0).toUpperCase() + words.slice(1);
};

type FieldErrors = { field: string; messages: string[] }[];

/** `{'field': [ErrorDetail(string='…', code='…')], …}` → field errors. */
const parsePythonRepr = (text: string): FieldErrors | null => {
    if (!/ErrorDetail\(/.test(text)) return null;
    const out: FieldErrors = [];
    const keyRe = /['"]([A-Za-z0-9_]+)['"]\s*:\s*\[/g;
    const keys: { field: string; start: number }[] = [];
    let m: RegExpExecArray | null;
    while ((m = keyRe.exec(text))) keys.push({ field: m[1], start: keyRe.lastIndex });
    const grab = (segment: string) => {
        const msgs: string[] = [];
        // string='…' or string="…" — the other quote may appear inside.
        const msgRe = /string=(['"])((?:(?!\1).)*)\1/g;
        let mm: RegExpExecArray | null;
        while ((mm = msgRe.exec(segment))) msgs.push(mm[2]);
        return msgs;
    };
    if (keys.length === 0) {
        const msgs = grab(text);
        return msgs.length ? [{ field: 'non_field_errors', messages: msgs }] : null;
    }
    keys.forEach((k, i) => {
        const segment = text.slice(k.start, i + 1 < keys.length ? keys[i + 1].start : text.length);
        const messages = grab(segment);
        if (messages.length) out.push({ field: k.field, messages });
    });
    return out.length ? out : null;
};

/** `{"field": ["…"], …}` (possibly nested under error/details) → field errors. */
const parseJsonObject = (text: string): FieldErrors | null => {
    const trimmed = text.trim();
    if (!trimmed.startsWith('{')) return null;
    let obj: unknown;
    try {
        obj = JSON.parse(trimmed);
    } catch {
        return null;
    }
    const out: FieldErrors = [];
    const walk = (value: unknown, field: string) => {
        if (typeof value === 'string') out.push({ field, messages: [value] });
        else if (Array.isArray(value)) {
            const msgs = value.filter((v): v is string => typeof v === 'string');
            if (msgs.length) out.push({ field, messages: msgs });
            value.filter((v) => v && typeof v === 'object').forEach((v) => walk(v, field));
        } else if (value && typeof value === 'object') {
            for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
                if (k === 'code' || k === 'status' || k === 'success') continue;
                walk(v, NON_FIELD_KEYS.has(k) || k === 'details' || k === 'errors' ? field : k);
            }
        }
    };
    walk(obj, 'non_field_errors');
    return out.length ? out : null;
};

const isBlankMessage = (msg: string) => /may not be blank|is required|may not be null|cannot be empty/i.test(msg);

const joinList = (items: string[]) =>
    items.length <= 1 ? items.join('') : `${items.slice(0, -1).join(', ')} and ${items[items.length - 1]}`;

const sentence = (s: string) => (/[.!?]$/.test(s) ? s : `${s}.`);

/** Field errors → one short paragraph: missing fields first, then the rest. */
const compose = (errors: FieldErrors): string => {
    const missing: string[] = [];
    const other: string[] = [];
    for (const { field, messages } of errors) {
        const general = NON_FIELD_KEYS.has(field);
        for (const msg of messages) {
            if (!general && isBlankMessage(msg)) {
                const label = fieldLabel(field);
                if (!missing.includes(label)) missing.push(label);
            } else {
                other.push(general ? sentence(msg) : `${fieldLabel(field)}: ${sentence(msg)}`);
            }
        }
    }
    const parts: string[] = [];
    if (missing.length) parts.push(`Please fill in ${joinList(missing)}.`);
    parts.push(...other);
    return parts.join(' ');
};

/** Make any error message fit to show a partner. Plain sentences pass through. */
export const readableErrorMessage = (message: unknown, fallback = 'Something went wrong. Please try again.'): string => {
    if (message == null) return fallback;
    const text = String(message).trim();
    if (!text) return fallback;
    const parsed = parsePythonRepr(text) ?? parseJsonObject(text);
    if (parsed) return compose(parsed) || fallback;
    // Anything else still shaped like a code dump isn't for partners either.
    if (/^[[{]/.test(text) || /Traceback \(most recent call last\)|<!doctype html|<html/i.test(text)) return fallback;
    return text;
};
