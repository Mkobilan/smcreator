import { supabase } from '../../../lib/supabase';
import { withAuth } from '../../../lib/middleware';
import Stripe from 'stripe';
import { createOrder as createPrintifyOrder } from '../../../lib/printify';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export default withAuth(async function handler(req, res) {
    if (req.method === 'POST') {
        return handlePost(req, res);
    } else if (req.method === 'GET') {
        // Admin only listing could go here or separate route
        return res.status(405).json({ message: 'Method not allowed' });
    } else {
        return res.status(405).json({ message: 'Method not allowed' });
    }
});

async function handlePost(req, res) {
    try {
        const { items, shippingAddress, paymentMethodId } = req.body;
        const userId = req.user.id;

        if (!items || !Array.isArray(items) || items.length === 0) {
            return res.status(400).json({ message: 'No items provided' });
        }

        // 1. Calculate total and validate products
        let totalAmount = 0;
        const printifyItems = [];
        const validItems = [];

        for (const item of items) {
            const { data: product, error: pError } = await supabase
                .from('products')
                .select('*')
                .eq('id', item.productId)
                .single();

            if (pError || !product) {
                throw new Error(`Product not found: ${item.productId}`);
            }

            totalAmount += product.price * item.quantity;

            validItems.push({
                product_id: product.id,
                quantity: item.quantity,
                price: product.price,
                title: product.title,
                image_url: product.image_url,
                variant_id: product.printify_id // Assuming printify_id stores the variant id
            });

            printifyItems.push({
                product_id: product.printify_id, // This should be the printify product id if different
                variant_id: product.printify_id, // Assuming it's the variant
                quantity: item.quantity
            });
        }

        // 2. Process Stripe Payment
        const paymentIntent = await stripe.paymentIntents.create({
            amount: Math.round(totalAmount * 100),
            currency: 'usd',
            customer: req.user.stripe_customer_id,
            payment_method: paymentMethodId,
            confirm: true,
            description: 'Canvas print order',
            automatic_payment_methods: {
                enabled: true,
                allow_redirects: 'never'
            }
        });

        // 3. Create Order in Supabase
        const { data: order, error: oError } = await supabase
            .from('orders')
            .insert({
                user_id: userId,
                status: 'pending',
                total_amount: totalAmount,
                stripe_payment_id: paymentIntent.id,
                shipping_address: shippingAddress
            })
            .select()
            .single();

        if (oError) throw oError;

        // 4. Create Order Items
        const orderItemsToInsert = validItems.map(item => ({
            order_id: order.id,
            product_id: item.product_id,
            quantity: item.quantity,
            price: item.price,
            title: item.title,
            image_url: item.image_url,
            variant_id: item.variant_id
        }));

        const { error: itemsError } = await supabase
            .from('order_items')
            .insert(orderItemsToInsert);

        if (itemsError) throw itemsError;

        // 5. Create Order in Printify
        try {
            const pOrder = await createPrintifyOrder(process.env.PRINTIFY_SHOP_ID, {
                external_id: order.id,
                line_items: printifyItems,
                shipping_method: 1,
                shipping_address: {
                    first_name: shippingAddress.firstName,
                    last_name: shippingAddress.lastName,
                    address1: shippingAddress.address1,
                    address2: shippingAddress.address2 || '',
                    city: shippingAddress.city,
                    state: shippingAddress.state,
                    country: shippingAddress.country,
                    zip: shippingAddress.zip,
                    phone: shippingAddress.phone,
                    email: req.user.email
                }
            });

            // Update order with Printify ID
            await supabase
                .from('orders')
                .update({ printify_order_id: pOrder.id, status: 'processing' })
                .eq('id', order.id);

        } catch (pError) {
            console.error('Printify order creation failed, will retry via cron:', pError);
            // We don't fail the whole request here as payment is already taken
        }

        res.status(201).json({
            message: 'Order created successfully',
            orderId: order.id
        });

    } catch (error) {
        console.error('Create order error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
}
