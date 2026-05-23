import os

from app import create_app
from app.db import check_db_connection
from flask_cors import CORS
from waitress import serve

app = create_app()
CORS(app)

if __name__ == "__main__":
    try:
        check_db_connection()
        print("MongoDB connected successfully.", flush=True)
    except Exception as error:
        print(f"MongoDB connection failed: {error}", flush=True)
        raise

    if os.getenv("FLASK_DEBUG") == "1":
        print("Starting Flask debug server at http://localhost:5000", flush=True)
        app.run(debug=True)
    else:
        port = int(os.getenv("PORT", 5000))
        print(f"Starting backend server at http://localhost:{port}", flush=True)
        serve(app, host="0.0.0.0", port=port)
