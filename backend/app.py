from flask_cors import CORS
from flask import Flask, request, send_from_directory
import os
from config import Config
from extensions import db, jwt, migrate, cors, bcrypt

# IMPORTANT: models must be imported at module level for Flask-Migrate
from models import (
    User,
    CollectorProfile,
    RecyclerProfile,
    PickupRequest,
    EWasteItem,
    Feedback,
    RecyclingCertificate,
    Notification,
    PasswordResetToken,
    PickupNote,
)

def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)
    # Configure default avatar upload folder (can be overridden via config)
    app.config.setdefault(
        "AVATAR_UPLOAD_FOLDER",
        os.path.join(app.root_path, "uploads", "avatars"),
    )

    db.init_app(app)

    # Register models so SQLAlchemy metadata loads tables
    with app.app_context():
        from models.user import User
        from models.pickup import PickupRequest
        from models.notification import Notification
        from models.collector import CollectorProfile
        from models.recycler import RecyclerProfile
        from models.password_reset import PasswordResetToken
        from models.pickup_note import PickupNote

    # In development only: ensure missing tables are created automatically
    # This avoids "table does not exist" errors during local development.
    if app.config.get("ENV") == "development" or app.config.get("DEBUG"):
        with app.app_context():
            db.create_all()
    jwt.init_app(app)
    migrate.init_app(app, db)
    bcrypt.init_app(app)

    cors.init_app(
        app,
        resources={r"/api/*": {
            "origins": ["http://localhost:8080", "http://127.0.0.1:8080"],
            "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
            "allow_headers": ["Content-Type", "Authorization"],
            "expose_headers": ["Content-Type"],
            "supports_credentials": True,
        }},
    )

    # Request logging middleware for JWT debugging
    @app.before_request
    def log_request():
        if request.path.startswith("/api/recycler"):
            print(f"[REQUEST] {request.method} {request.path}")
            auth_header = request.headers.get("Authorization", "NOT PRESENT")
            print(f"  - Authorization header: {'PRESENT' if auth_header != 'NOT PRESENT' else 'MISSING'}")
            if auth_header != "NOT PRESENT":
                print(f"  - Header format: {'Bearer format' if auth_header.startswith('Bearer ') else 'NOT Bearer format'}")
                if auth_header.startswith("Bearer "):
                    token = auth_header[7:]
                    print(f"  - Token length: {len(token)}")
                    print(f"  - Token segments: {len(token.split('.'))} (should be 3)")

    # JWT Error Handlers - Critical for debugging
    @jwt.invalid_token_loader
    def invalid_token_callback(error_string):
        print("=" * 60)
        print("[JWT ERROR] Invalid token detected")
        print(f"  - Error: {error_string}")
        print(f"  - Path: {request.path}")
        print(f"  - Method: {request.method}")
        auth_header = request.headers.get("Authorization", "NOT PRESENT")
        print(f"  - Authorization header present: {auth_header != 'NOT PRESENT'}")
        if auth_header != "NOT PRESENT":
            print(f"  - Header value: {auth_header[:80]}...")
            # Check if it starts with Bearer
            if not auth_header.startswith("Bearer "):
                print(f"  - WARNING: Header does not start with 'Bearer '")
            else:
                token_part = auth_header[7:]  # Skip "Bearer "
                print(f"  - Token length: {len(token_part)} characters")
                print(f"  - Token preview: {token_part[:50]}...")
        print(f"  - All headers: {dict(request.headers)}")
        print("=" * 60)
        return {"error": "Invalid token", "details": str(error_string)}, 401

    @jwt.unauthorized_loader
    def missing_token_callback(error_string):
        print("=" * 60)
        print("[JWT ERROR] Missing/Unauthorized token")
        print(f"  - Error: {error_string}")
        print(f"  - Path: {request.path}")
        print(f"  - Method: {request.method}")
        auth_header = request.headers.get("Authorization", "NOT PRESENT")
        print(f"  - Authorization header: {auth_header}")
        if auth_header == "NOT PRESENT":
            print(f"  - DIAGNOSIS: Authorization header is missing from request")
        else:
            print(f"  - Header present but not accepted")
            print(f"  - Header value: {auth_header[:80]}...")
        print(f"  - All headers: {dict(request.headers)}")
        print("=" * 60)
        return {"error": "Authorization required", "details": str(error_string)}, 401

    @jwt.expired_token_loader
    def expired_token_callback(jwt_header, jwt_payload):
        print("=" * 60)
        print("[JWT ERROR] Expired token")
        print(f"  - Path: {request.path}")
        print(f"  - JWT header: {jwt_header}")
        print(f"  - JWT payload: {jwt_payload}")
        if jwt_payload:
            print(f"  - Identity (sub): {jwt_payload.get('sub')}")
            print(f"  - Expiration (exp): {jwt_payload.get('exp')}")
            import time
            if jwt_payload.get('exp'):
                expired_ago = time.time() - jwt_payload.get('exp')
                print(f"  - Expired {expired_ago:.0f} seconds ago ({expired_ago/3600:.1f} hours)")
        print("=" * 60)
        return {"error": "Token expired", "details": "Please login again"}, 401

    @jwt.revoked_token_loader
    def revoked_token_callback(jwt_header, jwt_payload):
        print("=" * 60)
        print("[JWT ERROR] Revoked token")
        print(f"  - Path: {request.path}")
        print(f"  - JWT payload: {jwt_payload}")
        print("=" * 60)
        return {"error": "Token revoked"}, 401

    # register routes
    from routes.auth_routes import auth_bp
    from routes.pickup_routes import pickup_bp
    from routes.admin_routes import admin_bp
    from routes.certificate_routes import certificate_bp
    from routes.recycler_routes import recycler_bp
    from routes.recyclers_routes import recyclers_bp
    from routes.collector_routes import collector_bp
    from routes.collectors_routes import collectors_bp
    from routes.user_routes import user_bp
    

    app.register_blueprint(auth_bp, url_prefix="/api/auth")
    app.register_blueprint(collectors_bp, url_prefix="/api/collectors")
    app.register_blueprint(recyclers_bp, url_prefix="/api/recyclers")
    app.register_blueprint(pickup_bp, url_prefix="/api/pickups")
    app.register_blueprint(admin_bp, url_prefix="/api/admin")
    app.register_blueprint(certificate_bp, url_prefix="/api/certificates")
    app.register_blueprint(recycler_bp, url_prefix="/api/recycler")
    app.register_blueprint(collector_bp)
    app.register_blueprint(user_bp, url_prefix="/api/user")


    @app.route("/api/health")
    def api_health():
        """Health check endpoint for frontend connectivity verification"""
        return {"status": "ok", "message": "API is reachable"}, 200

    @app.route("/uploads/avatars/<path:filename>")
    def serve_avatar(filename: str):
        """Serve uploaded user avatar images."""
        upload_folder = app.config.get("AVATAR_UPLOAD_FOLDER")
        return send_from_directory(upload_folder, filename)

    @app.route("/", defaults={"path": ""})
    @app.route("/<path:path>")
    def spa_app(path: str):
        """
        Serve the built frontend (Vite) and fall back to index.html for client-side routes.
        Any /api/* and /uploads/* paths are handled by API or upload routes above.
        """
        # Let API and upload routes be handled separately
        if path.startswith("api/") or path.startswith("uploads/"):
            return {"error": "Not Found", "path": f"/{path}"}, 404

        dist_dir = os.path.abspath(os.path.join(app.root_path, "..", "frontend", "dist"))
        index_path = os.path.join(dist_dir, "index.html")

        if not os.path.exists(index_path):
            return {
                "error": "Frontend not built",
                "message": "Run 'npm install' and 'npm run build' inside the frontend folder.",
            }, 500

        # If the requested path is a real file (e.g., /assets/main.js), serve it directly
        if path:
            candidate = os.path.join(dist_dir, path)
            if os.path.exists(candidate) and os.path.isfile(candidate):
                return send_from_directory(dist_dir, path)

        # Otherwise, serve index.html so React Router can handle the route
        return send_from_directory(dist_dir, "index.html")

    @app.errorhandler(405)
    def method_not_allowed(e):
        return {"error": "Method Not Allowed", "message": "This endpoint does not support the HTTP method you used. Check the route and use POST or GET as required."}, 405

    return app


app = create_app()

# =====================
# CLI COMMANDS
# =====================
@app.cli.command("create-admin")
def create_admin():
    """Create or reset admin user with email admin@ecoswap.com and password admin123"""
    from models.user import User
    
    admin_email = "admin@ecoswap.com"
    admin_password = "admin123"
    
    # Check if admin exists
    admin_user = User.query.filter_by(email=admin_email).first()
    
    if admin_user:
        # Reset password
        admin_user.password_hash = bcrypt.generate_password_hash(admin_password).decode("utf-8")
        try:
            db.session.commit()
            print(f"✓ Admin password reset successfully")
            print(f"  Email: {admin_email}")
            print(f"  Password: {admin_password}")
        except Exception as e:
            db.session.rollback()
            print(f"✗ Failed to reset admin password: {str(e)}")
    else:
        # Create new admin
        admin_user = User(
            name="Admin",
            email=admin_email,
            password_hash=bcrypt.generate_password_hash(admin_password).decode("utf-8"),
            phone="0000000000",
            address="Admin Office",
            role="ADMIN"
        )
        
        try:
            db.session.add(admin_user)
            db.session.commit()
            print(f"✓ Admin created successfully")
            print(f"  Email: {admin_email}")
            print(f"  Password: {admin_password}")
            print(f"  Role: ADMIN")
        except Exception as e:
            db.session.rollback()
            print(f"✗ Failed to create admin user: {str(e)}")

# development helper command for creating all tables
@app.cli.command("create-tables")
def create_tables():
    """Open app context and run db.create_all() to ensure all tables exist."""
    with app.app_context():
        db.create_all()
        print("Tables created")