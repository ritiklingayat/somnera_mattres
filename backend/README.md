# Somnera Mattress - Backend API

Production-ready, modular Node.js/Express backend for the Somnera Mattress e-commerce platform with PostgreSQL (Neon DB), Prisma ORM, JWT Authentication, Brevo Transactional Emailing, Cloudinary Asset Management, and Razorpay Payments.

---

## 1. Tech Stack

- **Runtime & Server:** Node.js, Express.js (ES Modules)
- **Database:** PostgreSQL (Neon DB)
- **ORM:** Prisma v6
- **Authentication:** JWT (JSON Web Tokens) & bcryptjs password hashing
- **Mailing Service:** Brevo API v3 (OTP verification, password reset, order receipts)
- **Asset Storage:** Cloudinary (Multi-image/video direct streaming)
- **Payment Gateway:** Razorpay (Order creation & HMAC-SHA256 signature verification)
- **Security:** Helmet, CORS, Express Rate Limiting

---

## 2. Environment Configuration (`.env`)

Create `.env` in the `backend/` directory:

```env
# Server Config
PORT=5000
FRONTEND_URL=http://localhost:5173

# Database (PostgreSQL / Neon)
DATABASE_URL="postgresql://<USER>:<PASSWORD>@<HOST>/<DB_NAME>?sslmode=require"

# JWT
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRES_IN=7d

# Brevo (Mailing Service)
BREVO_API_URL=https://api.brevo.com/v3
BREVO_API_KEY=your_brevo_api_key
BREVO_SENDER_EMAIL=somneramattresses@gmail.com
BREVO_SENDER_NAME="Somnera Mattress"

# Cloudinary
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret

# Razorpay
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret
```

---

## 3. Database Setup & Seeding (Neon DB)

1. Put your real Neon DB PostgreSQL connection string into `DATABASE_URL` in `backend/.env`.
2. Push the schema to your Neon database:
   ```bash
   npm run prisma:push
   ```
3. Seed the database with Somnera catalog, categories, default admin, coupons, and showrooms:
   ```bash
   npm run prisma:seed
   ```
4. (Optional) Open Prisma Studio visual database editor:
   ```bash
   npm run prisma:studio
   ```

---

## 4. Running the Server

- **Development Mode (Auto-restart on save):**
  ```bash
  npm run dev
  ```
- **Production Mode:**
  ```bash
  npm start
  ```
- **Run Automated Tests:**
  ```bash
  npm test
  ```

---

## 5. API Endpoints Overview

### Health
- `GET /api/health` - Server health check & uptime status

### Authentication (`/api/auth`)
- `POST /api/auth/send-otp` - Trigger 6-digit OTP to email via Brevo
- `POST /api/auth/register` - Verify OTP, hash password, create active customer
- `POST /api/auth/login` - Authenticate customer or admin, issue JWT
- `POST /api/auth/forgot-password` - Dispatch password reset OTP
- `POST /api/auth/reset-password` - Verify OTP and update password
- `GET /api/auth/me` - Authenticated user profile `[Bearer Token]`
- `PUT /api/auth/profile` - Update user details `[Bearer Token]`

### Product Catalog (`/api/products`)
- `GET /api/products` - List products with search, filters, pagination, category/price sorting
- `GET /api/products/:id` - Fetch single product by ID or SKU

### Categories (`/api/categories`)
- `GET /api/categories` - Fetch active categories and nested subcategories

### Cart Management (`/api/cart`) `[Auth]`
- `GET /api/cart` - Retrieve user's cart with items and total calculation
- `POST /api/cart/items` - Add product (dynamic price computation based on size/thickness)
- `PUT /api/cart/items/:itemId` - Update item quantity (1-10)
- `DELETE /api/cart/items/:itemId` - Remove single item
- `DELETE /api/cart` - Clear entire cart

### Wishlist (`/api/wishlist`) `[Auth]`
- `GET /api/wishlist` - Retrieve user's wishlist
- `POST /api/wishlist/toggle/:productId` - Toggle wishlist status
- `POST /api/wishlist/items` - Add item
- `DELETE /api/wishlist/items/:productId` - Remove item
- `GET /api/wishlist/check/:productId` - Check item status

### Coupons (`/api/coupons`)
- `GET /api/coupons/available` - Public list of active promo codes
- `POST /api/coupons/apply` - Validate coupon against cart total and calculate discount

### Checkout & Payments (`/api/checkout` & `/api/payments`) `[Auth]`
- `POST /api/checkout/initialize` - Validate cart, apply discount, create order & init Razorpay order
- `POST /api/payments/razorpay/create-order` - Create Razorpay order ID
- `POST /api/payments/razorpay/verify` - Verify cryptographic HMAC SHA256 signature, mark PAID, confirm order
- `POST /api/payments/razorpay/failure` - Mark payment FAILED

### Customer Orders (`/api/orders`) `[Auth]`
- `GET /api/orders/my-orders` - List customer's past orders
- `GET /api/orders/my-orders/:id` - View order details

### Admin Dashboard (`/api/admin`) `[Auth + ADMIN Role]`
- `GET /api/admin/overview` - Revenue, orders count, product count, customers count
- `GET /api/admin/categories` & `POST`, `PUT`, `DELETE` - Category CRUD
- `GET /api/admin/products` & `POST`, `PUT`, `DELETE` - Product CRUD with Cloudinary multi-image upload
- `GET /api/admin/coupons` & `POST`, `PUT`, `DELETE` - Coupon engine CRUD
- `GET /api/admin/orders` & `PUT /api/admin/orders/:id/status` - Order tracking and status management
- `GET /api/admin/customers` & `PUT /api/admin/customers/:id/status` - Customer management (`ACTIVE`, `BLOCKED`)
- `GET /api/admin/showrooms` - Showroom experience centers
- `GET /api/admin/distributor-requests` - Distributor inquiries
