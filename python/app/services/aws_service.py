import boto3
from botocore.exceptions import ClientError
from app.db.models.user import UserType
import logging
from app.config import AWS_REGION, COGNITO_USER_POOL_ID, COGNITO_USER_POOL_CLIENT_ID

logger = logging.getLogger(__name__)

def get_cognito_client():
    """
    Create and return a boto3 client for Cognito Identity Provider
    """
    return boto3.client('cognito-idp', region_name=AWS_REGION)

def update_cognito_user_attribute(userCognitoId: str, attribute_name: str, attribute_value: str):
    """
    Update a specific attribute of a Cognito user
    
    Args:
        userCognitoId: The Cognito ID of the user
        attribute_name: The name of the attribute to update
        attribute_value: The new value for the attribute
    
    Returns:
        True if successful, False otherwise
    """
    client = get_cognito_client()
    
    try:
        response = client.admin_update_user_attributes(
            UserPoolId=COGNITO_USER_POOL_ID,
            Username=userCognitoId,
            UserAttributes=[
                {
                    'Name': attribute_name,
                    'Value': attribute_value
                }
            ]
        )
        logger.info(f"Updated attribute {attribute_name} for user {userCognitoId}")
        return True
    except ClientError as e:
        logger.error(f"Error updating Cognito user attribute: {e}")
        return False

def update_cognito_user_role(userCognitoId: str, new_role: str):
    """
    Update a user's custom:role attribute in Cognito
    
    Args:
        userCognitoId: The Cognito ID of the user
        new_role: The new role to assign (e.g., "ADMIN", "USER", etc.)
    
    Returns:
        True if successful, False otherwise
    """
    return update_cognito_user_attribute(userCognitoId, 'custom:role', new_role)

def get_cognito_user_attribute(userCognitoId: str, attribute_name: str):
    """
    Get a specific attribute of a Cognito user
    
    Args:
        userCognitoId: The Cognito ID of the user
        attribute_name: The name of the attribute to get
    
    Returns:
        The attribute value if found, None otherwise
    """
    client = get_cognito_client()
    
    try:
        response = client.admin_get_user(
            UserPoolId=COGNITO_USER_POOL_ID,
            Username=userCognitoId
        )
        
        # Find the specified attribute in the response
        for attr in response.get('UserAttributes', []):
            if attr['Name'] == attribute_name:
                return attr['Value']
                
        return None
    except ClientError as e:
        logger.error(f"Error getting Cognito user attribute: {e}")
        return None

def get_user_role_from_cognito(userCognitoId: str):
    """
    Get the user's role from Cognito
    
    Args:
        userCognitoId: The Cognito ID of the user
    
    Returns:
        The user's role if found, None otherwise
    """
    return get_cognito_user_attribute(userCognitoId, 'custom:role') 