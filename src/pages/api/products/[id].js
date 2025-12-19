import { getProduct } from '../../../lib/printify';

export default async function handler(req, res) {
    const { id } = req.query;

    if (req.method !== 'GET') {
        return res.status(405).json({ message: 'Method not allowed' });
    }

    try {
        const shopId = process.env.PRINTIFY_SHOP_ID;
        const product = await getProduct(shopId, id);

        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }

        let imageUrl = product.images?.[0]?.src || '';
        const selectedVariants = product.variants?.filter(v => v.is_enabled !== false) || [];

        const formattedProduct = {
            id: product.id,
            title: product.title,
            description: product.description,
            price: selectedVariants.length > 0 ? parseFloat(selectedVariants[0].price) / 100 : 0,
            imageUrl: imageUrl,
            images: product.images || [],
            variants: selectedVariants,
            createdAt: product.created_at,
            updatedAt: product.updated_at
        };

        res.status(200).json({ product: formattedProduct });
    } catch (error) {
        console.error('Get product error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
}
