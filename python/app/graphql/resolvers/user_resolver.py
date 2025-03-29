import strawberry
from typing import List, Optional, Union
from app.graphql.types import User
from app.services.user_service import get_all_users, create_user, get_user_profile, update_user_type

@strawberry.type
class UserError:
    """Error returned when a user operation fails"""
    message: str

@strawberry.type
class UpdateUserTypeResponse:
    """Response for update user type mutation"""
    user: Optional[User] = None
    error: Optional[UserError] = None

@strawberry.type
class UserQuery:
    @strawberry.field
    def getAllUsers(self) -> List[User]:
        """Returns a list of all users"""
        return get_all_users()
    
    @strawberry.field
    def getUserProfile(self, userId: str) -> Optional[User]:
        """Fetch a single user's profile without exposing referredBy"""
        user_data = get_user_profile(userId) # Create a User instance from sanitized data
        
        return user_data


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
        cognitoId: str,
        referredBy: Optional[str] = None
    ) -> User:
        return create_user(cognitoId, firstName, lastName, email, active, type, referralId, mobile, referredBy)
    
    @strawberry.mutation
    def updateUserType(
        self,
        requesterId: str,  # ID of the user making the request (must be an admin)
        targetUserId: str,  # ID of the user to update
        newType: str  # New user type (as string)
    ) -> UpdateUserTypeResponse:
        """
        Update a user's type/role - only ADMIN users can perform this action
        
        Args:
            requesterId: ID of the user making the request (must be an admin)
            targetUserId: ID of the user to update
            newType: New user type (ADMIN, USER, DELIVERY_AGENT, STORE_MANAGER)
            
        Returns:
            Response with either the updated user or an error message
        """
        try:
            updated_user = update_user_type(requesterId, targetUserId, newType)
            return UpdateUserTypeResponse(user=updated_user)
        except (ValueError, LookupError) as e:
            return UpdateUserTypeResponse(error=UserError(message=str(e)))
