export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ message: 'Method not allowed' });
    }

    // Same default categories as original controller
    const defaultCategories = ['Canvas Print', 'Wall Art', 'Home Decor'];
    res.status(200).json({ categories: defaultCategories });
}
