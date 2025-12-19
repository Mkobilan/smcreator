import React, { useState, useEffect } from 'react';
import { CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import axios from 'axios';

/**
 * Secure payment form component using Stripe Elements
 * This component handles payment method creation without raw card data touching our server
 */
const StripePaymentForm = ({ onPaymentMethodCreated, buttonText = 'Subscribe' }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [error, setError] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [clientSecret, setClientSecret] = useState('');
  
  // Get setup intent client secret on component mount
  useEffect(() => {
    const getSetupIntent = async () => {
      try {
        const { data } = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/api/subscriptions/setup-intent`);
        if (data && data.clientSecret) {
          setClientSecret(data.clientSecret);
        } else {
          setError('Invalid response from payment server. Please try again later.');
          console.error('Invalid setup intent response:', data);
        }
      } catch (err) {
        setError('Failed to initialize payment setup. Please try again.');
        console.error('Error getting setup intent:', err);
      }
    };
    
    getSetupIntent();
  }, []);
  
  const handleSubmit = async (event) => {
    event.preventDefault();
    
    if (!stripe || !elements) {
      // Stripe.js has not loaded yet
      return;
    }
    
    setProcessing(true);
    setError(null);
    
    try {
      // Create payment method using Stripe Elements
      const { error, setupIntent } = await stripe.confirmCardSetup(clientSecret, {
        payment_method: {
          card: elements.getElement(CardElement),
          billing_details: {
            // You can collect billing details here if needed
          }
        }
      });
      
      if (error) {
        setError(error.message);
        setProcessing(false);
        return;
      }
      
      // Payment method created successfully
      if (setupIntent.status === 'succeeded') {
        // Pass the payment method ID to parent component
        onPaymentMethodCreated(setupIntent.payment_method);
      } else {
        setError('Payment setup failed. Please try again.');
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
      console.error('Payment error:', err);
    }
    
    setProcessing(false);
  };
  
  const cardElementOptions = {
    style: {
      base: {
        fontSize: '16px',
        color: '#424770',
        '::placeholder': {
          color: '#aab7c4',
        },
      },
      invalid: {
        color: '#9e2146',
      },
    },
  };
  
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="p-4 border rounded-md">
        <CardElement options={cardElementOptions} />
      </div>
      
      {error && (
        <div className="text-red-600 text-sm">{error}</div>
      )}
      
      <button
        type="submit"
        disabled={!stripe || processing || !clientSecret}
        className={`w-full py-2 px-4 rounded-md text-white font-medium ${
          !stripe || processing || !clientSecret
            ? 'bg-gray-400 cursor-not-allowed'
            : 'bg-primary-600 hover:bg-primary-700'
        }`}
      >
        {processing ? 'Processing...' : buttonText}
      </button>
    </form>
  );
};

export default StripePaymentForm;
