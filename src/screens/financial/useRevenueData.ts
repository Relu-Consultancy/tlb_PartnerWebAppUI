import { useCallback, useEffect, useState } from 'react';
import { getStatsRevenue, StatsRevenue } from '../../api/stats';
import { getBankDetails, updateBankDetails, BankDetails, UpdateBankPayload } from '../../api/banking';
import { DateRangeKey } from '../../constants/dateRange';

/**
 * `none` — the backend confirmed no account is on file (404).
 * `error` — the read itself failed, so we don't know; kept distinct from `none`
 * so a transient failure never shows a partner who *has* linked an account the
 * "connect your bank account" gate.
 */
export type BankStatus = 'linked' | 'none' | 'error';

interface State {
    loading: boolean;
    revenue: StatsRevenue | null;
    bank: BankDetails | null;
    bankStatus: BankStatus;
}

export const useRevenueData = (range: DateRangeKey) => {
    const [state, setState] = useState<State>({ loading: true, revenue: null, bank: null, bankStatus: 'none' });

    const load = useCallback(async () => {
        setState((s) => ({ ...s, loading: true }));
        const [revenue, bank] = await Promise.allSettled([getStatsRevenue(range), getBankDetails()]);
        setState({
            loading: false,
            revenue: revenue.status === 'fulfilled' ? revenue.value : null,
            bank: bank.status === 'fulfilled' ? bank.value : null,
            bankStatus: bank.status === 'rejected' ? 'error' : bank.value ? 'linked' : 'none',
        });
    }, [range]);

    useEffect(() => {
        load();
    }, [load]);

    const saveBank = async (data: UpdateBankPayload, cheque?: File): Promise<boolean> => {
        try {
            const bank = await updateBankDetails(data, cheque);
            setState((s) => ({ ...s, bank, bankStatus: 'linked' }));
            return true;
        } catch {
            return false;
        }
    };

    return { loading: state.loading, revenue: state.revenue, bank: state.bank, bankStatus: state.bankStatus, reload: load, saveBank };
};
