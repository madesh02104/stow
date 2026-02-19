-- Stow Database Schema
-- PostgreSQL

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==========================================
-- USERS TABLE
-- ==========================================
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(120) NOT NULL,
  phone VARCHAR(20) UNIQUE NOT NULL,
  email VARCHAR(255),
  password_hash VARCHAR(255) NOT NULL,
  avatar_url TEXT,
  id_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- LISTINGS TABLE (Storage / Parking spaces)
-- ==========================================
CREATE TYPE listing_type AS ENUM ('storage', 'parking');

CREATE TABLE listings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type listing_type NOT NULL,
  title VARCHAR(200) NOT NULL,
  description TEXT,
  address TEXT NOT NULL,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  length_ft NUMERIC(10,2) NOT NULL,
  width_ft  NUMERIC(10,2) NOT NULL,
  height_ft NUMERIC(10,2),
  total_area_ft2 NUMERIC(14,2) GENERATED ALWAYS AS (length_ft * width_ft) STORED,
  price_per_15min NUMERIC(10,2) NOT NULL DEFAULT 0,
  has_locker    BOOLEAN DEFAULT FALSE,
  has_cctv      BOOLEAN DEFAULT FALSE,
  has_ev_charge BOOLEAN DEFAULT FALSE,
  is_waterproof BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  rating_avg NUMERIC(3,2) DEFAULT 0,
  rating_count INT DEFAULT 0,
  image_url TEXT,
  photos TEXT[] DEFAULT ARRAY[]::TEXT[],
  subtypes TEXT[] DEFAULT ARRAY[]::TEXT[],
  parent_listing_id UUID REFERENCES listings(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- SUB-SLOTS  (Dynamic Space Allocation)
-- ==========================================
CREATE TABLE sub_slots (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  listing_id UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  label VARCHAR(100) NOT NULL,
  length_ft NUMERIC(10,2) NOT NULL,
  width_ft  NUMERIC(10,2) NOT NULL,
  height_ft NUMERIC(10,2),
  area_ft2  NUMERIC(14,2) GENERATED ALWAYS AS (length_ft * width_ft) STORED,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- BOOKINGS TABLE
-- ==========================================
CREATE TYPE booking_status AS ENUM ('pending', 'confirmed', 'in_custody', 'completed', 'cancelled');

CREATE TABLE bookings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  listing_id UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  sub_slot_id UUID REFERENCES sub_slots(id) ON DELETE SET NULL,
  seeker_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  provider_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  duration_minutes INT NOT NULL,
  total_price NUMERIC(10,2) NOT NULL,
  status booking_status DEFAULT 'pending',
  qr_code_token UUID DEFAULT uuid_generate_v4(),
  custody_state VARCHAR(20) DEFAULT 'Pending',  -- Pending | In-Custody | Completed
  handed_over_at TIMESTAMPTZ,
  regotten_at TIMESTAMPTZ,
  refund_amount NUMERIC(10,2) DEFAULT 0,
  refund_percent INT DEFAULT 0,
  item_photos TEXT[] DEFAULT ARRAY[]::TEXT[],
  item_description TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Prevent overlapping bookings on the same sub-slot
CREATE INDEX idx_bookings_slot_time ON bookings (sub_slot_id, start_time, end_time);
CREATE INDEX idx_bookings_listing_time ON bookings (listing_id, start_time, end_time);
CREATE INDEX idx_bookings_seeker ON bookings (seeker_id);
CREATE INDEX idx_bookings_provider ON bookings (provider_id);
CREATE INDEX idx_listings_owner ON listings (owner_id);
CREATE INDEX idx_listings_type ON listings (type);
CREATE INDEX idx_listings_location ON listings (latitude, longitude);

-- ==========================================
-- REVIEWS TABLE
-- ==========================================
CREATE TABLE reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id UUID UNIQUE NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  reviewer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  listing_id UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  rating INT CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
