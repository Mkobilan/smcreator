import { withAuth } from '../../../lib/middleware';
import { cancelSubscription } from '../../../lib/stripe';
import { supabase } from '../../../lib/supabase';

export default withAuth(async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method not allowed' });
    }

    try {
        const userId = req.user.id;

        const { data: subscription, error } = await supabase
            .from('subscriptions')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

        if (error || !subscription) {
            return res.status(404).json({ message: 'No subscription found' });
        }

        const canceled = await cancelSubscription(subscription.stripe_subscription_id);

        res.status(200).json({
            message: 'Subscription canceled successfully',
            subscription: {
                id: subscription.id,
                status: canceled.status,
                cancelAtPeriodEnd: canceled.cancel_at_period_end,
                currentPeriodEnd: new Date(canceled.current_period_end * 1000)
            }
        });
    } catch (error) {
        console.error('Cancel subscription error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});
