import axios from 'axios';

const PRINTIFY_API_URL = 'https://api.printify.com/v1';

const printifyClient = axios.create({
    baseURL: PRINTIFY_API_URL,
    headers: {
        'Authorization': `Bearer ${process.env.PRINTIFY_API_KEY}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
    },
    timeout: 30000,
});

export const getShopInfo = async () => {
    const response = await printifyClient.get('/shops.json');
    return response.data;
};

export const getProducts = async (shopId) => {
    const response = await printifyClient.get(`/shops/${shopId}/products.json`);
    return response.data;
};

export const getProduct = async (shopId, productId) => {
    const response = await printifyClient.get(`/shops/${shopId}/products/${productId}.json`);
    return response.data;
};

export const createOrder = async (shopId, orderData) => {
    const response = await printifyClient.post(`/shops/${shopId}/orders.json`, orderData);
    return response.data;
};

export const getOrder = async (shopId, orderId) => {
    const response = await printifyClient.get(`/shops/${shopId}/orders/${orderId}.json`);
    return response.data;
};

export const calculateShipping = async (shopId, addressData) => {
    const response = await printifyClient.post(`/shops/${shopId}/orders/shipping.json`, addressData);
    return response.data;
};

export default printifyClient;
