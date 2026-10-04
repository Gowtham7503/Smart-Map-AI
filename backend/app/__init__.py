import os

from flask import Flask
from flask_cors import CORS

from app.routes.auth_api import auth_bp
from app.routes.chatbot_api import chatbot_bp
from app.routes.route_api import api


def get_allowed_origins():
    configured_origins = os.getenv("CORS_ORIGINS", "")
    if configured_origins:
        return [
            origin.strip()
            for origin in configured_origins.split(",")
            if origin.strip()
        ]

    return "*"


def create_app():
    app = Flask(__name__)
    app.secret_key = os.getenv("SECRET_KEY", "smartmap_secure_dev_key")
    is_production = os.getenv("FLASK_ENV") == "production"

    app.config.update(
        SESSION_COOKIE_HTTPONLY=True,
        SESSION_COOKIE_SAMESITE="None" if is_production else "Lax",
        SESSION_COOKIE_SECURE=is_production,
    )

    CORS(app, origins=get_allowed_origins(), supports_credentials=True)

    app.register_blueprint(api, url_prefix="/api")
    app.register_blueprint(auth_bp, url_prefix="/api/auth")
    app.register_blueprint(chatbot_bp, url_prefix="/api/chatbot")

    @app.get("/health")
    def health_check():
        return {"status": "ok"}, 200

    return app
