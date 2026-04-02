from flask import Flask
from app.routes.route_api import route_bp

def create_app():
    app = Flask(__name__)

    # ✅ Register route API
    app.register_blueprint(route_bp, url_prefix="/api")

    return app