import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { useAuth } from '../../context/AuthContext';
import { useQuery, useMutation } from 'react-query';
import axios from 'axios';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, useStripe, useElements } from '@stripe/react-stripe-js';
import { CheckIcon, XMarkIcon } from '@heroicons/react/24/outline';
import StripePaymentForm from '../../components/StripePaymentForm';

// Load Stripe outside of component render to avoid recreating Stripe object on every render
// Make sure to use the correct environment variable and add error handling
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY).catch(err => {
  console.error('Error loading Stripe:', err);
  return null;
});

// Fetch subscription plans
const fetchSubscriptionPlans = async () => {
  const { data } = await axios.get('/api/subscriptions/plans');
  return data.plans;
};

// Fetch current subscription if user is authenticated
const fetchCurrentSubscription = async () => {
  try {
    const { data } = await axios.get('/api/subscriptions/current');
    // The server now returns a subscription that could be null
    return data.subscription;
  } catch (error) {
    console.log('Subscription fetch error handled:', error.message);
    return null;
  }
};

// Secure checkout form component using StripePaymentForm
const CheckoutForm = ({ selectedPlan, onSuccess, onCancel }) => {
  const stripe = useStripe();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const { user } = useAuth();

  // Handle payment method creation from the secure form
  const handlePaymentMethodCreated = async (paymentMethodId) => {
    setIsLoading(true);
    setError('');

    try {
      // Create subscription on the server with the payment method ID
      const { data } = await axios.post('/api/subscriptions', {
        paymentMethodId,
        priceId: selectedPlan.priceId
      });

      if (data.subscription.status === 'active' || data.subscription.status === 'trialing') {
        onSuccess();
      } else if (data.subscription.status === 'incomplete') {
        // Handle additional authentication if needed
        const { error: confirmError } = await stripe.confirmCardPayment(data.clientSecret);
        if (confirmError) {
          setError(confirmError.message);
        } else {
          onSuccess();
        }
      }
    } catch (error) {
      console.error('Subscription error:', error);
      setError(error.response?.data?.message || 'An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Credit or debit card
        </label>
        <StripePaymentForm
          onPaymentMethodCreated={handlePaymentMethodCreated}
          buttonText={`Subscribe for $${selectedPlan.price.toFixed(2)}/month`}
        />
      </div>

      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <XMarkIcon className="h-5 w-5 text-red-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-start">
        <button
          type="button"
          onClick={onCancel}
          className="btn btn-outline"
          disabled={isLoading}
        >
          Cancel
        </button>
      </div>
    </div>
  );
};

export default function Subscription() {
  const router = useRouter();
  const { isAuthenticated, user } = useAuth();
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [showCheckout, setShowCheckout] = useState(false);
  const [subscriptionSuccess, setSubscriptionSuccess] = useState(false);

  // Fetch subscription plans
  const {
    data: plans = [],
    isLoading: isLoadingPlans
  } = useQuery('subscriptionPlans', fetchSubscriptionPlans, {
    staleTime: 1000 * 60 * 30 // 30 minutes
  });

  // Fetch current subscription if authenticated
  const {
    data: currentSubscription,
    isLoading: isLoadingSubscription,
    error: subscriptionError,
    refetch: refetchSubscription
  } = useQuery('currentSubscription', fetchCurrentSubscription, {
    enabled: isAuthenticated,
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: 1, // Only retry once to avoid excessive requests
    onError: (error) => {
      console.log('Subscription fetch error handled:', error.message);
    }
  });

  // Handle plan selection
  const handleSelectPlan = (plan) => {
    setSelectedPlan(plan);
    setShowCheckout(true);
  };

  // Handle subscription success
  const handleSubscriptionSuccess = () => {
    setSubscriptionSuccess(true);
    setShowCheckout(false);
    refetchSubscription();
  };

  // Handle subscription cancellation
  const handleCancelSubscription = async () => {
    try {
      await axios.post('/api/subscriptions/cancel');
      refetchSubscription();
    } catch (error) {
      console.error('Error canceling subscription:', error);
    }
  };

  // Handle subscription resumption
  const handleResumeSubscription = async () => {
    try {
      await axios.post('/api/subscriptions/resume');
      refetchSubscription();
    } catch (error) {
      console.error('Error resuming subscription:', error);
    }
  };

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isAuthenticated && !isLoadingSubscription) {
      router.push('/login?redirect=/subscription');
    }
  }, [isAuthenticated, isLoadingSubscription, router]);

  // Show login/signup prompt if not authenticated
  if (!isAuthenticated && !isLoadingSubscription) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center">
          <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
            Subscribe to Access Exclusive Content
          </h2>
          <p className="mt-4 text-lg text-gray-500">
            Please sign in or create an account to subscribe.
          </p>
          <div className="mt-8 flex justify-center">
            <Link href="/login?redirect=/subscription" className="btn btn-primary mx-2">
              Sign In
            </Link>
            <Link href="/register?redirect=/subscription" className="btn btn-outline mx-2">
              Create Account
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Show loading state
  if (isLoadingPlans) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  // Special handling for admin users or users with subscription errors
  if (isAuthenticated && isLoadingSubscription && user?.role !== 'admin') {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  // Special handling for admin users
  const isAdmin = user?.role === 'admin';

  // Show admin subscription access or current subscription details
  if ((isAdmin || currentSubscription) && !showCheckout) {
    // For admin users without subscription, create a virtual active subscription
    const subscriptionData = isAdmin && !currentSubscription ? {
      status: 'active',
      planName: 'Admin Access',
      price: 0,
      currentPeriodStart: new Date(),
      currentPeriodEnd: new Date(new Date().setFullYear(new Date().getFullYear() + 1)),
      cancelAtPeriodEnd: false
    } : currentSubscription;

    const isActive = isAdmin || ['active', 'trialing'].includes(subscriptionData.status);
    const isCanceled = !isAdmin && subscriptionData.status === 'canceled';
    const willCancel = !isAdmin && subscriptionData.cancelAtPeriodEnd;

    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white shadow-md rounded-lg overflow-hidden">
          <div className="px-6 py-8">
            <h2 className="text-2xl font-bold text-gray-900">{isAdmin && !currentSubscription ? 'Admin Access' : 'Your Subscription'}</h2>

            <div className="mt-6 border-t border-gray-200 pt-6">
              <dl className="divide-y divide-gray-200">
                <div className="py-4 flex justify-between">
                  <dt className="text-sm font-medium text-gray-500">Plan</dt>
                  <dd className="text-sm font-medium text-gray-900">{subscriptionData.planName}</dd>
                </div>
                <div className="py-4 flex justify-between">
                  <dt className="text-sm font-medium text-gray-500">Status</dt>
                  <dd className="text-sm font-medium">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                      {isAdmin && !currentSubscription ? 'Admin Access' : subscriptionData.status.charAt(0).toUpperCase() + subscriptionData.status.slice(1)}
                    </span>
                  </dd>
                </div>
                <div className="py-4 flex justify-between">
                  <dt className="text-sm font-medium text-gray-500">Price</dt>
                  <dd className="text-sm font-medium text-gray-900">
                    {isAdmin && !currentSubscription ? 'Free (Admin)' : `$${subscriptionData.price.toFixed(2)}/month`}
                  </dd>
                </div>
                {!isAdmin || currentSubscription ? (
                  <div className="py-4 flex justify-between">
                    <dt className="text-sm font-medium text-gray-500">Current Period</dt>
                    <dd className="text-sm font-medium text-gray-900">
                      {new Date(subscriptionData.currentPeriodStart).toLocaleDateString()} - {new Date(subscriptionData.currentPeriodEnd).toLocaleDateString()}
                    </dd>
                  </div>
                ) : null}
                {willCancel && (
                  <div className="py-4 flex justify-between">
                    <dt className="text-sm font-medium text-gray-500">Cancellation Date</dt>
                    <dd className="text-sm font-medium text-red-600">
                      Will cancel on {new Date(subscriptionData.currentPeriodEnd).toLocaleDateString()}
                    </dd>
                  </div>
                )}
              </dl>
            </div>

            <div className="mt-8">
              {isAdmin && !currentSubscription ? (
                <div className="bg-green-50 border border-green-200 rounded-md p-4">
                  <p className="text-green-700">
                    <strong>Admin Access:</strong> As an administrator, you have full access to all subscription content without requiring a paid subscription.
                  </p>
                </div>
              ) : (
                <>
                  {isActive && !willCancel && (
                    <button
                      onClick={handleCancelSubscription}
                      className="btn btn-outline"
                      disabled={isCancellingSubscription}
                    >
                      {isCancellingSubscription ? 'Processing...' : 'Cancel Subscription'}
                    </button>
                  )}

                  {willCancel && (
                    <button
                      onClick={handleResumeSubscription}
                      className="btn btn-primary"
                      disabled={isResumingSubscription}
                    >
                      {isResumingSubscription ? 'Processing...' : 'Resume Subscription'}
                    </button>
                  )}

                  {isCanceled && (
                    <div>
                      <p className="text-gray-600 mb-4">Your subscription has ended. Subscribe again to regain access.</p>
                      <button
                        onClick={() => setShowCheckout(true)}
                        className="btn btn-primary"
                      >
                        View Plans
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show checkout form
  if (showCheckout && selectedPlan) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white shadow-md rounded-lg overflow-hidden">
          <div className="px-6 py-8">
            <h2 className="text-2xl font-bold text-gray-900">Subscribe to {selectedPlan.name}</h2>
            <p className="mt-2 text-gray-600">${selectedPlan.price.toFixed(2)}/month</p>

            <div className="mt-8">
              {stripePromise ? (
                <Elements stripe={stripePromise}>
                  <CheckoutForm
                    selectedPlan={selectedPlan}
                    onSuccess={handleSubscriptionSuccess}
                    onCancel={() => setShowCheckout(false)}
                  />
                </Elements>
              ) : (
                <div className="text-center py-4">
                  <p className="text-red-600">Unable to load payment system. Please try again later.</p>
                  <button
                    onClick={() => setShowCheckout(false)}
                    className="mt-4 btn btn-outline"
                  >
                    Go Back
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show subscription success message
  if (subscriptionSuccess) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
            <CheckIcon className="h-6 w-6 text-green-600" aria-hidden="true" />
          </div>
          <h3 className="mt-3 text-lg font-medium text-green-800">Subscription Successful!</h3>
          <p className="mt-2 text-sm text-green-700">
            Thank you for subscribing. You now have access to all exclusive content.
          </p>
          <div className="mt-6">
            <Link href="/videos" className="btn btn-primary">
              Browse Videos
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Show subscription plans
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="text-center">
        <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
          Exclusive Content Subscription
        </h2>
        <p className="mt-4 text-lg text-gray-500">
          Get access to all our exclusive videos and premium content for just $2.99 per month.
        </p>
      </div>

      <div className="mt-12 max-w-lg mx-auto">
        {/* Hard-coded exclusive content plan */}
        <div className="relative p-8 bg-white border border-gray-200 rounded-2xl shadow-sm flex flex-col">
          <div className="flex-1">
            <h3 className="text-xl font-semibold text-gray-900">Exclusive Content Subscription</h3>
            <p className="absolute top-0 transform -translate-y-1/2 bg-primary-500 text-white px-3 py-0.5 rounded-full text-sm font-semibold">
              Best Value
            </p>
            <p className="mt-4 flex items-baseline text-gray-900">
              <span className="text-5xl font-extrabold tracking-tight">$2.99</span>
              <span className="ml-1 text-xl font-semibold">/month</span>
            </p>
            <p className="mt-6 text-gray-500">Access to exclusive content for $2.99 per month</p>

            <ul className="mt-6 space-y-4">
              <li className="flex">
                <CheckIcon className="flex-shrink-0 h-6 w-6 text-green-500" />
                <span className="ml-3 text-gray-500">Unlimited access to exclusive videos</span>
              </li>
              <li className="flex">
                <CheckIcon className="flex-shrink-0 h-6 w-6 text-green-500" />
                <span className="ml-3 text-gray-500">Behind-the-scenes content</span>
              </li>
              <li className="flex">
                <CheckIcon className="flex-shrink-0 h-6 w-6 text-green-500" />
                <span className="ml-3 text-gray-500">Premium video quality</span>
              </li>
              <li className="flex">
                <CheckIcon className="flex-shrink-0 h-6 w-6 text-green-500" />
                <span className="ml-3 text-gray-500">Cancel anytime</span>
              </li>
            </ul>
          </div>

          <button
            onClick={() => handleSelectPlan({
              id: 'prod_SbY9KDnAiFVej2',
              name: 'Exclusive Content Subscription',
              priceId: 'price_1RgL2yK1JuQJRnYFwaZc2Qr4',
              price: 2.99,
              currency: 'usd',
              interval: 'month'
            })}
            className="mt-8 block w-full bg-primary-600 border border-transparent rounded-md py-3 px-8 text-center font-medium text-white hover:bg-primary-700"
          >
            Subscribe Now
          </button>
        </div>

        {/* Show API-fetched plans if they exist */}
        {plans.length > 0 && (
          <div className="mt-12">
            <h3 className="text-xl font-semibold text-gray-900 mb-6">Other Available Plans</h3>
            <div className="space-y-8">
              {plans.map((plan) => (
                <div key={plan.id} className="relative p-8 bg-white border border-gray-200 rounded-2xl shadow-sm flex flex-col">
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-gray-900">{plan.name}</h3>
                    {plan.popular && (
                      <p className="absolute top-0 transform -translate-y-1/2 bg-primary-500 text-white px-3 py-0.5 rounded-full text-sm font-semibold">
                        Most Popular
                      </p>
                    )}
                    <p className="mt-4 flex items-baseline text-gray-900">
                      <span className="text-5xl font-extrabold tracking-tight">${plan.price.toFixed(2)}</span>
                      <span className="ml-1 text-xl font-semibold">/month</span>
                    </p>
                    <p className="mt-6 text-gray-500">{plan.description}</p>

                    <ul className="mt-6 space-y-4">
                      {plan.features && plan.features.length > 0 ? (
                        plan.features.map((feature, index) => (
                          <li key={index} className="flex">
                            <CheckIcon className="flex-shrink-0 h-6 w-6 text-green-500" aria-hidden="true" />
                            <span className="ml-3 text-gray-500">{feature}</span>
                          </li>
                        ))
                      ) : (
                        <li className="flex">
                          <CheckIcon className="flex-shrink-0 h-6 w-6 text-green-500" aria-hidden="true" />
                          <span className="ml-3 text-gray-500">Access to exclusive content</span>
                        </li>
                      )}
                    </ul>
                  </div>

                  <button
                    onClick={() => handleSelectPlan(plan)}
                    className={`mt-8 block w-full py-3 px-6 border border-transparent rounded-md text-center font-medium ${plan.popular
                        ? 'bg-primary-600 text-white hover:bg-primary-700'
                        : 'bg-primary-50 text-primary-700 hover:bg-primary-100'
                      }`}
                  >
                    Subscribe Now
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="mt-12 bg-gray-50 border border-gray-200 rounded-lg p-8">
        <h3 className="text-lg font-medium text-gray-900">Subscription FAQ</h3>
        <div className="mt-6 space-y-6">
          <div>
            <h4 className="text-base font-medium text-gray-900">What's included in my subscription?</h4>
            <p className="mt-2 text-sm text-gray-500">
              Your subscription gives you access to all exclusive video content on our platform. New videos are added regularly.
            </p>
          </div>
          <div>
            <h4 className="text-base font-medium text-gray-900">Can I cancel anytime?</h4>
            <p className="mt-2 text-sm text-gray-500">
              Yes, you can cancel your subscription at any time. You'll continue to have access until the end of your current billing period.
            </p>
          </div>
          <div>
            <h4 className="text-base font-medium text-gray-900">How do I access exclusive content?</h4>
            <p className="mt-2 text-sm text-gray-500">
              Once subscribed, all exclusive content will be automatically unlocked for you. Look for the "Exclusive" tag on videos.
            </p>
          </div>
          <div>
            <h4 className="text-base font-medium text-gray-900">Do you offer refunds?</h4>
            <p className="mt-2 text-sm text-gray-500">
              We don't offer refunds for subscription payments, but you can cancel at any time to prevent future charges.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
