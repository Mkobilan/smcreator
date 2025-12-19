import { supabase } from '../../../lib/supabase';
import { withAuth } from '../../../lib/middleware';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export default withAuth(async function handler(req, res) {
    if (req.method !== 'GET') {
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
            .maybeSingle();

        if (!subscription) {
            return res.status(200).json({ subscription: null, message: 'No active subscription found' });
        }

        // Get live status from Stripe
        const stripeSubscription = await stripe.subscriptions.retrieve(subscription.stripe_subscription_id);
        const product = await stripe.products.retrieve(stripeSubscription.items.data[0].price.product);

        const subscriptionData = {
            id: subscription.id,
            stripeId: subscription.stripe_subscription_id,
            status: stripeSubscription.status,
            currentPeriodEnd: new Date(stripeSubscription.current_period_end * 1000),
            cancelAtPeriodEnd: stripeSubscription.cancel_at_period_end,
            plan: {
                id: product.id,
                name: product.name,
                amount: stripeSubscription.items.data[0].price.unit_amount / 100,
                currency: stripeSubscription.items.data[0].price.currency,
                interval: stripeSubscription.items.data[0].price.recurring.interval
            }
        };

        res.status(200).json({ subscription: subscriptionData });
    } catch (error) {
        console.error('Get subscription error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});
