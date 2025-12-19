import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import axios from 'axios';
import { useQuery } from 'react-query';
import ReactPlayer from 'react-player';
import { useAuth } from '../../context/AuthContext';
import {
  ClockIcon,
  TagIcon,
  EyeIcon,
  CalendarIcon,
  LockClosedIcon
} from '@heroicons/react/24/outline';

// Fetch video by ID
const fetchVideo = async (id) => {
  try {
    const { data } = await axios.get(`/api/videos/${id}`);
    return data.video;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to fetch video');
  }
};

// Fetch related videos
const fetchRelatedVideos = async (id, tags) => {
  try {
    // Create query params with tags
    const params = new URLSearchParams();
    if (tags && tags.length > 0) {
      const tagNames = tags.map(tag => tag.name).join(',');
      params.append('tags', tagNames);
    }
    params.append('limit', 4);
    params.append('exclude', id);

    const { data } = await axios.get(`/api/videos?${params.toString()}`);
    return data.videos;
  } catch (error) {
    console.error('Error fetching related videos:', error);
    return [];
  }
};

export default function VideoDetail() {
  const router = useRouter();
  const { id } = router.query;
  const { isAuthenticated, user } = useAuth();
  const [isPlaying, setIsPlaying] = useState(false);

  // Fetch video data
  const {
    data: video,
    isLoading,
    error,
    refetch
  } = useQuery(['video', id], () => fetchVideo(id), {
    enabled: !!id,
    retry: 1
  });

  // Fetch related videos when video data is available
  const {
    data: relatedVideos = [],
    isLoading: isLoadingRelated
  } = useQuery(
    ['relatedVideos', id, video?.tags],
    () => fetchRelatedVideos(id, video?.tags),
    {
      enabled: !!video && !!video.tags,
      staleTime: 1000 * 60 * 5 // 5 minutes
    }
  );

  // Check if user can access this video
  const canAccessVideo = () => {
    if (!video) return false;
    if (!video.isExclusive) return true;
    if (!isAuthenticated) return false;

    // Check if user has active subscription
    return user?.subscriptionStatus === 'active' || user?.subscriptionStatus === 'trialing';
  };

  // Handle video start
  const handleVideoStart = async () => {
    try {
      // Increment view count - this could be a PATCH in Supabase or a specific API route
      await axios.patch(`/api/videos/${id}/view`);
      // Refetch to update view count
      refetch();
    } catch (error) {
      console.error('Error incrementing view count:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-red-50 p-4 rounded-md">
          <h2 className="text-lg font-medium text-red-800">Error</h2>
          <p className="mt-1 text-sm text-red-700">{error.message}</p>
          <div className="mt-4">
            <Link href="/videos" className="btn btn-outline">
              Back to Videos
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!video) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900">Video not found</h2>
          <p className="mt-2 text-gray-600">The video you're looking for doesn't exist or has been removed.</p>
          <div className="mt-6">
            <Link href="/videos" className="btn btn-primary">
              Browse Videos
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-4">
        <Link href="/videos" className="text-primary-600 hover:text-primary-700 flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
          </svg>
          Back to Videos
        </Link>
      </div>

      {/* Video player section */}
      <div className="bg-black rounded-lg overflow-hidden">
        {canAccessVideo() ? (
          <div className="aspect-w-16 aspect-h-9">
            {/* Debug info - remove in production */}
            <div className="bg-gray-800 text-white p-4 mb-2 text-xs overflow-auto max-h-40">
              <p><strong>Debug Info:</strong></p>
              <p>Video URL: {video.signedUrl || video.s3Url || 'No URL available'}</p>
              {video.debug && (
                <>
                  <p>Original URL: {video.debug.originalUrl}</p>
                  <p>Extracted Key: {video.debug.extractedKey}</p>
                  <p>Signed URL: {video.debug.signedUrl}</p>
                </>
              )}
            </div>

            <ReactPlayer
              url={video.signedUrl || video.s3Url}
              width="100%"
              height="100%"
              controls
              playing={isPlaying}
              onStart={handleVideoStart}
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
              onError={(e) => console.error('ReactPlayer error:', e)}
              config={{
                file: {
                  forceVideo: true,
                  attributes: {
                    crossOrigin: 'anonymous'
                  },
                  hlsOptions: {
                    xhrSetup: function (xhr, url) {
                      xhr.withCredentials = false;
                    }
                  },
                  forceHLS: false,
                  forceDASH: false
                }
              }}
            />
          </div>
        ) : (
          <div className="aspect-w-16 aspect-h-9 relative">
            {/* Show video thumbnail as background if available */}
            <div className="absolute inset-0 bg-black">
              {video.thumbnailUrl && (
                <img
                  src={video.thumbnailUrl}
                  alt={video.title}
                  className="w-full h-full object-cover opacity-50"
                />
              )}
            </div>

            {/* Premium content overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent flex flex-col items-center justify-center text-white z-10">
              <div className="bg-black bg-opacity-70 p-6 rounded-lg max-w-md text-center">
                <div className="inline-flex items-center justify-center p-2 bg-primary-600 rounded-full mb-4">
                  <LockClosedIcon className="h-8 w-8" />
                </div>
                <h3 className="text-2xl font-bold mb-2">Premium Content</h3>
                <p className="text-gray-300 mb-6 text-center">
                  This exclusive video is only available to our subscribers.
                  {!isAuthenticated
                    ? 'Sign in or subscribe to watch.'
                    : 'Upgrade your account to unlock this content.'}
                </p>
                <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4 justify-center">
                  <Link href="/subscription" className="btn btn-primary w-full sm:w-auto">
                    {isAuthenticated ? 'Upgrade Now' : 'Subscribe Now'}
                  </Link>
                  {!isAuthenticated && (
                    <Link href="/login" className="btn btn-outline text-white border-white hover:bg-white hover:text-gray-900 w-full sm:w-auto">
                      Sign In
                    </Link>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Video details */}
      <div className="mt-6">
        <h1 className="text-3xl font-bold text-gray-900">{video.title}</h1>

        <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-gray-500">
          <div className="flex items-center">
            <CalendarIcon className="h-4 w-4 mr-1" />
            <span>{new Date(video.createdAt).toLocaleDateString()}</span>
          </div>
          <div className="flex items-center">
            <EyeIcon className="h-4 w-4 mr-1" />
            <span>{video.views} views</span>
          </div>
          {video.duration && (
            <div className="flex items-center">
              <ClockIcon className="h-4 w-4 mr-1" />
              <span>{video.duration}</span>
            </div>
          )}
          {video.isExclusive && (
            <span className="bg-secondary-100 text-secondary-800 text-xs px-2 py-1 rounded-full">
              Exclusive
            </span>
          )}
        </div>

        {/* Tags */}
        {video.tags && video.tags.length > 0 && (
          <div className="mt-4 flex items-center">
            <TagIcon className="h-5 w-5 text-gray-400 mr-2" />
            <div className="flex flex-wrap gap-2">
              {video.tags.map(tag => (
                <Link
                  key={tag.id}
                  href={`/videos?tag=${tag.name}`}
                  className="bg-gray-100 hover:bg-gray-200 text-gray-800 text-sm px-3 py-1 rounded-full"
                >
                  {tag.name}
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Description */}
        <div className="mt-6 prose prose-primary max-w-none">
          <p className="text-gray-700">{video.description}</p>
        </div>
      </div>

      {/* Related videos */}
      {relatedVideos.length > 0 && (
        <div className="mt-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Related Videos</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {relatedVideos.map(relatedVideo => (
              <Link
                key={relatedVideo.id}
                href={`/videos/${relatedVideo.id}`}
                className="card overflow-hidden hover:shadow-md transition-shadow"
              >
                <div className="relative aspect-w-16 aspect-h-9">
                  <div className="absolute inset-0 bg-gray-300">
                    {relatedVideo.thumbnailUrl && (
                      <img
                        src={relatedVideo.thumbnailUrl}
                        alt={relatedVideo.title}
                        className="object-cover w-full h-full"
                      />
                    )}
                  </div>
                  {relatedVideo.isExclusive && (
                    <div className="absolute top-2 right-2 bg-secondary-600 text-white text-xs px-2 py-1 rounded">
                      Exclusive
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <h3 className="text-lg font-medium text-gray-900 line-clamp-2">{relatedVideo.title}</h3>
                  <p className="mt-1 text-sm text-gray-500 line-clamp-2">{relatedVideo.description}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Subscription CTA for non-subscribers */}
      {video.isExclusive && !canAccessVideo() && (
        <div className="mt-12 bg-primary-50 border border-primary-100 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-primary-800 mb-2">
            Subscribe to Watch This Video
          </h2>
          <p className="text-primary-700 mb-4">
            Get access to this video and all our exclusive content with a monthly subscription.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <Link href="/subscription" className="btn btn-primary">
              View Subscription Plans
            </Link>
            {!isAuthenticated && (
              <Link href="/login" className="btn btn-outline">
                Sign In
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
