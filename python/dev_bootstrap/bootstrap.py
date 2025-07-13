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
    user1 = db.query(UserModel).filter_by(cognitoId="a45894f8-7001-705b-b1ed-587fd34944c0").first()
    if not user1:
        user1 = UserModel(
            email="abhishekgattineni@gmail.com",
            mobile="1234567890",
            active=True,
            type=UserType.USER,
            referralId="",
            cognitoId="a45894f8-7001-705b-b1ed-587fd34944c0",
            secondary_phone=None
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
    user2 = db.query(UserModel).filter_by(cognitoId="2458b428-10b1-702f-3110-1f45a3bc6bcd").first()
    if not user2:
        user2 = UserModel(
            email="anddhenconsulting@gmail.com",
            mobile="2345678901",
            active=True,
            type=UserType.ADMIN,
            referralId="",
            cognitoId="2458b428-10b1-702f-3110-1f45a3bc6bcd",
            secondary_phone=None
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
    user3 = db.query(UserModel).filter_by(cognitoId="7488a458-0091-70f0-00a5-8d056011d692").first()
    if not user3:
        user3 = UserModel(
            email="anddhensoftware@gmail.com",
            mobile="3456789012",
            active=True,
            type=UserType.DELIVERY,
            referralId="",
            cognitoId="7488a458-0091-70f0-00a5-8d056011d692",
            secondary_phone=None
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
    user4 = db.query(UserModel).filter_by(cognitoId="d4c85498-7091-701f-255b-816dc7b10d4f").first()
    if not user4:
        user4 = UserModel(
            email="anddhendevs@gmail.com",
            mobile="4567890123",
            active=True,
            type=UserType.STORE_MANAGER,
            referralId="",
            cognitoId="d4c85498-7091-701f-255b-816dc7b10d4f",
            secondary_phone=None
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
            managerUserId=user4.id,  # Using the STORE_MANAGER user
            email="mainstore@indimitra.com",  # Added required email field
            mobile="123456989",  # Added mobile field which is nullable but should be included
            is_active=True,
            disabled=False,  # Changed from is_disabled to disabled
            description="Open 9am-9pm. Delivery available.",
            pincodes=["12345", "23456", "34567"],
            tnc="Rule 1. Rule 2. Rule 3.",
            storeDeliveryFee=5.99,  # Default delivery fee (optional field)
            taxPercentage=10,       # <--- Add a comma here!
            display_field="Main Store"  # or any appropriate value
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
            unit=unit,
            is_listed=True,
            is_available=True
        )
        db.add(inventory_item)
    
    db.commit()
    db.close()
    print("Bootstrap complete with users, store, products and inventory with measurements and units.")

if __name__ == "__main__":
    create_data()
