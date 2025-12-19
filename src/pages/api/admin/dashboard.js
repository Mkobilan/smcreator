import { supabase } from '../../../lib/supabase';
import { withAuth, isAdmin } from '../../../lib/middleware';

export default withAuth(isAdmin(async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ message: 'Method not allowed' });
    }

    try {
        // 1. Get User stats
        const { count: totalUsers } = await supabase
            .from('profiles')
            .select('*', { count: 'exact', head: true });

        const { count: activeSubscribers } = await supabase
            .from('profiles')
            .select('*', { count: 'exact', head: true })
            .in('subscription_status', ['active', 'trialing']);

        // 2. Get Video stats
        const { count: totalVideos } = await supabase
            .from('videos')
            .select('*', { count: 'exact', head: true });

        const { count: exclusiveVideos } = await supabase
            .from('videos')
            .select('*', { count: 'exact', head: true })
            .eq('is_exclusive', true);

        // 3. Get Product stats (mocked as Printify handles it usually, but we might track some in DB)
        const { count: totalProducts } = await supabase
            .from('products')
            .select('*', { count: 'exact', head: true });

        // 4. Get Order stats
        const { count: totalOrders } = await supabase
            .from('orders')
            .select('*', { count: 'exact', head: true });

        const { count: pendingOrders } = await supabase
            .from('orders')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'pending');

        // 5. Get Revenue
        const { data: revenueData } = await supabase
            .from('orders')
            .select('total_amount')
            .eq('status', 'completed');

        const totalRevenue = revenueData?.reduce((sum, order) => sum + Number(order.total_amount), 0) || 0;

        // 6. Recent Activity
        const { data: recentOrders } = await supabase
            .from('orders')
            .select('*, user: profiles(first_name, last_name)')
            .order('created_at', { ascending: false })
            .limit(5);

        const { data: recentUsers } = await supabase
            .from('profiles')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(5);

        res.status(200).json({
            users: { total: totalUsers || 0, activeSubscribers: activeSubscribers || 0 },
            videos: { total: totalVideos || 0, exclusive: exclusiveVideos || 0 },
            products: { total: totalProducts || 0, active: totalProducts || 0 },
            orders: {
                total: totalOrders || 0,
                pending: pendingOrders || 0,
                processing: totalOrders - pendingOrders || 0
            },
            revenue: { total: totalRevenue },
            recentOrders: recentOrders?.map(o => ({
                ...o,
                totalAmount: Number(o.total_amount),
                user: { firstName: o.user?.first_name, lastName: o.user?.last_name }
            })) || [],
            recentUsers: recentUsers?.map(u => ({
                ...u,
                firstName: u.first_name,
                lastName: u.last_name,
                subscriptionStatus: u.subscription_status
            })) || []
        });
    } catch (error) {
        console.error('Dashboard stats error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
}));
