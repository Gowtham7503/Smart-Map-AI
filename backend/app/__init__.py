from flask import Flask

from app.routes.route_api import api


def create_app():
    app = Flask(__name__)
    app.register_blueprint(api, url_prefix="/api")
    return app
