from flask import Blueprint, request, jsonify
from app.services.user_service import create_user

auth_bp = Blueprint("auth", __name__)

@auth_bp.route("/register", methods=["POST"])
def register():
    data = request.json
    create_user(data)
    return jsonify({"message": "User created"})