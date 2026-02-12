-- Mock data for testing IndiMitra UI (corrected schema)

-- Insert test users (manager for stores, customer for testing)
INSERT INTO users (email, mobile, active, type, "referredBy", "referralId", "cognitoId", "createdAt", "updatedAt")
VALUES
  ('manager1@test.com', '5551000', true, 'STORE_MANAGER', NULL, 'REF001', 'cognito-manager1', NOW(), NOW()),
  ('manager2@test.com', '5552000', true, 'STORE_MANAGER', NULL, 'REF002', 'cognito-manager2', NOW(), NOW()),
  ('manager3@test.com', '5553000', true, 'STORE_MANAGER', NULL, 'REF003', 'cognito-manager3', NOW(), NOW()),
  ('customer@test.com', '5550100', true, 'USER', NULL, 'REF100', 'cognito-customer1', NOW(), NOW())
ON CONFLICT (email) DO NOTHING;

-- Get manager user IDs for stores
DO $$
DECLARE
  manager1_id INT;
  manager2_id INT;
  manager3_id INT;
  customer_id INT;
  store1_id INT;
  store2_id INT;
  store3_id INT;
BEGIN
  -- Get user IDs
  SELECT id INTO manager1_id FROM users WHERE email = 'manager1@test.com';
  SELECT id INTO manager2_id FROM users WHERE email = 'manager2@test.com';
  SELECT id INTO manager3_id FROM users WHERE email = 'manager3@test.com';
  SELECT id INTO customer_id FROM users WHERE email = 'customer@test.com';

  -- Insert stores
  INSERT INTO store (name, address, radius, "managerUserId", email, mobile, display_field, is_active, disabled)
  VALUES
    ('Fresh Fruits & Vegetables', '123 Market Street, San Francisco, CA 94103', 10.0, manager1_id, 'store1@indimitra.com', '4155551001', 'fresh-fruits-vegetables', true, false),
    ('Spice Bazaar', '456 Curry Lane, San Francisco, CA 94103', 15.0, manager2_id, 'store2@indimitra.com', '4155552002', 'spice-bazaar', true, false),
    ('Grocery Express', '789 Main Avenue, San Francisco, CA 94103', 20.0, manager3_id, 'store3@indimitra.com', '4155553003', 'grocery-express', true, false)
  ON CONFLICT DO NOTHING;

  -- Get store IDs
  SELECT id INTO store1_id FROM store WHERE name = 'Fresh Fruits & Vegetables';
  SELECT id INTO store2_id FROM store WHERE name = 'Spice Bazaar';
  SELECT id INTO store3_id FROM store WHERE name = 'Grocery Express';

  -- Insert categories
  INSERT INTO categories (name, "createdAt")
  VALUES
    ('Fruits', NOW()),
    ('Vegetables', NOW()),
    ('Spices', NOW()),
    ('Grains & Pulses', NOW()),
    ('Dairy', NOW()),
    ('Snacks', NOW())
  ON CONFLICT DO NOTHING;

  -- Insert products
  INSERT INTO products (name, description, "categoryId", image)
  SELECT * FROM (VALUES
    -- Fruits (categoryId=1)
    ('Alphonso Mango', 'Premium Alphonso mangoes from Maharashtra', 1, '/images/products/alphonso.png'),
    ('Chinna Rasalu', 'Sweet Chinna Rasalu mangoes', 1, '/images/products/chinna-rasalu.png'),
    ('Bananas', 'Fresh ripe bananas', 1, NULL),
    ('Pomegranate', 'Juicy pomegranates', 1, NULL),
    ('Guava', 'Fresh guavas', 1, NULL),

    -- Vegetables (categoryId=2)
    ('Tomatoes', 'Fresh red tomatoes', 2, NULL),
    ('Onions', 'Fresh yellow onions', 2, NULL),
    ('Potatoes', 'Russet potatoes', 2, NULL),
    ('Green Chili', 'Hot green chilies', 2, NULL),
    ('Spinach', 'Fresh spinach bunch', 2, NULL),
    ('Okra (Bhindi)', 'Fresh okra', 2, NULL),
    ('Eggplant (Brinjal)', 'Fresh eggplant', 2, NULL),

    -- Spices (categoryId=3)
    ('Turmeric Powder', 'Pure turmeric powder - 200g', 3, NULL),
    ('Red Chili Powder', 'Hot red chili powder - 200g', 3, NULL),
    ('Garam Masala', 'Authentic garam masala blend - 100g', 3, NULL),
    ('Cumin Seeds', 'Whole cumin seeds - 200g', 3, NULL),
    ('Coriander Powder', 'Ground coriander - 200g', 3, NULL),
    ('Biryani Masala', 'Special biryani masala - 100g', 3, NULL),

    -- Grains & Pulses (categoryId=4)
    ('Basmati Rice', 'Premium aged basmati rice - 5lb', 4, NULL),
    ('Toor Dal', 'Yellow split pigeon peas - 2lb', 4, NULL),
    ('Moong Dal', 'Split green gram - 2lb', 4, NULL),
    ('Chana Dal', 'Split chickpeas - 2lb', 4, NULL),

    -- Dairy (categoryId=5)
    ('Whole Milk', 'Fresh whole milk - 1 gallon', 5, NULL),
    ('Plain Yogurt', 'Homestyle yogurt - 32oz', 5, NULL),
    ('Paneer', 'Fresh paneer cheese - 14oz', 5, NULL),
    ('Ghee', 'Pure clarified butter - 16oz', 5, NULL),

    -- Snacks (categoryId=6)
    ('Samosa (4 pack)', 'Crispy vegetable samosas', 6, NULL),
    ('Chakli', 'Crunchy chakli - 200g', 6, NULL),
    ('Murukku', 'Traditional murukku - 200g', 6, NULL),
    ('Mixture', 'Spicy mixture namkeen - 400g', 6, NULL)
  ) AS t(name, description, "categoryId", image)
  WHERE NOT EXISTS (SELECT 1 FROM products WHERE products.name = t.name);

  -- Insert inventory (products available at stores with prices)
  -- Store 1: Fruits & Vegetables
  INSERT INTO inventory ("storeId", "productId", price, measurement, unit, quantity, is_listed, is_available, "updatedAt")
  SELECT store1_id, p.id, price, 1, unit, 100, true, true, NOW()
  FROM (VALUES
    ('Alphonso Mango', 8.99, 'lb'),
    ('Chinna Rasalu', 6.99, 'lb'),
    ('Bananas', 2.99, 'lb'),
    ('Pomegranate', 5.99, 'each'),
    ('Guava', 3.99, 'lb'),
    ('Tomatoes', 3.49, 'lb'),
    ('Onions', 2.99, 'lb'),
    ('Potatoes', 4.99, 'lb'),
    ('Green Chili', 1.99, 'lb'),
    ('Spinach', 2.49, 'bunch'),
    ('Okra (Bhindi)', 4.49, 'lb'),
    ('Eggplant (Brinjal)', 3.99, 'lb')
  ) AS t(name, price, unit)
  JOIN products p ON p.name = t.name
  WHERE NOT EXISTS (
    SELECT 1 FROM inventory WHERE "storeId" = store1_id AND "productId" = p.id
  );

  -- Store 2: Spices and Grains
  INSERT INTO inventory ("storeId", "productId", price, measurement, unit, quantity, is_listed, is_available, "updatedAt")
  SELECT store2_id, p.id, price, 1, unit, 100, true, true, NOW()
  FROM (VALUES
    ('Turmeric Powder', 4.99, 'pack'),
    ('Red Chili Powder', 5.99, 'pack'),
    ('Garam Masala', 6.99, 'pack'),
    ('Cumin Seeds', 4.49, 'pack'),
    ('Coriander Powder', 3.99, 'pack'),
    ('Biryani Masala', 7.99, 'pack'),
    ('Basmati Rice', 12.99, 'pack'),
    ('Toor Dal', 6.99, 'pack'),
    ('Moong Dal', 5.99, 'pack'),
    ('Chana Dal', 6.49, 'pack')
  ) AS t(name, price, unit)
  JOIN products p ON p.name = t.name
  WHERE NOT EXISTS (
    SELECT 1 FROM inventory WHERE "storeId" = store2_id AND "productId" = p.id
  );

  -- Store 3: Dairy and Snacks
  INSERT INTO inventory ("storeId", "productId", price, measurement, unit, quantity, is_listed, is_available, "updatedAt")
  SELECT store3_id, p.id, price, 1, unit, 100, true, true, NOW()
  FROM (VALUES
    ('Whole Milk', 5.99, 'gallon'),
    ('Plain Yogurt', 4.99, 'tub'),
    ('Paneer', 6.99, 'pack'),
    ('Ghee', 12.99, 'jar'),
    ('Samosa (4 pack)', 5.99, 'pack'),
    ('Chakli', 4.99, 'pack'),
    ('Murukku', 4.99, 'pack'),
    ('Mixture', 6.99, 'pack')
  ) AS t(name, price, unit)
  JOIN products p ON p.name = t.name
  WHERE NOT EXISTS (
    SELECT 1 FROM inventory WHERE "storeId" = store3_id AND "productId" = p.id
  );

  -- Insert customer address
  INSERT INTO address ("userId", address, city, state, "zipCode")
  SELECT customer_id, '100 Test Street, Apt 5B', 'San Francisco', 'CA', '94103'
  WHERE NOT EXISTS (
    SELECT 1 FROM address WHERE "userId" = customer_id
  );

  -- Insert store driver
  INSERT INTO store_driver ("storeId", "userId", vehicle)
  SELECT store1_id, customer_id, 'Honda Civic - ABC123'
  WHERE NOT EXISTS (
    SELECT 1 FROM store_driver WHERE "storeId" = store1_id
  );

END $$;

-- Summary
SELECT 'Mock data loaded successfully!' as message;
SELECT COUNT(*) as store_count FROM store;
SELECT COUNT(*) as product_count FROM products;
SELECT COUNT(*) as category_count FROM categories;
SELECT COUNT(*) as inventory_count FROM inventory;
SELECT COUNT(*) as user_count FROM users;
