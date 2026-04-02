from app import create_app
from flask_cors import CORS

app = create_app()

# ✅ Enable CORS (IMPORTANT for React)
CORS(app)

if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=5000)