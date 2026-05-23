<p align="center">
  <img src="https://img.shields.io/badge/NETPark-Smart%20Parking-FFB703?style=for-the-badge&logo=car&logoColor=white" alt="NETPark Badge" />
  <img src="https://img.shields.io/badge/MERN-Stack-3A0CA3?style=for-the-badge&logo=mongodb&logoColor=white" alt="MERN Stack" />
  <img src="https://img.shields.io/badge/License-MIT-00f5d4?style=for-the-badge" alt="License" />
</p>

# 🅿️ NETPark — Smart Parking Management System

> An AI-powered, full-stack parking management system built with the **MERN stack** — featuring real-time slot booking, wallet payments, license plate recognition (ALPR), dynamic pricing, and automated email notifications.

🌐 **Live Demo**: [net-park.vercel.app](https://net-park.vercel.app)

---

## ✨ Features

### 🧑‍💻 User Features
- **OTP-Based Authentication** — Secure login/signup with email OTP verification
- **Real-Time Slot Booking** — Browse branches, select parking spaces, and book with time slots
- **Digital Wallet** — Add money, pay for bookings, and view transaction history
- **Google Maps Integration** — Navigate to parking locations with one click
- **Booking Extensions** — Extend active bookings without losing your spot
- **Review System** — Rate and review parking experiences after each visit

### 🔐 Admin Features
- **Master Admin Dashboard** — Full control over users, bookings, branches, and reviews
- **Branch Management** — Add, edit, and delete parking branches with custom pricing
- **User Management** — View all users, block/unblock accounts
- **Cash Payment Verification** — Manually verify cash payments
- **Admin Approval System** — Master admin approves or rejects new admin registrations
- **ALPR Scanner** — AI-powered license plate recognition for vehicle entry/exit

### 🤖 AI & Automation
- **Automatic License Plate Recognition (ALPR)** — OCR-based plate scanning with fuzzy matching
- **Smart Slot Recommendations** — AI suggests best available parking spots
- **Dynamic Pricing Engine** — Surge pricing based on real-time occupancy
- **Automated Email Notifications** — Booking receipts, 10-min expiry warnings, and review requests
- **Booking Clash Protection** — Real-time lock engine prevents double bookings

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 19, Vite 8, Tailwind CSS, Framer Motion, Lucide Icons |
| **Backend** | Node.js, Express.js |
| **Database** | MongoDB Atlas (Mongoose ODM) |
| **Auth** | JWT, bcrypt.js, OTP via Nodemailer |
| **AI/OCR** | Tesseract.js (License Plate Recognition) |
| **Deployment** | Vercel (Frontend), Render (Backend) |

---

## 📁 Project Structure

```
NETPark/
├── frontend/                 # React + Vite frontend
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Login.jsx           # User login/signup with OTP
│   │   │   ├── UserDashboard.jsx   # User booking & wallet interface
│   │   │   ├── AdminDashboard.jsx  # Admin management panel
│   │   │   ├── AdminLogin.jsx      # Admin authentication
│   │   │   └── SubmitReview.jsx    # Post-booking review form
│   │   ├── api.js                  # Axios API client
│   │   ├── App.jsx                 # Router & error boundary
│   │   └── index.css               # Global styles
│   ├── vercel.json                 # Vercel SPA rewrites
│   ├── tailwind.config.js          # Custom royal theme colors
│   └── vite.config.js
│
├── backend/                  # Express.js API server
│   ├── routes/
│   │   ├── auth.js           # Auth, OTP, admin, reviews, booking receipts
│   │   ├── booking.js        # Booking CRUD operations
│   │   ├── wallet.js         # Wallet transactions
│   │   ├── slot.js           # Parking slot management & AI toggle
│   │   ├── ai.js             # AI recommendations & dynamic pricing
│   │   └── alpr.js           # License plate recognition (OCR)
│   ├── models/
│   │   ├── User.js           # User schema (roles, wallet, blocking)
│   │   ├── Booking.js        # Booking schema (time slots, payments)
│   │   ├── ParkingSlot.js    # Parking branch schema (pricing, coords)
│   │   ├── Transaction.js    # Wallet transaction ledger
│   │   ├── Review.js         # Customer review schema
│   │   └── OTP_Verification.js
│   ├── middleware/
│   │   └── auth.js           # JWT protect & admin-only middleware
│   ├── server.js             # Express app entry point
│   ├── seed.js               # Database seeding script
│   └── .env.example          # Environment variable template
│
├── deploy.js                 # GitHub deployment automation script
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** v18+
- **MongoDB Atlas** account (or local MongoDB)
- **Gmail Account** with [App Password](https://myaccount.google.com/apppasswords) for OTP emails

### 1. Clone the Repository

```bash
git clone git@github.com:Karthikkarer/NETPark.git
cd NETPark
```

### 2. Setup Backend

```bash
cd backend
npm install
```

Create a `.env` file based on the template:

```bash
cp .env.example .env
```

Edit `.env` with your credentials:

```env
MONGO_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/netpark
JWT_SECRET=your-strong-secret-key
SMTP_EMAIL=your-email@gmail.com
SMTP_PASSWORD=your-gmail-app-password
PORT=5000
FRONTEND_URL=https://net-park.vercel.app
```

Start the backend:

```bash
npm run dev
```

### 3. Setup Frontend

```bash
cd frontend
npm install
npm run dev
```

The app will be available at `http://localhost:5173`

---

## 🔌 API Endpoints

### Authentication (`/api/auth`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/register` | Register new user/admin |
| POST | `/login` | Login with email & password |
| POST | `/send-otp` | Send OTP to email |
| POST | `/verify-otp-login` | Verify OTP & authenticate |
| PUT | `/profile` | Update user profile |
| GET | `/users` | Get all users |
| POST | `/toggle-block` | Block/unblock user |
| POST | `/admin/approve` | Approve admin registration |
| POST | `/admin/reject` | Reject admin registration |
| POST | `/send-booking-receipt` | Create booking & send receipt |
| POST | `/verify-cash` | Verify cash payment |
| POST | `/submit-review` | Submit parking review |
| GET | `/reviews` | Get all reviews |

### Bookings (`/api/bookings`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/` | Create booking (wallet deduction) |
| GET | `/my-bookings` | Get user's bookings |
| GET | `/all` | Get all bookings (admin) |

### Wallet (`/api/wallet`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/add-money` | Add funds to wallet |
| GET | `/balance` | Get wallet balance |
| GET | `/transactions` | Get transaction history |

### Slots (`/api/slots`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | Get all parking branches |
| POST | `/` | Create new branch (admin) |
| PUT | `/:id` | Update branch (admin) |
| DELETE | `/:id` | Delete branch (admin) |
| POST | `/toggle-ai` | Toggle AI pricing globally |

### AI (`/api/ai`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/recommend` | Get AI slot recommendations |
| GET | `/dynamic-pricing` | Get surge pricing multiplier |

### ALPR (`/api/alpr`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/scan` | Scan license plate image for entry/exit |

---

## 🌐 Deployment

### Frontend → Vercel
1. Import the repo on [vercel.com](https://vercel.com)
2. Set **Root Directory** to `frontend`
3. Add environment variable: `VITE_API_URL` = `https://your-backend-url/api`
4. Deploy

### Backend → Render
1. Create a new Web Service on [render.com](https://render.com)
2. Connect the GitHub repo
3. Set **Root Directory** to `backend`
4. **Build Command**: `npm install`
5. **Start Command**: `node server.js`
6. Add all environment variables from `.env.example`
7. Deploy

---

## 👥 Team

- **Karthik Karer** — Lead Developer
- **Contributors** — See [Contributors](https://github.com/Karthikkarer/NETPark/graphs/contributors)

---

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

---

<p align="center">
  <b>Built with ❤️ using the MERN Stack</b><br/>
  <sub>NETPark — Where Smart Meets Parking</sub>
</p>
