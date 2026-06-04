from datetime import datetime, timedelta, timezone
from email.message import EmailMessage
import hashlib
import os
import re
import secrets
import smtplib

from flask import Blueprint, request, jsonify, session
from werkzeug.security import generate_password_hash, check_password_hash
from app.db import db

auth_bp = Blueprint("auth_api", __name__)
otp_collection = db["otp_codes"]
OTP_EXPIRY_MINUTES = 5


def normalize_email(email):
    return email.strip().lower() if isinstance(email, str) else ""


def find_user_by_email(email):
    normalized_email = normalize_email(email)
    if not normalized_email:
        return None

    return (
        db.users.find_one({"email": normalized_email})
        or db.users.find_one({
            "email": {
                "$regex": f"^{re.escape(normalized_email)}$",
                "$options": "i",
            }
        })
    )


def password_matches(stored_password, candidate_password):
    if not stored_password or not candidate_password:
        return False

    try:
        if check_password_hash(stored_password, candidate_password):
            return True
    except ValueError:
        pass

    return stored_password == candidate_password


def generate_otp():
    return f"{secrets.randbelow(1000000):06d}"


def hash_otp(otp):
    return hashlib.sha256(otp.encode("utf-8")).hexdigest()


def send_otp_email(email, otp):
    smtp_user = os.getenv("GMAIL_SMTP_USER")
    smtp_password = os.getenv("GMAIL_SMTP_PASSWORD")
    smtp_host = os.getenv("GMAIL_SMTP_HOST", "smtp.gmail.com")
    smtp_port = int(os.getenv("GMAIL_SMTP_PORT", "587"))

    if not smtp_user or not smtp_password:
        raise RuntimeError("Gmail SMTP credentials are not configured.")

    message = EmailMessage()
    message["Subject"] = "Your SmartMaps password reset OTP"
    message["From"] = smtp_user
    message["To"] = email
    message.set_content(
        f"Your SmartMaps password reset code is {otp}.\n\n"
        f"This code expires in {OTP_EXPIRY_MINUTES} minutes."
    )

    with smtplib.SMTP(smtp_host, smtp_port) as smtp:
        smtp.starttls()
        smtp.login(smtp_user, smtp_password)
        smtp.send_message(message)

def validate_password_strength(password):
    """
    8 characters minimum, atleast one Uppercase, Lowecase letter, special charater and digits.
    """
    if len(password) < 8:
        return False
    if not re.search(r"[A-Z]", password):
        return False
    if not re.search(r"[a-z]", password):
        return False
    if not re.search(r"\d", password):
        return False
    if not re.search(r'[!@#$%^&*(),.?":{}|<>]', password):
        return False
    return True


@auth_bp.route("/request-password-reset-otp", methods=["POST"])
def request_password_reset_otp():
    data = request.get_json(silent=True) or {}
    email = normalize_email(data.get("email")) or session.get("password_reset_pending_email", "")

    if not email:
        return jsonify({"message": "Please enter your email on Sign In and click Forgot Password."}), 400

    user = find_user_by_email(email)
    if not user:
        return jsonify({"message": "No account found with this email"}), 404

    account_email = normalize_email(user.get("email")) or email

    otp = generate_otp()
    expires_at = datetime.now(timezone.utc) + timedelta(minutes=OTP_EXPIRY_MINUTES)

    otp_collection.delete_many({"email": account_email})
    otp_collection.insert_one({
        "email": account_email,
        "otpHash": hash_otp(otp),
        "expiresAt": expires_at,
        "verified": False,
    })

    try:
        send_otp_email(account_email, otp)
    except Exception as error:
        otp_collection.delete_many({"email": account_email})
        return jsonify({"message": str(error)}), 500

    session["password_reset_pending_email"] = account_email
    session.pop("password_reset_verified_email", None)
    return jsonify({
        "message": "Password reset OTP sent successfully",
    }), 200


@auth_bp.route("/verify-password-reset-otp", methods=["POST"])
def verify_password_reset_otp():
    data = request.get_json(silent=True) or {}
    email = session.get("password_reset_pending_email", "")
    otp = str(data.get("otp", "")).strip()

    if not email:
        return jsonify({"message": "Please request a password reset OTP first"}), 401

    if not re.fullmatch(r"\d{6}", otp):
        return jsonify({"message": "6-digit OTP is required"}), 400

    user = find_user_by_email(email)
    if not user:
        return jsonify({"message": "No account found with this email"}), 404

    account_email = normalize_email(user.get("email")) or email

    otp_record = otp_collection.find_one({"email": account_email})
    if not otp_record:
        return jsonify({"message": "OTP not found. Please request a new code."}), 404

    expires_at = otp_record.get("expiresAt")
    if expires_at and expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)

    if not expires_at or expires_at <= datetime.now(timezone.utc):
        otp_collection.delete_many({"email": account_email})
        return jsonify({"message": "OTP has expired. Please request a new code."}), 400

    if otp_record.get("otpHash") != hash_otp(otp):
        return jsonify({"message": "Invalid OTP"}), 401

    session["password_reset_verified_email"] = account_email
    return jsonify({
        "message": "OTP verified successfully",
    }), 200


@auth_bp.route("/reset-password", methods=["POST"])
def reset_password():
    data = request.get_json(silent=True) or {}
    email = session.get("password_reset_verified_email", "")
    password = data.get("password")

    if not email:
        return jsonify({"message": "Please verify your OTP before resetting password"}), 401

    user = find_user_by_email(email)
    if not user:
        return jsonify({"message": "No account found with this email"}), 404

    account_email = normalize_email(user.get("email")) or email

    if not password or not validate_password_strength(password):
        return jsonify({"message": "Password does not meet complexity requirements"}), 400

    result = db.users.update_one(
        {"_id": user["_id"]},
        {"$set": {"password": generate_password_hash(password)}},
    )
    if result.matched_count == 0:
        return jsonify({"message": "No account found with this email"}), 404

    otp_collection.delete_many({"email": account_email})
    session.pop("password_reset_pending_email", None)
    session.pop("password_reset_verified_email", None)
    return jsonify({"message": "Password reset successfully"}), 200

@auth_bp.route("/register", methods=["POST"])
def register():
    data = request.get_json(silent=True) or {}
    first_name = data.get("firstName", "").strip()
    last_name = data.get("lastName", "").strip()
    email = normalize_email(data.get("email"))
    password = data.get("password")

    if not all([first_name, last_name, email, password]):
        return jsonify({"message": "Missing required fields"}), 400

    if not validate_password_strength(password):
        return jsonify({"message": "Password does not meet complexity requirements"}), 400

    if find_user_by_email(email):
        return jsonify({"message": "User with this email already exists"}), 409

    hashed_password = generate_password_hash(password)
    db.users.insert_one({
        "firstName": first_name,
        "lastName": last_name,
        "email": email,
        "password": hashed_password
    })

    return jsonify({"message": "User registered successfully"}), 201

@auth_bp.route("/login", methods=["POST"])
def login():
    data = request.get_json(silent=True) or {}
    email = normalize_email(data.get("email"))
    password = data.get("password")

    user = find_user_by_email(email)
    if user and password_matches(user.get("password"), password):
        account_email = normalize_email(user.get("email")) or email
        if user.get("password") == password:
            db.users.update_one(
                {"_id": user["_id"]},
                {"$set": {"password": generate_password_hash(password)}},
            )
        session["user_email"] = account_email
        return jsonify({"message": "Login successful"}), 200

    return jsonify({"message": "Invalid email or password"}), 401

@auth_bp.route("/me", methods=["GET"])
def get_current_user():
    email = session.get("user_email")
    if not email:
        return jsonify({"message": "Unauthorized"}), 401

    user = db.users.find_one({"email": email}, {"password": 0, "_id": 0})
    return jsonify({"user": user}), 200

@auth_bp.route("/logout", methods=["POST"])
def logout():
    session.pop("user_email", None)
    return jsonify({"message": "Logged out successfully"}), 200
