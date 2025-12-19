import { supabase } from '../../../lib/supabase';

export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ message: 'Method not allowed' });
    }

    try {
        const { data: tags, error } = await supabase
            .from('tags')
            .select('id, name')
            .order('name', { ascending: true });

        if (error) throw error;
        res.status(200).json({ tags });
    } catch (error) {
        console.error('Get tags error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
}
