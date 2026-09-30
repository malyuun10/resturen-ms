# Royal Burgundy — Complete Offline Restaurant Management & POS System

A complete, production-ready, professional **Offline Restaurant Management System / Restaurant POS System** built specifically for restaurants to operate 100% reliably without requiring an internet connection.

---

## 1. Technology Stack (Exact Mandatory Stack)

- **Frontend:** HTML5, CSS3, Tailwind CSS, JavaScript, React.js (Vite)
- **Backend:** Node.js, Express.js (REST API Architecture)
- **Database:** MongoDB (Local instance: `mongodb://127.0.0.1:27017/restaurant_management`)
- **Security:** bcryptjs password hashing, JWT authentication, Role-Based Access Control (RBAC)
- **Theme Color Palette:** Maroon / Burgundy (`#800020`), Dark Maroon (`#5C001A`), White & Light Gray (`#F8F8F8`)

```
HTML5 + CSS3 + Tailwind CSS + JavaScript + React.js
                         ↓
                     Frontend (Port 5173)
                         ↓
                  Node.js + Express.js (Port 5000)
                         ↓
                  Backend / REST API
                         ↓
                      MongoDB
                         ↓
             Local Database (Port 27017)
```

---

## 2. Offline-First Architecture

This system runs completely independently on the restaurant premises:
- **No Cloud Database Required:** Connects to local `mongodb://127.0.0.1:27017/restaurant_management`
- **No Online APIs or External CDNs:** All icons, styles, fonts, and assets are bundled locally.
- **Local Persistence:** Users, Menu items, Categories, Tables, Orders, Payments, Inventory audit trails, System settings, and Snapshots are saved to local MongoDB collections.

---

## 3. Strict Role-Based Separation

### Admin Account
- **Username:** `admin`
- **Password:** `admin123`
- **Role:** Administrator (Full unrestricted access)
- **Capabilities:**
  - Executive KPI Dashboard (Today's Sales, Orders, Menu count, Tables, Low stock alerts, Total revenue)
  - User & Staff Management (CRUD users, assign Cashier/Admin roles, activate/deactivate, reset passwords)
  - Menu Management (CRUD dishes & drinks, price updates, stock levels, availability toggle)
  - Category Management (Food, Drinks, Desserts, Pizzas, etc.)
  - Table Floor Plan Management (Track Available, Occupied, Reserved tables)
  - Full Order Audit across all cashiers and dates
  - Inventory & Stock Management (Restock, reduce stock with audit reasons, low stock alerts)
  - Sales & Business Analytics (Daily, Weekly, Monthly, Cashier performance, Product popularity, Inventory valuation)
  - Print & Export Reports (Instant browser print formatting + CSV file export)
  - Restaurant Configuration (Name, address, phone, currency symbol, tax %, low-stock threshold, receipt notes)
  - Local Database Backup & Restore (Export JSON snapshots and 1-click restore)

### Cashier Account
- **Username:** `cashier1`
- **Password:** `cashier123`
- **Role:** Cashier (POS-focused restricted access)
- **Capabilities:**
  - Fast, intuitive POS Terminal
  - Food & Beverage category filters + real-time menu search
  - Dine-In with table selector OR Takeaway mode
  - Cart controls with quantity increment/decrement (`+` / `-`)
  - Subtotal, Tax calculation, and Authorized Discount
  - Cash payment processing with fast cash denomination shortcuts ($10, $20, $50, Exact)
  - Automatic change calculation (`Change = Amount Paid - Total`)
  - Professional Thermal Receipt generation and printing
  - Current Pending Orders tracking and checkout
  - Previous Orders history with 1-click receipt reprint
  - Direct Receipt Lookup by Order Number
- **Security:** Cashiers cannot view or access user management, admin reports, system settings, backup/restore, or administrative APIs.

---

## 4. Project Structure

```
restaurant-management-system/
│
├── client/                     # Frontend (React.js + Tailwind CSS)
│   ├── public/
│   └── src/
│       ├── assets/
│       ├── components/         # Reusable UI components
│       │   ├── Button.jsx
│       │   ├── ConfirmationDialog.jsx
│       │   ├── DashboardCard.jsx
│       │   ├── Loading.jsx
│       │   ├── Modal.jsx
│       │   ├── Navbar.jsx
│       │   ├── Pagination.jsx
│       │   ├── ReceiptModal.jsx
│       │   ├── SearchBar.jsx
│       │   └── Sidebar.jsx
│       ├── hooks/              # Auth context & RBAC helpers
│       │   └── useAuth.jsx
│       ├── layouts/            # Role-isolated layouts
│       │   ├── AdminLayout.jsx
│       │   └── CashierLayout.jsx
│       ├── pages/
│       │   ├── LoginPage.jsx
│       │   ├── admin/          # Admin-only modules
│       │   │   ├── AdminDashboard.jsx
│       │   │   ├── BackupRestore.jsx
│       │   │   ├── CategoryManagement.jsx
│       │   │   ├── InventoryManagement.jsx
│       │   │   ├── MenuManagement.jsx
│       │   │   ├── OrderManagement.jsx
│       │   │   ├── Reports.jsx
│       │   │   ├── SystemSettings.jsx
│       │   │   ├── TableManagement.jsx
│       │   │   └── UserManagement.jsx
│       │   └── cashier/        # Cashier-only modules
│       │       ├── CashierDashboard.jsx
│       │       ├── CashierPOS.jsx
│       │       ├── CurrentOrders.jsx
│       │       ├── PreviousOrders.jsx
│       │       └── ReceiptLookup.jsx
│       ├── services/           # Axios REST API client
│       │   └── api.js
│       ├── App.jsx
│       ├── index.css
│       └── main.jsx
│
├── server/                     # Backend (Node.js + Express.js)
│   ├── backups/                # Local database JSON snapshots
│   ├── config/
│   │   └── db.js               # Local MongoDB connection
│   ├── controllers/            # REST controllers
│   ├── middleware/             # JWT auth & RBAC validation
│   ├── models/                 # Mongoose schema models
│   │   ├── Category.js
│   │   ├── InventoryHistory.js
│   │   ├── MenuItem.js
│   │   ├── Order.js
│   │   ├── Payment.js
│   │   ├── SystemSettings.js
│   │   ├── Table.js
│   │   └── User.js
│   ├── routes/                 # Express API routes
│   ├── utils/
│   │   └── seeder.js           # Automatic database seeder
│   └── server.js               # Server entry point
│
├── package.json
└── README.md
```

---

## 5. Getting Started & Running the System

### Prerequisites
1. **Node.js** (v18 or higher installed)
2. **MongoDB Community Server** running locally on port `27017`

### Step 1: Start the Backend Server
In a terminal:
```bash
cd server
npm start
```
*The backend connects to `mongodb://127.0.0.1:27017/restaurant_management`, runs the initial database seeder automatically, and listens on port `5000`.*

### Step 2: Start the Frontend Client
In a second terminal:
```bash
cd client
npm run dev
```
*Vite will start the client on `http://localhost:5173`.*

### Step 3: Open in Browser
Open `http://localhost:5173` in your web browser.

---

## 6. Demonstration & Evaluation Walkthrough

1. **Login Screen:**
   - Click "Admin" quick fill button or type `admin` / `admin123`.
   - Log in to see the full Burgundy-themed **Admin Control Center**.
2. **Admin Operations:**
   - **Dashboard:** Notice Today's Sales, Orders count, Occupied vs Available tables, and Low-stock item count.
   - **Menu:** View dishes like *Chicken Burger* (stock: 5, flagged with an amber **Low Stock** badge). Add a new item or change price.
   - **Tables:** See tables T-01 to T-10 with real-time seating availability.
   - **Inventory:** View stock levels. Click `+ Restock` to replenish stock and note how it writes to the audit trail.
   - **Reports:** Explore Daily, Weekly, and Monthly sales breakdown, Cashier reports, and product sales. Click **Export to CSV** or **Print Report**.
   - **Backup & Restore:** Click "Create Local Backup Now" to generate an offline JSON snapshot file.
3. **Cashier Operations:**
   - Sign out and log in with Cashier credentials: `cashier1` / `cashier123`.
   - Notice that all Admin modules (Users, Inventory adjustments, System Settings, Backup, Reports) are strictly hidden and blocked by backend RBAC.
   - Click **POS / New Order**.
   - Select **Dine-In** and pick **T-01** (or select **Takeaway**).
   - Click menu cards to add them to the cart. Adjust quantities.
   - Enter cash received (e.g. $50). Notice the live change calculation.
   - Click **Pay Cash & Print Receipt**. The professional thermal receipt modal opens with a direct print button.
   - Notice the table T-01 automatically updates, the order is completed, and inventory stock is automatically deducted in the local database!
