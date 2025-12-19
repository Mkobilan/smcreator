import { createPagesServerClient } from '@supabase/auth-helpers-nextjs';

export const withAuth = (handler) => async (req, res) => {
    const supabase = createPagesServerClient({ req, res });

    const {
        data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
        return res.status(401).json({ message: 'Unauthorized' });
    }

    // Fetch profile to check role and subscription
    const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();

    req.user = { ...session.user, ...profile };

    return handler(req, res);
};

export const withAdmin = (handler) => async (req, res) => {
    return withAuth(async (req, res) => {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Forbidden: Admin access required' });
        }
        return handler(req, res);
    })(req, res);
};

export const withSubscription = (handler) => async (req, res) => {
    return withAuth(async (req, res) => {
        if (!['active', 'trialing'].includes(req.user.subscription_status)) {
            return res.status(403).json({ message: 'Forbidden: Active subscription required' });
        }
        return handler(req, res);
    })(req, res);
};
