"""
Seed dev data (users, store, products, inventory) using ``product_data.json``.

Loads secrets from ``python/.env`` before connecting to Postgres.
"""
from __future__ import annotations

import json
import sys
from pathlib import Path

PYTHON_ROOT = Path(__file__).resolve().parent.parent.parent
if str(PYTHON_ROOT) not in sys.path:
    sys.path.insert(0, str(PYTHON_ROOT))

from dotenv import load_dotenv

load_dotenv(PYTHON_ROOT / ".env", override=True)

from app.db.session import SessionLocal
from app.db.models.product import ProductModel
from app.db.models.category import CategoryModel
from app.db.models.user import UserModel, UserType
from app.db.models.address import AddressModel
from app.db.models.store import StoreModel
from app.db.models.inventory import InventoryModel
from app.db.models.pickup_address import PickupAddressModel

_BOOTSTRAP_DIR = Path(__file__).resolve().parent


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
    user2 = db.query(UserModel).filter_by(cognitoId="7408a498-3071-7036-4234-606ee5d70934").first()
    if not user2:
        user2 = UserModel(
            email="anddhenconsulting@gmail.com",
            mobile="2345678901",
            active=True,
            type=UserType.ADMIN,
            referralId="",
            cognitoId="7408a498-3071-7036-4234-606ee5d70934",
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
            address="5050 E Garford St, Long Beach, CA, 90815",
            radius=10.0,
            managerUserId=user4.id,
            email="mainstore@indimitra.com",
            mobile="123456989",
            is_active=True,
            disabled=False,
            description="Open 9am-9pm. Delivery available.",
            pincodes=["90815", "28262"],
            tnc="Rule 1. Rule 2. Rule 3.",
            storeDeliveryFee=5.99,
            taxPercentage=10,
            display_field="Main Store"
        )
        db.add(store)
        db.commit()
        db.refresh(store)

    # Create pickup addresses for the store
    existing_pickup = db.query(PickupAddressModel).filter_by(store_id=store.id).first()
    if not existing_pickup:
        pickup_addresses = [
            PickupAddressModel(
                store_id=store.id,
                address="5050 E Garford St, Long Beach, CA, 90815"
            ),
            PickupAddressModel(
                store_id=store.id,
                address="12006 Diploma Dr, Charlotte, NC, 28262"
            ),
        ]
        db.add_all(pickup_addresses)
        db.commit()
        print(f"Created {len(pickup_addresses)} pickup addresses for {store.name}")

    # Load product data from JSON file (next to this script)
    with open(_BOOTSTRAP_DIR / "product_data.json", "r", encoding="utf-8") as file:
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
    import re
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
