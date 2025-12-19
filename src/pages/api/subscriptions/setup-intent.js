import { withAuth } from '../../../lib/middleware';
import { createCustomer } from '../../../lib/stripe';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export default withAuth(async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method not allowed' });
    }

    try {
        let customerId = req.user.stripe_customer_id;

        if (!customerId) {
            const customer = await createCustomer(req.user);
            customerId = customer.id;
        }

        const setupIntent = await stripe.setupIntents.create({
            customer: customerId,
            payment_method_types: ['card'],
        });

        res.status(200).json({
            clientSecret: setupIntent.client_secret
        });
    } catch (error) {
        console.error('Setup intent error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});
