import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ShoppingBagIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';

export default function OrderSummary({ shippingMethod, cartItems, cartTotal }) {
  
  // Calculate tax (assuming 8.5% tax rate)
  const taxRate = 0.085;
  const subtotal = cartTotal;
  const taxAmount = subtotal * taxRate;
  
  // Get shipping cost from selected shipping method or default to 0
  const shippingCost = shippingMethod ? shippingMethod.price : 0;
  
  // Calculate order total
  const orderTotal = subtotal + taxAmount + shippingCost;
  
  return (
    <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
      <h2 className="text-lg font-medium text-gray-900">Order Summary</h2>
      
      {/* Items list */}
      <ul className="mt-6 divide-y divide-gray-200">
        {cartItems.map((item) => (
          <li key={item.id} className="py-4 flex">
            <div className="flex-shrink-0 w-16 h-16 border border-gray-200 rounded-md overflow-hidden">
              {item.image && (
                <Image
                  src={item.image}
                  alt={item.title}
                  width={64}
                  height={64}
                  className="w-full h-full object-center object-cover"
                />
              )}
            </div>
            
            <div className="ml-4 flex-1 flex flex-col">
              <div>
                <div className="flex justify-between text-sm font-medium text-gray-900">
                  <h3>{item.title}</h3>
                  <p className="ml-4">${(item.price * item.quantity).toFixed(2)}</p>
                </div>
                <p className="mt-1 text-sm text-gray-500">
                  {item.size && `Size: ${item.size}`}
                  {item.color && ` • ${item.color}`}
                </p>
              </div>
              <div className="flex-1 flex items-end justify-between text-sm">
                <p className="text-gray-500">Qty {item.quantity}</p>
              </div>
            </div>
          </li>
        ))}
      </ul>
      
      {/* Price calculations */}
      <dl className="mt-6 space-y-4">
        <div className="flex items-center justify-between">
          <dt className="text-sm text-gray-600">Subtotal</dt>
          <dd className="text-sm font-medium text-gray-900">${subtotal.toFixed(2)}</dd>
        </div>
        
        <div className="flex items-center justify-between">
          <dt className="text-sm text-gray-600">Shipping</dt>
          <dd className="text-sm font-medium text-gray-900">
            {shippingMethod ? (
              `$${shippingMethod.price.toFixed(2)} (${shippingMethod.title})`
            ) : (
              'Calculated at next step'
            )}
          </dd>
        </div>
        
        <div className="flex items-center justify-between">
          <dt className="text-sm text-gray-600">Tax (estimated)</dt>
          <dd className="text-sm font-medium text-gray-900">${taxAmount.toFixed(2)}</dd>
        </div>
        
        <div className="border-t border-gray-200 pt-4 flex items-center justify-between">
          <dt className="text-base font-medium text-gray-900">Order total</dt>
          <dd className="text-base font-medium text-gray-900">${orderTotal.toFixed(2)}</dd>
        </div>
      </dl>
      
      <div className="mt-6">
        <div className="rounded-md bg-blue-50 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-blue-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3 flex-1 md:flex md:justify-between">
              <p className="text-sm text-blue-700">
                Your order will be processed and shipped once payment is confirmed.
              </p>
            </div>
          </div>
        </div>
        
        <div className="mt-4">
          <Link href="/cart" className="text-primary-600 hover:text-primary-500 flex items-center text-sm">
            <ArrowLeftIcon className="h-4 w-4 mr-1" />
            Return to Cart
          </Link>
        </div>
      </div>
    </div>
  );
}
