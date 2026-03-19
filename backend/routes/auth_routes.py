from flask import Blueprint, request, jsonify, current_app
from extensions import db, bcrypt
from werkzeug.utils import secure_filename
import os

from flask_jwt_extended import (
    create_access_token,
    decode_token,
    get_jwt,
    get_jwt_identity,
    jwt_required,
)

from models.user import User
from models.collector import CollectorProfile
from models.recycler import RecyclerProfile
from models.password_reset import PasswordResetToken
from utils.email_sender import send_email
from utils.email_templates import render_password_reset, render_welcome

from datetime import datetime
from secrets import token_urlsafe

auth_bp = Blueprint("auth", __name__)

# ======================
# SAFE TEST ROUTES
# ======================

@auth_bp.route("/ping", methods=["GET"])
def ping():
    return {"ok": True}, 200


@auth_bp.route("/routes", methods=["GET"])
def routes():
    return {
        "routes": [
            {"path": "/api/auth/ping", "method": "GET"},
            {"path": "/api/auth/routes", "method": "GET"},
            {"path": "/api/auth/register", "method": "POST"},
            {"path": "/api/auth/login", "method": "POST"},
            {"path": "/api/auth/forgot-password", "method": "POST"},
            {"path": "/api/auth/reset-password", "method": "POST"},
            {"path": "/api/auth/debug/token", "method": "POST"}
        ]
    }, 200


# ======================
# DEBUG ROUTE - Token Decoder
# ======================
@auth_bp.route("/debug/token", methods=["POST"])
def debug_token():
    """
    Debug endpoint to decode and inspect JWT tokens.
    Send token in body: {"token": "..."}
    """
    try:
        data = request.get_json() or {}
        token = data.get("token")
        
        if not token:
            return {"error": "Token required in body: {'token': '...'}"}, 400
        
        # Decode token
        decoded = decode_token(token)
        
        # Get expiration info
        exp = decoded.get("exp")
        import time
        is_expired = exp and exp < time.time() if exp else None
        
        return {
            "decoded": decoded,
            "identity": decoded.get("sub"),
            "expiration": {
                "exp": exp,
                "is_expired": is_expired,
                "expires_at": None if not exp else time.strftime("%Y-%m-%d %H:%M:%S", time.localtime(exp))
            },
            "type": decoded.get("type"),
            "fresh": decoded.get("fresh"),
            "jti": decoded.get("jti")
        }, 200
        
    except Exception as e:
        print(f"[DEBUG] Token decode error: {str(e)}")
        return {"error": "Failed to decode token", "details": str(e)}, 400


# ======================
# FORGOT / RESET PASSWORD
# ======================

@auth_bp.route("/forgot-password", methods=["POST"])
def forgot_password():
    """
    Request a password reset link.

    Body: {"email": "user@example.com"}
    Always returns 200 to avoid leaking whether the email exists.
    """
    data = request.get_json() or {}
    email = (data.get("email") or "").strip().lower()

    if not email:
        return {"error": "email is required"}, 400

    user = User.query.filter_by(email=email).first()

    if not user:
        # Do not reveal that the email does not exist
        return {
            "message": "If that email exists in our system, a reset link has been sent."
        }, 200

    try:
        # Invalidate previous tokens for this user
        PasswordResetToken.query.filter_by(user_id=user.id, used=False).delete()

        reset_row = PasswordResetToken.create_for_user(user.id)
        db.session.add(reset_row)
        db.session.commit()

        frontend_url = (current_app.config.get("FRONTEND_URL") or "").rstrip("/")
        reset_url = f"{frontend_url}/reset-password?token={reset_row.token}"
        subj, html_body, text_body = render_password_reset(reset_url)
        send_email(user.email, subj, html_body=html_body, text_body=text_body)

        print("[AUTH] Password reset requested")
        print(f"  - User: {user.email}")

        response = {
            "message": "If that email exists in our system, a reset link has been sent."
        }
        if current_app.debug:
            response["reset_link"] = f"/reset-password?token={reset_row.token}"
        return response, 200
    except Exception as e:
        db.session.rollback()
        import traceback
        traceback.print_exc()
        return {"error": "Failed to create reset link. Please try again."}, 500


@auth_bp.route("/reset-password", methods=["POST"])
def reset_password():
    """
    Reset password using a one-time token.

    Body: {"token": "...", "newPassword": "..."}
    """
    data = request.get_json() or {}
    token_value = data.get("token")
    new_password = data.get("newPassword")

    if not token_value or not new_password:
        return {"error": "token and newPassword are required"}, 400

    reset_row: PasswordResetToken | None = PasswordResetToken.query.filter_by(
        token=token_value
    ).first()

    if not reset_row:
        return {"error": "Invalid or expired token"}, 400

    if reset_row.used:
        return {"error": "Token already used"}, 400

    if reset_row.expires_at < datetime.utcnow():
        return {"error": "Token expired"}, 400

    user = User.query.get(reset_row.user_id)
    if not user:
        return {"error": "User not found"}, 404

    if bcrypt.check_password_hash(user.password_hash, new_password):
        return {"error": "New password must be different from your current password."}, 400

    user.password_hash = bcrypt.generate_password_hash(new_password).decode("utf-8")
    reset_row.used = True

    try:
        db.session.commit()
    except Exception as e:
        db.session.rollback()
        return {"error": "Failed to reset password"}, 500

    return {"success": True}, 200


# ======================
# REGISTER
# ======================
@auth_bp.route("/register", methods=["GET"])
def register_info():
    return {
        "message": "This endpoint only accepts POST requests.",
        "how_to_use": {
            "method": "POST",
            "url": "/api/auth/register",
            "body": {
                "name": "string",
                "email": "string",
                "password": "string",
                "phone": "string",
                "address": "string",
                "role": "USER | COLLECTOR | RECYCLER"
            }
        }
    }, 200


@auth_bp.route("/register", methods=["POST"])
def register():
    data = request.get_json() or {}

    required = ["name", "email", "password", "phone", "address", "role"]
    for field in required:
        if field not in data:
            return {"error": f"{field} is required"}, 400

    # NORMALIZE EMAIL: Strip whitespace and convert to lowercase
    email = data.get("email", "").strip().lower()

    if User.query.filter_by(email=email).first():
        return {"error": "Email already registered"}, 400

    password_hash = bcrypt.generate_password_hash(data.get("password")).decode("utf-8")

    user = User(
        email=email,
        password_hash=password_hash,
        name=data.get("name"),
        phone=data.get("phone"),
        address=data.get("address"),
        role=data.get("role"),
    )

    # Populate role-specific fields on the User itself
    if user.role == "COLLECTOR":
        user.vehicle_type = data.get("vehicleType")
        user.license_number = data.get("licenseNumber")
    if user.role == "RECYCLER":
        user.facility_name = data.get("facilityName")
        user.certification = data.get("certification")

    db.session.add(user)
    # Flush to get user.id before creating profile, but don't commit yet
    db.session.flush()

    if user.role == "COLLECTOR":
        profile = CollectorProfile(
            user_id=user.id,
            vehicle_type=data.get("vehicleType"),
            license_number=data.get("licenseNumber"),
            approval_status="PENDING"
        )
        db.session.add(profile)

    if user.role == "RECYCLER":
        profile = RecyclerProfile(
            user_id=user.id,
            facility_name=data.get("facilityName"),
            certification=data.get("certification"),
            approval_status="PENDING"
        )
        db.session.add(profile)

    try:
        db.session.commit()
    except Exception as e:
        db.session.rollback()
        return {"error": "Failed to create account: " + str(e)}, 500

    role_label = {"USER": "Citizen", "COLLECTOR": "Collector", "RECYCLER": "Recycler", "ADMIN": "Admin"}.get(user.role, user.role)
    pending_approval = user.role in ("COLLECTOR", "RECYCLER")
    subj, welcome_html, text_body = render_welcome(
        user_name=user.name or "there",
        role_label=role_label,
        pending_approval=pending_approval,
    )
    send_email(user.email, subj, html_body=welcome_html, text_body=text_body)

    token = create_access_token(identity=user.id)
    
    # Enhanced debug logging
    print(f"[AUTH DEBUG] Token creation:")
    print(f"  - Identity (user.id): {user.id}")
    print(f"  - User email: {user.email}")
    print(f"  - User role: {user.role}")
    print(f"  - Token length: {len(token)} characters")
    print(f"  - Token preview: {token[:50]}...")
    
    # Verify token can be decoded immediately
    try:
        decoded = decode_token(token)
        print(f"  - Token decoded successfully")
        print(f"  - Decoded identity (sub): {decoded.get('sub')}")
        print(f"  - Token type: {decoded.get('type')}")
        print(f"  - Expiration (exp): {decoded.get('exp')}")
    except Exception as e:
        print(f"  - ERROR: Token decode failed: {e}")

    return {
        "user": {
            "id": user.id,
            "email": user.email,
            "name": user.name,
            "role": user.role,
            "avatar": user.avatar,
        },
        "token": token
    }, 201


# ======================
# LOGIN
# ======================
@auth_bp.route("/login", methods=["POST"])
def login():
    data = request.get_json() or {}

    # NORMALIZE EMAIL: Strip whitespace and convert to lowercase
    email = data.get("email", "").strip().lower()
    password = data.get("password", "")

    user = User.query.filter_by(email=email).first()

    # DEBUG: Password verification
    print("LOGIN DEBUG ----------------")
    print("Email received:", email)
    print("User found:", user is not None)
    
    if user:
        print("Stored hash:", user.password_hash)
        print("Password entered:", password)
        is_valid = bcrypt.check_password_hash(user.password_hash, password)
        print("Password valid:", is_valid)
    else:
        is_valid = False

    if not user or not is_valid:
        return {"error": "Invalid email or password"}, 401

    # Block suspended users from logging in
    if not getattr(user, "is_active", True):
        print("[AUTH] Login blocked: user is inactive")
        print(f"  - email: {user.email}")
        print(f"  - role: {user.role}")
        return {"error": "Account suspended. Please contact support or an admin."}, 403

    # Role-based login: if role is provided, it must match the user's actual role
    requested_role = data.get("role")
    if requested_role:
        # Normalize common role labels from frontend (case-insensitive)
        role_map = {
            "USER": "USER",
            "CITIZEN": "USER",
            "CUSTOMER": "USER",
            "COLLECTOR": "COLLECTOR",
            "RECYCLER": "RECYCLER",
            "ADMIN": "ADMIN",
        }
        requested_key = str(requested_role).strip().upper()
        requested_norm = role_map.get(requested_key, requested_key)

        if str(user.role) != str(requested_norm):
            role_labels = {"USER": "Citizen", "COLLECTOR": "Collector", "RECYCLER": "Recycler", "ADMIN": "Admin"}
            actual_label = role_labels.get(str(user.role), str(user.role))
            print("[AUTH] Login blocked: role mismatch")
            print(f"  - email: {user.email}")
            print(f"  - requested_role(raw): {requested_role}")
            print(f"  - requested_role(norm): {requested_norm}")
            print(f"  - actual_role: {user.role}")
            return {
                "error": f"This account is a {actual_label}. Please select {actual_label} to sign in."
            }, 403

    if user.role == "COLLECTOR":
        profile = CollectorProfile.query.filter_by(user_id=user.id).first()
        if not profile or profile.approval_status != "APPROVED":
            print("[AUTH] Login blocked: collector not approved")
            print(f"  - email: {user.email}")
            print(f"  - profile_exists: {profile is not None}")
            if profile is not None:
                print(f"  - approval_status: {profile.approval_status}")
            return jsonify({"error": "Account not approved yet"}), 403

    if user.role == "RECYCLER":
        profile = RecyclerProfile.query.filter_by(user_id=user.id).first()
        if not profile or profile.approval_status != "APPROVED":
            print("[AUTH] Login blocked: recycler not approved")
            print(f"  - email: {user.email}")
            print(f"  - profile_exists: {profile is not None}")
            if profile is not None:
                print(f"  - approval_status: {profile.approval_status}")
            return jsonify({"error": "Account not approved yet"}), 403

    token = create_access_token(identity=user.id)
    
    # Enhanced debug logging
    print(f"[AUTH DEBUG] Login token creation:")
    print(f"  - Identity (user.id): {user.id}")
    print(f"  - User email: {user.email}")
    print(f"  - User role: {user.role}")
    print(f"  - Token length: {len(token)} characters")
    print(f"  - Token preview: {token[:50]}...")
    
    # Verify token can be decoded immediately
    try:
        decoded = decode_token(token)
        print(f"  - Token decoded successfully")
        print(f"  - Decoded identity (sub): {decoded.get('sub')}")
        print(f"  - Token type: {decoded.get('type')}")
        print(f"  - Expiration (exp): {decoded.get('exp')}")
        import time
        if decoded.get('exp'):
            expires_in = decoded.get('exp') - time.time()
            print(f"  - Expires in: {expires_in:.0f} seconds ({expires_in/3600:.1f} hours)")
    except Exception as e:
        print(f"  - ERROR: Token decode failed: {e}")

    user_data = {
        "id": user.id,
        "email": user.email,
        "name": user.name,
        "phone": user.phone or "",
        "address": user.address or "",
        "role": user.role,
        "avatar": user.avatar,
        "createdAt": user.created_at.isoformat() if user.created_at else None,
    }
    
    # Add role-specific fields
    if user.role == "COLLECTOR":
        user_data["vehicleType"] = user.vehicle_type or ""
        user_data["licenseNumber"] = user.license_number or ""
    elif user.role == "RECYCLER":
        user_data["facilityName"] = user.facility_name or ""
        user_data["certification"] = user.certification or ""

    return {
        "user": user_data,
        "access_token": token,
        "token": token,
        "role": user.role
    }, 200


# ======================
# PROFILE & PASSWORD
# ======================

@auth_bp.route("/me", methods=["GET"])
@jwt_required()
def get_my_profile():
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    if not user:
        return {"error": "User not found"}, 404
    
    response = {
        "id": user.id,
        "name": user.name,
        "email": user.email,
        "phone": user.phone,
        "address": user.address,
        "role": user.role,
        "created_at": user.created_at.isoformat() if user.created_at else None,
        "avatar": user.avatar,
    }
    
    # Add role-specific fields
    if user.role == "COLLECTOR":
        response["vehicle_type"] = user.vehicle_type
        response["license_number"] = user.license_number
    elif user.role == "RECYCLER":
        response["facility_name"] = user.facility_name
        response["certification"] = user.certification
    
    return response, 200

@auth_bp.route("/profile", methods=["PATCH"])
@jwt_required()
def update_profile():
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    if not user:
        return {"error": "User not found"}, 404

    data = request.get_json() or {}
    
    # Base fields for all users
    allowed = ["name", "email", "phone", "address"]
    
    # Role-specific fields
    if user.role == "COLLECTOR":
        allowed.extend(["vehicle_type", "license_number"])
    elif user.role == "RECYCLER":
        allowed.extend(["facility_name", "certification"])
    
    for field in allowed:
        if field in data:
            setattr(user, field, data[field])
    
    try:
        db.session.commit()
    except Exception as e:
        db.session.rollback()
        return {"error": "Failed to update profile"}, 500

    response = {
        "id": user.id,
        "name": user.name,
        "email": user.email,
        "phone": user.phone,
        "address": user.address,
        "role": user.role,
        "created_at": user.created_at.isoformat() if user.created_at else None,
        "avatar": user.avatar,
    }
    
    # Add role-specific fields to response
    if user.role == "COLLECTOR":
        response["vehicle_type"] = user.vehicle_type
        response["license_number"] = user.license_number
    elif user.role == "RECYCLER":
        response["facility_name"] = user.facility_name
        response["certification"] = user.certification
    
    return response, 200


@auth_bp.route("/profile/avatar", methods=["POST"])
@jwt_required()
def upload_avatar():
    """
    Upload or replace the authenticated user's profile picture.
    Accepts multipart/form-data with a single "file" field.
    """
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    if not user:
        return {"error": "User not found"}, 404

    if "file" not in request.files:
        return {"error": "No file part in request"}, 400

    file = request.files["file"]
    if file.filename == "":
        return {"error": "No file selected"}, 400

    allowed_extensions = {"jpg", "jpeg", "png", "webp"}
    _, ext = os.path.splitext(file.filename)
    ext = (ext or "").lstrip(".").lower()
    if ext not in allowed_extensions:
        return {"error": "Only JPG, JPEG, PNG, and WEBP images are allowed"}, 400

    upload_root = current_app.config.get("AVATAR_UPLOAD_FOLDER")
    os.makedirs(upload_root, exist_ok=True)

    filename = secure_filename(f"{user.id}.{ext}")
    filepath = os.path.join(upload_root, filename)
    file.save(filepath)

    base_url = (current_app.config.get("PUBLIC_BACKEND_URL") or request.host_url).rstrip("/")
    avatar_url = f"{base_url}/uploads/avatars/{filename}"

    user.avatar = avatar_url
    try:
        db.session.commit()
    except Exception:
        db.session.rollback()
        return {"error": "Failed to save avatar"}, 500

    return {"avatar": user.avatar}, 200

@auth_bp.route("/change-password", methods=["POST"])
@jwt_required()
def change_password():
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    if not user:
        return {"error": "User not found"}, 404

    data = request.get_json() or {}
    current = data.get("currentPassword")
    new = data.get("newPassword")
    if not current or not new:
        return {"error": "currentPassword and newPassword required"}, 400
    if not bcrypt.check_password_hash(user.password_hash, current):
        return {"error": "Current password incorrect"}, 403

    if bcrypt.check_password_hash(user.password_hash, new):
        return {"error": "New password must be different from your current password."}, 400

    user.password_hash = bcrypt.generate_password_hash(new).decode("utf-8")
    try:
        db.session.commit()
    except Exception as e:
        db.session.rollback()
        return {"error": "Failed to change password"}, 500

    return {"success": True}, 200
