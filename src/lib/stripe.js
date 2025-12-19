import Stripe from 'stripe';
import { getServiceSupabase } from './supabase';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Create a Stripe customer
export const createCustomer = async (user) => {
    try {
        const customer = await stripe.customers.create({
            email: user.email,
            name: `${user.first_name} ${user.last_name}`,
            metadata: {
                userId: user.id
            }
        });

        // Update profile with Stripe customer ID using service role
        const supabase = getServiceSupabase();
        await supabase.from('profiles')
            .update({ stripe_customer_id: customer.id })
            .eq('id', user.id);

        return customer;
    } catch (error) {
        console.error('Error creating Stripe customer:', error);
        throw error;
    }
};

// Create a subscription
export const createSubscription = async (userId, paymentMethodId, priceId) => {
    try {
        const supabase = getServiceSupabase();

        // Get profile
        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single();

        if (profileError || !profile) {
            throw new Error('Profile not found');
        }

        let customerId = profile.stripe_customer_id;

        // If user doesn't have a Stripe customer ID, create one
        if (!customerId) {
            const { data: { user } } = await supabase.auth.admin.getUserById(userId);
            const customer = await createCustomer({ ...user, ...profile });
            customerId = customer.id;
        }

        // Attach payment method to customer
        await stripe.paymentMethods.attach(paymentMethodId, {
            customer: customerId,
        });

        // Set as default payment method
        await stripe.customers.update(customerId, {
            invoice_settings: {
                default_payment_method: paymentMethodId,
            },
        });

        // Create subscription
        const subscription = await stripe.subscriptions.create({
            customer: customerId,
            items: [{ price: priceId }],
            expand: ['latest_invoice.payment_intent'],
        });

        // Save subscription details to Supabase
        await supabase.from('subscriptions').insert({
            user_id: userId,
            stripe_subscription_id: subscription.id,
            stripe_price_id: priceId,
            status: subscription.status,
            current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
            cancel_at_period_end: subscription.cancel_at_period_end
        });

        // Update profile subscription status
        await supabase.from('profiles')
            .update({
                subscription_status: subscription.status,
                subscription_end_date: new Date(subscription.current_period_end * 1000).toISOString()
            })
            .eq('id', userId);

        return subscription;
    } catch (error) {
        console.error('Error creating subscription:', error);
        throw error;
    }
};

// Cancel a subscription
export const cancelSubscription = async (subscriptionId) => {
    try {
        const subscription = await stripe.subscriptions.update(subscriptionId, {
            cancel_at_period_end: true
        });

        const supabase = getServiceSupabase();

        // Update subscription in database
        await supabase.from('subscriptions')
            .update({
                status: subscription.status,
                cancel_at_period_end: true
            })
            .eq('stripe_subscription_id', subscriptionId);

        // Get user ID from subscription
        const { data: dbSubscription } = await supabase.from('subscriptions')
            .select('user_id')
            .eq('stripe_subscription_id', subscriptionId)
            .single();

        if (dbSubscription) {
            // Update profile subscription status
            await supabase.from('profiles')
                .update({ subscription_status: 'canceled' })
                .eq('id', dbSubscription.user_id);
        }

        return subscription;
    } catch (error) {
        console.error('Error canceling subscription:', error);
        throw error;
    }
};

export const handleWebhookEvent = async (event) => {
    const supabase = getServiceSupabase();
    let subscription;

    switch (event.type) {
        case 'customer.subscription.created':
        case 'customer.subscription.updated':
        case 'customer.subscription.deleted':
            subscription = event.data.object;
            await updateSubscriptionStatus(subscription);
            break;
        case 'invoice.payment_succeeded':
            const invoice = event.data.object;
            if (invoice.subscription) {
                subscription = await stripe.subscriptions.retrieve(invoice.subscription);
                await updateSubscriptionStatus(subscription);
            }
            break;
    }
};

const updateSubscriptionStatus = async (subscription) => {
    try {
        const supabase = getServiceSupabase();

        // Update subscription in database
        await supabase.from('subscriptions')
            .update({
                status: subscription.status,
                current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
                cancel_at_period_end: subscription.cancel_at_period_end
            })
            .eq('stripe_subscription_id', subscription.id);

        // Find user_id
        const { data: dbSub } = await supabase.from('subscriptions')
            .select('user_id')
            .eq('stripe_subscription_id', subscription.id)
            .single();

        if (dbSub) {
            await supabase.from('profiles')
                .update({
                    subscription_status: subscription.status,
                    subscription_end_date: new Date(subscription.current_period_end * 1000).toISOString()
                })
                .eq('id', dbSub.user_id);
        }
    } catch (error) {
        console.error('Error updating subscription status:', error);
    }
};
