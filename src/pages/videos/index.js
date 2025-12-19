import { useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Image from 'next/image';
import axios from 'axios';
import { useQuery } from 'react-query';
import { useAuth } from '../../context/AuthContext';

// Fetch videos with filtering and pagination
const fetchVideos = async ({ queryKey }) => {
  const [_, filters] = queryKey;
  const { page, limit, tag, search, sort } = filters;

  const params = new URLSearchParams();
  if (page) params.append('page', page);
  if (limit) params.append('limit', limit);
  if (tag) params.append('tag', tag);
  if (search) params.append('search', search);
  if (sort) params.append('sort', sort);

  const { data } = await axios.get(`/api/videos?${params.toString()}`);
  return data;
};

// Fetch all tags
const fetchTags = async () => {
  const { data } = await axios.get('/api/videos/tags');
  return data.tags;
};

export default function Videos() {
  const router = useRouter();
  const { isAuthenticated, user } = useAuth();

  // Filter and pagination state
  const [filters, setFilters] = useState({
    page: 1,
    limit: 12,
    tag: '',
    search: '',
    sort: 'newest'
  });

  // Fetch videos
  const {
    data: videosData,
    isLoading: isLoadingVideos,
    error: videosError
  } = useQuery(['videos', filters], fetchVideos, {
    keepPreviousData: true,
    staleTime: 1000 * 60 * 5 // 5 minutes
  });

  // Fetch tags
  const {
    data: tags = [],
    isLoading: isLoadingTags
  } = useQuery('videoTags', fetchTags, {
    staleTime: 1000 * 60 * 30 // 30 minutes
  });

  // Handle search
  const handleSearch = (e) => {
    e.preventDefault();
    setFilters(prev => ({ ...prev, page: 1, search: e.target.search.value }));
  };

  // Handle tag filter
  const handleTagFilter = (tag) => {
    setFilters(prev => ({ ...prev, page: 1, tag: prev.tag === tag ? '' : tag }));
  };

  // Handle sort change
  const handleSortChange = (e) => {
    setFilters(prev => ({ ...prev, sort: e.target.value }));
  };

  // Handle pagination
  const handlePageChange = (newPage) => {
    setFilters(prev => ({ ...prev, page: newPage }));
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Videos</h1>
          <p className="mt-1 text-sm text-gray-500">
            Browse our collection of videos. Subscribe for exclusive content.
          </p>
        </div>

        {/* Search form */}
        <form onSubmit={handleSearch} className="mt-4 md:mt-0 flex">
          <input
            type="text"
            name="search"
            placeholder="Search videos..."
            className="form-input rounded-l-md"
            defaultValue={filters.search}
          />
          <button
            type="submit"
            className="btn btn-primary rounded-l-none"
          >
            Search
          </button>
        </form>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row justify-between mb-6">
        {/* Tags filter */}
        <div className="mb-4 md:mb-0">
          <h2 className="text-sm font-medium text-gray-700 mb-2">Filter by tag:</h2>
          <div className="flex flex-wrap gap-2">
            {isLoadingTags ? (
              <div className="text-sm text-gray-500">Loading tags...</div>
            ) : (
              tags.map(tag => (
                <button
                  key={tag.id}
                  onClick={() => handleTagFilter(tag.name)}
                  className={`px-3 py-1 rounded-full text-sm ${filters.tag === tag.name
                      ? 'bg-primary-100 text-primary-800 border border-primary-300'
                      : 'bg-gray-100 text-gray-800 border border-gray-200 hover:bg-gray-200'
                    }`}
                >
                  {tag.name}
                </button>
              ))
            )}
          </div>
        </div>

        {/* Sort options */}
        <div>
          <label htmlFor="sort" className="text-sm font-medium text-gray-700 mr-2">
            Sort by:
          </label>
          <select
            id="sort"
            name="sort"
            className="form-input"
            value={filters.sort}
            onChange={handleSortChange}
          >
            <option value="newest">Newest</option>
            <option value="oldest">Oldest</option>
            <option value="popular">Most Popular</option>
            <option value="title">Title (A-Z)</option>
          </select>
        </div>
      </div>

      {/* Videos grid */}
      {isLoadingVideos ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
        </div>
      ) : videosError ? (
        <div className="bg-red-50 p-4 rounded-md">
          <p className="text-red-800">Error loading videos. Please try again later.</p>
        </div>
      ) : videosData?.videos.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">No videos found matching your criteria.</p>
          <button
            onClick={() => setFilters({ page: 1, limit: 12, tag: '', search: '', sort: 'newest' })}
            className="mt-4 btn btn-outline"
          >
            Clear filters
          </button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {videosData?.videos.map(video => (
              <Link key={video.id} href={`/videos/${video.id}`} className="block w-full h-full">
                <div className="h-full bg-white rounded-lg shadow overflow-hidden flex flex-col transition-transform hover:scale-[1.02] hover:shadow-lg">
                  <div className="relative w-full pb-[56.25%]">
                    {video.thumbnailUrl ? (
                      <img
                        src={video.thumbnailUrl}
                        alt={video.title}
                        className="absolute inset-0 w-full h-full object-cover"
                      />
                    ) : (
                      <div className="absolute inset-0 w-full h-full flex items-center justify-center bg-gray-200">
                        <div className="flex flex-col items-center justify-center">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                      </div>
                    )}
                    {/* Remove duplicate exclusive tag */}
                    <div className="absolute inset-0 bg-black bg-opacity-20 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                      <span className="btn btn-primary">
                        {video.isExclusive && (!isAuthenticated || !['active', 'trialing'].includes(user?.subscriptionStatus))
                          ? 'Subscribe to watch'
                          : 'Watch now'}
                      </span>
                    </div>
                    {video.isExclusive && (
                      <div className="absolute bottom-2 left-2 flex items-center bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                        Premium
                      </div>
                    )}
                  </div>
                  <div className="p-4 flex-grow flex flex-col justify-between">
                    <div>
                      <h3 className="text-lg font-medium text-gray-900 mb-1 line-clamp-1">{video.title}</h3>
                      <p className="text-sm text-gray-500 line-clamp-2 mb-2">{video.description}</p>
                    </div>
                    <div className="flex justify-between items-center text-xs text-gray-500 mt-2">
                      <span>{new Date(video.createdAt).toLocaleDateString()}</span>
                      <span>{video.views} views</span>
                    </div>
                    {video.tags && video.tags.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {video.tags.map(tag => (
                          <span
                            key={tag.id}
                            className="inline-block bg-gray-100 text-gray-800 text-xs px-2 py-0.5 rounded"
                          >
                            {tag.name}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {/* Pagination */}
          {videosData?.totalPages > 1 && (
            <div className="flex justify-center mt-8">
              <nav className="inline-flex rounded-md shadow">
                <button
                  onClick={() => handlePageChange(filters.page - 1)}
                  disabled={filters.page === 1}
                  className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                {[...Array(videosData.totalPages)].map((_, i) => (
                  <button
                    key={i}
                    onClick={() => handlePageChange(i + 1)}
                    className={`relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium ${filters.page === i + 1
                        ? 'bg-primary-50 text-primary-600 z-10'
                        : 'text-gray-500 hover:bg-gray-50'
                      }`}
                  >
                    {i + 1}
                  </button>
                ))}
                <button
                  onClick={() => handlePageChange(filters.page + 1)}
                  disabled={filters.page === videosData.totalPages}
                  className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </nav>
            </div>
          )}
        </>
      )}

      {/* Subscription CTA for non-subscribers */}
      {!isAuthenticated && (
        <div className="mt-12 bg-primary-50 border border-primary-100 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-primary-800 mb-2">
            Subscribe for Exclusive Content
          </h2>
          <p className="text-primary-700 mb-4">
            Get access to our exclusive videos and premium content with a monthly subscription.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <Link href="/subscription" className="btn btn-primary">
              View Subscription Plans
            </Link>
            <Link href="/login" className="btn btn-outline">
              Sign In
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
