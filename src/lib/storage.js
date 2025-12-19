import { supabase } from './supabase';

/**
 * Get a signed URL for a file in Supabase Storage
 * @param {string} bucket - The storage bucket
 * @param {string} path - The file path in the bucket
 * @param {number} expiresIn - Expiration time in seconds
 * @returns {Promise<string>} - The signed URL
 */
export const getSignedUrl = async (bucket, path, expiresIn = 3600) => {
    try {
        const { data, error } = await supabase.storage
            .from(bucket)
            .createSignedUrl(path, expiresIn);

        if (error) throw error;
        return data.signedUrl;
    } catch (error) {
        console.error(`Error generating signed URL for ${path}:`, error);
        return null;
    }
};

/**
 * Upload a file to Supabase Storage
 * @param {string} bucket - The storage bucket
 * @param {string} path - The file path in the bucket
 * @param {File|Buffer} file - The file content
 * @returns {Promise<string>} - The public URL or path
 */
export const uploadFile = async (bucket, path, file) => {
    try {
        const { data, error } = await supabase.storage
            .from(bucket)
            .upload(path, file, {
                cacheControl: '3600',
                upsert: false
            });

        if (error) throw error;
        return data.path;
    } catch (error) {
        console.error(`Error uploading file to ${path}:`, error);
        throw error;
    }
};

/**
 * Delete a file from Supabase Storage
 * @param {string} bucket - The storage bucket
 * @param {string[]} paths - Array of file paths to delete
 */
export const deleteFiles = async (bucket, paths) => {
    try {
        const { data, error } = await supabase.storage
            .from(bucket)
            .remove(paths);

        if (error) throw error;
        return data;
    } catch (error) {
        console.error(`Error deleting files from ${bucket}:`, error);
        throw error;
    }
};
