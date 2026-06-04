import re

from app.db import db
from werkzeug.security import check_password_hash, generate_password_hash

users_collection = db["users"]


def serialize_user(user):
    if not user:
        return None

    return {
        "id": str(user["_id"]),
        "firstName": user.get("firstName"),
        "lastName": user.get("lastName"),
        "email": user.get("email"),
    }


def normalize_email(email):
    return email.strip().lower() if isinstance(email, str) else ""


def get_user(email):
    normalized_email = normalize_email(email)
    if not normalized_email:
        return None

    return (
        users_collection.find_one({"email": normalized_email})
        or users_collection.find_one({
            "email": {
                "$regex": f"^{re.escape(normalized_email)}$",
                "$options": "i",
            }
        })
    )


def create_user(user_data):
    email = normalize_email(user_data["email"])
    user = {
        "firstName": user_data["firstName"].strip(),
        "lastName": user_data["lastName"].strip(),
        "email": email,
        "password": generate_password_hash(user_data["password"]),
    }
    return users_collection.insert_one(user)


def verify_user(email, password):
    user = get_user(email)
    if not user or not password:
        return None

    stored_password = user.get("password") or user.get("passwordHash")
    if not stored_password:
        return None

    try:
        if check_password_hash(stored_password, password):
            return user
    except ValueError:
        pass

    if stored_password == password:
        users_collection.update_one(
            {"_id": user["_id"]},
            {"$set": {"password": generate_password_hash(password)}, "$unset": {"passwordHash": ""}},
        )
        return user

    return None
