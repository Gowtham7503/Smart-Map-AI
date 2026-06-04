import os

from flask import Flask

from app.routes.auth_api import auth_bp
from app.routes.route_api import api


def create_app():
    app = Flask(__name__)
    app.secret_key = os.getenv("SECRET_KEY", "smartmap_secure_dev_key")

    app.register_blueprint(api, url_prefix="/api")
    app.register_blueprint(auth_bp, url_prefix="/api/auth")
    return app
