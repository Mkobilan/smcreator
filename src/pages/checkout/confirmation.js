import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { 
  CheckCircleIcon,
  ShoppingBagIcon,
  ArrowRightIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '../../context/AuthContext';

export default function OrderConfirmation() {
  const router = useRouter();
  const { orderId, email } = router.query;
  const { isAuthenticated } = useAuth();
  const [isClient, setIsClient] = useState(false);
  
  // Fix for hydration issues
  useEffect(() => {
    setIsClient(true);
  }, []);
  
  // Redirect if no order ID is provided
  useEffect(() => {
    if (isClient && !orderId) {
      router.push('/');
    }
  }, [isClient, orderId, router]);
  
  if (!isClient || !orderId) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900">Order Confirmation</h1>
          <div className="mt-8">Loading...</div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <div className="text-center">
        <div className="mx-auto flex items-center justify-center h-24 w-24 rounded-full bg-green-100">
          <CheckCircleIcon className="h-12 w-12 text-green-600" aria-hidden="true" />
        </div>
        
        <h1 className="mt-6 text-3xl font-bold tracking-tight text-gray-900">Thank you for your order!</h1>
        
        <p className="mt-3 text-lg text-gray-500">
          Your order has been confirmed and will be shipped soon.
        </p>
        
        <div className="mt-6 bg-gray-50 border border-gray-200 rounded-lg p-6 text-left">
          <h2 className="text-lg font-medium text-gray-900">Order Information</h2>
          
          <dl className="mt-4 space-y-4">
            <div className="flex justify-between">
              <dt className="text-sm font-medium text-gray-500">Order number</dt>
              <dd className="text-sm font-medium text-gray-900">#{orderId.slice(-8)}</dd>
            </div>
            
            {email && (
              <div className="flex justify-between">
                <dt className="text-sm font-medium text-gray-500">Email</dt>
                <dd className="text-sm font-medium text-gray-900">{email}</dd>
              </div>
            )}
            
            <div className="flex justify-between">
              <dt className="text-sm font-medium text-gray-500">Status</dt>
              <dd className="text-sm font-medium">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  Processing
                </span>
              </dd>
            </div>
          </dl>
        </div>
        
        <div className="mt-10 flex flex-col sm:flex-row justify-center gap-4">
          {isAuthenticated ? (
            <Link 
              href={`/profile/orders/${orderId}`}
              className="btn btn-primary flex items-center justify-center"
            >
              View Order Details
              <ArrowRightIcon className="ml-2 h-4 w-4" />
            </Link>
          ) : (
            <Link 
              href="/login"
              className="btn btn-primary flex items-center justify-center"
            >
              Sign in to view your order
              <ArrowRightIcon className="ml-2 h-4 w-4" />
            </Link>
          )}
          
          <Link 
            href="/shop"
            className="btn btn-outline flex items-center justify-center"
          >
            <ShoppingBagIcon className="mr-2 h-4 w-4" />
            Continue Shopping
          </Link>
        </div>
        
        <div className="mt-12 border-t border-gray-200 pt-8">
          <p className="text-sm text-gray-500">
            If you have any questions about your order, please contact our customer support team.
          </p>
        </div>
      </div>
    </div>
  );
}
