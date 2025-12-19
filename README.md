# Subscription Video & Print Store

A full-stack web application for a subscription-based platform that offers exclusive video content and canvas print products. Built with Node.js, Express, PostgreSQL, and React (Next.js).

## Features

- **User Authentication**: Secure registration and login system with JWT
- **Video Content**: Public and subscriber-only video content
- **Canvas Print Store**: Integration with Printify API for canvas print products
- **Subscription Management**: Monthly subscription payments via Stripe
- **Admin Dashboard**: Content and user management for administrators
- **Responsive Design**: Mobile-friendly interface with Tailwind CSS

## Tech Stack

### Backend
- Node.js & Express
- PostgreSQL with Sequelize ORM
- JWT Authentication
- AWS S3 for media storage
- Stripe API for payments
- Printify API for product management

### Frontend
- React with Next.js
- Tailwind CSS for styling
- React Query for data fetching
- React Hook Form for form handling
- Headless UI for accessible components

## Project Structure

```
.
├── client/                 # Frontend Next.js application
│   ├── public/             # Static assets
│   └── src/
│       ├── components/     # Reusable UI components
│       ├── context/        # React context providers
│       ├── hooks/          # Custom React hooks
│       ├── pages/          # Next.js pages
│       ├── styles/         # Global styles
│       └── utils/          # Utility functions
│
└── server/                 # Backend Express application
    ├── src/
    │   ├── config/         # Configuration files
    │   ├── controllers/    # API controllers
    │   ├── middleware/     # Express middleware
    │   ├── models/         # Sequelize models
    │   ├── routes/         # API routes
    │   └── utils/          # Utility functions
    └── .env.example        # Environment variables example
```

## Getting Started

### Prerequisites

- Node.js (v14+)
- PostgreSQL
- AWS Account with S3 bucket
- Stripe Account
- Printify Account

### Installation

1. Clone the repository
```bash
git clone <repository-url>
cd subscription-video-store
```

2. Install backend dependencies
```bash
cd server
npm install
```

3. Set up environment variables
```bash
cp .env.example .env
# Edit .env with your configuration
```

4. Install frontend dependencies
```bash
cd ../client
npm install
cp .env.local.example .env.local
# Edit .env.local with your configuration
```

### Running the Application

1. Start the backend server
```bash
cd server
npm run dev
```

2. Start the frontend development server
```bash
cd client
npm run dev
```

3. Access the application at http://localhost:3000

## API Endpoints

### Authentication
- `POST /api/users/register` - Register a new user
- `POST /api/users/login` - Login user

### User Management
- `GET /api/users/profile` - Get user profile
- `PUT /api/users/profile` - Update user profile
- `PUT /api/users/change-password` - Change password
- `DELETE /api/users/account` - Delete account

### Videos
- `GET /api/videos` - Get all videos
- `GET /api/videos/:id` - Get video by ID
- `POST /api/videos` - Create new video (admin)
- `PUT /api/videos/:id` - Update video (admin)
- `DELETE /api/videos/:id` - Delete video (admin)

### Products
- `GET /api/products` - Get all products
- `GET /api/products/:id` - Get product by ID
- `POST /api/products` - Create new product (admin)
- `PUT /api/products/:id` - Update product (admin)
- `DELETE /api/products/:id` - Delete product (admin)

### Orders
- `POST /api/orders` - Create new order
- `GET /api/orders/user` - Get user orders
- `GET /api/orders/:id` - Get order by ID
- `GET /api/orders` - Get all orders (admin)
- `PUT /api/orders/:id/status` - Update order status (admin)

### Subscriptions
- `GET /api/subscriptions/plans` - Get subscription plans
- `POST /api/subscriptions` - Create subscription
- `GET /api/subscriptions/current` - Get current subscription
- `POST /api/subscriptions/cancel` - Cancel subscription
- `POST /api/subscriptions/resume` - Resume subscription
- `POST /api/subscriptions/webhook` - Stripe webhook handler

### Admin
- `GET /api/admin/dashboard` - Get dashboard statistics
- `GET /api/admin/users` - Get all users
- `GET /api/admin/users/:id` - Get user by ID
- `PUT /api/admin/users/:id/role` - Update user role
- `GET /api/admin/analytics/subscriptions` - Get subscription analytics
- `GET /api/admin/analytics/videos` - Get video analytics
- `GET /api/admin/analytics/sales` - Get sales analytics

## License

[MIT](LICENSE)
