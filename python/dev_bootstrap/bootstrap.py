import json
from app.db.session import SessionLocal, engine
from app.db.base import Base
from app.db.models.product import ProductModel
from app.db.models.category import CategoryModel
from app.db.models.user import UserModel, UserType
from app.db.models.address import AddressModel

def create_data():
    # Create tables if they don't exist yet.
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    # Create a dummy user if not exists (needed for CategoryModel.createdByUserId).
    dummy_user = db.query(UserModel).filter_by(cognitoId="bootstrapCognito").first()
    if not dummy_user:
        dummy_user = UserModel(
            # id field will be auto-incremented
            email="bootstrap@example.com",
            mobile="1234567890",  # Added a dummy mobile number
            active=True,
            type=UserType.ADMIN,
            referralId="bootstrap",
            cognitoId="bootstrapCognito"
        )
        db.add(dummy_user)
        db.commit()
        db.refresh(dummy_user)
        
        # Create an address for the dummy user
        address = AddressModel(
            address="123 Admin St, Admin City, AC 12345",
            userId=dummy_user.id,
            isPrimary=True
        )
        db.add(address)
        db.commit()
        
    # Create another dummy user if not exists (needed for CategoryModel.createdByUserId).
    dummy_user_new = db.query(UserModel).filter_by(cognitoId="bootstrapNewCognito").first()
    if not dummy_user_new:
        dummy_user_new = UserModel(
            # id field will be auto-incremented
            email="bootstrapNew@example.com",
            mobile="0987654321",  # Added a dummy mobile number
            active=True,
            type=UserType.ADMIN,
            referralId="bootstrapNew",
            cognitoId="bootstrapNewCognito"
        )
        db.add(dummy_user_new)
        db.commit()
        db.refresh(dummy_user_new)
        
        # Create an address for the new user
        address_new = AddressModel(
            address="456 New St, New City, NC 67890",
            userId=dummy_user_new.id,
            isPrimary=True
        )
        db.add(address_new)
        db.commit()

    # Check if there is already at least one product.
    if db.query(ProductModel).first():
        print("Data already exists, skipping bootstrap.")
        db.close()
        return
    else:
        print("No product data exists in DB, starting bootstrap.")

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
                # Create a new category using the dummy user.
                category_obj = CategoryModel(name=cat_name, createdByUserId=dummy_user.id)
                db.add(category_obj)
                db.flush()  # Assign an ID without a full commit.
            categories[cat_name] = category_obj

    # Create product objects using the correct category relationship.
    products = []
    for item in data:
        cat_name = item.get("category")
        category_obj = categories.get(cat_name)
        product = ProductModel(
            name=item.get("name"),
            price=item.get("price"),
            description=item.get("description"),
            # Assign the category relationship directly (SQLAlchemy will set categoryId).
            category=category_obj,
            stock=0  # Default stock
            # size, measurement_unit, and image remain None.
        )
        products.append(product)

    db.add_all(products)
    db.commit()
    db.close()
    print("Bootstrap complete.")

if __name__ == "__main__":
    create_data()
