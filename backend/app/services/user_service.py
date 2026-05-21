from app.db import db

users_collection = db["users"]

def create_user(user_data):
    return users_collection.insert_one(user_data)

def get_user(email):
    return users_collection.find_one({"email": email})