import { supabase } from '../../lib/supabase';
import { withAuth, isAdmin } from '../../lib/middleware';

export default async function handler(req, res) {
    if (req.method === 'GET') {
        return withAuth(isAdmin(handleGet))(req, res);
    } else if (req.method === 'POST') {
        return handlePost(req, res);
    } else {
        return res.status(405).json({ message: 'Method not allowed' });
    }
}

async function handleGet(req, res) {
    try {
        const { data: messages, error } = await supabase
            .from('contact_messages')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;

        res.status(200).json({
            messages: messages.map(m => ({
                ...m,
                createdAt: m.created_at
            }))
        });
    } catch (error) {
        console.error('Get contact messages error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
}

async function handlePost(req, res) {
    try {
        const { name, email, subject, message } = req.body;

        if (!name || !email || !message) {
            return res.status(400).json({ message: 'Missing required fields' });
        }

        const { data, error } = await supabase
            .from('contact_messages')
            .insert({
                name,
                email,
                subject,
                message
            })
            .select()
            .single();

        if (error) throw error;

        res.status(201).json({ message: 'Message sent successfully', data });
    } catch (error) {
        console.error('Submit contact message error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
}
