from app.db.session import SessionLocal
from app.db.models.user import UserModel, UserType
from app.graphql.types import User  # Import the GraphQL User type
from typing import Optional
from sqlalchemy.exc import IntegrityError
from app.services.aws_service import update_cognito_user_role

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
        user = db.query(UserModel).filter(UserModel.cognitoId == user_id).first()
        if user: # Also remove referredBy for security
            return user
        return None
    finally:
        db.close()



def create_user(cognitoId: str, firstName: str, lastName: str, email: str, active: bool, user_type: str, referralId: str, mobile: str = None, referredBy: int = None):
    db = SessionLocal()
    try:
        # Validate required fields
        if not cognitoId or cognitoId.strip() == "":
            raise ValueError("User cognitoId cannot be empty")
        if not firstName or firstName.strip() == "":
            raise ValueError("First name cannot be empty")
        if not lastName or lastName.strip() == "":
            raise ValueError("Last name cannot be empty")
        if not email or email.strip() == "":
            raise ValueError("Email cannot be empty")
        if not referralId or referralId.strip() == "":
            raise ValueError("Referral ID cannot be empty")
            
        # Normalize input (trim whitespace)
        cognitoId = cognitoId.strip()
        firstName = firstName.strip()
        lastName = lastName.strip()
        email = email.strip()
        referralId = referralId.strip()
        if mobile:
            mobile = mobile.strip()
        
        # Convert the user_type string to the corresponding enum value
        user_enum = UserType(user_type)
        user = UserModel(
            cognitoId=cognitoId,
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

def update_user_type(requester_id: str, target_user_id: str, new_user_type: str):
    """
    Update a user's type/role - only ADMIN users can perform this action
    
    Args:
        requester_id: Cognito ID of the user making the request
        target_user_id: Cognito ID of the user whose type is being updated
        new_user_type: String representation of the new user type
        
    Returns:
        The updated user model
        
    Raises:
        ValueError: If the requester is not an admin or the new user type is invalid
        LookupError: If the requester or target user cannot be found
    """
    db = SessionLocal()
    try:
        # First, get the requester to check if they're an admin
        requester = db.query(UserModel).filter(UserModel.cognitoId == requester_id).first()
        if not requester:
            raise LookupError(f"Requester with ID {requester_id} not found")
            
        # Check if requester is an admin
        if requester.type != UserType.ADMIN:
            raise ValueError("You are not authorized to update user types. Only administrators can perform this action.")
        
        # Find the target user
        target_user = db.query(UserModel).filter(UserModel.cognitoId == target_user_id).first()
        if not target_user:
            raise LookupError(f"Target user with ID {target_user_id} not found")
            
        # Validate the new user type first
        try:
            new_type_enum = UserType(new_user_type)
            
            # Update Cognito FIRST, before making any database changes
            cognito_updated = update_cognito_user_role(target_user_id, new_user_type)
            if not cognito_updated:
                # If Cognito update fails, don't update the database
                raise ValueError(f"Failed to update Cognito role for user {target_user_id}. Database not updated to maintain consistency.")
            
            # Only update the database if Cognito update was successful
            target_user.type = new_type_enum
            db.commit()
            db.refresh(target_user)
            
            return target_user
        except ValueError as ve:
            # Check if this is our custom error or a UserType validation error
            if "Failed to update Cognito role" in str(ve):
                raise ve
            else:
                valid_types = [t.value for t in UserType]
                raise ValueError(f"Invalid user type: {new_user_type}. Valid types are: {', '.join(valid_types)}")
    finally:
        db.close()

def update_user_mobile(user_id: str, new_mobile: str) -> Optional[UserModel]:
    """
    Update a user's mobile number
    
    Args:
        user_id: Cognito ID of the user to update
        new_mobile: New mobile number for the user
        
    Returns:
        The updated user model, or None if the user doesn't exist
        
    Raises:
        ValueError: If the mobile number is invalid or already in use
    """
    db = SessionLocal()
    try:
        # Validate mobile
        if not new_mobile or new_mobile.strip() == "":
            raise ValueError("Mobile number cannot be empty")
            
        # Normalize input
        new_mobile = new_mobile.strip()
            
        # Find the user to update
        user = db.query(UserModel).filter(UserModel.cognitoId == user_id).first()
        if not user:
            return None
            
        # Check if mobile number is already in use by another user
        existing_user = db.query(UserModel).filter(
            UserModel.mobile == new_mobile, 
            UserModel.id != user.id
        ).first()
        
        if existing_user:
            raise ValueError(f"Mobile number {new_mobile} is already in use by another user")
            
        # Update the mobile number
        user.mobile = new_mobile
        db.commit()
        db.refresh(user)
        
        return user
    finally:
        db.close()
