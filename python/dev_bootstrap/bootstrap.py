import json
from app.db.session import SessionLocal, engine
from app.db.base import Base
from app.db.models.product import ProductModel
from app.db.models.category import CategoryModel
from app.db.models.user import UserModel, UserType
from app.db.models.address import AddressModel
from app.db.models.store import StoreModel
from app.db.models.inventory import InventoryModel

def create_data():
    db = SessionLocal()
    
    # User 1 - Regular USER
    user1 = db.query(UserModel).filter_by(cognitoId="5458d4f8-d0b1-70cb-b8b1-ecf9784e8956").first()
    if not user1:
        user1 = UserModel(
            email="abhishekgattineni@gmail.com",
            mobile="1234567890",
            active=True,
            type=UserType.USER,
            referralId="STxU6bVp",
            cognitoId="5458d4f8-d0b1-70cb-b8b1-ecf9784e8956"
        )
        db.add(user1)
        db.commit()
        db.refresh(user1)
        
        # Create an address for user
        address1 = AddressModel(
            address="123 User St, User City, UC 12345",
            userId=user1.id,
            isPrimary=True
        )
        db.add(address1)
        db.commit()
    
    # User 2 - ADMIN
    user2 = db.query(UserModel).filter_by(cognitoId="e42824a8-20d1-70b9-b91e-fa25d7c0d578").first()
    if not user2:
        user2 = UserModel(
            email="anddhenconsulting@gmail.com",
            mobile="2345678901",
            active=True,
            type=UserType.ADMIN,
            referralId="69LUnvbJ",
            cognitoId="e42824a8-20d1-70b9-b91e-fa25d7c0d578"
        )
        db.add(user2)
        db.commit()
        db.refresh(user2)
        
        # Create an address for admin
        address2 = AddressModel(
            address="456 Admin St, Admin City, AC 23456",
            userId=user2.id,
            isPrimary=True
        )
        db.add(address2)
        db.commit()
    
    # User 3 - DELIVERY_AGENT
    user3 = db.query(UserModel).filter_by(cognitoId="c4a8c458-40f1-70da-ba05-5b14764b3a31").first()
    if not user3:
        user3 = UserModel(
            email="anddhensoftware@gmail.com",
            mobile="3456789012",
            active=True,
            type=UserType.DELIVERY,
            referralId="3BbvYjWE",
            cognitoId="c4a8c458-40f1-70da-ba05-5b14764b3a31"
        )
        db.add(user3)
        db.commit()
        db.refresh(user3)
        
        # Create an address for delivery agent
        address3 = AddressModel(
            address="789 Delivery St, Delivery City, DC 34567",
            userId=user3.id,
            isPrimary=True
        )
        db.add(address3)
        db.commit()
    
    # User 4 - STORE_MANAGER
    user4 = db.query(UserModel).filter_by(cognitoId="f4b83478-d011-70ca-88fa-816ed25ac9cf").first()
    if not user4:
        user4 = UserModel(
            email="jakkustephen@gmail.com",
            mobile="4567890123",
            active=True,
            type=UserType.STORE_MANAGER,
            referralId="iWeqt8pu",
            cognitoId="f4b83478-d011-70ca-88fa-816ed25ac9cf"
        )
        db.add(user4)
        db.commit()
        db.refresh(user4)
        
        # Create an address for store manager
        address4 = AddressModel(
            address="101 Manager St, Manager City, MC 45678",
            userId=user4.id,
            isPrimary=True
        )
        db.add(address4)
        db.commit()
    
    # Create a store if not exists (needed for inventory)
    store = db.query(StoreModel).filter_by(name="Main Store").first()
    if not store:
        store = StoreModel(
            name="Main Store",
            address="123 Store St, Store City, SC 12345",
            radius=10.0,
            managerUserId=user4.id  # Using the STORE_MANAGER user
        )
        db.add(store)
        db.commit()
        db.refresh(store)

    # Check if there is already at least one product.
    # if db.query(ProductModel).first():
    #     print("Data already exists, skipping bootstrap.")
    #     db.close()
    #     return
    # else:
    #     print("No product data exists in DB, starting bootstrap.")

    # Load product data from JSON file.
    with open("dev_bootstrap/product_data.json", "r") as file:
        data = json.load(file)

    # Create or fetch categories.
    categories = {}
    for item in data:
        cat_name = item.get("category")
        if cat_name not in categories:
            # Check if the category already exists in the DB.
            category_obj = db.query(CategoryModel).filter_by(name=cat_name).first()
            if not category_obj:
                # Create a new category
                category_obj = CategoryModel(name=cat_name)
                db.add(category_obj)
                db.flush()  # Assign an ID without a full commit.
            categories[cat_name] = category_obj

    # Create product objects using the correct category relationship.
    products = []
    for item in data:
        cat_name = item.get("category")
        category_obj = categories.get(cat_name)
        # Note: Price is removed from product model and will be in inventory
        product = ProductModel(
            name=item.get("name"),
            description=item.get("description"),
            image=item.get("image"),
            # Assign the category relationship directly (SQLAlchemy will set categoryId).
            category=category_obj
        )
        products.append(product)

    db.add_all(products)
    db.commit()
    
    # Define measurement and unit information based on category
    category_units = {
        "Grains & Rice": {"measurement": 1000, "unit": "grams"},
        "Pulses & Lentils": {"measurement": 1000, "unit": "grams"},
        "Spices & Masalas": {"measurement": 100, "unit": "grams"},
        "Flours": {"measurement": 1000, "unit": "grams"},
        "Oils & Ghee": {"measurement": 1000, "unit": "ml"},
        "Snacks & Namkeen": {"measurement": 100, "unit": "grams"},
        "Beverages": {"measurement": 200, "unit": "ml"},
        "Dairy & Paneer": {"measurement": 500, "unit": "grams"},
        "Pickles & Chutneys": {"measurement": 250, "unit": "grams"},
        "Sweets & Desserts": {"measurement": 250, "unit": "grams"}
    }
    
    # Now create inventory items for the products in the store
    print("Creating inventory items...")
    for product in products:
        # Find the product's price and category from the original data
        for item in data:
            if item.get("name") == product.name:
                price = item.get("price")
                category = item.get("category")
                break
        
        # Get measurement and unit based on category
        measurement = category_units.get(category, {}).get("measurement")
        unit = category_units.get(category, {}).get("unit")
        
        # Extract specific measurement from product name if available
        # Example: "Basmati Rice 5kg" -> measurement = 5000, unit = "grams"
        import re
        name_units = {
            "kg": 1000,
            "g": 1,
            "ml": 1,
            "L": 1000,
            "pcs": 1
        }
        
        # Try to extract measurement from product name
        match = re.search(r'(\d+)(?:\s*)(kg|g|ml|L|pcs)', product.name)
        if match:
            value, unit_type = match.groups()
            value = float(value)
            
            if unit_type == "kg":
                measurement = int(value * 1000)
                unit = "grams"
            elif unit_type == "L":
                measurement = int(value * 1000)
                unit = "ml"
            elif unit_type == "pcs":
                measurement = int(value)
                unit = "pieces"
            elif unit_type == "g":
                measurement = int(value)
                unit = "grams"
            elif unit_type == "ml":
                measurement = int(value)
                unit = "ml"
        
        # Create inventory entry for this product in the store
        inventory_item = InventoryModel(
            storeId=store.id,
            productId=product.id,
            price=price,  # Use the price from the data
            quantity=50,  # Default stock of 50
            measurement=measurement,
            unit=unit
        )
        db.add(inventory_item)
    
    db.commit()
    db.close()
    print("Bootstrap complete with users, store, products and inventory with measurements and units.")

# Add this new function to create 3000 products
def create_bulk_products(target_count=3000):
    """
    Create a large number of products by repeating the existing product data with variations.
    
    Args:
        target_count: The target number of products to reach in the database
    """
    db = SessionLocal()
    try:
        # Check current product count
        current_count = db.query(ProductModel).count()
        print(f"Current product count: {current_count}")
        
        if current_count >= target_count:
            print(f"Already have {current_count} products, no need to add more.")
            db.close()
            return
        
        # Calculate how many more products we need to add
        products_to_add = target_count - current_count
        print(f"Adding {products_to_add} more products to reach target of {target_count}")
        
        # Load product data from JSON file
        with open("dev_bootstrap/product_data.json", "r") as file:
            data = json.load(file)
        
        # Get all categories from database
        categories = {}
        category_objects = db.query(CategoryModel).all()
        for category in category_objects:
            categories[category.name] = category
        
        # If any categories from our source data don't exist, create them
        for item in data:
            cat_name = item.get("category")
            if cat_name not in categories:
                category_obj = CategoryModel(name=cat_name)
                db.add(category_obj)
                db.flush()
                categories[cat_name] = category_obj
        
        # Get the store for inventory items
        store = db.query(StoreModel).first()
        if not store:
            print("No store found. Please run create_data() first.")
            db.close()
            return
            
        # Store the ID as a simple integer to avoid DetachedInstanceError after expunge_all
        store_id = store.id
            
        # Define measurement and unit information based on category
        category_units = {
            "Grains & Rice": {"measurement": 1000, "unit": "grams"},
            "Pulses & Lentils": {"measurement": 1000, "unit": "grams"},
            "Spices & Masalas": {"measurement": 100, "unit": "grams"},
            "Flours": {"measurement": 1000, "unit": "grams"},
            "Oils & Ghee": {"measurement": 1000, "unit": "ml"},
            "Snacks & Namkeen": {"measurement": 100, "unit": "grams"},
            "Beverages": {"measurement": 200, "unit": "ml"},
            "Dairy & Paneer": {"measurement": 500, "unit": "grams"},
            "Pickles & Chutneys": {"measurement": 250, "unit": "grams"},
            "Sweets & Desserts": {"measurement": 250, "unit": "grams"}
        }
        
        # Set batch size for committing to avoid memory issues
        batch_size = 100
        total_added = 0
        
        # Add products in batches with name variations until we reach the target
        while total_added < products_to_add:
            batch_products = []
            batch_inventory = []
            
            # Calculate how many items to add in this batch
            items_in_batch = min(batch_size, products_to_add - total_added)
            
            # For each batch, cycle through our base products
            for i in range(items_in_batch):
                # Get base product data (cycling through the data array)
                base_item = data[i % len(data)]
                
                # Create variation number
                variation = (total_added + i) // len(data) + 1
                
                # Create a varied name to ensure uniqueness
                varied_name = f"{base_item['name']} (Batch {variation})"
                
                # Get category
                cat_name = base_item.get("category")
                category_obj = categories.get(cat_name)
                
                # Create product with varied name
                product = ProductModel(
                    name=varied_name,
                    description=base_item.get("description"),
                    image=base_item.get("image"),
                    category=category_obj
                )
                batch_products.append(product)
            
            # Add and commit the batch
            db.add_all(batch_products)
            db.commit()
            
            # Now create inventory items for each product
            for i, product in enumerate(batch_products):
                base_item = data[i % len(data)]
                price = base_item.get("price")
                category = base_item.get("category")
                
                # Get measurement and unit based on category
                measurement = category_units.get(category, {}).get("measurement")
                unit = category_units.get(category, {}).get("unit")
                
                # Create inventory entry
                inventory_item = InventoryModel(
                    storeId=store_id,  # Use the stored integer ID instead of accessing the object
                    productId=product.id,
                    price=price,
                    quantity=50,  # Default stock of 50
                    measurement=measurement,
                    unit=unit
                )
                batch_inventory.append(inventory_item)
            
            # Add and commit inventory items
            db.add_all(batch_inventory)
            db.commit()
            
            total_added += items_in_batch
            print(f"Added batch of {items_in_batch} products. Total added: {total_added}")
            
            # Refresh the session to avoid memory issues
            db.expunge_all()
        
        final_count = db.query(ProductModel).count()
        print(f"Finished adding products. Final product count: {final_count}")
        
    finally:
        db.close()

if __name__ == "__main__":
    import sys
    
    if len(sys.argv) > 1 and sys.argv[1] == "bulk":
        # If run with "python bootstrap.py bulk", create 3000 products
        create_bulk_products()
    else:
        # Default behavior: just create the initial data
        create_data()
