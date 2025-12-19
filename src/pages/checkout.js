import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Image from 'next/image';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import {
  ShoppingBagIcon,
  ArrowLeftIcon,
  CheckCircleIcon,
  ExclamationCircleIcon
} from '@heroicons/react/24/outline';
import axios from 'axios';
import { validateAddress, formatPhone, formatZip } from '../utils/validation';
import ShippingMethodSelector from '../components/checkout/ShippingMethodSelector';
import OrderSummary from '../components/checkout/OrderSummary';

// Stripe imports
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';

// Load Stripe outside of component to avoid recreating on each render
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);

// Checkout form component
const CheckoutForm = ({ shippingMethod, setShippingMethod }) => {
  const router = useRouter();
  const { user } = useAuth();
  const { cartItems, cartTotal, clearCart } = useCart();
  const stripe = useStripe();
  const elements = useElements();

  // Form state
  const [formData, setFormData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
    address1: '',
    address2: '',
    city: '',
    state: '',
    zip: '',
    country: 'US',
    phone: ''
  });

  // Processing state
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [orderId, setOrderId] = useState(null);

  // Card element styling
  const cardElementOptions = {
    style: {
      base: {
        fontSize: '16px',
        color: '#32325d',
        '::placeholder': {
          color: '#aab7c4',
        },
      },
      invalid: {
        color: '#fa755a',
        iconColor: '#fa755a',
      },
    },
  };

  // Handle form input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  // Form state for field-specific errors
  const [fieldErrors, setFieldErrors] = useState({});

  // Format phone number on blur
  const handlePhoneBlur = (e) => {
    const formattedPhone = formatPhone(e.target.value);
    setFormData(prev => ({ ...prev, phone: formattedPhone }));
  };

  // Format ZIP/postal code on blur
  const handleZipBlur = (e) => {
    const formattedZip = formatZip(e.target.value, formData.country);
    setFormData(prev => ({ ...prev, zip: formattedZip }));
  };

  // Form validation
  const validateForm = () => {
    // Reset errors
    setError(null);
    setFieldErrors({});

    // Validate address
    const { isValid, errors } = validateAddress(formData);

    if (!isValid) {
      setFieldErrors(errors);
      setError('Please correct the errors in the form');
      return false;
    }

    return true;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Reset error state
    setError(null);

    // Validate form
    if (!validateForm()) {
      return;
    }

    // Check if Stripe is loaded
    if (!stripe || !elements) {
      setError('Payment processing is still loading. Please try again.');
      return;
    }

    // Get card element
    const cardElement = elements.getElement(CardElement);

    // Start processing
    setProcessing(true);

    try {
      // Create payment method
      const { error: stripeError, paymentMethod } = await stripe.createPaymentMethod({
        type: 'card',
        card: cardElement,
        billing_details: {
          name: `${formData.firstName} ${formData.lastName}`,
          email: formData.email,
          phone: formData.phone,
          address: {
            line1: formData.address1,
            line2: formData.address2 || undefined,
            city: formData.city,
            state: formData.state,
            postal_code: formData.zip,
            country: formData.country
          }
        }
      });

      if (stripeError) {
        setError(stripeError.message);
        setProcessing(false);
        return;
      }

      // Prepare order items
      const orderItems = cartItems.map(item => ({
        productId: item.id,
        quantity: item.quantity,
        variantId: item.variantId
      }));

      // Prepare shipping address
      const shippingAddress = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        address1: formData.address1,
        address2: formData.address2,
        city: formData.city,
        state: formData.state,
        zip: formData.zip,
        country: formData.country,
        phone: formData.phone
      };

      // Calculate tax (8.5%)
      const taxRate = 0.085;
      const taxAmount = cartTotal * taxRate;

      // Create order
      const { data } = await axios.post('/api/orders', {
        items: orderItems,
        shippingAddress,
        shippingMethod: shippingMethod.id,
        shippingCost: shippingMethod.price,
        taxAmount: taxAmount,
        paymentMethodId: paymentMethod.id
      });

      // Order created successfully
      setSuccess(true);
      setOrderId(data.order.id);

      // Clear cart
      clearCart();

      // Redirect to order confirmation page
      router.push({
        pathname: '/checkout/confirmation',
        query: {
          orderId: data.order.id,
          email: formData.email
        }
      });

    } catch (error) {
      console.error('Checkout error:', error);
      setError(error.response?.data?.message || 'An error occurred during checkout. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  // Show order success message
  if (success) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md text-center">
        <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
          <CheckCircleIcon className="h-6 w-6 text-green-600" aria-hidden="true" />
        </div>
        <h2 className="mt-3 text-lg font-medium text-gray-900">Order Successful!</h2>
        <p className="mt-2 text-sm text-gray-500">
          Your order has been placed successfully. You will receive an email confirmation shortly.
        </p>
        <p className="mt-1 text-sm text-gray-500">
          Order ID: {orderId}
        </p>
        <div className="mt-6">
          <Link href={`/profile/orders/${orderId}`} className="btn btn-primary">
            View Order Details
          </Link>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Shipping Information */}
      <div>
        <h3 className="text-lg font-medium text-gray-900">Shipping Information</h3>
        <div className="mt-4 grid grid-cols-1 gap-y-6 sm:grid-cols-2 sm:gap-x-4">
          <div>
            <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">
              First name *
            </label>
            <input
              type="text"
              id="firstName"
              name="firstName"
              value={formData.firstName}
              onChange={handleChange}
              className={`mt-1 block w-full rounded-md ${fieldErrors.firstName ? 'border-red-300' : 'border-gray-300'} shadow-sm focus:border-primary-500 focus:ring-primary-500`}
              required
            />
            {fieldErrors.firstName && (
              <p className="mt-1 text-sm text-red-600">{fieldErrors.firstName}</p>
            )}
          </div>

          <div>
            <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">
              Last name *
            </label>
            <input
              type="text"
              id="lastName"
              name="lastName"
              value={formData.lastName}
              onChange={handleChange}
              className={`mt-1 block w-full rounded-md ${fieldErrors.lastName ? 'border-red-300' : 'border-gray-300'} shadow-sm focus:border-primary-500 focus:ring-primary-500`}
              required
            />
            {fieldErrors.lastName && (
              <p className="mt-1 text-sm text-red-600">{fieldErrors.lastName}</p>
            )}
          </div>

          <div className="sm:col-span-2">
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              Email address *
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className={`mt-1 block w-full rounded-md ${fieldErrors.email ? 'border-red-300' : 'border-gray-300'} shadow-sm focus:border-primary-500 focus:ring-primary-500`}
              required
            />
            {fieldErrors.email && (
              <p className="mt-1 text-sm text-red-600">{fieldErrors.email}</p>
            )}
          </div>

          <div className="sm:col-span-2">
            <label htmlFor="address1" className="block text-sm font-medium text-gray-700">
              Address line 1 *
            </label>
            <input
              type="text"
              id="address1"
              name="address1"
              value={formData.address1}
              onChange={handleChange}
              className={`mt-1 block w-full rounded-md ${fieldErrors.address1 ? 'border-red-300' : 'border-gray-300'} shadow-sm focus:border-primary-500 focus:ring-primary-500`}
              required
            />
            {fieldErrors.address1 && (
              <p className="mt-1 text-sm text-red-600">{fieldErrors.address1}</p>
            )}
          </div>

          <div className="sm:col-span-2">
            <label htmlFor="address2" className="block text-sm font-medium text-gray-700">
              Address line 2
            </label>
            <input
              type="text"
              id="address2"
              name="address2"
              value={formData.address2}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
            />
          </div>

          <div>
            <label htmlFor="city" className="block text-sm font-medium text-gray-700">
              City *
            </label>
            <input
              type="text"
              id="city"
              name="city"
              value={formData.city}
              onChange={handleChange}
              className={`mt-1 block w-full rounded-md ${fieldErrors.city ? 'border-red-300' : 'border-gray-300'} shadow-sm focus:border-primary-500 focus:ring-primary-500`}
              required
            />
            {fieldErrors.city && (
              <p className="mt-1 text-sm text-red-600">{fieldErrors.city}</p>
            )}
          </div>

          <div>
            <label htmlFor="state" className="block text-sm font-medium text-gray-700">
              State / Province *
            </label>
            <input
              type="text"
              id="state"
              name="state"
              value={formData.state}
              onChange={handleChange}
              className={`mt-1 block w-full rounded-md ${fieldErrors.state ? 'border-red-300' : 'border-gray-300'} shadow-sm focus:border-primary-500 focus:ring-primary-500`}
              required
            />
            {fieldErrors.state && (
              <p className="mt-1 text-sm text-red-600">{fieldErrors.state}</p>
            )}
          </div>

          <div>
            <label htmlFor="zip" className="block text-sm font-medium text-gray-700">
              ZIP / Postal code *
            </label>
            <input
              type="text"
              id="zip"
              name="zip"
              value={formData.zip}
              onChange={handleChange}
              onBlur={handleZipBlur}
              className={`mt-1 block w-full rounded-md ${fieldErrors.zip ? 'border-red-300' : 'border-gray-300'} shadow-sm focus:border-primary-500 focus:ring-primary-500`}
              required
            />
            {fieldErrors.zip && (
              <p className="mt-1 text-sm text-red-600">{fieldErrors.zip}</p>
            )}
          </div>

          <div>
            <label htmlFor="country" className="block text-sm font-medium text-gray-700">
              Country *
            </label>
            <select
              id="country"
              name="country"
              value={formData.country}
              onChange={handleChange}
              className={`mt-1 block w-full rounded-md ${fieldErrors.country ? 'border-red-300' : 'border-gray-300'} shadow-sm focus:border-primary-500 focus:ring-primary-500`}
              required
            >
              <option value="US">United States</option>
              <option value="CA">Canada</option>
              <option value="GB">United Kingdom</option>
              <option value="AU">Australia</option>
              <option value="DE">Germany</option>
              <option value="FR">France</option>
              <option value="JP">Japan</option>
              <option value="TH">Thailand</option>
              {/* Add more countries as needed */}
            </select>
          </div>

          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
              Phone number *
            </label>
            <input
              type="tel"
              id="phone"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              onBlur={handlePhoneBlur}
              className={`mt-1 block w-full rounded-md ${fieldErrors.phone ? 'border-red-300' : 'border-gray-300'} shadow-sm focus:border-primary-500 focus:ring-primary-500`}
              required
            />
            {fieldErrors.phone && (
              <p className="mt-1 text-sm text-red-600">{fieldErrors.phone}</p>
            )}
          </div>
        </div>
      </div>

      {/* Shipping Method */}
      <div>
        <h3 className="text-lg font-medium text-gray-900">Shipping Method</h3>
        <div className="mt-4">
          <ShippingMethodSelector
            shippingMethod={shippingMethod}
            setShippingMethod={setShippingMethod}
          />
        </div>
      </div>

      {/* Payment Information */}
      <div>
        <h3 className="text-lg font-medium text-gray-900">Payment Information</h3>
        <div className="mt-4">
          <div className="border border-gray-300 rounded-md p-4">
            <CardElement options={cardElementOptions} />
          </div>
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <ExclamationCircleIcon className="h-5 w-5 text-red-400" aria-hidden="true" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error</h3>
              <div className="mt-2 text-sm text-red-700">
                <p>{error}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Submit button */}
      <div className="flex justify-end">
        <button
          type="submit"
          className="btn btn-primary py-2 px-4"
          disabled={processing || !stripe}
        >
          {processing ? 'Processing...' : `Pay $${cartTotal.toFixed(2)}`}
        </button>
      </div>
    </form>
  );
};

// Main checkout page component
export default function Checkout() {
  const router = useRouter();
  const { isAuthenticated, loading } = useAuth();
  const { cartItems, cartTotal } = useCart();
  const [isClient, setIsClient] = useState(false);

  // Define shipping method state at the Checkout component level
  const [shippingMethod, setShippingMethod] = useState({
    id: 'standard',
    title: 'Standard',
    turnaround: '4–10 business days',
    price: 5.00,
  });

  // Fix for hydration issues - only render cart contents on client
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/login?redirect=/checkout');
    }
  }, [isAuthenticated, loading, router]);

  // Redirect to cart if cart is empty
  useEffect(() => {
    if (isClient && cartItems.length === 0) {
      router.push('/cart');
    }
  }, [cartItems, isClient, router]);

  if (loading || !isClient) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-3xl font-bold text-gray-900">Checkout</h1>
        <div className="mt-8">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-3xl font-bold text-gray-900">Checkout</h1>
        <div className="mt-8">Please log in to continue...</div>
      </div>
    );
  }

  if (cartItems.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-3xl font-bold text-gray-900">Checkout</h1>
        <div className="mt-8">Your cart is empty. Redirecting to cart page...</div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-3xl font-bold text-gray-900">Checkout</h1>

      <div className="mt-8 grid grid-cols-1 gap-x-6 lg:grid-cols-3">
        {/* Checkout form */}
        <div className="lg:col-span-2">
          <Elements stripe={stripePromise}>
            <CheckoutForm shippingMethod={shippingMethod} setShippingMethod={setShippingMethod} />
          </Elements>
        </div>

        {/* Order summary */}
        <div className="lg:col-span-1">
          <OrderSummary
            cartItems={cartItems}
            cartTotal={cartTotal}
            shippingMethod={shippingMethod}
          />
        </div>
      </div>
    </div>
  );
}
