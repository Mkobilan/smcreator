import { supabase } from '../../../lib/supabase';
import { withAuth } from '../../../lib/middleware';

export default async function handler(req, res) {
    if (req.method === 'GET') {
        return handleGet(req, res);
    } else if (req.method === 'POST') {
        return withAuth(isAdmin(handlePost))(req, res);
    } else {
        return res.status(405).json({ message: 'Method not allowed' });
    }
}

import { isAdmin } from '../../../lib/middleware';

async function handlePost(req, res) {
    try {
        const { title, description, isExclusive, url, thumbnailUrl, tags } = req.body;

        const { data: video, error } = await supabase
            .from('videos')
            .insert({
                title,
                description,
                is_exclusive: isExclusive,
                url,
                thumbnail_url: thumbnailUrl,
                uploaded_by: req.user.id
            })
            .select()
            .single();

        if (error) throw error;

        // If tags are provided, link them
        if (tags && Array.isArray(tags)) {
            // Logic for tags would go here (fetch/create tags and then insert into video_tags)
        }

        res.status(201).json({ video });
    } catch (error) {
        console.error('Create video error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
}

async function handleGet(req, res) {
    try {
        const { page = 1, limit = 10, tag, exclusive, admin } = req.query;
        const offset = (page - 1) * limit;

        let query = supabase
            .from('videos')
            .select('*, profiles!videos_uploaded_by_fkey(id, first_name, last_name), tags(id, name)', { count: 'exact' });

        // Apply filters
        if (exclusive === 'true') {
            query = query.eq('is_exclusive', true);
        } else if (exclusive === 'false') {
            query = query.eq('is_exclusive', false);
        }

        if (tag) {
            // Filter by tag requires a junction table check
            // This is a bit complex in Supabase select, often better to query tags first or use join
            query = query.filter('tags.name', 'eq', tag);
        }

        const { data: videos, count, error } = await query
            .order('created_at', { ascending: false })
            .range(offset, offset + limit - 1);

        if (error) throw error;

        res.status(200).json({
            videos,
            totalPages: Math.ceil(count / limit),
            currentPage: parseInt(page),
            totalVideos: count
        });
    } catch (error) {
        console.error('Get videos error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
}
