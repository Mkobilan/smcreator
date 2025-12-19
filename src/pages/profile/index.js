import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { useAuth } from '../../context/AuthContext';
import { 
  UserIcon, 
  KeyIcon, 
  CreditCardIcon,
  ShoppingBagIcon,
  ExclamationCircleIcon
} from '@heroicons/react/24/outline';

export default function Profile() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading, updateProfile, changePassword, deleteAccount } = useAuth();
  
  const [activeTab, setActiveTab] = useState('profile');
  const [updateSuccess, setUpdateSuccess] = useState(false);
  const [updateError, setUpdateError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  
  const { 
    register: profileRegister, 
    handleSubmit: handleProfileSubmit, 
    formState: { errors: profileErrors },
    reset: resetProfileForm
  } = useForm();
  
  const { 
    register: passwordRegister, 
    handleSubmit: handlePasswordSubmit, 
    formState: { errors: passwordErrors },
    reset: resetPasswordForm,
    watch
  } = useForm();
  
  const newPassword = watch('newPassword');
  
  // Redirect if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login?redirect=/profile');
    }
  }, [isLoading, isAuthenticated, router]);
  
  // Reset profile form with user data
  useEffect(() => {
    if (user) {
      resetProfileForm({
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email
      });
    }
  }, [user, resetProfileForm]);
  
  // Handle profile update
  const onProfileSubmit = async (data) => {
    try {
      setUpdateSuccess(false);
      setUpdateError('');
      
      await updateProfile(data);
      
      setUpdateSuccess(true);
      setTimeout(() => setUpdateSuccess(false), 3000);
    } catch (error) {
      console.error('Profile update error:', error);
      setUpdateError(error.response?.data?.message || 'Failed to update profile. Please try again.');
    }
  };
  
  // Handle password change
  const onPasswordSubmit = async (data) => {
    try {
      setPasswordSuccess(false);
      setPasswordError('');
      
      await changePassword(data);
      
      setPasswordSuccess(true);
      resetPasswordForm();
      setTimeout(() => setPasswordSuccess(false), 3000);
    } catch (error) {
      console.error('Password change error:', error);
      setPasswordError(error.response?.data?.message || 'Failed to change password. Please try again.');
    }
  };
  
  // Handle account deletion
  const handleDeleteAccount = async () => {
    try {
      setDeleteError('');
      
      await deleteAccount();
      
      // Redirect to home page after successful deletion
      router.push('/');
    } catch (error) {
      console.error('Account deletion error:', error);
      setDeleteError(error.response?.data?.message || 'Failed to delete account. Please try again.');
    }
  };
  
  if (isLoading || !user) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-3xl font-bold text-gray-900">Your Account</h1>
      
      <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Sidebar navigation */}
        <div className="md:col-span-1">
          <nav className="space-y-1">
            <button
              onClick={() => setActiveTab('profile')}
              className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md ${
                activeTab === 'profile'
                  ? 'bg-primary-100 text-primary-700'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <UserIcon className="h-5 w-5 mr-3" />
              Profile Information
            </button>
            
            <button
              onClick={() => setActiveTab('password')}
              className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md ${
                activeTab === 'password'
                  ? 'bg-primary-100 text-primary-700'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <KeyIcon className="h-5 w-5 mr-3" />
              Change Password
            </button>
            
            <button
              onClick={() => setActiveTab('subscription')}
              className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md ${
                activeTab === 'subscription'
                  ? 'bg-primary-100 text-primary-700'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <CreditCardIcon className="h-5 w-5 mr-3" />
              Subscription
            </button>
            
            <button
              onClick={() => setActiveTab('orders')}
              className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md ${
                activeTab === 'orders'
                  ? 'bg-primary-100 text-primary-700'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <ShoppingBagIcon className="h-5 w-5 mr-3" />
              Order History
            </button>
            
            <button
              onClick={() => setActiveTab('delete')}
              className="w-full flex items-center px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 hover:text-red-700 rounded-md"
            >
              <ExclamationCircleIcon className="h-5 w-5 mr-3" />
              Delete Account
            </button>
          </nav>
        </div>
        
        {/* Main content */}
        <div className="md:col-span-3">
          {/* Profile Information */}
          {activeTab === 'profile' && (
            <div className="bg-white shadow-sm rounded-lg p-6">
              <h2 className="text-lg font-medium text-gray-900">Profile Information</h2>
              
              {updateSuccess && (
                <div className="mt-4 bg-green-50 border-l-4 border-green-400 p-4">
                  <div className="flex">
                    <div className="ml-3">
                      <p className="text-sm text-green-700">
                        Profile updated successfully!
                      </p>
                    </div>
                  </div>
                </div>
              )}
              
              {updateError && (
                <div className="mt-4 bg-red-50 border-l-4 border-red-400 p-4">
                  <div className="flex">
                    <div className="ml-3">
                      <p className="text-sm text-red-700">{updateError}</p>
                    </div>
                  </div>
                </div>
              )}
              
              <form onSubmit={handleProfileSubmit(onProfileSubmit)} className="mt-6 space-y-6">
                <div>
                  <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">
                    First Name
                  </label>
                  <input
                    id="firstName"
                    type="text"
                    className={`mt-1 form-input block w-full ${profileErrors.firstName ? 'border-red-300' : ''}`}
                    {...profileRegister('firstName', { required: 'First name is required' })}
                  />
                  {profileErrors.firstName && (
                    <p className="mt-1 text-sm text-red-600">{profileErrors.firstName.message}</p>
                  )}
                </div>
                
                <div>
                  <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">
                    Last Name
                  </label>
                  <input
                    id="lastName"
                    type="text"
                    className={`mt-1 form-input block w-full ${profileErrors.lastName ? 'border-red-300' : ''}`}
                    {...profileRegister('lastName', { required: 'Last name is required' })}
                  />
                  {profileErrors.lastName && (
                    <p className="mt-1 text-sm text-red-600">{profileErrors.lastName.message}</p>
                  )}
                </div>
                
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                    Email Address
                  </label>
                  <input
                    id="email"
                    type="email"
                    className={`mt-1 form-input block w-full ${profileErrors.email ? 'border-red-300' : ''}`}
                    {...profileRegister('email', { 
                      required: 'Email is required',
                      pattern: {
                        value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                        message: 'Invalid email address'
                      }
                    })}
                  />
                  {profileErrors.email && (
                    <p className="mt-1 text-sm text-red-600">{profileErrors.email.message}</p>
                  )}
                </div>
                
                <div>
                  <button type="submit" className="btn btn-primary">
                    Update Profile
                  </button>
                </div>
              </form>
            </div>
          )}
          
          {/* Change Password */}
          {activeTab === 'password' && (
            <div className="bg-white shadow-sm rounded-lg p-6">
              <h2 className="text-lg font-medium text-gray-900">Change Password</h2>
              
              {passwordSuccess && (
                <div className="mt-4 bg-green-50 border-l-4 border-green-400 p-4">
                  <div className="flex">
                    <div className="ml-3">
                      <p className="text-sm text-green-700">
                        Password changed successfully!
                      </p>
                    </div>
                  </div>
                </div>
              )}
              
              {passwordError && (
                <div className="mt-4 bg-red-50 border-l-4 border-red-400 p-4">
                  <div className="flex">
                    <div className="ml-3">
                      <p className="text-sm text-red-700">{passwordError}</p>
                    </div>
                  </div>
                </div>
              )}
              
              <form onSubmit={handlePasswordSubmit(onPasswordSubmit)} className="mt-6 space-y-6">
                <div>
                  <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700">
                    Current Password
                  </label>
                  <input
                    id="currentPassword"
                    type="password"
                    className={`mt-1 form-input block w-full ${passwordErrors.currentPassword ? 'border-red-300' : ''}`}
                    {...passwordRegister('currentPassword', { required: 'Current password is required' })}
                  />
                  {passwordErrors.currentPassword && (
                    <p className="mt-1 text-sm text-red-600">{passwordErrors.currentPassword.message}</p>
                  )}
                </div>
                
                <div>
                  <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700">
                    New Password
                  </label>
                  <input
                    id="newPassword"
                    type="password"
                    className={`mt-1 form-input block w-full ${passwordErrors.newPassword ? 'border-red-300' : ''}`}
                    {...passwordRegister('newPassword', { 
                      required: 'New password is required',
                      minLength: {
                        value: 6,
                        message: 'Password must be at least 6 characters'
                      }
                    })}
                  />
                  {passwordErrors.newPassword && (
                    <p className="mt-1 text-sm text-red-600">{passwordErrors.newPassword.message}</p>
                  )}
                </div>
                
                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                    Confirm New Password
                  </label>
                  <input
                    id="confirmPassword"
                    type="password"
                    className={`mt-1 form-input block w-full ${passwordErrors.confirmPassword ? 'border-red-300' : ''}`}
                    {...passwordRegister('confirmPassword', { 
                      required: 'Please confirm your new password',
                      validate: value => value === newPassword || 'Passwords do not match'
                    })}
                  />
                  {passwordErrors.confirmPassword && (
                    <p className="mt-1 text-sm text-red-600">{passwordErrors.confirmPassword.message}</p>
                  )}
                </div>
                
                <div>
                  <button type="submit" className="btn btn-primary">
                    Change Password
                  </button>
                </div>
              </form>
            </div>
          )}
          
          {/* Subscription */}
          {activeTab === 'subscription' && (
            <div className="bg-white shadow-sm rounded-lg p-6">
              <h2 className="text-lg font-medium text-gray-900">Your Subscription</h2>
              
              {user.subscription ? (
                <div className="mt-6">
                  <dl className="divide-y divide-gray-200">
                    <div className="py-4 flex justify-between">
                      <dt className="text-sm font-medium text-gray-500">Plan</dt>
                      <dd className="text-sm font-medium text-gray-900">{user.subscription.planName}</dd>
                    </div>
                    <div className="py-4 flex justify-between">
                      <dt className="text-sm font-medium text-gray-500">Status</dt>
                      <dd className="text-sm font-medium">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          ['active', 'trialing'].includes(user.subscription.status)
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {user.subscription.status.charAt(0).toUpperCase() + user.subscription.status.slice(1)}
                        </span>
                      </dd>
                    </div>
                    <div className="py-4 flex justify-between">
                      <dt className="text-sm font-medium text-gray-500">Price</dt>
                      <dd className="text-sm font-medium text-gray-900">${user.subscription.price.toFixed(2)}/month</dd>
                    </div>
                    <div className="py-4 flex justify-between">
                      <dt className="text-sm font-medium text-gray-500">Next Billing Date</dt>
                      <dd className="text-sm font-medium text-gray-900">
                        {new Date(user.subscription.currentPeriodEnd).toLocaleDateString()}
                      </dd>
                    </div>
                  </dl>
                  
                  <div className="mt-6">
                    <Link href="/subscription" className="btn btn-primary">
                      Manage Subscription
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="mt-6">
                  <p className="text-gray-500">You don't have an active subscription.</p>
                  <div className="mt-4">
                    <Link href="/subscription" className="btn btn-primary">
                      View Subscription Plans
                    </Link>
                  </div>
                </div>
              )}
            </div>
          )}
          
          {/* Order History */}
          {activeTab === 'orders' && (
            <div className="bg-white shadow-sm rounded-lg p-6">
              <h2 className="text-lg font-medium text-gray-900">Order History</h2>
              
              <div className="mt-6">
                <Link href="/orders" className="btn btn-primary">
                  View All Orders
                </Link>
              </div>
            </div>
          )}
          
          {/* Delete Account */}
          {activeTab === 'delete' && (
            <div className="bg-white shadow-sm rounded-lg p-6">
              <h2 className="text-lg font-medium text-gray-900">Delete Account</h2>
              
              <div className="mt-4">
                <p className="text-gray-500">
                  Once you delete your account, all of your data will be permanently removed. This action cannot be undone.
                </p>
              </div>
              
              {deleteError && (
                <div className="mt-4 bg-red-50 border-l-4 border-red-400 p-4">
                  <div className="flex">
                    <div className="ml-3">
                      <p className="text-sm text-red-700">{deleteError}</p>
                    </div>
                  </div>
                </div>
              )}
              
              {!showDeleteConfirm ? (
                <div className="mt-6">
                  <button
                    type="button"
                    onClick={() => setShowDeleteConfirm(true)}
                    className="btn bg-red-600 hover:bg-red-700 text-white"
                  >
                    Delete Account
                  </button>
                </div>
              ) : (
                <div className="mt-6 bg-red-50 p-4 rounded-md">
                  <p className="text-red-700 font-medium">Are you sure you want to delete your account?</p>
                  <p className="mt-1 text-sm text-red-600">
                    This will cancel any active subscriptions and permanently delete all your data.
                  </p>
                  <div className="mt-4 flex space-x-4">
                    <button
                      type="button"
                      onClick={handleDeleteAccount}
                      className="btn bg-red-600 hover:bg-red-700 text-white"
                    >
                      Yes, Delete My Account
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowDeleteConfirm(false)}
                      className="btn btn-outline"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
