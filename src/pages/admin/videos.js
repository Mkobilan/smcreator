import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../../context/AuthContext';
import AdminLayout from '../../components/layouts/AdminLayout';
import axios from 'axios';
import { uploadFile, getPublicUrl } from '../../lib/storage';
import { supabase } from '../../lib/supabase';

export default function AdminVideosPage() {
  const router = useRouter();
  const { isAuthenticated, isAdmin, loading } = useAuth();
  const [videos, setVideos] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [newVideo, setNewVideo] = useState({
    title: '',
    description: '',
    isExclusive: false,
    file: null
  });

  useEffect(() => {
    // Redirect if not authenticated or not admin
    if (!loading && (!isAuthenticated || !isAdmin)) {
      router.push('/login');
    } else if (isAuthenticated && isAdmin) {
      fetchVideos();
    }
  }, [isAuthenticated, isAdmin, loading, router]);

  const fetchVideos = async () => {
    try {
      setIsLoading(true);
      const { data } = await axios.get('/api/videos'); // Admin will see all if backend is updated
      setVideos(data.videos);
      setIsLoading(false);
    } catch (err) {
      console.error('Error fetching videos:', err);
      setError('Failed to load videos. Please try again later.');
      setIsLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked, files } = e.target;

    if (type === 'file') {
      setNewVideo({
        ...newVideo,
        file: files[0]
      });
    } else if (type === 'checkbox') {
      setNewVideo({
        ...newVideo,
        [name]: checked
      });
    } else {
      setNewVideo({
        ...newVideo,
        [name]: value
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!newVideo.title || !newVideo.description || !newVideo.file) {
      setError('Please fill in all required fields');
      return;
    }

    try {
      setIsUploading(true);
      setUploadProgress(10);

      const file = newVideo.file;
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `videos/${fileName}`;

      // 1. Upload video directly to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('videos')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      setUploadProgress(70);

      // 2. Get public URL
      const { data: { publicUrl: videoUrl } } = supabase.storage
        .from('videos')
        .getPublicUrl(filePath);

      // 3. Save metadata to DB via API
      await axios.post('/api/videos', {
        title: newVideo.title,
        description: newVideo.description,
        isExclusive: newVideo.isExclusive,
        url: videoUrl,
        // For now we skip thumbnail or let user upload it later
        thumbnailUrl: null
      });

      setUploadProgress(100);
      setIsUploading(false);
      setUploadProgress(0);
      setNewVideo({
        title: '',
        description: '',
        isExclusive: false,
        file: null
      });

      // Refresh video list
      fetchVideos();
    } catch (err) {
      console.error('Error uploading video:', err);
      setError(err.message || 'Failed to upload video. Please try again later.');
      setIsUploading(false);
    }
  };

  const handleDeleteVideo = async (videoId) => {
    if (window.confirm('Are you sure you want to delete this video?')) {
      try {
        await axios.delete(`/api/videos/${videoId}`);
        // Refresh video list
        fetchVideos();
      } catch (err) {
        console.error('Error deleting video:', err);
        setError('Failed to delete video. Please try again later.');
      }
    }
  };

  // Show loading state while checking authentication
  if (loading || !isAuthenticated || !isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-lg">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <AdminLayout>
      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
          <h1 className="text-2xl font-semibold text-gray-900">Video Management</h1>

          {error && (
            <div className="mt-4 bg-red-50 p-4 rounded-md">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* Upload Form */}
          <div className="mt-6 bg-white shadow overflow-hidden sm:rounded-lg">
            <div className="px-4 py-5 sm:px-6">
              <h2 className="text-lg font-medium text-gray-900">Upload New Video</h2>
              <p className="mt-1 text-sm text-gray-500">Upload videos to your platform. Supported formats: MP4, WebM.</p>
            </div>
            <div className="border-t border-gray-200 px-4 py-5 sm:p-6">
              <form onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                  <div className="sm:col-span-3">
                    <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                      Title *
                    </label>
                    <div className="mt-1">
                      <input
                        type="text"
                        name="title"
                        id="title"
                        value={newVideo.title}
                        onChange={handleInputChange}
                        className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                        required
                      />
                    </div>
                  </div>

                  <div className="sm:col-span-6">
                    <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                      Description *
                    </label>
                    <div className="mt-1">
                      <textarea
                        id="description"
                        name="description"
                        rows={3}
                        value={newVideo.description}
                        onChange={handleInputChange}
                        className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                        required
                      />
                    </div>
                  </div>

                  <div className="sm:col-span-6">
                    <label htmlFor="videoFile" className="block text-sm font-medium text-gray-700">
                      Video File *
                    </label>
                    <div className="mt-1">
                      <input
                        type="file"
                        id="videoFile"
                        name="videoFile"
                        accept="video/mp4,video/webm"
                        onChange={handleInputChange}
                        className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                        required
                      />
                    </div>
                    <p className="mt-2 text-sm text-gray-500">
                      Max file size: 500MB. Supported formats: MP4, WebM.
                    </p>
                  </div>

                  <div className="sm:col-span-6">
                    <div className="flex items-start">
                      <div className="flex items-center h-5">
                        <input
                          id="isExclusive"
                          name="isExclusive"
                          type="checkbox"
                          checked={newVideo.isExclusive}
                          onChange={handleInputChange}
                          className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300 rounded"
                        />
                      </div>
                      <div className="ml-3 text-sm">
                        <label htmlFor="isExclusive" className="font-medium text-gray-700">
                          Exclusive Content
                        </label>
                        <p className="text-gray-500">
                          Mark this video as exclusive (only available to subscribers)
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {isUploading && (
                  <div className="mt-6">
                    <div className="relative pt-1">
                      <div className="flex mb-2 items-center justify-between">
                        <div>
                          <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-blue-600 bg-blue-200">
                            Uploading
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="text-xs font-semibold inline-block text-blue-600">
                            {uploadProgress}%
                          </span>
                        </div>
                      </div>
                      <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-blue-200">
                        <div
                          style={{ width: `${uploadProgress}%` }}
                          className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-blue-500"
                        ></div>
                      </div>
                    </div>
                  </div>
                )}

                <div className="mt-6">
                  <button
                    type="submit"
                    disabled={isUploading}
                    className={`inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white ${isUploading ? 'bg-gray-400' : 'bg-blue-600 hover:bg-blue-700'
                      } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
                  >
                    {isUploading ? 'Uploading...' : 'Upload Video'}
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Video List */}
          <div className="mt-8">
            <h2 className="text-lg font-medium text-gray-900">Uploaded Videos</h2>

            {isLoading ? (
              <div className="mt-4 flex justify-center">
                <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : videos.length === 0 ? (
              <div className="mt-4 bg-white shadow overflow-hidden sm:rounded-lg px-4 py-5 sm:p-6">
                <p className="text-gray-500">No videos uploaded yet.</p>
              </div>
            ) : (
              <div className="mt-4 flex flex-col">
                <div className="-my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
                  <div className="py-2 align-middle inline-block min-w-full sm:px-6 lg:px-8">
                    <div className="shadow overflow-hidden border-b border-gray-200 sm:rounded-lg">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Title
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Status
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Views
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Uploaded
                            </th>
                            <th scope="col" className="relative px-6 py-3">
                              <span className="sr-only">Actions</span>
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {videos.map((video) => (
                            <tr key={video.id}>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center">
                                  <div className="flex-shrink-0 h-10 w-10 bg-gray-200 rounded">
                                    {video.thumbnailUrl && (
                                      <img
                                        className="h-10 w-10 rounded object-cover"
                                        src={video.thumbnailUrl}
                                        alt=""
                                      />
                                    )}
                                  </div>
                                  <div className="ml-4">
                                    <div className="text-sm font-medium text-gray-900">{video.title}</div>
                                    <div className="text-sm text-gray-500 truncate max-w-xs">{video.description}</div>
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${video.isExclusive
                                    ? 'bg-purple-100 text-purple-800'
                                    : 'bg-green-100 text-green-800'
                                  }`}>
                                  {video.isExclusive ? 'Exclusive' : 'Public'}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {video.views || 0}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {new Date(video.createdAt).toLocaleDateString()}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                <button
                                  onClick={() => handleDeleteVideo(video.id)}
                                  className="text-red-600 hover:text-red-900"
                                >
                                  Delete
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
