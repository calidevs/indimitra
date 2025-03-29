from app.db.session import SessionLocal
from app.db.models.user import UserModel, UserType
from app.graphql.types import User  # Import the GraphQL User type

def get_all_users():
    db = SessionLocal()
    try:
        return db.query(UserModel).all()  # ✅ No need for manual conversion
    finally:
        db.close()

def get_user_profile(user_id: str):
    """Fetch user profile by ID without exposing SQLAlchemy metadata"""
    db = SessionLocal()
    try:
        user = db.query(UserModel).filter(UserModel.id == user_id).first()
        if user:
            # Convert SQLAlchemy model instance to dictionary and remove `_sa_instance_state`
            user_dict = {key: value for key, value in user.__dict__.items() if key != "_sa_instance_state"}
            user_dict.pop("referredBy", None)  # Also remove referredBy for security
            return user_dict
        return None
    finally:
        db.close()



def create_user(firstName: str, lastName: str, email: str, active: bool, user_type: str, referralId: str, mobile: str = None, referredBy: str = None):
    db = SessionLocal()
    try:
        # Convert the user_type string to the corresponding enum value
        user_enum = UserType(user_type)
        user = UserModel(
            firstName=firstName,
            lastName=lastName,
            email=email,
            mobile=mobile,
            active=active,
            type=user_enum,
            referredBy=referredBy,
            referralId=referralId
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        return user
    finally:
        db.close()
