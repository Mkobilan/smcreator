import { supabase } from '../../../lib/supabase';
import { getSignedUrl } from '../../../lib/storage';
import { withAuth, isAdmin } from '../../../lib/middleware';

export default async function handler(req, res) {
    if (req.method === 'GET') {
        return handleGet(req, res);
    } else if (req.method === 'DELETE') {
        return withAuth(isAdmin(handleDelete))(req, res);
    } else {
        return res.status(405).json({ message: 'Method not allowed' });
    }
}

async function handleDelete(req, res) {
    const { id } = req.query;
    try {
        const { data: video, error: fetchError } = await supabase
            .from('videos')
            .select('url')
            .eq('id', id)
            .single();

        if (fetchError || !video) {
            return res.status(404).json({ message: 'Video not found' });
        }

        const { error: deleteError } = await supabase
            .from('videos')
            .delete()
            .eq('id', id);

        if (deleteError) throw deleteError;

        const fileName = video.url.split('/').pop();
        if (fileName) {
            await supabase.storage.from('videos').remove([`videos/${fileName}`]);
        }

        res.status(200).json({ message: 'Video deleted successfully' });
    } catch (error) {
        console.error('Delete video error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
}

async function handleGet(req, res) {
    const { id } = req.query;
    try {
        const { data: video, error } = await supabase
            .from('videos')
            .select('*, profiles!videos_uploaded_by_fkey(id, first_name, last_name), tags(id, name)')
            .eq('id', id)
            .single();

        if (error || !video) {
            return res.status(404).json({ message: 'Video not found' });
        }

        // Generate signed URL
        if (video.url) {
            const signedUrl = await getSignedUrl('videos', video.url);
            video.signedUrl = signedUrl;
        }

        // Access check logic here if needed, or rely on RLS
        res.status(200).json({ video });
    } catch (error) {
        console.error('Get video error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
}
