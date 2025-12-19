import { useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Image from 'next/image';
import axios from 'axios';
import { useQuery } from 'react-query';
import { useCart } from '../../context/CartContext';
import { ShoppingCartIcon, AdjustmentsHorizontalIcon } from '@heroicons/react/24/outline';

// Fetch products with filtering and pagination
const fetchProducts = async ({ queryKey }) => {
  const [_, filters] = queryKey;
  const { page, limit, category, search, sort, priceRange } = filters;

  const params = new URLSearchParams();
  if (page) params.append('page', page);
  if (limit) params.append('limit', limit);
  if (category) params.append('category', category);
  if (search) params.append('search', search);
  if (sort) params.append('sort', sort);
  if (priceRange && priceRange.min) params.append('minPrice', priceRange.min);
  if (priceRange && priceRange.max) params.append('maxPrice', priceRange.max);

  const { data } = await axios.get(`/api/products?${params.toString()}`);
  return data;
};

// Fetch categories
const fetchCategories = async () => {
  const { data } = await axios.get('/api/products/categories');
  return data.categories;
};

export default function Shop() {
  const router = useRouter();
  const { addToCart } = useCart();

  // Filter and pagination state
  const [filters, setFilters] = useState({
    page: 1,
    limit: 12,
    category: '',
    search: '',
    sort: 'newest',
    priceRange: { min: '', max: '' }
  });

  // Mobile filter visibility
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  // Fetch products
  const {
    data: productsData,
    isLoading: isLoadingProducts,
    error: productsError
  } = useQuery(['products', filters], fetchProducts, {
    keepPreviousData: true,
    staleTime: 1000 * 60 * 5 // 5 minutes
  });

  // Fetch categories
  const {
    data: categories = [],
    isLoading: isLoadingCategories
  } = useQuery('productCategories', fetchCategories, {
    staleTime: 1000 * 60 * 30 // 30 minutes
  });

  // Handle search
  const handleSearch = (e) => {
    e.preventDefault();
    setFilters(prev => ({ ...prev, page: 1, search: e.target.search.value }));
  };

  // Handle category filter
  const handleCategoryFilter = (category) => {
    setFilters(prev => ({ ...prev, page: 1, category: prev.category === category ? '' : category }));
  };

  // Handle sort change
  const handleSortChange = (e) => {
    setFilters(prev => ({ ...prev, sort: e.target.value }));
  };

  // Handle price range change
  const handlePriceRangeChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      priceRange: { ...prev.priceRange, [name]: value }
    }));
  };

  // Apply price filter
  const applyPriceFilter = () => {
    setFilters(prev => ({ ...prev, page: 1 }));
  };

  // Handle pagination
  const handlePageChange = (newPage) => {
    setFilters(prev => ({ ...prev, page: newPage }));
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Handle add to cart
  const handleAddToCart = (product) => {
    addToCart({
      id: product.id,
      title: product.title,
      price: product.price,
      imageUrl: product.imageUrl,
      quantity: 1,
      // Default to first variant if available
      variantId: product.variants && product.variants.length > 0 ? product.variants[0].id : null
    });

    // Show confirmation toast or modal
    // For now, just redirect to product detail page
    router.push(`/shop/${product.id}`);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Canvas Prints</h1>
          <p className="mt-1 text-sm text-gray-500">
            Browse our collection of high-quality canvas prints for your home or office.
          </p>
        </div>

        {/* Search form */}
        <form onSubmit={handleSearch} className="mt-4 md:mt-0 flex">
          <input
            type="text"
            name="search"
            placeholder="Search products..."
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

      {/* Mobile filter dialog */}
      <div className="lg:hidden mb-4">
        <button
          type="button"
          className="flex items-center text-gray-700 hover:text-gray-900"
          onClick={() => setMobileFiltersOpen(!mobileFiltersOpen)}
        >
          <AdjustmentsHorizontalIcon className="h-5 w-5 mr-2" />
          <span>Filters</span>
        </button>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Filters sidebar */}
        <div className={`lg:w-64 ${mobileFiltersOpen ? 'block' : 'hidden'} lg:block`}>
          <div className="sticky top-20">
            <div className="bg-white p-4 rounded-lg shadow-sm mb-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Categories</h2>
              <div className="space-y-2">
                {isLoadingCategories ? (
                  <div className="text-sm text-gray-500">Loading categories...</div>
                ) : (
                  categories.map(category => (
                    <div key={category} className="flex items-center">
                      <button
                        onClick={() => handleCategoryFilter(category)}
                        className={`text-sm ${filters.category === category
                            ? 'font-medium text-primary-600'
                            : 'text-gray-600 hover:text-gray-900'
                          }`}
                      >
                        {category}
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="bg-white p-4 rounded-lg shadow-sm mb-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Price Range</h2>
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <span className="text-gray-500">$</span>
                  <input
                    type="number"
                    name="min"
                    placeholder="Min"
                    className="form-input w-full"
                    value={filters.priceRange.min}
                    onChange={handlePriceRangeChange}
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-gray-500">$</span>
                  <input
                    type="number"
                    name="max"
                    placeholder="Max"
                    className="form-input w-full"
                    value={filters.priceRange.max}
                    onChange={handlePriceRangeChange}
                  />
                </div>
                <button
                  type="button"
                  onClick={applyPriceFilter}
                  className="btn btn-outline w-full"
                >
                  Apply
                </button>
              </div>
            </div>

            <div className="bg-white p-4 rounded-lg shadow-sm">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Sort By</h2>
              <select
                className="form-input w-full"
                value={filters.sort}
                onChange={handleSortChange}
              >
                <option value="newest">Newest</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
                <option value="popular">Most Popular</option>
                <option value="title">Name (A-Z)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Products grid */}
        <div className="flex-1">
          {isLoadingProducts ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
            </div>
          ) : productsError ? (
            <div className="bg-red-50 p-4 rounded-md">
              <p className="text-red-800">Error loading products. Please try again later.</p>
            </div>
          ) : productsData?.products.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">No products found matching your criteria.</p>
              <button
                onClick={() => setFilters({
                  page: 1,
                  limit: 12,
                  category: '',
                  search: '',
                  sort: 'newest',
                  priceRange: { min: '', max: '' }
                })}
                className="mt-4 btn btn-outline"
              >
                Clear filters
              </button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {productsData?.products.map(product => (
                  <div key={product.id} className="card overflow-hidden flex flex-col">
                    <Link href={`/shop/${product.id}`} className="block">
                      <div className="relative aspect-w-1 aspect-h-1" style={{ height: '300px' }}>
                        <div className="absolute inset-0 bg-gray-200">
                          {product.imageUrl && (
                            <Image
                              src={product.imageUrl}
                              alt={product.title}
                              fill
                              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                              className="object-cover"
                            />
                          )}
                        </div>
                      </div>
                    </Link>
                    <div className="p-4 flex-grow flex flex-col">
                      <Link href={`/shop/${product.id}`} className="block">
                        <h3 className="text-lg font-medium text-gray-900 hover:text-primary-600 mb-1">
                          {product.title}
                        </h3>
                      </Link>
                      <p className="text-sm text-gray-500 line-clamp-2 mb-4 flex-grow">
                        {product.description}
                      </p>
                      <div className="flex justify-between items-center">
                        <span className="text-lg font-medium text-gray-900">
                          ${product.price.toFixed(2)}
                        </span>
                        <button
                          onClick={() => handleAddToCart(product)}
                          className="btn btn-primary btn-sm flex items-center"
                        >
                          <ShoppingCartIcon className="h-4 w-4 mr-1" />
                          Add to Cart
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {productsData?.totalPages > 1 && (
                <div className="flex justify-center mt-8">
                  <nav className="inline-flex rounded-md shadow">
                    <button
                      onClick={() => handlePageChange(filters.page - 1)}
                      disabled={filters.page === 1}
                      className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Previous
                    </button>
                    {[...Array(productsData.totalPages)].map((_, i) => (
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
                      disabled={filters.page === productsData.totalPages}
                      className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next
                    </button>
                  </nav>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
