import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ message: 'Method not allowed' });
    }

    try {
        const products = await stripe.products.list({
            active: true,
            expand: ['data.default_price']
        });

        const plans = products.data
            .filter(product => product.default_price)
            .map(product => {
                const price = product.default_price;
                let features = [];
                if (product.metadata && product.metadata.features) {
                    try {
                        features = JSON.parse(product.metadata.features);
                    } catch (e) {
                        features = product.metadata.features.split(',').map(f => f.trim());
                    }
                }

                if (features.length === 0) {
                    features.push('Access to exclusive content');
                }

                return {
                    id: product.id,
                    name: product.name,
                    description: product.description || '',
                    priceId: price.id,
                    price: price.unit_amount / 100,
                    currency: price.currency,
                    interval: price.recurring?.interval || 'month',
                    features: features
                };
            });

        if (plans.length === 0) {
            // Fallback plan logic from controller
            plans.push({
                id: 'prod_SbY9KDnAiFVej2',
                name: 'Exclusive Content Subscription',
                description: 'Access to exclusive content',
                priceId: 'price_1RgL2yK1JuQJRnYFwaZc2Qr4',
                price: 2.99,
                currency: 'usd',
                interval: 'month',
                features: ['Access to exclusive content', 'Monthly updates']
            });
        }

        res.status(200).json({ plans });
    } catch (error) {
        console.error('Get plans error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
}
