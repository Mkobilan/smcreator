import { getProducts } from '../../../lib/printify';

export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ message: 'Method not allowed' });
    }

    try {
        const {
            page = 1,
            limit = 12,
            category,
            search,
            sort = 'newest'
        } = req.query;

        const shopId = process.env.PRINTIFY_SHOP_ID;
        const allProducts = await getProducts(shopId);

        // Formatting logic similar to productController.js
        let filteredProducts = allProducts.data || allProducts;

        if (category) {
            filteredProducts = filteredProducts.filter(p =>
                p.tags?.some(t => t.toLowerCase().includes(category.toLowerCase()))
            );
        }

        if (search) {
            const s = search.toLowerCase();
            filteredProducts = filteredProducts.filter(p =>
                p.title.toLowerCase().includes(s) || p.description?.toLowerCase().includes(s)
            );
        }

        // Pagination
        const totalProducts = filteredProducts.length;
        const offset = (page - 1) * limit;
        const paginated = filteredProducts.slice(offset, offset + parseInt(limit));

        const formattedProducts = paginated.map(product => {
            let imageUrl = product.images?.[0]?.src || '';
            if (product.variants?.[0]?.preview_image_url) {
                imageUrl = product.variants[0].preview_image_url;
            }

            let price = 0;
            if (product.variants?.[0]?.price) {
                price = parseFloat(product.variants[0].price) / 100;
            }

            return {
                id: product.id,
                title: product.title,
                description: product.description || '',
                price: price,
                imageUrl: imageUrl,
                isPublished: product.visible,
                createdAt: new Date(product.created_at),
                updatedAt: new Date(product.updated_at)
            };
        });

        res.status(200).json({
            products: formattedProducts,
            totalPages: Math.ceil(totalProducts / limit),
            currentPage: parseInt(page),
            totalProducts
        });
    } catch (error) {
        console.error('Get products error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
}
