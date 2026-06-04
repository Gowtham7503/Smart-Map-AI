import os
from flask import Flask

from app.routes.route_api import api
from app.routes.auth_api import auth_bp


def create_app():
    app = Flask(__name__)
    # Secret key is required for session-based authentication
    app.secret_key = os.getenv("SECRET_KEY", "smartmap_secure_dev_key")

    app.register_blueprint(api, url_prefix="/api")
    app.register_blueprint(auth_bp, url_prefix="/api/auth")

    return app