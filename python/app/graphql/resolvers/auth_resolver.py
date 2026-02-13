import strawberry
from fastapi import HTTPException
import boto3
from botocore.exceptions import ClientError
import os
import logging
import traceback
from typing import Optional

# Configure logging
logger = logging.getLogger(__name__)

client = boto3.client("cognito-idp", region_name="us-east-1")
COGNITO_CLIENT_ID = os.getenv("COGNITO_USER_POOL_CLIENT_ID")

if not COGNITO_CLIENT_ID:
    logger.error("COGNITO_USER_POOL_CLIENT_ID environment variable is not set")

@strawberry.type
class AuthResponse:
    token: Optional[str]
    challenge_name: Optional[str]
    session: Optional[str]

@strawberry.type
class AuthQuery:
    @strawberry.field
    def me(self, info) -> str:
        """A simple query to test authentication"""
        current_user = info.context.get("current_user")
        if not current_user:
            raise HTTPException(status_code=401, detail="Not authenticated")
        return f"Authenticated as user: {current_user}"

@strawberry.type
class AuthMutation:
    @strawberry.mutation
    def login(self, username: str, password: str) -> AuthResponse:
        try:
            response = client.initiate_auth(
                ClientId=COGNITO_CLIENT_ID,
                AuthFlow="USER_PASSWORD_AUTH",
                AuthParameters={
                    "USERNAME": username,
                    "PASSWORD": password,
                }
            )
            
            # Log the response for debugging
            logger.info(f"Cognito response: {response}")
            
            if 'AuthenticationResult' in response:
                id_token = response['AuthenticationResult']['IdToken']
                return AuthResponse(token=id_token, challenge_name=None, session=None)
            elif 'ChallengeName' in response:
                # Return challenge information instead of raising an exception
                challenge = response['ChallengeName']
                session = response.get('Session')  # Get the session for completing the challenge
                return AuthResponse(token=None, challenge_name=challenge, session=session)
            else:
                raise HTTPException(status_code=401, detail="Authentication failed")
        except ClientError as e:
            # You can log error details if you want
            traceback.print_exc()
            error_code = e.response['Error']['Code']
            if error_code == 'NotAuthorizedException':
                raise HTTPException(status_code=401, detail="Incorrect username or password")
            elif error_code == 'UserNotConfirmedException':
                raise HTTPException(status_code=403, detail="User not confirmed")
            else:
                raise HTTPException(status_code=500, detail="Internal server error")

    @strawberry.mutation
    def complete_new_password(self, username: str, new_password: str, session: str) -> AuthResponse:
        try:
            response = client.respond_to_auth_challenge(
                ClientId=COGNITO_CLIENT_ID,
                ChallengeName='NEW_PASSWORD_REQUIRED',
                Session=session,
                ChallengeResponses={
                    'USERNAME': username,
                    'NEW_PASSWORD': new_password
                }
            )
            
            logger.info(f"Complete new password response: {response}")
            
            if 'AuthenticationResult' in response:
                id_token = response['AuthenticationResult']['IdToken']
                return AuthResponse(token=id_token, challenge_name=None, session=None)
            else:
                raise HTTPException(status_code=401, detail="Failed to set new password")
                
        except ClientError as e:
            logger.error(f"Error completing new password challenge: {str(e)}")
            raise HTTPException(status_code=400, detail=str(e))
        try:
            response = client.initiate_auth(
                ClientId=COGNITO_CLIENT_ID,
                AuthFlow="USER_PASSWORD_AUTH",
                AuthParameters={
                    "USERNAME": username,
                    "PASSWORD": password,
                }
            )
            
            # Log the response for debugging
            logger.info(f"Cognito response: {response}")
            
            if 'AuthenticationResult' in response:
                id_token = response['AuthenticationResult']['IdToken']
                return AuthResponse(token=id_token, challenge_name=None, session=None)
            elif 'ChallengeName' in response:
                # Return challenge information instead of raising an exception
                challenge = response['ChallengeName']
                session = response.get('Session')  # Get the session for completing the challenge
                return AuthResponse(token=None, challenge_name=challenge, session=session)
            else:
                raise HTTPException(status_code=401, detail="Authentication failed")
        except ClientError as e:
            # You can log error details if you want
            traceback.print_exc()
            error_code = e.response['Error']['Code']
            if error_code == 'NotAuthorizedException':
                raise HTTPException(status_code=401, detail="Incorrect username or password")
            elif error_code == 'UserNotConfirmedException':
                raise HTTPException(status_code=403, detail="User not confirmed")
            else:
                raise HTTPException(status_code=500, detail="Internal server error")
