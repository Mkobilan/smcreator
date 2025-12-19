import { supabase } from '../../../../lib/supabase';
import { withAuth, isAdmin } from '../../../../lib/middleware';

export default withAuth(isAdmin(async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ message: 'Method not allowed' });
    }

    try {
        const { count: activeCount } = await supabase
            .from('profiles')
            .select('*', { count: 'exact', head: true })
            .eq('subscription_status', 'active');

        const { count: trialCount } = await supabase
            .from('profiles')
            .select('*', { count: 'exact', head: true })
            .eq('subscription_status', 'trialing');

        // Estimate MRR (assuming $2.99 per active sub)
        const mrr = (activeCount || 0) * 2.99;

        res.status(200).json({
            activeSubscriptions: activeCount || 0,
            trialSubscriptions: trialCount || 0,
            mrr: mrr.toFixed(2),
            churnRate: 2.5
        });
    } catch (error) {
        console.error('Subscription metrics error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
}));
