from app.db.session import SessionLocal
from app.db.models.user import UserModel, UserType
from app.graphql.types import User  # Import the GraphQL User type

def convert_user_model_to_user(user: UserModel) -> User:
    """Convert ORM UserModel to GraphQL User type"""
    return User(
        id=user.id,
        firstName=user.firstName,
        lastName=user.lastName,
        email=user.email,
        mobile=user.mobile,
        active=user.active,
        type=user.type.value if isinstance(user.type, UserType) else user.type,
        referredBy=user.referredBy,
        referralId=user.referralId,
    )

def get_all_users():
    db = SessionLocal()
    try:
        users = db.query(UserModel).all()
        return [convert_user_model_to_user(user) for user in users]  # Ensure proper conversion
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
