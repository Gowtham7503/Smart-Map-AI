from datetime import datetime, timedelta, timezone
import hashlib
import secrets

from app.db import db
from app.services.user_service import serialize_user, users_collection

sessions_collection = db["sessions"]
SESSION_COOKIE_NAME = "smartmaps_session"
SESSION_DAYS = 7


def _hash_token(token):
    return hashlib.sha256(token.encode("utf-8")).hexdigest()


def create_session(user):
    token = secrets.token_urlsafe(32)
    now = datetime.now(timezone.utc)
    expires_at = now + timedelta(days=SESSION_DAYS)

    sessions_collection.insert_one({
        "tokenHash": _hash_token(token),
        "userId": user["_id"],
        "createdAt": now,
        "expiresAt": expires_at,
    })

    return token, expires_at


def get_session_user(token):
    if not token:
        return None

    session = sessions_collection.find_one({
        "tokenHash": _hash_token(token),
        "expiresAt": {"$gt": datetime.now(timezone.utc)},
    })
    if not session:
        return None

    user = users_collection.find_one({"_id": session["userId"]})
    return serialize_user(user) if user else None


def delete_session(token):
    if token:
        sessions_collection.delete_one({"tokenHash": _hash_token(token)})
