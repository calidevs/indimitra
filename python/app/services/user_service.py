from app.db.session import SessionLocal
from app.db.models.user import UserModel, UserType

def get_all_users():
    db = SessionLocal()
    try:
        return db.query(UserModel).all()
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
