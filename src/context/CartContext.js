import { createContext, useState, useEffect, useContext } from 'react';

const CartContext = createContext();

export const useCart = () => useContext(CartContext);

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState([]);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPrice, setTotalPrice] = useState(0);
  const [cartTotal, setCartTotal] = useState(0);

  // Initialize cart from localStorage on mount
  useEffect(() => {
    const storedCart = localStorage.getItem('cart');
    if (storedCart) {
      const parsedCart = JSON.parse(storedCart);
      setCartItems(parsedCart);
    }
  }, []);

  // Update totals when cart changes
  useEffect(() => {
    // Calculate total items
    const itemCount = cartItems.reduce((total, item) => total + item.quantity, 0);
    setTotalItems(itemCount);
    
    // Calculate total price
    const price = cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);
    setTotalPrice(price);
    
    // Set cart total (same as totalPrice for now, but could include taxes/shipping later)
    setCartTotal(price);
    
    // Save to localStorage
    localStorage.setItem('cart', JSON.stringify(cartItems));
  }, [cartItems]);

  // Add item to cart
  const addToCart = (product, quantity = 1, variantId) => {
    setCartItems(prevItems => {
      // Check if item already exists in cart
      const existingItemIndex = prevItems.findIndex(
        item => item.id === product.id && item.variantId === variantId
      );
      
      if (existingItemIndex >= 0) {
        // Update quantity of existing item
        const updatedItems = [...prevItems];
        updatedItems[existingItemIndex].quantity += quantity;
        return updatedItems;
      } else {
        // Add new item
        return [...prevItems, {
          id: product.id,
          title: product.title,
          price: product.price,
          imageUrl: product.imageUrl,
          quantity,
          variantId
        }];
      }
    });
  };

  // Update item quantity
  const updateQuantity = (productId, variantId, quantity) => {
    if (quantity <= 0) {
      removeFromCart(productId, variantId);
      return;
    }
    
    setCartItems(prevItems => {
      return prevItems.map(item => {
        if (item.id === productId && item.variantId === variantId) {
          return { ...item, quantity };
        }
        return item;
      });
    });
  };

  // Remove item from cart
  const removeFromCart = (productId, variantId) => {
    setCartItems(prevItems => {
      return prevItems.filter(
        item => !(item.id === productId && item.variantId === variantId)
      );
    });
  };

  // Clear cart
  const clearCart = () => {
    setCartItems([]);
    localStorage.removeItem('cart');
  };

  // Check if product is already in cart
  const isInCart = (productId) => {
    return cartItems.some(item => item.id === productId);
  };

  const value = {
    cartItems,
    totalItems,
    totalPrice,
    cartTotal,
    addToCart,
    updateQuantity,
    removeFromCart,
    clearCart,
    isInCart
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};
