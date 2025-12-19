import { supabase } from '../../../lib/supabase';
import { withAuth, isAdmin } from '../../../lib/middleware';

export default withAuth(isAdmin(async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ message: 'Method not allowed' });
    }

    try {
        const { periodDays = 30 } = req.query;
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - periodDays);

        // 1. Subscription Growth Trend
        // In a real app, you'd query a subscription_events table. 
        // Here we'll use profiles' created_at for those with subscriptions as a proxy or just mock trend.
        const { data: growthData } = await supabase
            .from('profiles')
            .select('created_at')
            .not('subscription_status', 'eq', 'none')
            .gte('created_at', startDate.toISOString());

        // Aggregate by day
        const growthByDay = {};
        growthData?.forEach(p => {
            const date = p.created_at.split('T')[0];
            growthByDay[date] = (growthByDay[date] || 0) + 1;
        });

        const subscriptionGrowth = Object.entries(growthByDay).map(([date, count]) => ({
            date,
            count
        })).sort((a, b) => a.date.localeCompare(b.date));

        // 2. Subscriptions by Status
        const { data: statusData } = await supabase
            .from('profiles')
            .select('subscription_status');

        const subscriptionsByStatus = {
            active: 0,
            trialing: 0,
            past_due: 0,
            canceled: 0,
            incomplete: 0
        };

        statusData?.forEach(p => {
            if (subscriptionsByStatus.hasOwnProperty(p.subscription_status)) {
                subscriptionsByStatus[p.subscription_status]++;
            }
        });

        // 3. Retention Rate (Mocked for now as we don't have historical churn data easily)
        const retentionRate = {
            totalSubscriptions: statusData?.length || 0,
            retainedSubscriptions: statusData?.filter(p => p.subscription_status === 'active').length || 0,
            retentionRate: statusData?.length ? Math.round((statusData.filter(p => p.subscription_status === 'active').length / statusData.length) * 100) : 0
        };

        res.status(200).json({
            subscriptionGrowth,
            subscriptionsByStatus,
            retentionRate,
            conversionRate: { conversionRate: 15 } // Mocked
        });
    } catch (error) {
        console.error('Subscription analytics error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
}));
