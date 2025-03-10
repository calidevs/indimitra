import strawberry
from typing import List, Optional
from app.graphql.types import User
from app.services.user_service import get_all_users, create_user

@strawberry.type
class UserQuery:
    @strawberry.field
    def getAllUsers(self) -> List[User]:
        # Returns a list of UserModel instances auto‑converted to GraphQL User type.
        return get_all_users()

@strawberry.type
class UserMutation:
    @strawberry.mutation
    def createUser(
        self,
        firstName: str,
        lastName: str,
        email: str,
        mobile: Optional[str],
        active: bool,
        type: str,  # Pass the string representation; the service converts it to enum.
        referralId: str,
        referredBy: Optional[str] = None
    ) -> User:
        return create_user(firstName, lastName, email, active, type, referralId, mobile, referredBy)
