import strawberry
from typing import List, Optional, Union
from app.graphql.types import User, DashboardStats
from app.services.user_service import get_all_users, create_user, get_user_profile, update_user_type, update_user_mobile, update_secondary_phone, get_dashboard_stats

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
class UpdateMobileResponse:
    """Response for update mobile mutation"""
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
    
    @strawberry.field
    def getDashboardStats(self) -> DashboardStats:
        """Get dashboard statistics for admin panel"""
        stats = get_dashboard_stats()
        return DashboardStats(
            total_users=stats['total_users'],
            active_users=stats['active_users'],
            delivery_agents=stats['delivery_agents'],
            users_by_type=stats['users_by_type']
        )


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
    
    @strawberry.mutation
    def updateUserMobile(
        self,
        userId: str,  # ID of the user to update
        newMobile: str  # New mobile number
    ) -> UpdateMobileResponse:
        """
        Update a user's mobile number
        
        Args:
            userId: ID of the user to update
            newMobile: New mobile number
            
        Returns:
            Response with either the updated user or an error message
        """
        try:
            updated_user = update_user_mobile(userId, newMobile)
            if not updated_user:
                return UpdateMobileResponse(
                    error=UserError(message=f"User with ID {userId} not found")
                )
            return UpdateMobileResponse(user=updated_user)
        except ValueError as e:
            return UpdateMobileResponse(error=UserError(message=str(e)))

    @strawberry.mutation
    def update_secondary_phone(self, user_id: int, secondary_phone: Optional[str] = None) -> Optional[User]:
        """
        Update user's secondary phone number
        
        Args:
            user_id: ID of the user to update
            secondary_phone: Optional secondary phone number (can be empty to remove)
        """
        try:
            user = update_secondary_phone(user_id, secondary_phone)
            if not user:
                raise Exception(f"User with ID {user_id} not found")
            return user
        except ValueError as e:
            raise Exception(str(e))
