"""
Send emails via SMTP. Uses Flask app config.
If MAIL_SERVER is not set, send_email no-ops and logs a warning.
On send failure, logs the exception and returns False (does not raise).
"""
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText


def send_email(to_address: str, subject: str, html_body: str, text_body: str = None):
    """
    Send an email. Uses current_app.config for SMTP settings.
    Returns True if sent, False if skipped or failed. Does not raise.
    """
    try:
        from flask import current_app
    except ImportError:
        print("[MAIL] Flask not available, skipping send")
        return False

    server = current_app.config.get("MAIL_SERVER")
    if not server:
        print("[MAIL] MAIL_SERVER not configured, skipping send")
        return False

    port = current_app.config.get("MAIL_PORT", 587)
    username = current_app.config.get("MAIL_USERNAME")
    password = current_app.config.get("MAIL_PASSWORD")
    use_tls = current_app.config.get("MAIL_USE_TLS", True)
    from_addr = current_app.config.get("MAIL_DEFAULT_SENDER", "noreply@ecoswap.com")

    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"] = from_addr
    msg["To"] = to_address

    if text_body:
        msg.attach(MIMEText(text_body, "plain"))
    msg.attach(MIMEText(html_body, "html"))

    # Envelope sender must match login for Gmail (use username, not display name)
    envelope_from = username if username else from_addr
    if " <" in envelope_from:
        envelope_from = envelope_from.split(" <", 1)[1].rstrip(">").strip()
    try:
        with smtplib.SMTP(server, port) as smtp:
            if use_tls:
                smtp.starttls()
            if username and password:
                smtp.login(username, password)
            smtp.sendmail(envelope_from, [to_address], msg.as_string())
        print(f"[MAIL] Sent to {to_address}: {subject}")
        return True
    except Exception as e:
        print(f"[MAIL] Failed to send to {to_address}: {e}")
        return False
