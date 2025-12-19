import { supabase } from '../../../lib/supabase';
import { withAuth } from '../../../lib/middleware';

export default withAuth(async function handler(req, res) {
    if (req.method !== 'PUT') {
        return res.status(405).json({ message: 'Method not allowed' });
    }

    try {
        const { firstName, lastName } = req.body;
        const userId = req.user.id;

        const { data, error } = await supabase
            .from('profiles')
            .update({
                first_name: firstName,
                last_name: lastName,
                updated_at: new Date().toISOString()
            })
            .eq('id', userId)
            .select()
            .single();

        if (error) throw error;

        res.status(200).json({
            message: 'Profile updated successfully',
            user: {
                ...req.user,
                firstName: data.first_name,
                lastName: data.last_name
            }
        });
    } catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});
