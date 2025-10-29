# Food Ordering Backend API

Backend API for Food Ordering Application built with Node.js and Express.

## Features

- User authentication and authorization
- Restaurant management
- Menu item management
- Order processing
- MongoDB database integration

## Setup Instructions

### Prerequisites

- Node.js (v14 or higher)
- MongoDB (installed locally or MongoDB Atlas account)

### Installation

1. Install dependencies:
```bash
npm install
```

2. Configure environment variables:
- Create a `.env` file in the root directory (already provided)
- Update the following variables:
  - `MONGODB_URI`: MongoDB connection string
  - `JWT_SECRET`: Secret key for JWT tokens
  - `PORT`: Server port (default: 5000)

3. Start the server:

For development:
```bash
npm run dev
```

For production:
```bash
npm start
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/profile` - Get user profile

### Restaurants
- `GET /api/restaurants` - Get all restaurants
- `GET /api/restaurants/:id` - Get single restaurant
- `POST /api/restaurants` - Create a new restaurant
- `PUT /api/restaurants/:id` - Update restaurant

### Menu
- `GET /api/menu/restaurant/:restaurantId` - Get menu items for a restaurant
- `POST /api/menu` - Add menu item
- `PUT /api/menu/:id` - Update menu item
- `DELETE /api/menu/:id` - Delete menu item

### Orders
- `POST /api/orders` - Create a new order
- `GET /api/orders` - Get all orders
- `GET /api/orders/:id` - Get single order
- `PUT /api/orders/:id/status` - Update order status

## Project Structure

```
backend/
├── config/
│   └── db.js           # MongoDB connection
├── models/
│   ├── User.js         # User model
│   ├── Restaurant.js   # Restaurant model
│   ├── MenuItem.js    # Menu item model
│   └── Order.js        # Order model
├── routes/
│   ├── auth.js         # Authentication routes
│   ├── restaurants.js  # Restaurant routes
│   ├── menu.js         # Menu routes
│   └── orders.js       # Order routes
├── middleware/
│   └── auth.js         # Authentication middleware
├── server.js           # Main server file
└── package.json        # Dependencies
```

## Next Steps

1. Implement authentication logic in `routes/auth.js`
2. Implement restaurant CRUD operations
3. Implement menu item management
4. Implement order processing
5. Add input validation
6. Add error handling
7. Write tests

