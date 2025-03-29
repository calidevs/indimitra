import strawberry
from typing import List, Optional
from app.graphql.types import User
from app.services.user_service import get_all_users, create_user, get_user_profile

@strawberry.type
class UserQuery:
    @strawberry.field
    def getAllUsers(self) -> List[User]:
        """Returns a list of all users"""
        return get_all_users()
    
    @strawberry.field
    def getUserProfile(self, userId: str) -> Optional[User]:
        """Fetch a single user's profile without exposing referredBy"""
        user_data = get_user_profile(userId)

        if user_data:
            # Ensure 'referredBy' is present with a default None value
            user_data.setdefault("referredBy", None)

            return User(**user_data)  # Create a User instance from sanitized data
        
        return None


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
