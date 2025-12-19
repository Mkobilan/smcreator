import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import axios from 'axios';
import { useQuery } from 'react-query';
import { useAuth } from '../context/AuthContext';
import { VideoCameraIcon, ShoppingBagIcon, CreditCardIcon } from '@heroicons/react/24/outline';

// Fetch featured videos
const fetchFeaturedVideos = async () => {
  const { data } = await axios.get('/api/videos?featured=true&limit=3');
  return data.videos;
};

// Fetch featured products
const fetchFeaturedProducts = async () => {
  const { data } = await axios.get('/api/products?featured=true&limit=4');
  return data.products;
};

export default function Home() {
  const { isAuthenticated } = useAuth();

  // Fetch featured videos
  const {
    data: featuredVideos = [],
    isLoading: isLoadingVideos
  } = useQuery('featuredVideos', fetchFeaturedVideos, {
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: 1,
    onError: (error) => console.error('Error fetching featured videos:', error)
  });

  // Fetch featured products
  const {
    data: featuredProducts = [],
    isLoading: isLoadingProducts
  } = useQuery('featuredProducts', fetchFeaturedProducts, {
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: 1,
    onError: (error) => console.error('Error fetching featured products:', error)
  });

  return (
    <div>
      {/* Hero Section */}
      <div className="relative bg-gray-900">
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-r from-primary-800 to-secondary-800 mix-blend-multiply" />
        </div>
        <div className="relative max-w-7xl mx-auto py-24 px-4 sm:py-32 sm:px-6 lg:px-8">
          <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl lg:text-6xl">
            Premium Video Content & Canvas Prints
          </h1>
          <p className="mt-6 max-w-3xl text-xl text-gray-300">
            Subscribe for exclusive video content and shop our collection of high-quality canvas prints.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row gap-4">
            <Link
              href="/videos"
              className="btn btn-primary text-base px-8 py-3"
            >
              Browse Videos
            </Link>
            <Link
              href="/shop"
              className="btn btn-outline text-white border-white hover:bg-white hover:text-gray-900 text-base px-8 py-3"
            >
              Shop Canvas Prints
            </Link>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
              Why Choose Us
            </h2>
            <p className="mt-4 max-w-2xl text-xl text-gray-500 mx-auto">
              Premium content, quality products, and exceptional service.
            </p>
          </div>

          <div className="mt-16">
            <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
              <div className="bg-gray-50 p-6 rounded-lg shadow-sm">
                <div className="flex items-center justify-center h-12 w-12 rounded-md bg-primary-600 text-white">
                  <VideoCameraIcon className="h-6 w-6" aria-hidden="true" />
                </div>
                <h3 className="mt-5 text-lg font-medium text-gray-900">Exclusive Video Content</h3>
                <p className="mt-2 text-base text-gray-500">
                  Access premium videos with our monthly subscription. New content added regularly.
                </p>
              </div>

              <div className="bg-gray-50 p-6 rounded-lg shadow-sm">
                <div className="flex items-center justify-center h-12 w-12 rounded-md bg-primary-600 text-white">
                  <ShoppingBagIcon className="h-6 w-6" aria-hidden="true" />
                </div>
                <h3 className="mt-5 text-lg font-medium text-gray-900">High-Quality Canvas Prints</h3>
                <p className="mt-2 text-base text-gray-500">
                  Shop our collection of beautiful canvas prints, perfect for your home or office.
                </p>
              </div>

              <div className="bg-gray-50 p-6 rounded-lg shadow-sm">
                <div className="flex items-center justify-center h-12 w-12 rounded-md bg-primary-600 text-white">
                  <CreditCardIcon className="h-6 w-6" aria-hidden="true" />
                </div>
                <h3 className="mt-5 text-lg font-medium text-gray-900">Flexible Subscription</h3>
                <p className="mt-2 text-base text-gray-500">
                  Cancel anytime. No long-term commitment required. Affordable monthly pricing.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Featured Videos Section */}
      <div className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <h2 className="text-3xl font-extrabold text-gray-900">Featured Videos</h2>
            <Link href="/videos" className="text-primary-600 hover:text-primary-700">
              View all videos
            </Link>
          </div>

          <div className="mt-8">
            {isLoadingVideos ? (
              <div className="flex justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
                {featuredVideos.map((video) => (
                  <div key={video.id} className="card">
                    <div className="relative aspect-w-16 aspect-h-9">
                      <div className="absolute inset-0 bg-gray-300">
                        {video.thumbnailUrl ? (
                          <Image
                            src={video.thumbnailUrl}
                            alt={video.title}
                            fill
                            className="object-cover"
                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                          />
                        ) : (
                          <div className="absolute inset-0 flex items-center justify-center bg-gray-200">
                            <div className="flex flex-col items-center justify-center">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                            </div>
                          </div>
                        )}
                      </div>
                      {video.isExclusive && (
                        <div className="absolute top-2 right-2 bg-secondary-600 text-white text-xs px-2 py-1 rounded">
                          Exclusive
                        </div>
                      )}
                    </div>
                    <div className="p-4">
                      <h3 className="text-lg font-medium text-gray-900">{video.title}</h3>
                      <p className="mt-1 text-sm text-gray-500 line-clamp-2">{video.description}</p>
                      <div className="mt-4">
                        <Link
                          href={`/videos/${video.id}`}
                          className="text-primary-600 hover:text-primary-700"
                        >
                          {video.isExclusive && !isAuthenticated
                            ? 'Subscribe to watch'
                            : 'Watch now'}
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Featured Products Section */}
      <div className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <h2 className="text-3xl font-extrabold text-gray-900">Featured Canvas Prints</h2>
            <Link href="/shop" className="text-primary-600 hover:text-primary-700">
              View all products
            </Link>
          </div>

          <div className="mt-8">
            {isLoadingProducts ? (
              <div className="flex justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
                {featuredProducts.map((product) => (
                  <div key={product.id} className="card">
                    <div className="relative aspect-w-1 aspect-h-1" style={{ height: '300px' }}>
                      <div className="absolute inset-0 bg-gray-200">
                        {product.imageUrl ? (
                          <Image
                            src={product.imageUrl}
                            alt={product.title}
                            fill
                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                            className="object-contain"
                          />
                        ) : (
                          <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
                            <div className="flex flex-col items-center justify-center">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                              <p className="mt-2 text-sm text-gray-500">Canvas Print</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="p-4">
                      <h3 className="text-lg font-medium text-gray-900">{product.title}</h3>
                      <p className="mt-1 text-sm text-gray-500 line-clamp-2">{product.description}</p>
                      <div className="mt-2 flex justify-between items-center">
                        <p className="text-lg font-medium text-gray-900">${product.price.toFixed(2)}</p>
                        <Link
                          href={`/shop/${product.id}`}
                          className="text-primary-600 hover:text-primary-700"
                        >
                          View details
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-primary-700">
        <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:py-16 lg:px-8 lg:flex lg:items-center lg:justify-between">
          <h2 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
            <span className="block">Ready to get started?</span>
            <span className="block text-primary-200">Subscribe today for exclusive content.</span>
          </h2>
          <div className="mt-8 flex lg:mt-0 lg:flex-shrink-0">
            <div className="inline-flex rounded-md shadow">
              <Link
                href="/subscription"
                className="btn bg-white text-primary-600 hover:bg-primary-50 px-6 py-3"
              >
                Get Started
              </Link>
            </div>
            <div className="ml-3 inline-flex rounded-md shadow">
              <Link
                href="/videos"
                className="btn bg-primary-600 text-white hover:bg-primary-800 px-6 py-3"
              >
                Learn More
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
