import strawberry
import enum
from typing import List, Optional
from app.services.user_service import get_all_users, create_user

# GraphQL enum that mirrors your Python enum
@strawberry.enum
class UserTypeEnum(enum.Enum):
    ADMIN = "ADMIN"
    USER = "USER"
    DELIVERY = "DELIVERY"
    STORE_MANAGER = "STORE_MANAGER"

@strawberry.type
class User:
    id: int
    firstName: str
    lastName: str
    email: str
    mobile: Optional[str]
    active: bool
    type: UserTypeEnum
    referredBy: Optional[str] = None
    referralId: str

@strawberry.type
class Query:
    @strawberry.field
    def users(self) -> List[User]:
        users_db = get_all_users()
        return [
            User(
                id=user.id,
                firstName=user.firstName,
                lastName=user.lastName,
                email=user.email,
                mobile=user.mobile,
                active=user.active,
                type=user.type,  # GraphQL enum will convert automatically
                referredBy=user.referredBy,
                referralId=user.referralId,
            )
            for user in users_db
        ]

@strawberry.type
class Mutation:
    @strawberry.mutation
    def create_user(self,
                    firstName: str,
                    lastName: str,
                    email: str,
                    mobile: str,
                    active: bool,
                    type: UserTypeEnum,
                    referralId: str,
                    referredBy: Optional[str] = None) -> User:
        user_model = create_user(firstName, lastName, email, mobile, active, type.value, referredBy, referralId)
        return User(
            id=user_model.id,
            firstName=user_model.firstName,
            lastName=user_model.lastName,
            email=user_model.email,
            mobile=user_model.mobile,
            active=user_model.active,
            type=user_model.type,
            referredBy=user_model.referredBy,
            referralId=user_model.referralId,
        )
