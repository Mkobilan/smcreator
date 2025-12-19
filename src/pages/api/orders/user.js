import { supabase } from '../../../lib/supabase';
import { withAuth } from '../../../lib/middleware';

export default withAuth(async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ message: 'Method not allowed' });
    }

    try {
        const userId = req.user.id;
        const { page = 1, limit = 10 } = req.query;
        const offset = (page - 1) * limit;

        const { data: orders, count, error } = await supabase
            .from('orders')
            .select('*, order_items(*)', { count: 'exact' })
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .range(offset, offset + limit - 1);

        if (error) throw error;

        res.status(200).json({
            orders,
            totalPages: Math.ceil(count / limit),
            currentPage: parseInt(page),
            totalOrders: count
        });
    } catch (error) {
        console.error('Get user orders error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});
