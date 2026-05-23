from flask import Blueprint, request, jsonify
from app.services.session_service import (
    SESSION_COOKIE_NAME,
    SESSION_DAYS,
    create_session,
    delete_session,
    get_session_user,
)
from app.services.user_service import create_user, get_user, serialize_user, verify_user

auth_bp = Blueprint("auth", __name__)

PASSWORD_REQUIREMENTS_MESSAGE = (
    "Password must be at least 8 characters and include uppercase, lowercase, "
    "number, and special character."
)


def is_strong_password(password):
    return (
        len(password) >= 8
        and any(char.isupper() for char in password)
        and any(char.islower() for char in password)
        and any(char.isdigit() for char in password)
        and any(not char.isalnum() for char in password)
    )


@auth_bp.route("/register", methods=["POST"])
def register():
    data = request.get_json(silent=True) or {}

    required_fields = ("firstName", "lastName", "email", "password")
    missing_fields = [field for field in required_fields if not data.get(field)]
    if missing_fields:
        return jsonify({"message": "Please fill all required fields"}), 400

    if data.get("confirmPassword") and data["password"] != data["confirmPassword"]:
        return jsonify({"message": "Passwords do not match"}), 400

    if not is_strong_password(data["password"]):
        return jsonify({"message": PASSWORD_REQUIREMENTS_MESSAGE}), 400

    email = data["email"].strip().lower()
    if get_user(email):
        return jsonify({"message": "Email is already registered"}), 409

    result = create_user({**data, "email": email})
    return jsonify({"message": "User created", "userId": str(result.inserted_id)}), 201

@auth_bp.route("/login", methods=["POST"])
def login():
    data = request.get_json(silent=True) or {}

    email = data.get("email", "").strip().lower()
    password = data.get("password", "")

    if not email or not password:
        return jsonify({"message": "Email and password are required"}), 400

    user = verify_user(email, password)
    if not user:
        return jsonify({"message": "Invalid email or password"}), 401

    session_token, _ = create_session(user)
    response = jsonify({
        "message": "Login successful",
        "user": serialize_user(user),
    })
    response.set_cookie(
        SESSION_COOKIE_NAME,
        session_token,
        httponly=True,
        max_age=SESSION_DAYS * 24 * 60 * 60,
        samesite="Lax",
    )
    return response, 200

@auth_bp.route("/me", methods=["GET"])
def me():
    user = get_session_user(request.cookies.get(SESSION_COOKIE_NAME))
    if not user:
        return jsonify({"message": "Not authenticated"}), 401

    return jsonify({"user": user}), 200

@auth_bp.route("/logout", methods=["POST"])
def logout():
    session_token = request.cookies.get(SESSION_COOKIE_NAME)
    delete_session(session_token)

    response = jsonify({"message": "Logged out"})
    response.delete_cookie(SESSION_COOKIE_NAME)
    return response, 200
