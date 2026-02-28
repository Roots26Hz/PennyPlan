-- ============================================
-- PennyPlan — Local Dealer Inventory Schema
-- Run this in your Supabase SQL editor
-- ============================================

-- 1. Dealers table
CREATE TABLE IF NOT EXISTS local_dealers (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  business_name TEXT NOT NULL,
  owner_name    TEXT NOT NULL,
  email         TEXT NOT NULL UNIQUE,
  phone         TEXT,
  city          TEXT NOT NULL,
  state         TEXT NOT NULL,
  zip_code      TEXT,
  website       TEXT,
  created_at    TIMESTAMPTZ DEFAULT now()
);

-- 2. Products table
CREATE TABLE IF NOT EXISTS local_products (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  dealer_id     UUID NOT NULL REFERENCES local_dealers(id) ON DELETE CASCADE,
  name          TEXT NOT NULL,
  category      TEXT NOT NULL CHECK (category IN (
    'sofa','chair','table','desk','bed','dresser',
    'bookshelf','nightstand','rug','lamp','storage','other'
  )),
  price         NUMERIC(10,2) NOT NULL,
  width_in      NUMERIC(6,1),
  depth_in      NUMERIC(6,1),
  height_in     NUMERIC(6,1),
  style_tags    TEXT[] DEFAULT '{}',
  color         TEXT,
  rating        NUMERIC(2,1) DEFAULT 0,
  review_count  INTEGER DEFAULT 0,
  in_stock      BOOLEAN DEFAULT true,
  image_url     TEXT,
  product_url   TEXT,
  description   TEXT,
  created_at    TIMESTAMPTZ DEFAULT now()
);

-- Indexes for fast search
CREATE INDEX IF NOT EXISTS idx_local_products_category ON local_products(category);
CREATE INDEX IF NOT EXISTS idx_local_products_price    ON local_products(price);
CREATE INDEX IF NOT EXISTS idx_local_products_in_stock ON local_products(in_stock);
CREATE INDEX IF NOT EXISTS idx_local_products_dealer   ON local_products(dealer_id);

-- 3. RLS Policies (enable Row-Level Security)
ALTER TABLE local_dealers  ENABLE ROW LEVEL SECURITY;
ALTER TABLE local_products ENABLE ROW LEVEL SECURITY;

-- Allow public reads (anyone can search products)
CREATE POLICY "Public read dealers"  ON local_dealers  FOR SELECT USING (true);
CREATE POLICY "Public read products" ON local_products FOR SELECT USING (true);

-- Allow inserts via anon key (dealer sign-up + inventory upload)
CREATE POLICY "Public insert dealers"  ON local_dealers  FOR INSERT WITH CHECK (true);
CREATE POLICY "Public insert products" ON local_products FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update products" ON local_products FOR UPDATE USING (true);
CREATE POLICY "Public delete products" ON local_products FOR DELETE USING (true);
