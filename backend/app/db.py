from pymongo import MongoClient
import os
from pathlib import Path
from dotenv import load_dotenv

load_dotenv(Path(__file__).resolve().parents[1] / ".env")

MONGO_URI = os.getenv("MONGO_URI") or os.getenv("Mongo_URI")
MONGO_DB_NAME = os.getenv("MONGO_DB_NAME", "smartmaps")

if not MONGO_URI:
    raise RuntimeError("MONGO_URI is not set in backend/.env")

try:
    client = MongoClient(MONGO_URI, serverSelectionTimeoutMS=5000)
    db = client[MONGO_DB_NAME]

    client.admin.command('ping')

    db["users"].create_index("email", unique=True)
    db["sessions"].create_index("tokenHash", unique=True)
    db["sessions"].create_index("expiresAt", expireAfterSeconds=0)

    print("MongoDB Connected Successfully!")
except Exception as e:
    print("MongoDB Connection Failed:", e)
    raise
