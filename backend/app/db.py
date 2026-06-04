import os

from dotenv import load_dotenv
from pymongo import MongoClient

BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
ENV_PATH = os.path.join(BASE_DIR, ".env")

load_dotenv(ENV_PATH)

MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017/")

client = MongoClient(MONGO_URI, serverSelectionTimeoutMS=5000)

db = client["smartmaps"]


def check_db_connection():
    client.admin.command("ping")
    return True
