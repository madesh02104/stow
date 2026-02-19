# Stow – Hyper-Local Storage & Parking Marketplace

A peer-to-peer marketplace for sub-hour storage and parking reservations with 15-minute granularity, dynamic space allocation, and a verifiable Chain of Custody.

## Project Structure

```
Stow/
├── client/                       # React + Tailwind frontend
│   ├── public/
│   │   └── index.html
│   ├── src/
│   │   ├── components/
│   │   │   ├── auth/             # Login, Register, Forgot Password
│   │   │   ├── booking/          # BookingDetail, TimeSlotPicker, PriceCalculator
│   │   │   ├── common/           # QRHandshake, StatusBadge
│   │   │   ├── dashboard/        # MyListings, BookingHistory
│   │   │   ├── home/             # HeroSection, HowItWorks, Suggestions, WhyStow
│   │   │   ├── layout/           # Header, Footer, FloatingActionButton
│   │   │   └── listing/          # CreateListing multi-step wizard
│   │   ├── context/
│   │   │   └── AuthContext.jsx
│   │   ├── pages/                # Route-level page wrappers
│   │   ├── api.js                # Axios instance
│   │   ├── App.jsx               # Router + Layout
│   │   ├── index.js
│   │   └── index.css             # Tailwind imports
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   └── package.json
│
├── server/                       # Node.js + Express backend
│   ├── config/
│   │   └── db.js                 # PostgreSQL pool
│   ├── middleware/
│   │   └── auth.js               # JWT auth middleware
│   ├── routes/
│   │   ├── auth.js               # Register / Login / Profile
│   │   ├── listings.js           # CRUD + sub-slots
│   │   ├── bookings.js           # Create / Read / Cancel / Slots
│   │   └── custody.js            # Chain of Custody state machine
│   ├── utils/
│   │   └── timeSlots.js          # 15-min slot generation & overlap detection
│   ├── server.js
│   ├── .env
│   └── package.json
│
├── database/
│   └── schema.sql                # PostgreSQL DDL
│
└── .gitignore
```

## Setup & Install Commands

### 1. Prerequisites

- **Node.js** >= 18
- **PostgreSQL** >= 14

### 2. Database Setup

```bash
# Create the database
psql -U postgres -c "CREATE DATABASE stow;"

# Run the schema
psql -U postgres -d stow -f database/schema.sql
```

### 3. Backend

```bash
cd server
npm install
npm run dev        # starts on http://localhost:5000
```

### 4. Frontend

```bash
cd client
npm install
npm start          # starts on http://localhost:3000  (proxies API to :5000)
```

## Tech Stack

| Layer      | Technology                                       |
|------------|--------------------------------------------------|
| Frontend   | React 18, Tailwind CSS 3, React Router 6         |
| Backend    | Node.js, Express 4                               |
| Database   | PostgreSQL (date-fns for time-slot math)          |
| Icons      | lucide-react                                     |
| QR Codes   | qrcode.react                                     |
| Validation | react-hook-form                                  |
| Auth       | JWT (jsonwebtoken + bcryptjs)                    |

## Color Palette

| Token      | Hex       | Usage                              |
|------------|-----------|------------------------------------|
| Primary    | `#FF681F` | Buttons, active states, brand      |
| Secondary  | `#E6A459` | Accents, sub-headers               |
| Background | `#FFFFFF` | Clean white canvas                 |
| Body Text  | `#64748B` | Slate gray body copy               |
| Card BG    | `#F8FAFC` | Off-white card backgrounds         |

## Core Features

- **15-Minute Time-Slot Engine** – date-fns powered slot generation with overlap prevention
- **Chain of Custody** – State machine (Pending → In-Custody → Completed) with QR handshake verification
- **Dynamic Space Allocation** – Sub-divide listings into sub-slots; remaining area stays bookable
- **Multi-step Listing Wizard** – Type → Details → Amenities → Sub-Slots
- **Booking Detail Page** – Visual time-slot picker + real-time price calculator
