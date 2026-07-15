# 🍔 Food Delivery (MERN + Firebase Auth)

Three independent apps sharing one backend:

- **frontend** (`fronted/`) — customer storefront. React 19 + Vite, **Firebase** auth (email/password + Google).
- **admin** (`admin/`) — standalone admin dashboard. React 19 + Vite, **its own JWT auth** (no Firebase, no signup, no Google), **Socket.IO** live updates.
- **backend** (`backend/`) — Express + MongoDB (Mongoose), Firebase Admin token verification (customers) **and** JWT auth (admins), Socket.IO server.

### Two completely separate auth realms
- **Customers** authenticate with **Firebase**; the backend verifies Firebase ID tokens.
- **Admins** authenticate against a **separate MongoDB `admins` collection** (bcrypt-hashed passwords, JWT). Admin accounts are created **only** by the `create-admin` script — never through any app.
- A customer credential can never access the admin app, and vice versa. Role-based access is enforced on every admin API route and on the Socket.IO connection.

Prices, discounts, and totals are always computed **server-side**. The customer app
only ever shows the logged-in customer's own data; the admin dashboard sees all
customers, orders, and menu items, and updates **in real time** via Socket.IO.

---

## 1. Prerequisites

- Node.js 18+
- A **MongoDB** database — local (`mongodb://127.0.0.1:27017`) or a free
  [MongoDB Atlas](https://www.mongodb.com/atlas) cluster
- A **Firebase** project — <https://console.firebase.google.com>

---

## 2. Firebase setup (one time)

1. Create a project in the Firebase console.
2. **Authentication → Get started → Sign-in method** → enable **Email/Password** and **Google**.
3. **Client keys (frontend):** Project settings → *General* → *Your apps* → add a **Web app**,
   then copy the `firebaseConfig` values into `fronted/.env` (see below).
4. **Admin key (backend):** Project settings → *Service accounts* →
   **Generate new private key**. Save the downloaded file as
   `backend/serviceAccountKey.json` (already gitignored).

---

## 3. Backend

```bash
cd backend
cp .env.example .env      # then fill in the values (see below)
npm install
npm run seed              # loads the 32 menu items into MongoDB
npm run dev               # starts on http://localhost:4000
```

`backend/.env`:

| Variable | What to put |
|---|---|
| `MONGODB_URI` | Your MongoDB connection string |
| `CLIENT_URL` | Customer frontend origin, e.g. `http://localhost:5173` |
| `ADMIN_CLIENT_URL` | Admin app origin, e.g. `http://localhost:5174` |
| `FIREBASE_SERVICE_ACCOUNT_PATH` | `./serviceAccountKey.json` (or use the inline `FIREBASE_*` trio) |
| `ADMIN_JWT_SECRET` | Long random string used to sign admin JWTs |
| `STRIPE_SECRET_KEY` | Stripe secret key (`sk_test_…`). **Leave blank for cash-on-delivery mode.** |
| `DELIVERY_FEE` | Flat delivery fee (default `2`) |

Create an admin account (the **only** way admins are made):

```bash
npm run create-admin -- admin@example.com "StrongPassw0rd" "Full Name"
```

---

## 4. Frontend

```bash
cd fronted
cp .env.example .env      # then fill in the Firebase web config
npm install
npm run dev               # starts on http://localhost:5173
```

`fronted/.env`:

| Variable | Where it comes from |
|---|---|
| `VITE_API_URL` | Backend URL, e.g. `http://localhost:4000` |
| `VITE_FIREBASE_*` | The web-app `firebaseConfig` values from step 2.3 |

> If the backend isn't running, the frontend falls back to the bundled menu so the
> UI still renders — but sign-in and checkout require the backend + Firebase.

---

## 5. Admin dashboard (separate app)

```bash
cd admin
cp .env.example .env      # set VITE_API_URL (defaults to http://localhost:4000)
npm install
npm run dev               # starts on http://localhost:5174
```

Log in at `http://localhost:5174` with an admin account created via `npm run create-admin`
(above). The dashboard shows platform stats, **all** orders (with live status updates),
the full menu (add/remove), and all customers — everything updates in **real time** via
Socket.IO as customers place orders or change their details. There is **no signup, Google,
or Gmail login** here, and admin accounts cannot be created from any app.

---

## 6. API reference

| Method | Route | Auth | Purpose |
|---|---|---|---|
| `GET` | `/api/food/list` | – | List the menu (from MongoDB) |
| `POST` | `/api/order/place` | 🧑 customer | Place an order → Stripe URL (or COD) |
| `POST` | `/api/order/verify` | 🧑 customer | Confirm/discard order after Stripe |
| `GET` | `/api/order/myorders` | 🧑 customer | The logged-in customer's own orders |
| `GET` | `/api/user/me` · `PUT /api/user/me` | 🧑 customer | Get/update own profile |
| `POST` | `/api/admin/login` | – | Admin login → JWT |
| `GET` | `/api/admin/overview` · `/customers` · `/orders` | 👑 admin | Platform data |
| `POST` | `/api/admin/orders/status` | 👑 admin | Update an order's status |
| `POST` | `/api/admin/food` · `/api/admin/food/remove` | 👑 admin | Manage the menu |

🧑 customer routes require `Authorization: Bearer <firebase-id-token>`.
👑 admin routes require `Authorization: Bearer <admin-jwt>` (from `/api/admin/login`).
The two are verified by different mechanisms and are not interchangeable.

## 7. Payments (Stripe)

Set `STRIPE_SECRET_KEY` in `backend/.env` to enable online payments. Checkout uses
Stripe-hosted Checkout: placing an order returns a `session_url`, the app redirects
there, and Stripe returns to `/verify` which confirms the order. Use test card
`4242 4242 4242 4242` (any future expiry / CVC). With no key set, orders are placed
as **cash on delivery** so the flow still works.

## 8. Real-time updates

The backend emits Socket.IO events (`orders:changed`, `customers:changed`, `menu:changed`)
whenever data changes. Only authenticated admins can connect (the JWT is checked on the
socket handshake), and the admin dashboard re-fetches the affected view instantly — no refresh.

---

## 9. Promo codes

Defined server-side in `backend/config/promos.js` (`JUBAIR15` = 15% off). Add more there;
the client only sends the code string — the discount is applied and validated on the server.
