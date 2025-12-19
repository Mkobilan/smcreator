import { useState, useEffect } from 'react';
import Head from 'next/head';
import Navbar from './Navbar';
import Footer from './Footer';
import { useAuth } from '../context/AuthContext';

const Layout = ({ children }) => {
  const { loading } = useAuth();
  const [mounted, setMounted] = useState(false);

  // Handle hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <>
      <Head>
        <title>Subscription Video & Print Store</title>
        <meta name="description" content="Premium video content and canvas prints" />
        <link rel="icon" href="/favicon.ico" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      {mounted && (
        <>
          <Navbar />
          <main className="min-h-screen pt-16 pb-10">
            {loading ? (
              <div className="flex justify-center items-center h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
              </div>
            ) : (
              children
            )}
          </main>
          <Footer />
        </>
      )}
    </>
  );
};

export default Layout;
