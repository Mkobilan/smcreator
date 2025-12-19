import { useState } from 'react';
import { QueryClient, QueryClientProvider } from 'react-query';
import { AuthProvider } from '../context/AuthContext';
import { CartProvider } from '../context/CartContext';
import { NotificationProvider } from '../contexts/NotificationContext';
import Layout from '../components/Layout';
import '../styles/globals.css';

function MyApp({ Component, pageProps }) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <CartProvider>
          <NotificationProvider>
            <Layout>
              <Component {...pageProps} />
            </Layout>
          </NotificationProvider>
        </CartProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default MyApp;
