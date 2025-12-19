import Stripe from 'stripe';
import { handleWebhookEvent } from '../../../lib/stripe';
import { buffer } from 'micro';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export const config = {
    api: {
        bodyParser: false,
    },
};

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method not allowed' });
    }

    const sig = req.headers['stripe-signature'];
    const buf = await buffer(req);

    try {
        const event = stripe.webhooks.constructEvent(
            buf,
            sig,
            process.env.STRIPE_WEBHOOK_SECRET
        );

        await handleWebhookEvent(event);

        res.status(200).json({ received: true });
    } catch (err) {
        console.error(`Webhook Error: ${err.message}`);
        res.status(400).send(`Webhook Error: ${err.message}`);
    }
}
