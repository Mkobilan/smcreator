import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Image from 'next/image';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { 
  TrashIcon, 
  ShoppingBagIcon, 
  ArrowLeftIcon,
  ExclamationCircleIcon
} from '@heroicons/react/24/outline';

export default function Cart() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const { 
    cartItems, 
    removeFromCart, 
    updateQuantity, 
    clearCart, 
    cartTotal 
  } = useCart();
  
  const [isClient, setIsClient] = useState(false);
  
  // Fix for hydration issues - only render cart contents on client
  useEffect(() => {
    setIsClient(true);
  }, []);
  
  // Handle quantity change
  const handleQuantityChange = (itemId, newQuantity) => {
    if (newQuantity >= 1 && newQuantity <= 10) {
      updateQuantity(itemId, newQuantity);
    }
  };
  
  // Handle remove item
  const handleRemoveItem = (itemId) => {
    removeFromCart(itemId);
  };
  
  // Handle checkout
  const handleCheckout = () => {
    if (!isAuthenticated) {
      router.push('/login?redirect=/checkout');
    } else {
      router.push('/checkout');
    }
  };

  if (!isClient) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-3xl font-bold text-gray-900">Your Cart</h1>
        <div className="mt-8">Loading cart...</div>
      </div>
    );
  }

  if (cartItems.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-3xl font-bold text-gray-900">Your Cart</h1>
        <div className="mt-8 text-center py-12">
          <div className="mx-auto h-24 w-24 text-gray-400">
            <ShoppingBagIcon className="h-full w-full" />
          </div>
          <h3 className="mt-2 text-lg font-medium text-gray-900">Your cart is empty</h3>
          <p className="mt-1 text-sm text-gray-500">
            Looks like you haven't added any products to your cart yet.
          </p>
          <div className="mt-6">
            <Link href="/shop" className="btn btn-primary">
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-3xl font-bold text-gray-900">Your Cart</h1>
      
      <div className="mt-8">
        <div className="flow-root">
          <ul className="-my-6 divide-y divide-gray-200">
            {cartItems.map((item) => (
              <li key={item.id} className="py-6 flex">
                <div className="flex-shrink-0 w-24 h-24 border border-gray-200 rounded-md overflow-hidden">
                  {item.imageUrl ? (
                    <Image
                      src={item.imageUrl}
                      alt={item.title}
                      width={96}
                      height={96}
                      className="w-full h-full object-center object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                      <ShoppingBagIcon className="h-8 w-8 text-gray-400" />
                    </div>
                  )}
                </div>

                <div className="ml-4 flex-1 flex flex-col">
                  <div>
                    <div className="flex justify-between text-base font-medium text-gray-900">
                      <h3>
                        <Link href={`/shop/${item.id}`} className="hover:text-primary-600">
                          {item.title}
                        </Link>
                      </h3>
                      <p className="ml-4">${(item.price * item.quantity).toFixed(2)}</p>
                    </div>
                    {item.variantName && (
                      <p className="mt-1 text-sm text-gray-500">Size: {item.variantName}</p>
                    )}
                  </div>
                  
                  <div className="flex-1 flex items-end justify-between text-sm">
                    <div className="flex items-center">
                      <label htmlFor={`quantity-${item.id}`} className="mr-2 text-gray-500">
                        Qty
                      </label>
                      <div className="flex border border-gray-300 rounded">
                        <button
                          type="button"
                          className="px-2 py-1 text-gray-600 hover:bg-gray-100"
                          onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                          disabled={item.quantity <= 1}
                        >
                          -
                        </button>
                        <input
                          id={`quantity-${item.id}`}
                          type="number"
                          min="1"
                          max="10"
                          className="w-12 text-center border-x border-gray-300"
                          value={item.quantity}
                          onChange={(e) => handleQuantityChange(item.id, parseInt(e.target.value) || 1)}
                        />
                        <button
                          type="button"
                          className="px-2 py-1 text-gray-600 hover:bg-gray-100"
                          onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                          disabled={item.quantity >= 10}
                        >
                          +
                        </button>
                      </div>
                    </div>

                    <div className="flex">
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(item.id)}
                        className="font-medium text-red-600 hover:text-red-500 flex items-center"
                      >
                        <TrashIcon className="h-4 w-4 mr-1" />
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
      
      <div className="border-t border-gray-200 mt-8 pt-8">
        <div className="flex justify-between text-base font-medium text-gray-900">
          <p>Subtotal</p>
          <p>${cartTotal.toFixed(2)}</p>
        </div>
        <p className="mt-0.5 text-sm text-gray-500">
          Shipping and taxes calculated at checkout.
        </p>
        
        <div className="mt-6">
          <button
            onClick={handleCheckout}
            className="btn btn-primary w-full py-3"
          >
            Checkout
          </button>
        </div>
        
        <div className="mt-4 flex justify-between">
          <Link href="/shop" className="text-primary-600 hover:text-primary-500 flex items-center">
            <ArrowLeftIcon className="h-4 w-4 mr-1" />
            Continue Shopping
          </Link>
          
          <button
            type="button"
            onClick={() => clearCart()}
            className="text-red-600 hover:text-red-500"
          >
            Clear Cart
          </button>
        </div>
      </div>
      
      {!isAuthenticated && (
        <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-md p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <ExclamationCircleIcon className="h-5 w-5 text-yellow-400" aria-hidden="true" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">
                Sign in to continue
              </h3>
              <div className="mt-2 text-sm text-yellow-700">
                <p>
                  You'll need to sign in or create an account to complete your purchase.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
