from app.db import db
from werkzeug.security import check_password_hash, generate_password_hash

users_collection = db["users"]

def create_user(user_data):
    email = user_data["email"].strip().lower()
    user = {
        "firstName": user_data["firstName"].strip(),
        "lastName": user_data["lastName"].strip(),
        "email": email,
        "passwordHash": generate_password_hash(user_data["password"]),
    }
    return users_collection.insert_one(user)

def get_user(email):
    return users_collection.find_one({"email": email.strip().lower()})

def verify_user(email, password):
    user = get_user(email)
    if not user or not check_password_hash(user["passwordHash"], password):
        return None
    return user
