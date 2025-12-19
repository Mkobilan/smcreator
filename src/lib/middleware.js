import { createServerClient } from '@supabase/ssr';
import { serialize } from 'cookie';

export const withAuth = (handler) => async (req, res) => {
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        {
            cookies: {
                getAll() {
                    return Object.keys(req.cookies).map((name) => ({ name, value: req.cookies[name] }));
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value, options }) => {
                        res.appendHeader('Set-Cookie', serialize(name, value, options));
                    });
                },
            },
        }
    );

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

export const isAdmin = withAdmin;

export const withSubscription = (handler) => async (req, res) => {
    return withAuth(async (req, res) => {
        if (!['active', 'trialing'].includes(req.user.subscription_status)) {
            return res.status(403).json({ message: 'Forbidden: Active subscription required' });
        }
        return handler(req, res);
    })(req, res);
};
