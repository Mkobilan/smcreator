import { supabase } from '../../../lib/supabase';
import { withAuth, isAdmin } from '../../../lib/middleware';

export default withAuth(isAdmin(async function handler(req, res) {
    if (req.method !== 'PUT') {
        return res.status(405).json({ message: 'Method not allowed' });
    }

    const { id } = req.query;
    const { status } = req.body;

    try {
        const { data, error } = await supabase
            .from('contact_messages')
            .update({ status })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;

        res.status(200).json({ message: 'Status updated successfully', data });
    } catch (error) {
        console.error('Update message status error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
}));
