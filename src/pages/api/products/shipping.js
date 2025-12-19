export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ message: 'Method not allowed' });
    }

    // Mock shipping data as per original controller
    const mockShippingEstimates = [
        {
            method: 'Standard Shipping',
            price: 5.99,
            estimatedDays: '5-7'
        },
        {
            method: 'Express Shipping',
            price: 12.99,
            estimatedDays: '2-3'
        }
    ];

    res.status(200).json({ shippingEstimates: mockShippingEstimates });
}
