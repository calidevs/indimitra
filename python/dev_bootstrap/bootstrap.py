# bootstrap.py

import json
from app.db.session import SessionLocal
from app.db.models.product import ProductModel
from app.db.base import Base
from app.db.session import engine

def create_data():
    # Create tables if they don’t exist yet
    Base.metadata.create_all(bind=engine)

    with open("dev_bootstrap/product_data.json", "r") as file:
        data = json.load(file)

    db = SessionLocal()
    try:
        products = []
        for item in data:
            product = ProductModel(
                name=item["name"],
                price=item["price"],
                description=item["description"],
                category=item["category"]
            )
            products.append(product)

        db.bulk_save_objects(products)
        db.commit()
    finally:
        db.close()

if __name__ == "__main__":
    create_data()
