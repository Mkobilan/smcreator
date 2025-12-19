import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Image from 'next/image';
import axios from 'axios';
import { useQuery } from 'react-query';
import { useCart } from '../../context/CartContext';
import {
  ShoppingCartIcon,
  TruckIcon,
  ShieldCheckIcon,
  ArrowPathIcon,
  CheckIcon
} from '@heroicons/react/24/outline';

// Fetch product by ID
const fetchProduct = async (id) => {
  try {
    const { data } = await axios.get(`/api/products/${id}`);
    return data.product;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to fetch product');
  }
};

// Fetch shipping estimates
const fetchShippingEstimates = async (productId, variantId) => {
  try {
    const { data } = await axios.get(
      `/api/products/shipping?productId=${productId}&variantId=${variantId}`
    );
    return data.shippingEstimates;
  } catch (error) {
    console.error('Error fetching shipping estimates:', error);
    return [];
  }
};

// Fetch related products
const fetchRelatedProducts = async (id, category) => {
  try {
    const params = new URLSearchParams();
    if (category) {
      params.append('category', category);
    }
    params.append('limit', 4);
    params.append('exclude', id);

    const { data } = await axios.get(`/api/products?${params.toString()}`);
    return data.products;
  } catch (error) {
    console.error('Error fetching related products:', error);
    return [];
  }
};

export default function ProductDetail() {
  const router = useRouter();
  const { id } = router.query;
  const { addToCart, isInCart, updateQuantity } = useCart();

  // Product state
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [addedToCart, setAddedToCart] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [variantImages, setVariantImages] = useState([]);
  const [allProductImages, setAllProductImages] = useState([]);

  // Fetch product data
  const {
    data: product,
    isLoading,
    error
  } = useQuery(['product', id], () => fetchProduct(id), {
    enabled: !!id,
    retry: 1,
    onSuccess: (data) => {
      // Store all product images
      if (data.images && data.images.length > 0) {
        setAllProductImages(data.images);
      }

      // Set default variant
      if (data.variants && data.variants.length > 0) {
        const defaultVariant = data.variants[0];
        setSelectedVariant(defaultVariant);

        // Filter images for the default variant
        if (data.images && data.images.length > 0) {
          // Use the filterImagesForVariant helper function
          const filteredImages = filterImagesForVariant(defaultVariant, data.images);
          setVariantImages(filteredImages);
        }
      }
    }
  });

  // Fetch shipping estimates when variant is selected
  const {
    data: shippingEstimates = [],
    isLoading: isLoadingShipping
  } = useQuery(
    ['shipping', id, selectedVariant?.id],
    () => fetchShippingEstimates(id, selectedVariant?.id),
    {
      enabled: !!id && !!selectedVariant?.id,
      staleTime: 1000 * 60 * 5 // 5 minutes
    }
  );

  // Fetch related products when product data is available
  const {
    data: relatedProducts = [],
    isLoading: isLoadingRelated
  } = useQuery(
    ['relatedProducts', id, product?.category],
    () => fetchRelatedProducts(id, product?.category),
    {
      enabled: !!product && !!product.category,
      staleTime: 1000 * 60 * 5 // 5 minutes
    }
  );

  // Helper function to extract size from variant name
  const extractSizeFromVariantName = (variantName) => {
    // Check if variantName is defined
    if (!variantName) return '';

    // Try to extract dimensions like 12×16, 8x10, etc.
    const dimensionMatch = variantName.match(/\d+[×x]\d+/);
    if (dimensionMatch) {
      // Convert 'x' to the proper '×' character if needed
      return dimensionMatch[0].replace('x', '×');
    }

    // Try to extract dimensions with other formats (e.g., "12 x 16", "12in x 16in")
    const spacedDimensionMatch = variantName.match(/\d+\s*[x×]\s*\d+/);
    if (spacedDimensionMatch) {
      // Clean up and standardize format
      return spacedDimensionMatch[0].replace(/\s+/g, '').replace('x', '×');
    }

    // Check for dimensions with units (e.g., "12in x 16in")
    const unitDimensionMatch = variantName.match(/(\d+)\s*(?:in|cm|mm|")?\s*[x×]\s*(\d+)\s*(?:in|cm|mm|")?/);
    if (unitDimensionMatch && unitDimensionMatch.length >= 3) {
      return `${unitDimensionMatch[1]}×${unitDimensionMatch[2]}`;
    }

    // If no dimension pattern found, just return the variant name
    return variantName;
  };

  // Helper function to filter images for a variant
  const filterImagesForVariant = (variant, imagesList) => {
    if (!variant || !imagesList || imagesList.length === 0) {
      return imagesList; // Return all images if no valid input
    }

    // Extract size identifier from variant name
    let sizeIdentifier = extractSizeFromVariantName(variant.name);
    let variantTitle = variant.name || '';

    // If no size found in name, try to get it from variant options
    if (!sizeIdentifier && variant.options) {
      const sizeOption = variant.options.find(opt =>
        opt.name && (opt.name.toLowerCase().includes('size') ||
          opt.name.toLowerCase().includes('dimension')));

      if (sizeOption && sizeOption.value) {
        sizeIdentifier = extractSizeFromVariantName(sizeOption.value);
        variantTitle = sizeOption.value;
      }
    }

    // If still no size, try variant title
    if (!sizeIdentifier && variant.title) {
      sizeIdentifier = extractSizeFromVariantName(variant.title);
      variantTitle = variant.title;
    }

    console.log(`Looking for images for variant: ${variantTitle}, size identifier: ${sizeIdentifier || 'none'}`);

    // First try: Look for exact size match in image filename
    if (sizeIdentifier) {
      // Try to find images with exact size match
      const exactMatches = imagesList.filter(image => {
        if (!image.src) return false;

        const imageSrc = image.src.toLowerCase();
        // Check for exact size match
        return imageSrc.includes(sizeIdentifier.toLowerCase()) ||
          imageSrc.includes(sizeIdentifier.replace('×', 'x').toLowerCase());
      });

      console.log(`Found ${exactMatches.length} exact size matches`);

      if (exactMatches.length > 0) {
        return exactMatches;
      }
    }

    // Second try: Look for images that contain any part of the variant name
    if (variantTitle) {
      // Split the variant title into words and look for matches
      const words = variantTitle.split(/\s+/).filter(word => word.length > 2);

      if (words.length > 0) {
        const wordMatches = imagesList.filter(image => {
          if (!image.src) return false;

          const imageSrc = image.src.toLowerCase();
          return words.some(word => imageSrc.includes(word.toLowerCase()));
        });

        console.log(`Found ${wordMatches.length} partial word matches`);

        if (wordMatches.length > 0) {
          return wordMatches;
        }
      }
    }

    // Third try: Look for images that have size-related keywords
    const sizeKeywords = ['size', 'dimension', 'canvas', 'print', 'artwork'];
    const keywordMatches = imagesList.filter(image => {
      if (!image.src) return false;

      const imageSrc = image.src.toLowerCase();
      return sizeKeywords.some(keyword => imageSrc.includes(keyword));
    });

    console.log(`Found ${keywordMatches.length} keyword matches`);

    if (keywordMatches.length > 0) {
      return keywordMatches;
    }

    // Final fallback: Return all images rather than showing nothing
    console.log('No specific matches found, using all available images');
    return imagesList;
  };

  // Handle variant selection
  const handleVariantChange = (variant) => {
    setSelectedVariant(variant);
    // Reset image index when variant changes
    setCurrentImageIndex(0);

    // Filter images for this variant
    if (allProductImages.length > 0) {
      const filteredImages = filterImagesForVariant(variant, allProductImages);
      setVariantImages(filteredImages);
    }
  };

  // Carousel navigation
  const nextImage = () => {
    setCurrentImageIndex((prevIndex) =>
      prevIndex === variantImages.length - 1 ? 0 : prevIndex + 1
    );
  };

  const prevImage = () => {
    setCurrentImageIndex((prevIndex) =>
      prevIndex === 0 ? variantImages.length - 1 : prevIndex - 1
    );
  };

  const goToImage = (index) => {
    setCurrentImageIndex(index);
  };

  // Handle quantity change
  const handleQuantityChange = (e) => {
    const value = parseInt(e.target.value);
    if (value > 0 && value <= 10) {
      setQuantity(value);
    }
  };

  // Handle add to cart
  const handleAddToCart = () => {
    if (!product || !selectedVariant) return;

    const cartItem = {
      id: product.id,
      title: product.title,
      price: product.price,
      imageUrl: product.imageUrl,
      quantity: quantity,
      variantId: selectedVariant.id,
      variantName: selectedVariant.name
    };

    if (isInCart(product.id)) {
      updateQuantity(product.id, selectedVariant.id, quantity);
    } else {
      addToCart(cartItem);
    }

    // Show success message
    setAddedToCart(true);

    // Reset after 3 seconds
    setTimeout(() => {
      setAddedToCart(false);
    }, 3000);
  };

  // Handle buy now
  const handleBuyNow = () => {
    handleAddToCart();
    router.push('/checkout');
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
            <Link href="/shop" className="btn btn-outline">
              Back to Shop
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900">Product not found</h2>
          <p className="mt-2 text-gray-600">The product you're looking for doesn't exist or has been removed.</p>
          <div className="mt-6">
            <Link href="/shop" className="btn btn-primary">
              Browse Products
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-4">
        <Link href="/shop" className="text-primary-600 hover:text-primary-700 flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
          </svg>
          Back to Shop
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Product image carousel */}
        <div className="bg-white rounded-lg overflow-hidden shadow-sm">
          {/* Main image */}
          <div className="relative aspect-w-1 aspect-h-1" style={{ height: '500px' }}>
            {variantImages.length > 0 && (
              <Image
                src={variantImages[currentImageIndex].src}
                alt={`${product.title} - Image ${currentImageIndex + 1}`}
                fill
                sizes="(max-width: 768px) 100vw, 50vw"
                className="object-contain"
              />
            )}

            {/* Navigation arrows */}
            {variantImages.length > 1 && (
              <>
                <button
                  onClick={prevImage}
                  className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-75 rounded-full p-2 shadow-md hover:bg-opacity-100 transition-all z-10"
                  aria-label="Previous image"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <button
                  onClick={nextImage}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-75 rounded-full p-2 shadow-md hover:bg-opacity-100 transition-all z-10"
                  aria-label="Next image"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </>
            )}
          </div>

          {/* Thumbnail navigation */}
          {variantImages.length > 1 && (
            <div className="mt-4 flex space-x-2 overflow-x-auto pb-2">
              {variantImages.map((image, index) => (
                <button
                  key={index}
                  onClick={() => goToImage(index)}
                  className={`relative w-16 h-16 border-2 rounded overflow-hidden flex-shrink-0 ${currentImageIndex === index ? 'border-primary-600' : 'border-gray-200'}`}
                >
                  <Image
                    src={image.src}
                    alt={`Thumbnail ${index + 1}`}
                    fill
                    sizes="64px"
                    className="object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Product details */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{product.title}</h1>

          <div className="mt-4">
            <p className="text-3xl font-bold text-gray-900">
              ${selectedVariant ? (parseFloat(selectedVariant.price) / 100).toFixed(2) : product.price.toFixed(2)}
            </p>
            {product.compareAtPrice && product.compareAtPrice > product.price && (
              <p className="mt-1 text-sm text-gray-500">
                <span className="line-through">${product.compareAtPrice.toFixed(2)}</span>
                <span className="ml-2 text-red-600">
                  Save ${(product.compareAtPrice - product.price).toFixed(2)}
                </span>
              </p>
            )}
          </div>

          <div className="mt-6">
            <p className="text-base text-gray-700">{product.description}</p>
          </div>

          {/* Variants */}
          {product.variants && product.variants.length > 0 && (
            <div className="mt-6">
              <h3 className="text-sm font-medium text-gray-900">Size</h3>
              <div className="mt-2 flex flex-wrap gap-3">
                {product.variants.map(variant => {
                  // Extract dimensions using our improved helper function
                  let dimensions = extractSizeFromVariantName(variant.name || '');

                  // Extract size details from variant options if available
                  if (!dimensions && variant.options) {
                    // Look for size-related options
                    const sizeOption = variant.options.find(opt =>
                      opt.name && (opt.name.toLowerCase().includes('size') ||
                        opt.name.toLowerCase().includes('dimension')));

                    if (sizeOption && sizeOption.value) {
                      dimensions = extractSizeFromVariantName(sizeOption.value);
                    }
                  }

                  // If still no dimensions found, check if title contains dimensions
                  if (!dimensions && variant.title) {
                    dimensions = extractSizeFromVariantName(variant.title);
                  }

                  // Get price for this variant
                  const price = variant.price ? `$${(parseFloat(variant.price) / 100).toFixed(2)}` : '';

                  return (
                    <button
                      key={variant.id}
                      type="button"
                      onClick={() => handleVariantChange(variant)}
                      className={`relative flex flex-col items-center justify-center w-28 h-24 border-2 rounded-md ${selectedVariant?.id === variant.id
                          ? 'border-primary-500 bg-primary-600 text-white'
                          : 'border-gray-300 bg-white text-gray-800'
                        }`}
                      title={`${variant.name || ''} - ${price}`}
                    >
                      <span className="text-base font-bold tracking-tight" style={{ fontSize: '0.7em' }}>{dimensions || variant.name || 'Unknown Size'}</span>
                      <span className="text-xs mt-1">Size</span>
                      {price && <span className="mt-1 text-xs">{price}</span>}
                    </button>
                  );
                })}
              </div>

              {/* Display selected variant details */}
              {selectedVariant && (
                <div className="mt-3 p-3 bg-gray-50 rounded-md border border-gray-200">
                  <p className="text-sm font-medium text-gray-700">Selected size: <span className="font-bold">{selectedVariant.name || 'Standard'}</span></p>
                  {extractSizeFromVariantName(selectedVariant.name) && (
                    <p className="text-sm text-gray-600 mt-1">Dimensions: <span className="font-bold">{extractSizeFromVariantName(selectedVariant.name)} inches</span></p>
                  )}
                  <p className="text-sm text-gray-600 mt-1">Price: <span className="font-bold">${(parseFloat(selectedVariant.price || 0) / 100).toFixed(2)}</span></p>
                </div>
              )}
            </div>
          )}

          {/* Quantity */}
          <div className="mt-6">
            <h3 className="text-sm font-medium text-gray-900">Quantity</h3>
            <div className="mt-2 flex items-center">
              <button
                type="button"
                onClick={() => quantity > 1 && setQuantity(quantity - 1)}
                className="p-2 border border-gray-300 rounded-l-md"
              >
                -
              </button>
              <input
                type="number"
                min="1"
                max="10"
                value={quantity}
                onChange={handleQuantityChange}
                className="w-16 text-center border-t border-b border-gray-300 p-2"
              />
              <button
                type="button"
                onClick={() => quantity < 10 && setQuantity(quantity + 1)}
                className="p-2 border border-gray-300 rounded-r-md"
              >
                +
              </button>
            </div>
          </div>

          {/* Shipping estimates */}
          {selectedVariant && (
            <div className="mt-6">
              <h3 className="text-sm font-medium text-gray-900">Shipping</h3>
              <div className="mt-2">
                {isLoadingShipping ? (
                  <p className="text-sm text-gray-500">Loading shipping estimates...</p>
                ) : shippingEstimates.length > 0 ? (
                  <div className="space-y-2">
                    {shippingEstimates.map((estimate, index) => (
                      <div key={index} className="flex items-center text-sm">
                        <TruckIcon className="h-4 w-4 text-gray-400 mr-2" />
                        <span>{estimate.method}: ${estimate.price.toFixed(2)} ({estimate.estimatedDays} days)</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">Shipping calculated at checkout</p>
                )}
              </div>
            </div>
          )}

          {/* Add to cart / Buy now buttons */}
          <div className="mt-8 space-y-3">
            <button
              type="button"
              onClick={handleAddToCart}
              disabled={!selectedVariant}
              className="btn btn-primary w-full py-3 flex items-center justify-center"
            >
              {addedToCart ? (
                <>
                  <CheckIcon className="h-5 w-5 mr-2" />
                  Added to Cart
                </>
              ) : (
                <>
                  <ShoppingCartIcon className="h-5 w-5 mr-2" />
                  Add to Cart
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleBuyNow}
              disabled={!selectedVariant}
              className="btn btn-secondary w-full py-3"
            >
              Buy Now
            </button>
          </div>

          {/* Product features */}
          <div className="mt-8 border-t border-gray-200 pt-6">
            <div className="space-y-4">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <ShieldCheckIcon className="h-6 w-6 text-green-500" />
                </div>
                <div className="ml-3">
                  <h4 className="text-sm font-medium text-gray-900">Premium Quality</h4>
                  <p className="text-sm text-gray-500">
                    High-quality canvas with fade-resistant inks for vibrant colors.
                  </p>
                </div>
              </div>

              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <TruckIcon className="h-6 w-6 text-green-500" />
                </div>
                <div className="ml-3">
                  <h4 className="text-sm font-medium text-gray-900">Fast Shipping</h4>
                  <p className="text-sm text-gray-500">
                    Orders typically ship within 2-3 business days.
                  </p>
                </div>
              </div>

              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <ArrowPathIcon className="h-6 w-6 text-green-500" />
                </div>
                <div className="ml-3">
                  <h4 className="text-sm font-medium text-gray-900">Easy Returns</h4>
                  <p className="text-sm text-gray-500">
                    30-day return policy if you're not completely satisfied.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Product specifications */}
      <div className="mt-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Product Specifications</h2>
        <div className="bg-white shadow-sm rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <tbody className="divide-y divide-gray-200">
              {product.material && (
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 bg-gray-50">
                    Material
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {product.material}
                  </td>
                </tr>
              )}
              {product.dimensions && (
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 bg-gray-50">
                    Dimensions
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {product.dimensions}
                  </td>
                </tr>
              )}
              {product.weight && (
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 bg-gray-50">
                    Weight
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {product.weight}
                  </td>
                </tr>
              )}
              {product.printTechnology && (
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 bg-gray-50">
                    Print Technology
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {product.printTechnology}
                  </td>
                </tr>
              )}
              {product.careInstructions && (
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 bg-gray-50">
                    Care Instructions
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {product.careInstructions}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Related products */}
      {relatedProducts.length > 0 && (
        <div className="mt-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">You May Also Like</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {relatedProducts.map(relatedProduct => (
              <Link
                key={relatedProduct.id}
                href={`/shop/${relatedProduct.id}`}
                className="card overflow-hidden hover:shadow-md transition-shadow"
              >
                <div className="relative aspect-w-1 aspect-h-1">
                  <div className="absolute inset-0 bg-gray-200">
                    {relatedProduct.imageUrl && (
                      <img
                        src={relatedProduct.imageUrl}
                        alt={relatedProduct.title}
                        className="object-cover w-full h-full"
                      />
                    )}
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="text-lg font-medium text-gray-900">{relatedProduct.title}</h3>
                  <p className="mt-1 text-lg font-medium text-gray-900">${relatedProduct.price.toFixed(2)}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
