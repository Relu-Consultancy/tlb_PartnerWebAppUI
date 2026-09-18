import { useCallback, useEffect, useState } from 'react';
import { getStatsRevenue, StatsRevenue } from '../../api/stats';
import { getBankDetails, updateBankDetails, BankDetails, UpdateBankPayload } from '../../api/banking';
import { DateRangeKey } from '../../constants/dateRange';

interface State {
    loading: boolean;
    revenue: StatsRevenue | null;
    bank: BankDetails | null;
}

export const useRevenueData = (range: DateRangeKey) => {
    const [state, setState] = useState<State>({ loading: true, revenue: null, bank: null });

    const load = useCallback(async () => {
        setState(s => ({ ...s, loading: true }));
        const [revenue, bank] = await Promise.allSettled([getStatsRevenue(range), getBankDetails()]);
        setState({
            loading: false,
            revenue: revenue.status === 'fulfilled' ? revenue.value : null,
            bank: bank.status === 'fulfilled' ? bank.value : null,
        });
    }, [range]);

    useEffect(() => { load(); }, [load]);

    const saveBank = async (data: UpdateBankPayload, cheque?: File): Promise<boolean> => {
        try {
            const bank = await updateBankDetails(data, cheque);
            setState(s => ({ ...s, bank }));
            return true;
        } catch {
            return false;
        }
    };

    return { loading: state.loading, revenue: state.revenue, bank: state.bank, reload: load, saveBank };
};
