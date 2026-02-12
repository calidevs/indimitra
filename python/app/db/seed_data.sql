-- Mock data for testing IndiMitra UI
-- Run this to populate the database with test stores, products, and categories

-- Clear existing data (optional - comment out if you want to keep existing data)
-- TRUNCATE TABLE order_items, orders, payment, inventory, products, categories, store_driver, store, users, address, delivery CASCADE;

-- Insert test users
INSERT INTO users (id, name, email, phone_number, user_type, date_created)
VALUES
  (1, 'Test Customer', 'customer@test.com', '555-0100', 'CUSTOMER', NOW()),
  (2, 'Store Manager', 'manager@test.com', '555-0200', 'STOREMANAGER', NOW()),
  (3, 'Driver User', 'driver@test.com', '555-0300', 'DRIVER', NOW())
ON CONFLICT (id) DO NOTHING;

-- Insert test stores
INSERT INTO store (id, name, address, contact_number, email, opening_time, closing_time, is_active, date_created)
VALUES
  (1, 'Fresh Fruits & Vegetables', '123 Market Street, San Francisco, CA 94103', '555-1000', 'freshfv@indimitra.com', '08:00:00', '20:00:00', true, NOW()),
  (2, 'Spice Bazaar', '456 Curry Lane, San Francisco, CA 94103', '555-2000', 'spices@indimitra.com', '09:00:00', '21:00:00', true, NOW()),
  (3, 'Grocery Express', '789 Main Avenue, San Francisco, CA 94103', '555-3000', 'grocery@indimitra.com', '07:00:00', '22:00:00', true, NOW())
ON CONFLICT (id) DO NOTHING;

-- Insert categories
INSERT INTO categories (id, name, description, date_created)
VALUES
  (1, 'Fruits', 'Fresh seasonal fruits', NOW()),
  (2, 'Vegetables', 'Fresh vegetables and greens', NOW()),
  (3, 'Spices', 'Indian spices and masalas', NOW()),
  (4, 'Grains & Pulses', 'Rice, lentils, and beans', NOW()),
  (5, 'Dairy', 'Milk, yogurt, and cheese', NOW()),
  (6, 'Snacks', 'Indian snacks and namkeen', NOW())
ON CONFLICT (id) DO NOTHING;

-- Insert products for Store 1 (Fresh Fruits & Vegetables)
INSERT INTO products (id, name, description, price, category_id, store_id, image_url, date_created)
VALUES
  -- Fruits
  (1, 'Alphonso Mango', 'Premium Alphonso mangoes from Maharashtra', 8.99, 1, 1, '/images/products/alphonso.png', NOW()),
  (2, 'Chinna Rasalu', 'Sweet Chinna Rasalu mangoes', 6.99, 1, 1, '/images/products/chinna-rasalu.png', NOW()),
  (3, 'Bananas', 'Fresh ripe bananas', 2.99, 1, 1, null, NOW()),
  (4, 'Pomegranate', 'Juicy pomegranates', 5.99, 1, 1, null, NOW()),
  (5, 'Guava', 'Fresh guavas', 3.99, 1, 1, null, NOW()),

  -- Vegetables
  (6, 'Tomatoes', 'Fresh red tomatoes', 3.49, 2, 1, null, NOW()),
  (7, 'Onions', 'Fresh yellow onions', 2.99, 2, 1, null, NOW()),
  (8, 'Potatoes', 'Russet potatoes', 4.99, 2, 1, null, NOW()),
  (9, 'Green Chili', 'Hot green chilies', 1.99, 2, 1, null, NOW()),
  (10, 'Spinach', 'Fresh spinach bunch', 2.49, 2, 1, null, NOW()),
  (11, 'Okra (Bhindi)', 'Fresh okra', 4.49, 2, 1, null, NOW()),
  (12, 'Eggplant (Brinjal)', 'Fresh eggplant', 3.99, 2, 1, null, NOW())
ON CONFLICT (id) DO NOTHING;

-- Insert products for Store 2 (Spice Bazaar)
INSERT INTO products (id, name, description, price, category_id, store_id, image_url, date_created)
VALUES
  -- Spices
  (13, 'Turmeric Powder', 'Pure turmeric powder - 200g', 4.99, 3, 2, null, NOW()),
  (14, 'Red Chili Powder', 'Hot red chili powder - 200g', 5.99, 3, 2, null, NOW()),
  (15, 'Garam Masala', 'Authentic garam masala blend - 100g', 6.99, 3, 2, null, NOW()),
  (16, 'Cumin Seeds', 'Whole cumin seeds - 200g', 4.49, 3, 2, null, NOW()),
  (17, 'Coriander Powder', 'Ground coriander - 200g', 3.99, 3, 2, null, NOW()),
  (18, 'Biryani Masala', 'Special biryani masala - 100g', 7.99, 3, 2, null, NOW()),

  -- Grains & Pulses
  (19, 'Basmati Rice', 'Premium aged basmati rice - 5lb', 12.99, 4, 2, null, NOW()),
  (20, 'Toor Dal', 'Yellow split pigeon peas - 2lb', 6.99, 4, 2, null, NOW()),
  (21, 'Moong Dal', 'Split green gram - 2lb', 5.99, 4, 2, null, NOW()),
  (22, 'Chana Dal', 'Split chickpeas - 2lb', 6.49, 4, 2, null, NOW())
ON CONFLICT (id) DO NOTHING;

-- Insert products for Store 3 (Grocery Express)
INSERT INTO products (id, name, description, price, category_id, store_id, image_url, date_created)
VALUES
  -- Dairy
  (23, 'Whole Milk', 'Fresh whole milk - 1 gallon', 5.99, 5, 3, null, NOW()),
  (24, 'Plain Yogurt', 'Homestyle yogurt - 32oz', 4.99, 5, 3, null, NOW()),
  (25, 'Paneer', 'Fresh paneer cheese - 14oz', 6.99, 5, 3, null, NOW()),
  (26, 'Ghee', 'Pure clarified butter - 16oz', 12.99, 5, 3, null, NOW()),

  -- Snacks
  (27, 'Samosa (4 pack)', 'Crispy vegetable samosas', 5.99, 6, 3, null, NOW()),
  (28, 'Chakli', 'Crunchy chakli - 200g', 4.99, 6, 3, null, NOW()),
  (29, 'Murukku', 'Traditional murukku - 200g', 4.99, 6, 3, null, NOW()),
  (30, 'Mixture', 'Spicy mixture namkeen - 400g', 6.99, 6, 3, null, NOW())
ON CONFLICT (id) DO NOTHING;

-- Insert inventory for all products (set stock levels)
INSERT INTO inventory (product_id, quantity, date_created)
SELECT id, 100, NOW() FROM products
WHERE NOT EXISTS (SELECT 1 FROM inventory WHERE inventory.product_id = products.id);

-- Insert customer addresses
INSERT INTO address (id, user_id, address, city, state, zip_code, date_created)
VALUES
  (1, 1, '100 Test Street, Apt 5B', 'San Francisco', 'CA', '94103', NOW()),
  (2, 1, '200 Market Street, Unit 3A', 'San Francisco', 'CA', '94102', NOW())
ON CONFLICT (id) DO NOTHING;

-- Insert store pickup addresses
INSERT INTO pickup_address (id, store_id, address, city, state, zip_code, contact_number, is_active, date_created)
VALUES
  (1, 1, '123 Market Street', 'San Francisco', 'CA', '94103', '555-1000', true, NOW()),
  (2, 2, '456 Curry Lane', 'San Francisco', 'CA', '94103', '555-2000', true, NOW()),
  (3, 3, '789 Main Avenue', 'San Francisco', 'CA', '94103', '555-3000', true, NOW())
ON CONFLICT (id) DO NOTHING;

-- Insert store location codes
INSERT INTO store_location_code (id, store_id, location_code, location_name, is_active, date_created)
VALUES
  (1, 1, 'FV-01', 'Main Location', true, NOW()),
  (2, 2, 'SB-01', 'Main Location', true, NOW()),
  (3, 3, 'GE-01', 'Main Location', true, NOW())
ON CONFLICT (id) DO NOTHING;

-- Insert delivery fees
INSERT INTO fees (id, store_id, fee_type, amount, description, date_created)
VALUES
  (1, 1, 'DELIVERY', 5.99, 'Standard delivery fee', NOW()),
  (2, 2, 'DELIVERY', 5.99, 'Standard delivery fee', NOW()),
  (3, 3, 'DELIVERY', 4.99, 'Express delivery fee', NOW())
ON CONFLICT (id) DO NOTHING;

-- Insert a store driver
INSERT INTO store_driver (id, store_id, name, phone_number, vehicle_info, is_active, date_created)
VALUES
  (1, 1, 'Raj Kumar', '555-4000', 'Honda Civic - ABC123', true, NOW()),
  (2, 2, 'Priya Singh', '555-5000', 'Toyota Camry - XYZ789', true, NOW()),
  (3, 3, 'Amit Patel', '555-6000', 'Ford Transit - DEF456', true, NOW())
ON CONFLICT (id) DO NOTHING;

-- Update sequences to avoid conflicts
SELECT setval('users_id_seq', (SELECT MAX(id) FROM users) + 1, false);
SELECT setval('store_id_seq', (SELECT MAX(id) FROM store) + 1, false);
SELECT setval('categories_id_seq', (SELECT MAX(id) FROM categories) + 1, false);
SELECT setval('products_id_seq', (SELECT MAX(id) FROM products) + 1, false);
SELECT setval('inventory_id_seq', (SELECT MAX(id) FROM inventory) + 1, false);
SELECT setval('address_id_seq', (SELECT MAX(id) FROM address) + 1, false);
SELECT setval('pickup_address_id_seq', (SELECT MAX(id) FROM pickup_address) + 1, false);
SELECT setval('store_location_code_id_seq', (SELECT MAX(id) FROM store_location_code) + 1, false);
SELECT setval('fees_id_seq', (SELECT MAX(id) FROM fees) + 1, false);
SELECT setval('store_driver_id_seq', (SELECT MAX(id) FROM store_driver) + 1, false);

-- Summary
SELECT 'Mock data loaded successfully!' as message;
SELECT COUNT(*) as store_count FROM store WHERE is_active = true;
SELECT COUNT(*) as product_count FROM products;
SELECT COUNT(*) as category_count FROM categories;
SELECT COUNT(*) as user_count FROM users;
