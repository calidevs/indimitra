# Subdomain-Based Multi-Tenancy Implementation Guide

## Overview

This document outlines the complete implementation plan for converting IndiMitra from a single-domain multi-store application to a subdomain-based multi-tenancy architecture.

**Current Architecture:**
- Single domain with explicit `storeId` parameters in all operations
- Store selection via localStorage
- Square OAuth uses hardcoded `FRONTEND_URL` redirect
- Per-store Square credentials encrypted in database

**Target Architecture:**
- `store1.indimitra.com` → Store 1 customer storefront
- `store2.indimitra.com` → Store 2 customer storefront
- `admin.indimitra.com` or `indimitra.com` → Admin dashboard controlling all stores

---

## Critical Questions & Answers

### 1. How will Square payments work with multiple subdomains?

**✅ Great News: Square payments will work WITHOUT modification!**

**Why:**
- Payments are **backend-processed** using per-store credentials from database
- Frontend sends `storeId` in `createOrderWithPayment` mutation
- Backend calls `create_square_payment_for_store(store_id)` which fetches the store's encrypted `square_access_token` and `square_merchant_id`
- Square API only validates the access token and location ID - doesn't care about subdomain

**Payment Flow (unchanged):**
```
1. Customer on store1.indimitra.com → subdomain detected → storeId=1
2. Frontend queries: storePaymentConfig(storeId: 1) → gets Square credentials
3. Frontend initializes Square Web Payments SDK with store's credentials
4. Customer pays → SDK tokenizes → returns payment token
5. Frontend: createOrderWithPayment(storeId: 1, payment: {...})
6. Backend uses store1's database credentials to process payment
```

**Reference:** `/python/app/services/payment_service.py` lines 156-236

### 2. Do we need to fix the OAuth redirect URL?

**⚠️ YES - This is the MOST CRITICAL issue**

**Current Problem:**
- OAuth redirect hardcoded: `OAUTH_REDIRECT_URI=http://localhost:8000/oauth/callback`
- Square requires pre-registering ALL redirect URIs
- After OAuth: redirects to `{FRONTEND_URL}/admin/payment-settings?oauth_success=true`
- Cannot scale to multiple store subdomains

**SOLUTION: Centralized OAuth with Smart Redirect**

**Architecture:**
```
1. Store manager on store1.indimitra.com clicks "Connect Square"
2. Frontend: connectSquare(storeId: 1, returnSubdomain: "store1")
3. Backend generates OAuth URL with:
   - redirect_uri: https://admin.indimitra.com/oauth/callback (PUBLIC endpoint)
   - state: encrypted {storeId: 1, returnSubdomain: "store1"}
4. User authorizes on Square → Square redirects to admin.indimitra.com/oauth/callback
5. Backend validates, saves credentials to database
6. Backend automatically redirects → https://store1.indimitra.com/admin/payment-settings?oauth_success=true
```

**IMPORTANT: Store managers never "log into" admin.indimitra.com**
- The `/oauth/callback` endpoint is PUBLIC (no authentication required)
- Store manager is just redirected through it momentarily (Square → callback → back to store1)
- The entire flow happens automatically - store manager stays in their store context
- The redirect back to store1.indimitra.com happens server-side (backend redirect)

**Why Centralized:**
- ✅ Only ONE redirect URI to register: `https://admin.indimitra.com/oauth/callback`
- ✅ No Square limits on number of redirect URIs
- ✅ OAuth callback is stateless - no authentication needed
- ✅ Easier SSL certificate management
- ✅ Store managers never leave their store's subdomain context (except for brief redirect)

### 3. Other Issues to Foresee

**A. CORS Wildcard Subdomain Support**
- Current: Static origins list
- Needed: Regex pattern for `*.indimitra.com`
- Solution: `allow_origin_regex=r"^https://([a-zA-Z0-9-]+\.)?indimitra\.com$"`

**B. AWS Cognito Callback URLs**
- Challenge: Cognito has ~100 callback URL limit
- Solution: Centralize authentication on `admin.indimitra.com`
- Users login at admin → redirect back to original subdomain

**C. Cookie Scope**
- Issue: Cookies on store1 not accessible from store2
- Current implementation: Uses Amplify JWT in localStorage (no changes needed)
- If using cookies: Set `domain=.indimitra.com` for cross-subdomain access

**D. SSL Wildcard Certificates**
- Required: `*.indimitra.com` wildcard certificate
- Setup: Let's Encrypt with DNS validation
- Covers all current and future subdomains

**E. Store Discovery**
- Need: Landing page at `indimitra.com` with store directory
- Alternative: QR codes or direct subdomain URLs
- Database: Add unique `subdomain` column to StoreModel

**F. SEO Implications**
- Each subdomain = separate site for Google
- Solution: Canonical URLs, per-store sitemaps, Google Search Console per subdomain

**G. Cross-Subdomain Analytics**
- Configure GA4 with `cookie_domain: '.indimitra.com'`
- Track subdomain in custom dimension

**H. Security**
- Subdomain validation (prevent injection)
- Cross-store access prevention via middleware
- Store context enforcement in GraphQL resolvers

---

## Localhost Development Strategy

We have **3 approaches** for testing subdomain-based multi-tenancy locally:

### Approach 1: /etc/hosts mapping (Recommended for Full Testing)

**Setup:**
```bash
# Add to /etc/hosts (requires sudo)
sudo nano /etc/hosts

# Add these lines:
127.0.0.1 admin.localhost
127.0.0.1 store1.localhost
127.0.0.1 store2.localhost
```

**Access:**
- `http://admin.localhost:3000` - Admin dashboard
- `http://store1.localhost:3000` - Store 1 storefront
- `http://store2.localhost:3000` - Store 2 storefront

**Pros:**
- Most realistic, tests actual subdomain extraction
- Identical behavior to production

**Cons:**
- Requires system-level configuration (one-time setup)
- Need sudo access

### Approach 2: Query Parameter (Quick Testing)

**Usage:**
```
http://localhost:3000?subdomain=store1
http://localhost:3000?subdomain=store2
http://localhost:3000?subdomain=admin
```

**Pros:**
- No setup needed, easy to switch stores
- Quick for testing different stores

**Cons:**
- Less realistic, URL looks different than production
- Won't test full subdomain extraction logic

### Approach 3: localStorage (Persistent Development)

**Setup:**
```javascript
// Set in browser console
localStorage.setItem('dev_subdomain', 'store1');

// Clear to switch stores
localStorage.removeItem('dev_subdomain');
```

**Pros:**
- Persists across page reloads
- No URL changes needed

**Cons:**
- Manual setup required
- Can be confusing which store you're on

### Recommended Development Workflow

**Priority Chain** (what the code will check in order):
1. **Real subdomain** (if using *.localhost via /etc/hosts)
2. **Query parameter** `?subdomain=store1`
3. **localStorage** `dev_subdomain`
4. **Default to `null`** (no store selected)

**Recommended Approach:**
- **Daily Development:** Use localStorage for convenience
- **Testing OAuth/Authentication:** Use /etc/hosts for realistic flow
- **Quick Store Switching:** Use query parameters
- **Production Testing:** Use /etc/hosts exclusively

---

## Implementation Plan

### Phase 1: Database & Backend Foundation

#### Task 1.1: Database Migration ✅ COMPLETED

**Files Modified:**
- `/python/app/db/models/store.py` - Added subdomain column
- `/python/app/db/migrations/versions/c26daec46104_add_subdomain_to_store.py` - Migration file

**Changes:**
```python
# Added to StoreModel
subdomain = Column(String, unique=True, nullable=True, index=True)
```

**Migration:**
```bash
# Run migration (when ready)
cd python
alembic upgrade head
```

#### Task 1.2: GraphQL Query for Subdomain Lookup

**Files to Modify:**
- `/python/app/services/store_service.py` - Add `get_store_by_subdomain()` function
- `/python/app/graphql/resolvers/store_resolver.py` - Add `storeBySubdomain` query

**Implementation:**
```python
# store_service.py
def get_store_by_subdomain(subdomain: str) -> Optional[StoreModel]:
    """Get a store by subdomain"""
    db = SessionLocal()
    try:
        return db.query(StoreModel).filter(StoreModel.subdomain == subdomain).first()
    finally:
        db.close()

# store_resolver.py
@strawberry.field
def store_by_subdomain(self, subdomain: str) -> Optional[Store]:
    """Get a store by subdomain"""
    return get_store_by_subdomain(subdomain)
```

#### Task 1.3: Subdomain Middleware

**File to Create:**
- `/python/app/middleware/subdomain_middleware.py`

**Implementation:**
```python
import re
import logging
from fastapi import Request
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware
from app.services.store_service import get_store_by_subdomain

logger = logging.getLogger(__name__)

RESERVED_SUBDOMAINS = ['www', 'admin', 'api', 'cdn', 'static', 'mail', 'ftp']

def extract_subdomain(host: str) -> Optional[str]:
    """
    Extract subdomain from host header.

    Examples:
        store1.indimitra.com -> store1
        admin.localhost -> admin
        localhost:3000 -> None
    """
    # Remove port if present
    host = host.split(':')[0]

    # Handle localhost (no subdomain)
    if host in ['localhost', '127.0.0.1']:
        return None

    # Split by dots
    parts = host.split('.')

    # Need at least subdomain.domain.tld (3 parts)
    if len(parts) >= 3:
        return parts[0]

    # Handle *.localhost pattern (subdomain.localhost)
    if len(parts) == 2 and parts[1] == 'localhost':
        return parts[0]

    return None

def validate_subdomain(subdomain: str) -> bool:
    """Validate subdomain format and check against reserved names"""
    if not subdomain:
        return False

    # Check reserved subdomains
    if subdomain.lower() in RESERVED_SUBDOMAINS:
        return True  # Reserved are valid, just special-cased

    # Check length
    if len(subdomain) > 63:
        return False

    # Check format: lowercase alphanumeric and hyphens, must start with letter
    if not re.match(r'^[a-z][a-z0-9-]*$', subdomain.lower()):
        return False

    return True

class SubdomainMiddleware(BaseHTTPMiddleware):
    """
    Middleware to extract subdomain from Host header and attach store context.

    Flow:
    1. Extract subdomain from Host header
    2. Validate subdomain format
    3. For store subdomains: Query database and attach store to request.state
    4. For admin/reserved subdomains: Skip store lookup
    5. For invalid subdomains: Return 404
    """

    async def dispatch(self, request: Request, call_next):
        # Extract host header
        host = request.headers.get("host", "")

        # Support development mode with query parameter or X-Subdomain header
        dev_subdomain = None
        if "localhost" in host or "127.0.0.1" in host:
            # Check query parameter first
            dev_subdomain = request.query_params.get("subdomain")
            # Check custom header second
            if not dev_subdomain:
                dev_subdomain = request.headers.get("X-Subdomain")

        # Extract subdomain
        subdomain = dev_subdomain or extract_subdomain(host)

        # Attach to request state
        request.state.subdomain = subdomain
        request.state.store_id = None
        request.state.is_admin_subdomain = False

        # If no subdomain, continue (main domain)
        if not subdomain:
            return await call_next(request)

        # Validate subdomain format
        if not validate_subdomain(subdomain):
            logger.warning(f"Invalid subdomain format: {subdomain}")
            return JSONResponse(
                status_code=404,
                content={"detail": "Invalid subdomain format"}
            )

        # Check if admin or reserved subdomain
        if subdomain.lower() in RESERVED_SUBDOMAINS:
            request.state.is_admin_subdomain = (subdomain.lower() == 'admin')
            return await call_next(request)

        # Look up store by subdomain
        store = get_store_by_subdomain(subdomain)

        if not store:
            logger.warning(f"Store not found for subdomain: {subdomain}")
            return JSONResponse(
                status_code=404,
                content={"detail": f"Store not found for subdomain: {subdomain}"}
            )

        # Check if store is active
        if not store.is_active or store.disabled:
            logger.warning(f"Store {store.id} ({subdomain}) is inactive or disabled")
            return JSONResponse(
                status_code=503,
                content={"detail": "This store is currently unavailable"}
            )

        # Attach store context to request
        request.state.store_id = store.id
        logger.debug(f"Subdomain '{subdomain}' mapped to store ID {store.id}")

        return await call_next(request)
```

**File to Modify:**
- `/python/app/main.py` - Add middleware

```python
from app.middleware.subdomain_middleware import SubdomainMiddleware

# Add AFTER CognitoAuthMiddleware
app.add_middleware(SubdomainMiddleware)
```

#### Task 1.4: Update OAuth Service for Centralized Redirect

**File to Modify:**
- `/python/app/services/square_oauth_service.py`

**Changes:**
```python
import json
import base64
from cryptography.fernet import Fernet
import os

# Add encryption for state parameter
def _get_state_cipher():
    """Get Fernet cipher for state encryption"""
    key = os.getenv('STATE_ENCRYPTION_KEY')
    if not key:
        # Generate a key if not set (should be in .env for production)
        key = Fernet.generate_key().decode()
        logger.warning("STATE_ENCRYPTION_KEY not set, using generated key (not suitable for production)")
    return Fernet(key.encode() if isinstance(key, str) else key)

def initiate_square_oauth(store_id: int, return_subdomain: str = None) -> str:
    """
    Generate Square OAuth authorization URL for a store.

    Args:
        store_id: The store ID requesting authorization
        return_subdomain: The subdomain to redirect back to (e.g., 'store1')

    Returns:
        Full authorization URL to redirect the user to
    """
    application_id = os.getenv('SQUARE_APPLICATION_ID')
    base_domain = os.getenv('BASE_DOMAIN', 'indimitra.com')

    if not application_id:
        raise ValueError("SQUARE_APPLICATION_ID environment variable not set")

    environment_name = os.getenv('SQUARE_ENVIRONMENT', 'sandbox').lower()

    # Centralized redirect URI (always admin subdomain)
    if 'localhost' in base_domain or '127.0.0.1' in base_domain:
        redirect_uri = f'http://{base_domain}/oauth/callback'
    else:
        redirect_uri = f'https://admin.{base_domain}/oauth/callback'

    # Determine base URL based on environment
    if environment_name == 'production':
        base_url = 'https://connect.squareup.com'
    else:
        base_url = 'https://connect.squareupsandbox.com'

    # Encrypt state with store_id and return_subdomain
    state_data = {
        'store_id': store_id,
        'return_subdomain': return_subdomain or 'admin',
        'timestamp': datetime.utcnow().isoformat()
    }

    cipher = _get_state_cipher()
    state_json = json.dumps(state_data)
    state_encrypted = cipher.encrypt(state_json.encode())
    state = base64.urlsafe_b64encode(state_encrypted).decode()

    # Required scopes for payment processing
    scopes = "MERCHANT_PROFILE_READ PAYMENTS_WRITE PAYMENTS_READ"
    encoded_scopes = scopes.replace(' ', '+')

    # Build authorization URL
    auth_url = (
        f"{base_url}/oauth2/authorize"
        f"?client_id={application_id}"
        f"&scope={encoded_scopes}"
        f"&state={state}"
        f"&redirect_uri={redirect_uri}"
    )

    logger.info(f"Generated OAuth URL for store {store_id}, will redirect to {return_subdomain}")
    return auth_url

def validate_oauth_state(state: str) -> Optional[dict]:
    """
    Validate and decrypt OAuth state parameter.

    Args:
        state: The encrypted state parameter from OAuth callback

    Returns:
        dict with store_id and return_subdomain if valid, None otherwise
    """
    try:
        cipher = _get_state_cipher()
        state_encrypted = base64.urlsafe_b64decode(state.encode())
        state_json = cipher.decrypt(state_encrypted).decode()
        state_data = json.loads(state_json)

        # Validate timestamp (10 minute expiry)
        timestamp = datetime.fromisoformat(state_data['timestamp'])
        age = datetime.utcnow() - timestamp

        if age > timedelta(minutes=STATE_TTL_MINUTES):
            logger.warning(f"OAuth state expired for store {state_data.get('store_id')}")
            return None

        logger.info(f"OAuth state validated for store {state_data['store_id']}")
        return state_data

    except Exception as e:
        logger.error(f"Failed to validate OAuth state: {e}")
        return None
```

#### Task 1.5: Update OAuth Callback with Smart Redirect

**File to Modify:**
- `/python/app/api/routes/oauth.py`

**Changes:**
```python
import os
import logging
from typing import Optional
from fastapi import APIRouter, Depends, Query, Request
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session
from app.api.dependencies import get_db
from app.services.square_oauth_service import (
    validate_oauth_state,
    exchange_authorization_code
)
from app.middleware.rate_limit_middleware import limiter

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/oauth", tags=["oauth"])


@router.get("/callback")
@limiter.limit("5/minute")
async def oauth_callback(
    request: Request,
    code: Optional[str] = Query(None),
    state: Optional[str] = Query(None),
    error: Optional[str] = Query(None),
    error_description: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    """
    PUBLIC OAuth callback endpoint for Square authorization.

    NO AUTHENTICATION REQUIRED - Store managers pass through this endpoint
    during OAuth flow and are automatically redirected back to their store.

    Flow:
    1. Square redirects here after authorization
    2. Validate state and extract store_id + return_subdomain
    3. Exchange code for tokens and save to database
    4. Redirect back to original subdomain
    """
    base_domain = os.getenv('BASE_DOMAIN', 'indimitra.com')

    # Determine frontend URL based on environment
    if 'localhost' in base_domain:
        frontend_base = f'http://{base_domain}'
    else:
        frontend_base = f'https://{base_domain}'

    # Check for OAuth error from Square
    if error:
        error_msg = error_description or error
        logger.warning(f"OAuth error received: {error_msg}")
        return RedirectResponse(
            url=f"{frontend_base}/admin/payment-settings?oauth_error={error_msg}",
            status_code=302
        )

    # Validate required parameters
    if not code or not state:
        logger.error("OAuth callback missing required parameters")
        return RedirectResponse(
            url=f"{frontend_base}/admin/payment-settings?oauth_error=Missing authorization code or state",
            status_code=302
        )

    # Validate and decrypt state parameter
    state_data = validate_oauth_state(state)
    if not state_data:
        logger.warning(f"Invalid or expired OAuth state")
        return RedirectResponse(
            url=f"{frontend_base}/admin/payment-settings?oauth_error=Invalid or expired authorization. Please try again.",
            status_code=302
        )

    store_id = state_data['store_id']
    return_subdomain = state_data.get('return_subdomain', 'admin')

    # Exchange authorization code for tokens
    try:
        result = exchange_authorization_code(code, store_id, db)
        logger.info(f"Successfully completed OAuth for store {store_id}")

        # Smart redirect: back to original subdomain
        if return_subdomain == 'admin' or return_subdomain in ['www', None]:
            redirect_url = f"{frontend_base}/admin/payment-settings?store_id={store_id}&oauth_success=true"
        else:
            # Redirect back to store subdomain
            if 'localhost' in base_domain:
                redirect_url = f"http://{return_subdomain}.{base_domain}/admin/payment-settings?oauth_success=true"
            else:
                redirect_url = f"https://{return_subdomain}.{base_domain}/admin/payment-settings?oauth_success=true"

        logger.info(f"Redirecting to: {redirect_url}")
        return RedirectResponse(url=redirect_url, status_code=302)

    except Exception as e:
        error_msg = str(e)
        logger.error(f"Failed to exchange authorization code for store {store_id}: {error_msg}")

        return RedirectResponse(
            url=f"{frontend_base}/admin/payment-settings?oauth_error={error_msg}",
            status_code=302
        )
```

#### Task 1.6: Update CORS Configuration

**File to Modify:**
- `/python/app/main.py`

**Changes:**
```python
import os
import re
from fastapi.middleware.cors import CORSMiddleware

# CORS configuration with wildcard subdomain support
base_domain = os.getenv("BASE_DOMAIN", "indimitra.com")
allowed_origins_env = os.getenv("ALLOWED_ORIGINS", "")

# Build allowed origins list
allowed_origins = []

# Add explicit origins from env
if allowed_origins_env:
    allowed_origins.extend([origin.strip() for origin in allowed_origins_env.split(",")])

# Add localhost for development
allowed_origins.extend([
    "http://localhost:3000",
    "http://127.0.0.1:3000",
])

# Build regex pattern for wildcard subdomain matching
# Matches: https://anything.indimitra.com and https://indimitra.com
if base_domain != "localhost":
    subdomain_pattern = rf"^https://([a-zA-Z0-9-]+\.)?{re.escape(base_domain)}$"
else:
    # For localhost development, support *.localhost pattern
    subdomain_pattern = r"^http://([a-zA-Z0-9-]+\.)?localhost(:\d+)?$"

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_origin_regex=subdomain_pattern,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

---

### Phase 2: Frontend Implementation

#### Task 2.1: Create Subdomain Utility Functions

**File to Create:**
- `/js/src/utils/subdomain.js`

```javascript
/**
 * Subdomain utilities for multi-tenancy support
 *
 * Development mode supports multiple approaches:
 * 1. Real subdomains via /etc/hosts (e.g., store1.localhost)
 * 2. Query parameter: ?subdomain=store1
 * 3. localStorage: dev_subdomain key
 */

/**
 * Extract subdomain from hostname with development fallbacks
 *
 * Priority order:
 * 1. Real subdomain from hostname
 * 2. Query parameter ?subdomain=xxx
 * 3. localStorage dev_subdomain
 * 4. null (no subdomain)
 *
 * @param {string} hostname - window.location.hostname
 * @param {URLSearchParams} searchParams - window.location.search params
 * @returns {string|null} - subdomain or null
 */
export const extractSubdomain = (hostname = window.location.hostname, searchParams = new URLSearchParams(window.location.search)) => {
  // Development mode: Check query parameter first
  if (hostname.includes('localhost') || hostname.includes('127.0.0.1')) {
    const querySubdomain = searchParams.get('subdomain');
    if (querySubdomain) {
      return querySubdomain;
    }

    // Check localStorage second
    const storedSubdomain = localStorage.getItem('dev_subdomain');
    if (storedSubdomain) {
      return storedSubdomain;
    }

    // Check for *.localhost pattern (e.g., store1.localhost)
    const parts = hostname.split('.');
    if (parts.length === 2 && parts[1] === 'localhost') {
      return parts[0];
    }

    return null;
  }

  // Production mode: Extract from hostname
  const parts = hostname.split('.');

  // Need at least subdomain.domain.tld (3 parts)
  if (parts.length >= 3) {
    return parts[0];
  }

  // No subdomain (e.g., indimitra.com)
  return null;
};

/**
 * Check if current subdomain is admin or reserved
 *
 * @param {string|null} subdomain
 * @returns {boolean}
 */
export const isAdminSubdomain = (subdomain = null) => {
  const currentSubdomain = subdomain || extractSubdomain();

  // No subdomain = main domain = admin
  if (!currentSubdomain) {
    return true;
  }

  const reservedSubdomains = ['admin', 'www', 'api', 'cdn', 'static'];
  return reservedSubdomains.includes(currentSubdomain.toLowerCase());
};

/**
 * Get current store subdomain (null if admin)
 *
 * @returns {string|null}
 */
export const getStoreSubdomain = () => {
  const subdomain = extractSubdomain();
  return isAdminSubdomain(subdomain) ? null : subdomain;
};

/**
 * Set development subdomain (for localStorage persistence)
 *
 * @param {string|null} subdomain
 */
export const setDevSubdomain = (subdomain) => {
  if (subdomain) {
    localStorage.setItem('dev_subdomain', subdomain);
  } else {
    localStorage.removeItem('dev_subdomain');
  }
};

/**
 * Build URL for different subdomain
 *
 * @param {string} subdomain - Target subdomain
 * @param {string} path - Path to navigate to
 * @returns {string} - Full URL
 */
export const buildSubdomainUrl = (subdomain, path = '/') => {
  const hostname = window.location.hostname;
  const protocol = window.location.protocol;
  const port = window.location.port;

  // Development mode
  if (hostname.includes('localhost') || hostname.includes('127.0.0.1')) {
    // Check if using *.localhost pattern
    if (hostname.includes('.localhost')) {
      const newHost = `${subdomain}.localhost${port ? ':' + port : ''}`;
      return `${protocol}//${newHost}${path}`;
    }

    // Use query parameter fallback
    return `${protocol}//${hostname}${port ? ':' + port : ''}${path}?subdomain=${subdomain}`;
  }

  // Production mode
  const baseDomain = hostname.split('.').slice(-2).join('.');
  const newHost = subdomain ? `${subdomain}.${baseDomain}` : baseDomain;
  return `${protocol}//${newHost}${path}`;
};
```

#### Task 2.2: Create StoreContext Provider

**File to Create:**
- `/js/src/contexts/StoreContext.jsx`

```javascript
import React, { createContext, useContext, useState, useEffect } from 'react';
import { extractSubdomain, isAdminSubdomain } from '../utils/subdomain';
import { fetchGraphQL } from '../config/graphql/graphqlClient';

const StoreContext = createContext({
  currentStore: null,
  subdomain: null,
  isAdmin: true,
  loading: true,
  error: null,
  refetchStore: () => {},
});

export const useStore = () => {
  const context = useContext(StoreContext);
  if (!context) {
    throw new Error('useStore must be used within StoreProvider');
  }
  return context;
};

const GET_STORE_BY_SUBDOMAIN = `
  query GetStoreBySubdomain($subdomain: String!) {
    storeBySubdomain(subdomain: $subdomain) {
      id
      name
      address
      subdomain
      email
      mobile
      description
      images
      isActive
      disabled
      storeDeliveryFee
      taxPercentage
      pincodes
      tnc
      sectionHeaders
      displayField
      isSquareConnected
      codEnabled
    }
  }
`;

export const StoreProvider = ({ children }) => {
  const [currentStore, setCurrentStore] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const subdomain = extractSubdomain();
  const isAdmin = isAdminSubdomain(subdomain);

  const fetchStore = async () => {
    // If admin subdomain, no store to fetch
    if (isAdmin || !subdomain) {
      setCurrentStore(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const data = await fetchGraphQL(GET_STORE_BY_SUBDOMAIN, { subdomain });

      if (data.storeBySubdomain) {
        setCurrentStore(data.storeBySubdomain);
      } else {
        setError(`Store not found for subdomain: ${subdomain}`);
      }
    } catch (err) {
      console.error('Failed to fetch store by subdomain:', err);
      setError(err.message || 'Failed to load store');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStore();
  }, [subdomain]);

  const value = {
    currentStore,
    subdomain,
    isAdmin,
    loading,
    error,
    refetchStore: fetchStore,
  };

  return (
    <StoreContext.Provider value={value}>
      {children}
    </StoreContext.Provider>
  );
};
```

#### Task 2.3: Update App.jsx with Subdomain Routing

**File to Modify:**
- `/js/src/App.jsx`

```javascript
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import theme from './theme';

import Products from './pages/Products';
import ProtectedRoute from './config/ProtectedRoute';
import ForgotPassword from './pages/ForgotPassword';
import SignUpPage from './pages/SignUp/SignUp';
import AdminDashboard from './pages/Admin/AdminDashboard';
import DriverDashboard from './pages/DriverDashboard';
import StoreManagerDashboard from './pages/StoreManagerDashboard';
import Orders from './pages/Orders';
import Profile from './pages/Profile';
import NotFound from './components/NotFound';
import StoreManagerNotFound from './components/StoreManager/NotFound';
import DeliveryFees from './pages/StoreManager/DeliveryFees';
import PaymentSettings from './pages/StoreManager/PaymentSettings';

import { useAuthStore } from './store/useStore';
import { ROUTES } from './config/constants/routes';
import LoginPage from './pages/LoginPage';
import { CustomerDashboard } from './pages/Customer';

import CartPage from './pages/CartPage';
import Layout from './components/layout/Layout';
import StoreManagerOrders from './pages/StoreManager/Orders';
import DeliveryPartners from './pages/StoreManager/DeliveryPartners';
import Inventory from './pages/StoreManager/Inventory';
import LocationCodes from './pages/StoreManager/LocationCodes';
import PickupAddresses from '@/pages/StoreManager/PickupAddresses';

import { StoreProvider, useStore } from './contexts/StoreContext';
import { extractSubdomain, isAdminSubdomain } from './utils/subdomain';

/**
 * Store Subdomain Routes
 * Shows customer storefront for specific store
 */
const StoreRoutes = () => {
  const { currentStore, loading, error } = useStore();

  if (loading) {
    return <div>Loading store...</div>;
  }

  if (error || !currentStore) {
    return (
      <Layout>
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <h1>Store Not Found</h1>
          <p>{error || 'This store does not exist.'}</p>
        </div>
      </Layout>
    );
  }

  return (
    <Routes>
      {/* Customer storefront */}
      <Route
        path="/"
        element={
          <Layout>
            <CustomerDashboard />
          </Layout>
        }
      />
      <Route
        path={ROUTES.CART}
        element={
          <Layout>
            <CartPage />
          </Layout>
        }
      />

      {/* Store Manager Routes (for this specific store) */}
      <Route
        path="/admin/*"
        element={
          <ProtectedRoute role="store_manager">
            <StoreManagerDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/orders"
        element={
          <ProtectedRoute role="store_manager">
            <StoreManagerOrders />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/delivery-partners"
        element={
          <ProtectedRoute role="store_manager">
            <DeliveryPartners />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/inventory"
        element={
          <ProtectedRoute role="store_manager">
            <Inventory />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/delivery-fees"
        element={
          <ProtectedRoute role="store_manager">
            <DeliveryFees />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/location-codes"
        element={
          <ProtectedRoute role="store_manager">
            <LocationCodes />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/pickup-addresses"
        element={
          <ProtectedRoute role="store_manager">
            <PickupAddresses />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/payment-settings"
        element={
          <ProtectedRoute role="store_manager">
            <PaymentSettings />
          </ProtectedRoute>
        }
      />

      {/* Authentication */}
      <Route path={ROUTES.LOGIN} element={<LoginPage />} />
      <Route path={ROUTES.SIGNUP} element={<SignUpPage />} />
      <Route path={ROUTES.FORGOT_PASSWORD} element={<ForgotPassword />} />

      {/* Catch-all */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

/**
 * Admin Subdomain Routes
 * Shows platform-wide admin dashboard
 */
const AdminRoutes = () => {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path={ROUTES.LOGIN} element={<LoginPage />} />
      <Route path={ROUTES.SIGNUP} element={<SignUpPage />} />
      <Route path={ROUTES.FORGOT_PASSWORD} element={<ForgotPassword />} />

      {/* Platform Admin */}
      <Route
        path={`${ROUTES.ADMIN}/*`}
        element={
          <ProtectedRoute role="admin">
            <AdminDashboard />
          </ProtectedRoute>
        }
      />

      {/* User Routes */}
      <Route
        path={ROUTES.USER}
        element={
          <ProtectedRoute role="user">
            <CustomerDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path={ROUTES.DELIVERY_AGENT}
        element={
          <ProtectedRoute role="delivery_agent">
            <DriverDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path={ROUTES.ORDERS}
        element={
          <ProtectedRoute role="user">
            <Orders />
          </ProtectedRoute>
        }
      />
      <Route
        path={ROUTES.PROFILE}
        element={
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        }
      />

      {/* Landing page */}
      <Route
        path="/"
        element={
          <Layout>
            <div style={{ textAlign: 'center', padding: '2rem' }}>
              <h1>Welcome to IndiMitra</h1>
              <p>Select a store to get started</p>
            </div>
          </Layout>
        }
      />

      {/* Catch-all */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

/**
 * Main App Component
 * Routes to Admin or Store based on subdomain
 */
const App = () => {
  const subdomain = extractSubdomain();
  const isAdmin = isAdminSubdomain(subdomain);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <StoreProvider>
        <Router>
          {isAdmin ? <AdminRoutes /> : <StoreRoutes />}
        </Router>
      </StoreProvider>
    </ThemeProvider>
  );
};

export default App;
```

---

### Phase 3: Environment Configuration

#### Task 3.1: Update .env.example

**File to Modify:**
- `/python/.env.example`

```bash
# Database Configuration
POSTGRES_USER=indimitra
POSTGRES_PASSWORD=your_password
POSTGRES_DB=indimitra
POSTGRES_HOST=localhost
POSTGRES_PORT=5432

# AWS Cognito (Required for Authentication)
COGNITO_USER_POOL_ID=your_user_pool_id
COGNITO_USER_POOL_CLIENT_ID=your_client_id
AWS_REGION=us-east-1

# Multi-Tenancy Configuration
BASE_DOMAIN=indimitra.com  # Use 'localhost:3000' for development
ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000

# Square Payment Configuration
SQUARE_APPLICATION_ID=your_square_app_id
SQUARE_APPLICATION_SECRET=your_square_app_secret
SQUARE_ENVIRONMENT=sandbox  # or 'production'

# OAuth Configuration (Centralized)
# Use admin subdomain for OAuth callback
OAUTH_REDIRECT_URI=https://admin.indimitra.com/oauth/callback
# For localhost: http://localhost:8000/oauth/callback

# State Encryption (generate with: python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())")
STATE_ENCRYPTION_KEY=your_fernet_key_here

# Frontend URL (deprecated - now using BASE_DOMAIN)
FRONTEND_URL=http://localhost:3000

# Security
ENABLE_GRAPHIQL=false  # Only enable in development
PAYMENT_ENCRYPTION_SECRET_NAME=your_payment_secret

# AWS S3 (for file uploads)
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
S3_BUCKET_NAME=your_bucket_name
```

---

## Testing Plan

### Development Testing (Localhost)

#### 1. Setup /etc/hosts (One-time)
```bash
sudo nano /etc/hosts

# Add:
127.0.0.1 admin.localhost
127.0.0.1 store1.localhost
127.0.0.1 store2.localhost
```

#### 2. Populate Store Subdomains
```sql
-- Update existing stores with subdomains
UPDATE store SET subdomain = 'store1' WHERE id = 1;
UPDATE store SET subdomain = 'store2' WHERE id = 2;
```

#### 3. Test Scenarios

**Scenario A: Store Subdomain Access**
```
1. Visit http://store1.localhost:3000
2. Should show Store 1's customer storefront
3. Products should be filtered to Store 1 only
4. Payment should use Store 1's Square credentials
```

**Scenario B: Admin Subdomain Access**
```
1. Visit http://admin.localhost:3000
2. Should show platform admin dashboard
3. Can manage all stores
```

**Scenario C: OAuth Flow**
```
1. Store manager visits http://store1.localhost:3000/admin/payment-settings
2. Clicks "Connect Square"
3. Redirected to Square authorization page
4. After approval, redirected to admin.localhost/oauth/callback
5. Automatically redirected back to store1.localhost/admin/payment-settings?oauth_success=true
6. Square credentials saved for Store 1
```

**Scenario D: Query Parameter Fallback**
```
1. Visit http://localhost:3000?subdomain=store1
2. Should behave identical to store1.localhost:3000
3. Store context should be loaded
```

**Scenario E: localStorage Fallback**
```javascript
// In browser console
localStorage.setItem('dev_subdomain', 'store1');
// Refresh page - should load Store 1 context
```

### Production Testing

#### 1. DNS Configuration
```
# Add these records in your DNS provider:
A     indimitra.com           → [SERVER_IP]
A     admin.indimitra.com     → [SERVER_IP]
CNAME *.indimitra.com         → indimitra.com
```

#### 2. SSL Certificate
```bash
# Install certbot
sudo apt-get install certbot

# Get wildcard certificate (requires DNS verification)
sudo certbot certonly --manual --preferred-challenges=dns \
  -d indimitra.com -d *.indimitra.com

# Follow prompts to add TXT record to DNS
```

#### 3. Nginx Configuration
```nginx
# /etc/nginx/sites-available/indimitra

server {
    listen 80;
    server_name ~^(?<subdomain>[a-z0-9-]+)\.indimitra\.com$ indimitra.com;

    # Redirect to HTTPS
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name ~^(?<subdomain>[a-z0-9-]+)\.indimitra\.com$ indimitra.com;

    # SSL certificates
    ssl_certificate /etc/letsencrypt/live/indimitra.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/indimitra.com/privkey.pem;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Backend API
    location /graphql {
        proxy_pass http://127.0.0.1:8000/graphql;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /oauth {
        proxy_pass http://127.0.0.1:8000/oauth;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    location /s3 {
        proxy_pass http://127.0.0.1:8000/s3;
        proxy_set_header Host $host;
    }

    # Frontend (React SPA)
    location / {
        root /var/www/indimitra/frontend/build;
        try_files $uri $uri/ /index.html;
    }

    # Static assets
    location /static {
        alias /var/www/indimitra/frontend/build/static;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

#### 4. Update Environment Variables
```bash
# /var/www/indimitra/backend/.env
BASE_DOMAIN=indimitra.com
OAUTH_REDIRECT_URI=https://admin.indimitra.com/oauth/callback
ALLOWED_ORIGINS=
```

#### 5. Test Production Flow
```
1. Visit https://store1.indimitra.com
2. Verify SSL certificate is valid
3. Test product browsing
4. Test checkout with Square payment
5. Test OAuth flow from store manager dashboard
6. Verify cross-subdomain CORS works
```

---

## Migration Guide

### Step 1: Database Migration
```bash
cd python
alembic upgrade head
```

### Step 2: Assign Subdomains to Existing Stores
```sql
-- Option A: Manual assignment
UPDATE store SET subdomain = 'store1' WHERE id = 1;
UPDATE store SET subdomain = 'store2' WHERE id = 2;

-- Option B: Auto-generate from display_field
UPDATE store SET subdomain = LOWER(REGEXP_REPLACE(display_field, '[^a-zA-Z0-9]', '', 'g'));

-- Verify uniqueness
SELECT subdomain, COUNT(*) FROM store GROUP BY subdomain HAVING COUNT(*) > 1;
```

### Step 3: Update Environment Variables
```bash
# Backend
BASE_DOMAIN=indimitra.com
OAUTH_REDIRECT_URI=https://admin.indimitra.com/oauth/callback
STATE_ENCRYPTION_KEY=<generate_new_key>

# Generate encryption key:
python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"
```

### Step 4: Deploy Backend Changes
```bash
cd python
pip install cryptography  # For state encryption
systemctl restart indimitra-backend
```

### Step 5: Deploy Frontend Changes
```bash
cd js
npm install
npm run build
# Copy build to /var/www/indimitra/frontend/build
```

### Step 6: Configure DNS & SSL
(See Production Testing section above)

### Step 7: Update Square OAuth Redirect
```
1. Log into Square Developer Dashboard
2. Navigate to your application
3. OAuth > Redirect URLs
4. Update to: https://admin.indimitra.com/oauth/callback
5. Save changes
```

### Step 8: Update Cognito Callback URLs
```
1. AWS Console > Cognito > User Pools
2. Select your pool > App clients
3. Update callback URLs to: https://admin.indimitra.com
4. Update logout URL to: https://admin.indimitra.com
5. Save changes
```

---

## Security Considerations

### 1. Subdomain Validation
- Only allow lowercase alphanumeric and hyphens
- Maximum 63 characters
- Must start with letter
- Block reserved subdomains (admin, api, www, etc.)

### 2. Cross-Store Access Prevention
```python
# Middleware should validate:
if request.state.store_id and requested_store_id:
    if request.state.store_id != requested_store_id:
        raise HTTPException(403, "Access denied")
```

### 3. OAuth State Encryption
- Use Fernet symmetric encryption
- 10-minute expiry on state tokens
- Include timestamp in encrypted payload
- Validate on callback

### 4. CORS Configuration
- Use regex pattern for subdomain matching
- Only allow HTTPS in production
- Enable credentials for authenticated requests

### 5. Rate Limiting
- Per-subdomain rate limits
- Stricter limits on OAuth endpoints
- User-based limits when authenticated

---

## Rollback Plan

If issues occur during deployment:

### 1. Quick Rollback (DNS)
```
# Point *.indimitra.com back to old server
# Or remove CNAME record temporarily
```

### 2. Database Rollback
```bash
cd python
alembic downgrade -1  # Rollback one migration
```

### 3. Code Rollback
```bash
# Backend
git checkout <previous_commit>
systemctl restart indimitra-backend

# Frontend
git checkout <previous_commit>
npm run build
```

### 4. Environment Variables
```bash
# Restore previous .env
cp .env.backup .env
systemctl restart indimitra-backend
```

---

## Future Enhancements

### 1. Custom Domains
Allow stores to use their own domains:
- `www.mystore.com` → Store 1
- Requires DNS CNAME pointing to IndiMitra
- SSL certificate per custom domain (Let's Encrypt)

### 2. White-Label Branding
- Per-store themes and logos
- Custom email templates
- Branded receipts

### 3. Store Analytics Dashboard
- Per-subdomain traffic metrics
- Conversion tracking
- Revenue reports

### 4. Multi-Region Support
- Region-based routing (e.g., us.store1.indimitra.com)
- CDN integration
- Localized content

---

## Support & Troubleshooting

### Common Issues

**Issue 1: "Store not found" error**
```
Cause: Subdomain not in database
Fix: UPDATE store SET subdomain = 'xxx' WHERE id = Y;
```

**Issue 2: OAuth redirect fails**
```
Cause: Wrong OAUTH_REDIRECT_URI in .env
Fix: Ensure matches Square Developer Dashboard setting
```

**Issue 3: CORS errors in browser**
```
Cause: Subdomain not matching regex pattern
Fix: Check allow_origin_regex in main.py
```

**Issue 4: Localhost subdomain not working**
```
Cause: /etc/hosts not configured
Fix: Add *.localhost entries to /etc/hosts
```

**Issue 5: SSL certificate invalid**
```
Cause: Wildcard cert not covering subdomain
Fix: Ensure cert covers *.indimitra.com
```

---

## Conclusion

This implementation plan provides a complete roadmap for converting IndiMitra to subdomain-based multi-tenancy. The architecture:

✅ **Works with existing Square payments** (no changes needed)
✅ **Centralized OAuth** (one redirect URL for all stores)
✅ **Supports localhost development** (multiple approaches)
✅ **Scalable** (unlimited stores without DNS/SSL changes)
✅ **Secure** (subdomain validation, cross-store prevention)
✅ **SEO-friendly** (each store has own domain)

**Total Implementation Time:** ~1-2 weeks
**Biggest Risk:** OAuth redirect handling
**Biggest Win:** Professional URLs + complete isolation

**Next Steps:**
1. Review and approve this plan
2. Set up localhost development environment
3. Implement Phase 1 (Backend)
4. Test locally with /etc/hosts
5. Implement Phase 2 (Frontend)
6. Deploy to staging
7. Production rollout
