import os
import logging
import json
import urllib.request
from jose import jwk, jwt
from jose.utils import base64url_decode
from typing import Optional, Dict

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

REGION = os.getenv('AWS_REGION')
USER_POOL_ID = os.getenv('COGNITO_USER_POOL_ID')
CLIENT_ID = os.getenv('COGNITO_USER_POOL_CLIENT_ID')

def verify_cognito_token(token: str) -> Optional[Dict]:
    """
    Verify a JWT token issued by Cognito
    """
    try:
        # Get the key id from the token header
        headers = jwt.get_unverified_headers(token)
        kid = headers['kid']

        # Get the public keys from Cognito
        keys_url = f'https://cognito-idp.{REGION}.amazonaws.com/{USER_POOL_ID}/.well-known/jwks.json'
        with urllib.request.urlopen(keys_url) as f:
            response = f.read()
        keys = json.loads(response.decode('utf-8'))['keys']

        # Find the key that matches the kid in the token
        key = next((k for k in keys if k["kid"] == kid), None)
        if not key:
            logger.error("Public key not found")
            return None

        # Convert the key to PEM format
        public_key = jwk.construct(key)
        
        # Verify the token
        payload = jwt.decode(
            token,
            public_key.to_pem(),
            algorithms=['RS256'],
            audience=CLIENT_ID,
            issuer=f'https://cognito-idp.{REGION}.amazonaws.com/{USER_POOL_ID}',
            options={
                'verify_exp': True,
                'verify_aud': True,
                'verify_iss': True
            }
        )
        
        logger.info(f"Token verified successfully for user: {payload.get('sub')}")
        return payload

    except Exception as e:
        logger.error(f"Token verification failed: {str(e)}")
        return None
