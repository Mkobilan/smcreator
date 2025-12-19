import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import axios from 'axios';
import { useAuth } from '../../../context/AuthContext';
import { useNotification } from '../../../contexts/NotificationContext';
import {
  ShoppingBagIcon,
  ArrowLeftIcon,
  ClockIcon,
  TruckIcon,
  CheckCircleIcon,
  ExclamationCircleIcon
} from '@heroicons/react/24/outline';

// Status badge component
const StatusBadge = ({ status }) => {
  const statusConfig = {
    pending: {
      color: 'bg-yellow-100 text-yellow-800',
      icon: ClockIcon
    },
    processing: {
      color: 'bg-blue-100 text-blue-800',
      icon: ClockIcon
    },
    shipped: {
      color: 'bg-purple-100 text-purple-800',
      icon: TruckIcon
    },
    delivered: {
      color: 'bg-green-100 text-green-800',
      icon: CheckCircleIcon
    },
    canceled: {
      color: 'bg-red-100 text-red-800',
      icon: ExclamationCircleIcon
    }
  };

  const config = statusConfig[status] || statusConfig.pending;
  const Icon = config.icon;

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
      <Icon className="-ml-0.5 mr-1.5 h-3 w-3" />
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
};

export default function OrderDetails() {
  const router = useRouter();
  const { id } = router.query;
  const { isAuthenticated, loading } = useAuth();
  const { showSuccess, showError, showInfo } = useNotification();

  const [order, setOrder] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch order details
  useEffect(() => {
    const fetchOrder = async () => {
      if (!id || !isAuthenticated) return;

      try {
        setIsLoading(true);
        const { data } = await axios.get(`/api/orders/${id}`);
        setOrder(data.order);
      } catch (error) {
        console.error('Error fetching order:', error);
        setError(error.response?.data?.message || 'Failed to load order details');
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrder();
  }, [id, isAuthenticated]);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/login?redirect=/profile/orders');
    }
  }, [isAuthenticated, loading, router]);

  if (loading || isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-3xl font-bold text-gray-900">Order Details</h1>
        <div className="mt-8">Loading order details...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-3xl font-bold text-gray-900">Order Details</h1>
        <div className="mt-8 bg-red-50 border border-red-200 rounded-md p-4">
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
        <div className="mt-6">
          <Link href="/profile/orders" className="text-primary-600 hover:text-primary-500 flex items-center">
            <ArrowLeftIcon className="h-4 w-4 mr-1" />
            Back to Orders
          </Link>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-3xl font-bold text-gray-900">Order Details</h1>
        <div className="mt-8">Order not found</div>
        <div className="mt-6">
          <Link href="/profile/orders" className="text-primary-600 hover:text-primary-500 flex items-center">
            <ArrowLeftIcon className="h-4 w-4 mr-1" />
            Back to Orders
          </Link>
        </div>
      </div>
    );
  }

  // Format date
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const [syncing, setSyncing] = useState(false);

  // Function to sync order with Printify
  const syncOrderWithPrintify = async () => {
    try {
      setSyncing(true);
      // Show loading notification
      showInfo('Syncing order with Printify...', 'Updating Order');

      const { data } = await axios.post(`/api/orders/${id}/sync`, {});

      // Refresh order data
      const { data: refreshedData } = await axios.get(`/api/orders/${id}`);
      setOrder(refreshedData.order);

      // Show success notification
      showSuccess('Order updated with latest tracking information', 'Order Synced');

      // If order status changed to shipped, show shipping notification
      if (refreshedData.order.status === 'shipped' &&
        (!order.trackingNumber && refreshedData.order.trackingNumber)) {
        showSuccess(
          `Your order has been shipped! ${refreshedData.order.trackingNumber ?
            `Tracking number: ${refreshedData.order.trackingNumber}` : ''}`,
          'Order Shipped',
          10000 // Show for 10 seconds
        );
      }
    } catch (error) {
      console.error('Error syncing order:', error);
      showError(error.response?.data?.message || 'Failed to sync order with Printify', 'Sync Failed');
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Order Details</h1>
        <StatusBadge status={order.status} />
      </div>

      <div className="mt-2 text-sm text-gray-500">
        <p>Order #{order.id.slice(-8)}</p>
        <p>Placed on {formatDate(order.createdAt)}</p>
      </div>

      {/* Sync button and message */}
      {order.printifyOrderId && (
        <div className="mt-4">
          <button
            onClick={syncOrderWithPrintify}
            disabled={syncing}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
          >
            {syncing ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Updating...
              </>
            ) : (
              <>Get Latest Status</>
            )}
          </button>
        </div>
      )}

      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Order items */}
        <div className="lg:col-span-2">
          <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <div className="px-4 py-5 sm:px-6">
              <h2 className="text-lg font-medium text-gray-900">Order Items</h2>
            </div>
            <div className="border-t border-gray-200">
              <ul className="divide-y divide-gray-200">
                {order.items.map((item) => (
                  <li key={item.id} className="p-4 sm:p-6">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 w-16 h-16 border border-gray-200 rounded-md overflow-hidden">
                        {item.product?.imageUrl ? (
                          <Image
                            src={item.product.imageUrl}
                            alt={item.product.title}
                            width={64}
                            height={64}
                            className="w-full h-full object-center object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                            <ShoppingBagIcon className="h-6 w-6 text-gray-400" />
                          </div>
                        )}
                      </div>

                      <div className="ml-4 flex-1">
                        <div className="flex justify-between">
                          <h3 className="text-sm font-medium text-gray-900">
                            {item.product?.title || 'Product'}
                          </h3>
                          <p className="text-sm font-medium text-gray-900">
                            ${parseFloat(item.price).toFixed(2)}
                          </p>
                        </div>
                        <p className="mt-1 text-sm text-gray-500">
                          Quantity: {item.quantity}
                        </p>
                        {item.printifyVariantId && (
                          <p className="mt-1 text-sm text-gray-500">
                            Variant ID: {item.printifyVariantId}
                          </p>
                        )}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Order summary and shipping info */}
        <div className="lg:col-span-1 space-y-6">
          {/* Order summary */}
          <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <div className="px-4 py-5 sm:px-6">
              <h2 className="text-lg font-medium text-gray-900">Order Summary</h2>
            </div>
            <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
              <dl className="grid grid-cols-1 gap-x-4 gap-y-4">
                <div className="flex justify-between">
                  <dt className="text-sm font-medium text-gray-500">Subtotal</dt>
                  <dd className="text-sm text-gray-900">${parseFloat(order.totalAmount).toFixed(2)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-sm font-medium text-gray-500">Shipping</dt>
                  <dd className="text-sm text-gray-900">Included</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-sm font-medium text-gray-500">Tax</dt>
                  <dd className="text-sm text-gray-900">Included</dd>
                </div>
                <div className="border-t border-gray-200 pt-4 flex justify-between">
                  <dt className="text-base font-medium text-gray-900">Total</dt>
                  <dd className="text-base font-medium text-gray-900">${parseFloat(order.totalAmount).toFixed(2)}</dd>
                </div>
              </dl>
            </div>
          </div>

          {/* Shipping information */}
          <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <div className="px-4 py-5 sm:px-6">
              <h2 className="text-lg font-medium text-gray-900">Shipping Information</h2>
            </div>
            <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
              <dl className="grid grid-cols-1 gap-x-4 gap-y-4">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Name</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {order.shippingAddress.firstName} {order.shippingAddress.lastName}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Address</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    <address className="not-italic">
                      {order.shippingAddress.address1}<br />
                      {order.shippingAddress.address2 && (
                        <>{order.shippingAddress.address2}<br /></>
                      )}
                      {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.zip}<br />
                      {order.shippingAddress.country}
                    </address>
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Phone</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {order.shippingAddress.phone}
                  </dd>
                </div>
              </dl>
            </div>
          </div>

          {/* Tracking information */}
          {(order.trackingNumber || (order.printifyDetails && order.printifyDetails.shipments && order.printifyDetails.shipments.length > 0)) && (
            <div className="bg-white shadow overflow-hidden sm:rounded-lg">
              <div className="px-4 py-5 sm:px-6">
                <h2 className="text-lg font-medium text-gray-900">Tracking Information</h2>
              </div>
              <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
                <dl className="grid grid-cols-1 gap-x-4 gap-y-4">
                  {/* Direct tracking info from order */}
                  {order.trackingNumber && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Shipment</dt>
                      <dd className="mt-1 text-sm text-gray-900">
                        <div className="flex flex-col space-y-2">
                          <div>
                            <span className="font-medium">Carrier:</span> {order.shippingCarrier || 'Not specified'}
                          </div>
                          <div>
                            <span className="font-medium">Tracking Number:</span> {order.trackingNumber}
                          </div>
                          {order.trackingUrl && (
                            <div>
                              <a
                                href={order.trackingUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                              >
                                <TruckIcon className="-ml-0.5 mr-1.5 h-4 w-4" />
                                Track Package
                              </a>
                            </div>
                          )}
                          {order.estimatedDeliveryDate && (
                            <div>
                              <span className="font-medium">Estimated Delivery:</span> {formatDate(order.estimatedDeliveryDate)}
                            </div>
                          )}
                        </div>
                      </dd>
                    </div>
                  )}

                  {/* Printify shipments (if available and no direct tracking) */}
                  {!order.trackingNumber && order.printifyDetails && order.printifyDetails.shipments &&
                    order.printifyDetails.shipments.map((shipment, index) => (
                      <div key={index}>
                        <dt className="text-sm font-medium text-gray-500">
                          Shipment {index + 1}
                        </dt>
                        <dd className="mt-1 text-sm text-gray-900">
                          <div className="flex flex-col space-y-2">
                            <div>
                              <span className="font-medium">Carrier:</span> {shipment.carrier || 'Not specified'}
                            </div>
                            {shipment.tracking_number && (
                              <div>
                                <span className="font-medium">Tracking Number:</span> {shipment.tracking_number}
                              </div>
                            )}
                            {shipment.tracking_url && (
                              <div>
                                <a
                                  href={shipment.tracking_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                                >
                                  <TruckIcon className="-ml-0.5 mr-1.5 h-4 w-4" />
                                  Track Package
                                </a>
                              </div>
                            )}
                            {shipment.estimated_delivery_date && (
                              <div>
                                <span className="font-medium">Estimated Delivery:</span> {formatDate(shipment.estimated_delivery_date)}
                              </div>
                            )}
                          </div>
                        </dd>
                      </div>
                    ))}

                  {/* Order status timeline */}
                  {order.status !== 'pending' && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <dt className="text-sm font-medium text-gray-500">Order Progress</dt>
                      <dd className="mt-3">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="relative">
                              {/* Progress bar */}
                              <div className="overflow-hidden h-2 text-xs flex bg-gray-200 rounded">
                                <div
                                  style={{
                                    width: order.status === 'processing' ? '25%' :
                                      order.status === 'shipped' ? '75%' :
                                        order.status === 'delivered' ? '100%' : '0%'
                                  }}
                                  className={`shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center ${order.status === 'canceled' ? 'bg-red-500' : 'bg-primary-500'
                                    }`}
                                ></div>
                              </div>

                              {/* Status markers */}
                              <div className="flex justify-between text-xs text-gray-600 mt-1">
                                <div className="text-center">
                                  <div className={`w-4 h-4 rounded-full mx-auto mb-1 ${['processing', 'shipped', 'delivered'].includes(order.status) ? 'bg-primary-500' : 'bg-gray-300'
                                    }`}></div>
                                  <span>Processing</span>
                                </div>
                                <div className="text-center">
                                  <div className={`w-4 h-4 rounded-full mx-auto mb-1 ${['shipped', 'delivered'].includes(order.status) ? 'bg-primary-500' : 'bg-gray-300'
                                    }`}></div>
                                  <span>Shipped</span>
                                </div>
                                <div className="text-center">
                                  <div className={`w-4 h-4 rounded-full mx-auto mb-1 ${order.status === 'delivered' ? 'bg-primary-500' : 'bg-gray-300'
                                    }`}></div>
                                  <span>Delivered</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </dd>
                    </div>
                  )}
                </dl>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="mt-8">
        <Link href="/profile/orders" className="text-primary-600 hover:text-primary-500 flex items-center">
          <ArrowLeftIcon className="h-4 w-4 mr-1" />
          Back to Orders
        </Link>
      </div>
    </div>
  );
}
