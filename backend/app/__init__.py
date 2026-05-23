from flask import Flask

from app.routes.authapi import auth_bp
from app.routes.route_api import api


def create_app():
    app = Flask(__name__)
    app.register_blueprint(api, url_prefix="/api")
    app.register_blueprint(auth_bp, url_prefix="/api/auth")
    return app
