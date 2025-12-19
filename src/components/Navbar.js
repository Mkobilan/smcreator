import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { Disclosure, Menu, Transition } from '@headlessui/react';
import { ShoppingCartIcon, UserIcon, VideoCameraIcon, Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline';
import SubscriptionStatus from './SubscriptionStatus';

const Navbar = () => {
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const { totalItems } = useCart();
  const router = useRouter();
  
  const navigation = [
    { name: 'Home', href: '/', current: router.pathname === '/' },
    { name: 'Videos', href: '/videos', current: router.pathname.startsWith('/videos') },
    { name: 'Shop', href: '/shop', current: router.pathname.startsWith('/shop') },
    { name: 'Subscription', href: '/subscription', current: router.pathname.startsWith('/subscription') },
  ];

  return (
    <Disclosure as="nav" className="bg-white shadow fixed w-full z-10">
      {({ open }) => (
        <>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex">
                <div className="flex-shrink-0 flex items-center">
                  <Link href="/" className="text-xl font-bold text-primary-600 flex items-center">
                    <VideoCameraIcon className="h-8 w-8 mr-2" />
                    <span>VideoCanvas</span>
                  </Link>
                </div>
                <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                  {navigation.map((item) => (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={`${
                        item.current
                          ? 'border-primary-500 text-gray-900'
                          : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                      } inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium`}
                    >
                      {item.name}
                    </Link>
                  ))}
                  {isAdmin && (
                    <Link
                      href="/admin"
                      className={`${
                        router.pathname.startsWith('/admin')
                          ? 'border-primary-500 text-gray-900'
                          : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                      } inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium`}
                    >
                      Admin
                    </Link>
                  )}
                </div>
              </div>
              <div className="hidden sm:ml-6 sm:flex sm:items-center">
                {/* Subscription status for authenticated users */}
                {isAuthenticated && (
                  <div className="mr-4">
                    <SubscriptionStatus />
                  </div>
                )}
                
                {/* Cart icon */}
                <Link href="/cart" className="p-2 rounded-full text-gray-400 hover:text-gray-500 relative">
                  <span className="sr-only">View cart</span>
                  <ShoppingCartIcon className="h-6 w-6" aria-hidden="true" />
                  {totalItems > 0 && (
                    <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-primary-600 rounded-full">
                      {totalItems}
                    </span>
                  )}
                </Link>

                {/* Profile dropdown */}
                {isAuthenticated ? (
                  <Menu as="div" className="ml-3 relative">
                    <div>
                      <Menu.Button className="bg-white rounded-full flex text-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500">
                        <span className="sr-only">Open user menu</span>
                        {user?.profileImage ? (
                          <img
                            className="h-8 w-8 rounded-full"
                            src={user.profileImage}
                            alt={`${user.firstName} ${user.lastName}`}
                          />
                        ) : (
                          <div className="h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center">
                            <span className="text-primary-800 font-medium">
                              {user?.firstName?.charAt(0)}
                              {user?.lastName?.charAt(0)}
                            </span>
                          </div>
                        )}
                      </Menu.Button>
                    </div>
                    <Transition
                      enter="transition ease-out duration-100"
                      enterFrom="transform opacity-0 scale-95"
                      enterTo="transform opacity-100 scale-100"
                      leave="transition ease-in duration-75"
                      leaveFrom="transform opacity-100 scale-100"
                      leaveTo="transform opacity-0 scale-95"
                    >
                      <Menu.Items className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg py-1 bg-white ring-1 ring-black ring-opacity-5 focus:outline-none">
                        <Menu.Item>
                          {({ active }) => (
                            <Link
                              href="/account"
                              className={`${
                                active ? 'bg-gray-100' : ''
                              } block px-4 py-2 text-sm text-gray-700`}
                            >
                              Your Account
                            </Link>
                          )}
                        </Menu.Item>
                        <Menu.Item>
                          {({ active }) => (
                            <Link
                              href="/orders"
                              className={`${
                                active ? 'bg-gray-100' : ''
                              } block px-4 py-2 text-sm text-gray-700`}
                            >
                              Your Orders
                            </Link>
                          )}
                        </Menu.Item>
                        <Menu.Item>
                          {({ active }) => (
                            <button
                              onClick={logout}
                              className={`${
                                active ? 'bg-gray-100' : ''
                              } block w-full text-left px-4 py-2 text-sm text-gray-700`}
                            >
                              Sign out
                            </button>
                          )}
                        </Menu.Item>
                      </Menu.Items>
                    </Transition>
                  </Menu>
                ) : (
                  <div className="ml-3 flex items-center space-x-4">
                    <Link
                      href="/login"
                      className="text-gray-500 hover:text-gray-700 text-sm font-medium"
                    >
                      Sign in
                    </Link>
                    <Link
                      href="/register"
                      className="bg-primary-600 text-white hover:bg-primary-700 px-3 py-2 rounded-md text-sm font-medium"
                    >
                      Sign up
                    </Link>
                  </div>
                )}
              </div>
              <div className="-mr-2 flex items-center sm:hidden">
                {/* Mobile menu button */}
                <Disclosure.Button className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500">
                  <span className="sr-only">Open main menu</span>
                  {open ? (
                    <XMarkIcon className="block h-6 w-6" aria-hidden="true" />
                  ) : (
                    <Bars3Icon className="block h-6 w-6" aria-hidden="true" />
                  )}
                </Disclosure.Button>
              </div>
            </div>
          </div>

          <Disclosure.Panel className="sm:hidden">
            <div className="pt-2 pb-3 space-y-1">
              {navigation.map((item) => (
                <Disclosure.Button
                  key={item.name}
                  as="a"
                  href={item.href}
                  className={`${
                    item.current
                      ? 'bg-primary-50 border-primary-500 text-primary-700'
                      : 'border-transparent text-gray-500 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-700'
                  } block pl-3 pr-4 py-2 border-l-4 text-base font-medium`}
                >
                  {item.name}
                </Disclosure.Button>
              ))}
              {isAdmin && (
                <Disclosure.Button
                  as="a"
                  href="/admin"
                  className={`${
                    router.pathname.startsWith('/admin')
                      ? 'bg-primary-50 border-primary-500 text-primary-700'
                      : 'border-transparent text-gray-500 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-700'
                  } block pl-3 pr-4 py-2 border-l-4 text-base font-medium`}
                >
                  Admin
                </Disclosure.Button>
              )}
            </div>
            <div className="pt-4 pb-3 border-t border-gray-200">
              {isAuthenticated ? (
                <>
                  <div className="flex items-center px-4">
                    <div className="flex-shrink-0">
                      {user?.profileImage ? (
                        <img
                          className="h-10 w-10 rounded-full"
                          src={user.profileImage}
                          alt={`${user.firstName} ${user.lastName}`}
                        />
                      ) : (
                        <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center">
                          <span className="text-primary-800 font-medium">
                            {user?.firstName?.charAt(0)}
                            {user?.lastName?.charAt(0)}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="ml-3">
                      <div className="text-base font-medium text-gray-800">
                        {user?.firstName} {user?.lastName}
                      </div>
                      <div className="text-sm font-medium text-gray-500">{user?.email}</div>
                    </div>
                    <Link href="/cart" className="ml-auto p-1 rounded-full text-gray-400 hover:text-gray-500 relative">
                      <span className="sr-only">View cart</span>
                      <ShoppingCartIcon className="h-6 w-6" aria-hidden="true" />
                      {totalItems > 0 && (
                        <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-primary-600 rounded-full">
                          {totalItems}
                        </span>
                      )}
                    </Link>
                  </div>
                  <div className="mt-3 space-y-1">
                    <Disclosure.Button
                      as="a"
                      href="/account"
                      className="block px-4 py-2 text-base font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-100"
                    >
                      Your Account
                    </Disclosure.Button>
                    <Disclosure.Button
                      as="a"
                      href="/orders"
                      className="block px-4 py-2 text-base font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-100"
                    >
                      Your Orders
                    </Disclosure.Button>
                    <Disclosure.Button
                      as="button"
                      onClick={logout}
                      className="block w-full text-left px-4 py-2 text-base font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-100"
                    >
                      Sign out
                    </Disclosure.Button>
                  </div>
                </>
              ) : (
                <div className="mt-3 space-y-1">
                  <Disclosure.Button
                    as="a"
                    href="/login"
                    className="block px-4 py-2 text-base font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-100"
                  >
                    Sign in
                  </Disclosure.Button>
                  <Disclosure.Button
                    as="a"
                    href="/register"
                    className="block px-4 py-2 text-base font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-100"
                  >
                    Sign up
                  </Disclosure.Button>
                </div>
              )}
            </div>
          </Disclosure.Panel>
        </>
      )}
    </Disclosure>
  );
};

export default Navbar;
