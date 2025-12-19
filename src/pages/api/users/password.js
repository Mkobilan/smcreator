import { supabase } from '../../../lib/supabase';
import { withAuth } from '../../../lib/middleware';

export default withAuth(async function handler(req, res) {
    if (req.method !== 'PUT') {
        return res.status(405).json({ message: 'Method not allowed' });
    }

    try {
        const { newPassword } = req.body;

        const { error } = await supabase.auth.updateUser({
            password: newPassword
        });

        if (error) throw error;

        res.status(200).json({
            message: 'Password updated successfully'
        });
    } catch (error) {
        console.error('Update password error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});
