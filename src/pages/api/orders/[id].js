import { supabase } from '../../../lib/supabase';
import { withAuth } from '../../../lib/middleware';
import { getOrder as getPrintifyOrder } from '../../../lib/printify';

export default withAuth(async function handler(req, res) {
    const { id } = req.query;

    if (req.method !== 'GET') {
        return res.status(405).json({ message: 'Method not allowed' });
    }

    try {
        const { data: order, error } = await supabase
            .from('orders')
            .select('*, order_items(*)')
            .eq('id', id)
            .single();

        if (error || !order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        // Auth check
        if (req.user.role !== 'admin' && order.user_id !== req.user.id) {
            return res.status(403).json({ message: 'Unauthorized' });
        }

        // Fetch live Printify status if available
        if (order.printify_order_id) {
            try {
                const pOrder = await getPrintifyOrder(process.env.PRINTIFY_SHOP_ID, order.printify_order_id);
                order.printifyDetails = pOrder;
            } catch (e) {
                console.error('Error fetching Printify details:', e);
            }
        }

        res.status(200).json({ order });
    } catch (error) {
        console.error('Get order error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});
