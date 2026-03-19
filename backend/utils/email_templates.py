"""
Rich HTML email templates with EcoSwap branding.
Renders transactional email content for pickup confirmations, status updates,
approval decisions, and certificate dispatch.
"""
from datetime import datetime

from flask import render_template


def _frontend_url():
    from flask import current_app
    return (current_app.config.get("FRONTEND_URL") or "http://localhost:8080").rstrip("/")


def _base_context():
    return {"year": datetime.utcnow().year}


def render_pickup_confirmation(user_name: str, pickup_id: str, address: str,
                               scheduled_date: str, time_slot: str = None,
                               total_weight: float = None) -> tuple[str, str, str]:
    """Returns (subject, html_body, text_body) for pickup confirmation."""
    track_url = f"{_frontend_url()}/user/track"
    ctx = _base_context()
    ctx.update({
        "user_name": user_name,
        "pickup_id": pickup_id,
        "address": address or "—",
        "scheduled_date": scheduled_date or "—",
        "time_slot": time_slot,
        "total_weight": f"{total_weight:.1f}" if total_weight is not None else None,
        "track_url": track_url,
    })
    html = render_template("emails/pickup_confirmation.html", **ctx)
    text = (
        f"Hi {user_name},\n\n"
        f"Your e-waste pickup request has been received (Request ID: {pickup_id}).\n"
        f"Address: {address}\nScheduled: {scheduled_date}\n"
        f"Track your pickup: {track_url}\n\n— EcoSwap"
    )
    return "Pickup Request Confirmed - EcoSwap", html, text


def render_pickup_status_update(
    user_name: str, pickup_id: str, status: str, address: str,
    scheduled_date: str = None, time_slot: str = None, status_message: str = None
) -> tuple[str, str, str]:
    """Returns (subject, html_body, text_body) for pickup status update."""
    status_colors = {
        "ASSIGNED": ("#ecfdf5", "#a7f3d0", "#047857"),
        "EN_ROUTE": ("#eff6ff", "#bfdbfe", "#1d4ed8"),
        "COLLECTED": ("#ecfdf5", "#a7f3d0", "#047857"),
        "HANDED_TO_RECYCLER": ("#f0fdf4", "#bbf7d0", "#15803d"),
        "PROCESSING": ("#eff6ff", "#bfdbfe", "#1d4ed8"),
        "RECYCLED": ("#ecfdf5", "#a7f3d0", "#047857"),
        "CANCELLED": ("#fef2f2", "#fecaca", "#b91c1c"),
    }
    colors = status_colors.get(status, ("#f8fafc", "#e2e8f0", "#475569"))
    status_display = status.replace("_", " ").title()
    track_url = f"{_frontend_url()}/user/track"

    ctx = _base_context()
    ctx.update({
        "user_name": user_name,
        "pickup_id": pickup_id,
        "status": status,
        "status_display": status_display,
        "status_bg_color": colors[0],
        "status_border_color": colors[1],
        "status_text_color": colors[2],
        "address": address or "—",
        "scheduled_date": scheduled_date,
        "time_slot": time_slot,
        "status_message": status_message,
        "track_url": track_url,
    })
    html = render_template("emails/pickup_status_update.html", **ctx)
    text = (
        f"Hi {user_name},\n\n"
        f"Pickup {pickup_id} status: {status_display}\n"
        f"{status_message or ''}\n"
        f"Track: {track_url}\n\n— EcoSwap"
    )
    return f"Pickup Status: {status_display} - EcoSwap", html, text


def render_approval_decision(
    user_name: str, approved: bool, role_label: str, login_url: str
) -> tuple[str, str, str]:
    """Returns (subject, html_body, text_body) for approval/rejection."""
    subject = (
        f"Your EcoSwap {role_label} account has been approved"
        if approved
        else f"Your EcoSwap {role_label} application update"
    )
    ctx = _base_context()
    ctx.update({
        "user_name": user_name,
        "approved": approved,
        "role_label": role_label,
        "login_url": login_url,
        "subject_line": subject,
    })
    html = render_template("emails/approval_decision.html", **ctx)
    if approved:
        text = (
            f"Hi {user_name},\n\n"
            f"Your EcoSwap {role_label} account has been approved. "
            f"You can now log in and start using EcoSwap.\n{login_url}\n\n— EcoSwap"
        )
    else:
        text = (
            f"Hi {user_name},\n\n"
            f"Your EcoSwap {role_label} application was not approved at this time. "
            f"Please contact support if you have questions.\n\n— EcoSwap"
        )
    return subject, html, text


def render_certificate_dispatch(
    user_name: str, pickup_id: str, certificate_id: str,
    total_weight: float, co2_saved: float
) -> tuple[str, str, str]:
    """Returns (subject, html_body, text_body) for certificate dispatch."""
    cert_url = f"{_frontend_url()}/user/certificates"
    ctx = _base_context()
    ctx.update({
        "user_name": user_name,
        "pickup_id": pickup_id,
        "certificate_id": certificate_id,
        "total_weight": f"{total_weight:.1f}",
        "co2_saved": f"{co2_saved:.1f}",
        "certificates_url": cert_url,
    })
    html = render_template("emails/certificate_dispatch.html", **ctx)
    text = (
        f"Hi {user_name},\n\n"
        f"Your recycling certificate has been issued for pickup {pickup_id}.\n"
        f"Total weight: {total_weight:.1f} kg, CO2 saved: ~{co2_saved:.1f} kg\n"
        f"View certificates: {cert_url}\n\n— EcoSwap"
    )
    return "Your Recycling Certificate - EcoSwap", html, text


def render_password_reset(reset_url: str) -> tuple[str, str, str]:
    """Returns (subject, html_body, text_body) for password reset."""
    ctx = _base_context()
    ctx.update({"reset_url": reset_url})
    html = render_template("emails/password_reset.html", **ctx)
    text = (
        "You requested a password reset for EcoSwap.\n"
        f"Reset your password: {reset_url}\n"
        "This link expires in 1 hour.\n\n— EcoSwap"
    )
    return "Reset Your Password - EcoSwap", html, text


def render_welcome(user_name: str, role_label: str, pending_approval: bool) -> tuple[str, str, str]:
    """Returns (subject, html_body, text_body) for welcome email."""
    login_url = _frontend_url() + "/login"
    ctx = _base_context()
    ctx.update({
        "user_name": user_name or "there",
        "role_label": role_label,
        "pending_approval": pending_approval,
        "login_url": login_url,
    })
    html = render_template("emails/welcome.html", **ctx)
    text = (
        f"Hi {user_name},\n\n"
        f"Welcome to EcoSwap! Your account has been created as a {role_label}."
    )
    if pending_approval:
        text += "\n\nYour account is pending admin approval. You will receive an email when approved."
    text += f"\n\nLog in: {login_url}\n\n— EcoSwap"
    return "Welcome to EcoSwap", html, text
