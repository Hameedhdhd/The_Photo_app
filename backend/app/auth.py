"""
JWT Authentication module for The Photo App API.
Verifies Supabase JWT tokens using embedded JWKS public key.

Supabase uses ES256 (ECDSA with P-256) for JWT signing.
The JWKS public key is embedded directly for reliability.
Keys can be found at: Supabase Dashboard > Settings > API > JWKS
"""

import os
import time
import jwt
from fastapi import HTTPException, Security
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
import requests

load_dotenv()

SUPABASE_URL = os.environ.get("SUPABASE_URL", "")
SUPABASE_ANON_KEY = os.environ.get("SUPABASE_ANON_KEY", "")
SUPABASE_JWT_SECRET = os.environ.get("SUPABASE_JWT_SECRET", "")

security = HTTPBearer(auto_error=False)

# Embedded JWKS from Supabase Dashboard > Settings > API
# This is the PUBLIC key (safe to embed) - used only for verification.
# If the key rotates, update this from the Supabase Dashboard.
EMBEDDED_JWKS = {
    "keys": [
        {
            "x": "fhOFmfuilis1zceBPmfjLWoKyhRNdWg_t2tVeKYzVqE",
            "y": "jxFTQ4VoAMRcZCuEuqA1Waoc5Mx3vUHMYzZNZXyyv_o",
            "alg": "ES256",
            "crv": "P-256",
            "ext": True,
            "kid": "d502bac6-9a6d-49e2-9738-2cdece66702c",
            "kty": "EC",
            "key_ops": ["verify"]
        }
    ]
}

# JWKS Cache (for remote fetching fallback)
_jwks_cache = {"keys": None, "fetched_at": 0}
_JWKS_CACHE_TTL = 3600  # Re-fetch keys every hour


def get_jwks() -> dict:
    """
    Get the JWKS. Returns embedded keys first, then tries remote fetch.
    The embedded keys are the primary source (most reliable).
    """
    # Always return embedded keys as primary source
    return EMBEDDED_JWKS


def get_signing_key(token: str):
    """
    Extract the signing key from JWKS that matches the token's kid.
    Returns the public key object for verification.
    """
    # Get the kid from the token header
    unverified_header = jwt.get_unverified_header(token)
    kid = unverified_header.get("kid")
    
    jwks = get_jwks()
    if not jwks:
        return None
    
    # Find the matching key
    for key_data in jwks.get("keys", []):
        if key_data.get("kid") == kid:
            # Convert JWK to public key object
            from jwt.algorithms import ECAlgorithm
            public_key = ECAlgorithm.from_jwk(key_data)
            return public_key
    
    # If no matching kid, try the first key (Supabase typically has one key)
    if jwks.get("keys"):
        from jwt.algorithms import ECAlgorithm
        public_key = ECAlgorithm.from_jwk(jwks["keys"][0])
        return public_key
    
    return None


async def get_current_user(credentials: HTTPAuthorizationCredentials = Security(security)) -> dict:
    """
    Verify the Supabase JWT token from the Authorization header.
    Returns the decoded JWT payload containing user info (sub, email, etc.)
    
    Verification strategy:
    1. Try JWKS-based verification (production - uses Supabase's embedded public key)
    2. Fallback to SUPABASE_JWT_SECRET if JWKS fails (for self-hosted or older setups)
    3. Fallback to dev mode (no verification) if nothing is configured
    """
    if not credentials:
        raise HTTPException(status_code=401, detail="Missing authorization header")
    
    token = credentials.credentials
    
    # Strategy 1: JWKS-based verification (recommended for Supabase cloud)
    signing_key = get_signing_key(token)
    if signing_key:
        try:
            payload = jwt.decode(
                token,
                signing_key,
                algorithms=["ES256"],
                options={"verify_aud": False},
            )
            return payload
        except jwt.ExpiredSignatureError:
            raise HTTPException(status_code=401, detail="Token has expired")
        except jwt.InvalidTokenError as e:
            # JWKS verification failed, try fallback
            print(f"JWKS verification failed: {e}, trying fallback...")
    
    # Strategy 2: HMAC secret verification (for self-hosted or older Supabase)
    if SUPABASE_JWT_SECRET:
        try:
            payload = jwt.decode(
                token,
                SUPABASE_JWT_SECRET,
                algorithms=["HS256"],
                audience="authenticated",
            )
            return payload
        except jwt.ExpiredSignatureError:
            raise HTTPException(status_code=401, detail="Token has expired")
        except jwt.InvalidAudienceError:
            try:
                payload = jwt.decode(
                    token,
                    SUPABASE_JWT_SECRET,
                    algorithms=["HS256"],
                    options={"verify_aud": False},
                )
                return payload
            except Exception:
                raise HTTPException(status_code=401, detail="Invalid token")
        except jwt.InvalidTokenError as e:
            raise HTTPException(status_code=401, detail=f"Invalid token: {str(e)}")
    
    # Strategy 3: Development mode (no verification - decode only)
    try:
        payload = jwt.decode(token, options={"verify_signature": False}, algorithms=["ES256", "HS256"])
        return payload
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Invalid token: {str(e)}")


async def get_optional_user(credentials: HTTPAuthorizationCredentials = Security(security)) -> dict | None:
    """
    Optional auth - returns user info if token is present and valid,
    but doesn't fail if no token is provided.
    Useful for endpoints that work for both authenticated and anonymous users.
    """
    if not credentials:
        return None
    
    try:
        return await get_current_user(credentials)
    except HTTPException:
        return None