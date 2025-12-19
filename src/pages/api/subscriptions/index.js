import { withAuth } from '../../../lib/middleware';
import { createSubscription } from '../../../lib/stripe';

export default withAuth(async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method not allowed' });
    }

    try {
        const { paymentMethodId, priceId } = req.body;
        const userId = req.user.id;

        const subscription = await createSubscription(userId, paymentMethodId, priceId);

        res.status(201).json({
            message: 'Subscription created successfully',
            subscription: {
                id: subscription.id,
                status: subscription.status,
                currentPeriodEnd: new Date(subscription.current_period_end * 1000),
                cancelAtPeriodEnd: subscription.cancel_at_period_end
            }
        });
    } catch (error) {
        console.error('Create subscription error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});
