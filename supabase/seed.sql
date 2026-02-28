-- ============================================
-- PennyPlan — Seed Local Dealers + Products
-- Run this AFTER schema.sql in Supabase SQL editor
-- ============================================

-- Dealers
INSERT INTO local_dealers (id, business_name, owner_name, email, phone, city, state, zip_code, website) VALUES
  ('d1a00000-0000-0000-0000-000000000001', 'Local Woodworks Co.', 'James Carter', 'james@localwoodworks.com', '512-555-0101', 'Austin', 'TX', '78701', 'https://localwoodworks.example.com'),
  ('d1a00000-0000-0000-0000-000000000002', 'GreenGrain Furniture', 'Mia Chen', 'mia@greengrain.com', '503-555-0202', 'Portland', 'OR', '97201', 'https://greengrain.example.com'),
  ('d1a00000-0000-0000-0000-000000000003', 'Artisan Home Collective', 'Rosa Delgado', 'rosa@artisanhome.com', '505-555-0303', 'Santa Fe', 'NM', '87501', NULL),
  ('d1a00000-0000-0000-0000-000000000004', 'Harbor Furnishings', 'David Brooks', 'david@harborfurnish.com', '912-555-0404', 'Savannah', 'GA', '31401', 'https://harborfurnish.example.com');

-- Products (10 dummy items spread across 4 dealers)
INSERT INTO local_products (dealer_id, name, category, price, width_in, depth_in, height_in, style_tags, color, rating, review_count, in_stock, image_url, description) VALUES
  -- Local Woodworks Co.
  ('d1a00000-0000-0000-0000-000000000001', 'Handcrafted Teak Coffee Table', 'table', 185.00, 42, 22, 16, ARRAY['farmhouse','mid-century'], 'Natural Teak', 4.8, 34, true,
   'https://images.unsplash.com/photo-1611486212557-88be5ff6f941?w=400&h=400&fit=crop',
   'Solid teak coffee table, hand-finished with natural oils. Each piece is unique.'),

  ('d1a00000-0000-0000-0000-000000000001', 'Mid-Century Walnut Nightstand', 'nightstand', 135.00, 18, 15, 24, ARRAY['mid-century','modern'], 'Walnut', 4.9, 12, true,
   'https://images.unsplash.com/photo-1532372576444-dda954194ad0?w=400&h=400&fit=crop',
   'Compact walnut nightstand with tapered legs and a single drawer.'),

  ('d1a00000-0000-0000-0000-000000000001', 'Custom-Stained Maple Dresser', 'dresser', 420.00, 54, 18, 32, ARRAY['mid-century','modern'], 'Maple', 4.9, 6, true,
   'https://images.unsplash.com/photo-1558997519-83ea9252edf8?w=400&h=400&fit=crop',
   'Six-drawer maple dresser with dovetail joints and custom stain options.'),

  -- GreenGrain Furniture
  ('d1a00000-0000-0000-0000-000000000002', 'Reclaimed Pine Bookshelf', 'bookshelf', 220.00, 32, 12, 60, ARRAY['industrial','farmhouse'], 'Weathered Brown', 4.6, 18, true,
   'https://images.unsplash.com/photo-1594620302200-9a762244a156?w=400&h=400&fit=crop',
   'Tall bookshelf made from reclaimed Pacific Northwest pine with iron brackets.'),

  ('d1a00000-0000-0000-0000-000000000002', 'Live-Edge Cedar Desk', 'desk', 310.00, 48, 24, 30, ARRAY['industrial','modern'], 'Natural Cedar', 4.8, 7, true,
   'https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?w=400&h=400&fit=crop',
   'Live-edge desk crafted from salvaged cedar with steel hairpin legs.'),

  -- Artisan Home Collective
  ('d1a00000-0000-0000-0000-000000000003', 'Hand-Woven Jute Area Rug 5x7', 'rug', 95.00, 84, 60, 1, ARRAY['bohemian','farmhouse'], 'Natural', 4.7, 22, true,
   'https://images.unsplash.com/photo-1600166898405-da9535204843?w=400&h=400&fit=crop',
   'Artisan-woven jute rug with a soft natural texture, 5 × 7 ft.'),

  ('d1a00000-0000-0000-0000-000000000003', 'Bamboo Floor Lamp with Linen Shade', 'lamp', 68.00, 12, 12, 60, ARRAY['bohemian','scandinavian'], 'Natural/White', 4.4, 15, true,
   'https://images.unsplash.com/photo-1513506003901-1e6a229e2d15?w=400&h=400&fit=crop',
   'Sustainably sourced bamboo floor lamp topped with a hand-sewn linen shade.'),

  -- Harbor Furnishings
  ('d1a00000-0000-0000-0000-000000000004', 'Upholstered Linen Accent Chair', 'chair', 275.00, 28, 30, 34, ARRAY['traditional','farmhouse'], 'Oatmeal', 4.5, 9, true,
   'https://images.unsplash.com/photo-1598300042247-d088f8ab3a91?w=400&h=400&fit=crop',
   'Classic wingback accent chair in premium oatmeal linen with nailhead trim.'),

  ('d1a00000-0000-0000-0000-000000000004', 'Rustic Oak Storage Chest', 'storage', 199.00, 36, 18, 20, ARRAY['farmhouse','traditional'], 'Honey Oak', 4.6, 11, true,
   'https://images.unsplash.com/photo-1595428774223-ef52624120d2?w=400&h=400&fit=crop',
   'Blanket chest in solid oak with hand-forged iron hinges.'),

  ('d1a00000-0000-0000-0000-000000000004', 'Handmade Velvet Sofa — 3-Seat', 'sofa', 650.00, 78, 34, 28, ARRAY['bohemian','modern'], 'Emerald Green', 4.7, 14, true,
   'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=400&h=400&fit=crop',
   'Three-seat sofa with kiln-dried hardwood frame and hand-tufted emerald velvet.');
