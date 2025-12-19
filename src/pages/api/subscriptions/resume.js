import { withAuth } from '../../../lib/middleware';
import { supabase } from '../../../lib/supabase';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

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

        const resumed = await stripe.subscriptions.update(
            subscription.stripe_subscription_id,
            { cancel_at_period_end: false }
        );

        await supabase
            .from('subscriptions')
            .update({ cancel_at_period_end: false })
            .eq('id', subscription.id);

        res.status(200).json({
            message: 'Subscription resumed successfully',
            subscription: {
                id: subscription.id,
                status: resumed.status,
                cancelAtPeriodEnd: resumed.cancel_at_period_end,
                currentPeriodEnd: new Date(resumed.current_period_end * 1000)
            }
        });
    } catch (error) {
        console.error('Resume subscription error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});
