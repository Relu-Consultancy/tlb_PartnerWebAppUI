import { apiClient } from './client';

export interface BankDetails {
    account_holder_name: string;
    bank_name: string;
    branch_name: string;
    account_number_masked: string;
    ifsc_code: string;
    cancelled_cheque_url: string;
    consent_given: boolean;
    verification_status: 'pending' | 'under_review' | 'verified' | 'rejected';
    verification_note: string;
    updated_at: string;
}

export const getBankDetails = async (): Promise<BankDetails | null> => {
    const response = await apiClient('/api/v1/partner/bank-details/');
    if (response.status === 404) return null;
    if (!response.ok) {
        const err = await response.json().catch(() => null);
        throw new Error(err?.error?.message || 'Failed to fetch bank details');
    }
    const res = await response.json().catch(() => null);
    // `data ?? res`, never `data || res`: a "no bank yet" answer of
    // {success: true, data: null} used to fall back to the whole envelope — a
    // truthy object — so Revenue & payouts treated it as a linked account and
    // unlocked every section.
    const bank = res && typeof res === 'object' && 'data' in res ? res.data : res;
    return isBankLinked(bank) ? (bank as BankDetails) : null;
};

/**
 * A bank account counts as connected only when the record actually identifies
 * one — an empty object, a null, or a bare success envelope does not.
 */
export const isBankLinked = (bank: unknown): bank is BankDetails => {
    if (!bank || typeof bank !== 'object') return false;
    const b = bank as Partial<BankDetails> & { account_number?: string };
    return !!(b.account_number_masked || b.account_number || b.ifsc_code || b.account_holder_name);
};

export interface UpdateBankPayload {
    account_holder_name: string;
    account_number: string;
    ifsc_code: string;
    consent_given: boolean;
    bank_name?: string;
    branch_name?: string;
}

export const updateBankDetails = async (data: UpdateBankPayload, cancelledCheque?: File): Promise<BankDetails> => {
    let options: RequestInit;

    if (cancelledCheque) {
        const form = new FormData();
        form.append('account_holder_name', data.account_holder_name);
        form.append('account_number', data.account_number);
        form.append('ifsc_code', data.ifsc_code);
        form.append('consent_given', String(data.consent_given));
        if (data.bank_name) form.append('bank_name', data.bank_name);
        if (data.branch_name) form.append('branch_name', data.branch_name);
        form.append('cancelled_cheque', cancelledCheque);
        options = { method: 'PUT', body: form };
    } else {
        options = { method: 'PUT', body: JSON.stringify(data) };
    }

    const response = await apiClient('/api/v1/partner/bank-details/', options);
    if (!response.ok) {
        const err = await response.json().catch(() => null);
        throw new Error(err?.error?.message || 'Failed to update bank details');
    }
    const res = await response.json();
    return res.data || res;
};
