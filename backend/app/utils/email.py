"""
Email Utilities
Send emails for notifications and confirmations
"""
import aiosmtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from jinja2 import Template
from typing import List, Optional

from app.core.config import settings


async def send_email(
    to_email: str,
    subject: str,
    html_content: str,
    text_content: Optional[str] = None
):
    """
    Send an email using SMTP
    
    Args:
        to_email: Recipient email address
        subject: Email subject
        html_content: HTML email body
        text_content: Plain text email body (optional)
    """
    message = MIMEMultipart("alternative")
    message["From"] = f"{settings.SMTP_FROM_NAME} <{settings.SMTP_FROM_EMAIL}>"
    message["To"] = to_email
    message["Subject"] = subject
    
    # Add plain text version if provided
    if text_content:
        part1 = MIMEText(text_content, "plain")
        message.attach(part1)
    
    # Add HTML version
    part2 = MIMEText(html_content, "html")
    message.attach(part2)
    
    try:
        await aiosmtplib.send(
            message,
            hostname=settings.SMTP_HOST,
            port=settings.SMTP_PORT,
            username=settings.SMTP_USER,
            password=settings.SMTP_PASSWORD,
            use_tls=True
        )
        print(f"✅ Email sent to {to_email}")
    except Exception as e:
        print(f"❌ Failed to send email to {to_email}: {str(e)}")
        raise


async def send_welcome_email(user_email: str, user_name: str, role: str):
    """Send welcome email to new user"""
    html_template = """
    <html>
        <body style="font-family: Arial, sans-serif;">
            <h2>Welcome to Heart-Chain! 🎉</h2>
            <p>Hello <strong>{{ name }}</strong>,</p>
            <p>Thank you for joining Heart-Chain as a <strong>{{ role }}</strong>.</p>
            <p>Together, we can make a difference in the lives of children in need.</p>
            <br>
            <p>Best regards,<br>The Heart-Chain Team</p>
        </body>
    </html>
    """
    
    template = Template(html_template)
    html_content = template.render(name=user_name, role=role.title())
    
    await send_email(
        to_email=user_email,
        subject="Welcome to Heart-Chain!",
        html_content=html_content
    )


async def send_orphanage_verification_email(
    email: str,
    orphanage_name: str,
    status: str,
    message: Optional[str] = None
):
    """Send email about orphanage verification status"""
    html_template = """
    <html>
        <body style="font-family: Arial, sans-serif;">
            <h2>Orphanage Verification Update</h2>
            <p>Hello <strong>{{ name }}</strong>,</p>
            <p>Your orphanage verification status has been updated to: <strong>{{ status }}</strong></p>
            {% if message %}
            <p>Message from admin: {{ message }}</p>
            {% endif %}
            <br>
            <p>Best regards,<br>The Heart-Chain Team</p>
        </body>
    </html>
    """
    
    template = Template(html_template)
    html_content = template.render(name=orphanage_name, status=status, message=message)
    
    await send_email(
        to_email=email,
        subject=f"Orphanage Verification {status}",
        html_content=html_content
    )


async def send_donation_confirmation_email(
    donor_email: str,
    donor_name: str,
    campaign_title: str,
    amount: float,
    transaction_id: str
):
    """Send donation confirmation email"""
    html_template = """
    <html>
        <body style="font-family: Arial, sans-serif;">
            <h2>Thank You for Your Donation! ❤️</h2>
            <p>Hello <strong>{{ donor_name }}</strong>,</p>
            <p>Your donation of <strong>₹{{ amount }}</strong> to <strong>{{ campaign }}</strong> has been successfully processed.</p>
            <p>Transaction ID: {{ transaction_id }}</p>
            <p>You will receive updates on how your contribution is making an impact.</p>
            <br>
            <p>Thank you for making a difference!<br>The Heart-Chain Team</p>
        </body>
    </html>
    """
    
    template = Template(html_template)
    html_content = template.render(
        donor_name=donor_name,
        amount=amount,
        campaign=campaign_title,
        transaction_id=transaction_id
    )
    
    await send_email(
        to_email=donor_email,
        subject="Donation Confirmation - Heart-Chain",
        html_content=html_content
    )


async def send_fund_disbursement_email(
    orphanage_email: str,
    orphanage_name: str,
    campaign_title: str,
    amount: float
):
    """Send fund disbursement notification"""
    html_template = """
    <html>
        <body style="font-family: Arial, sans-serif;">
            <h2>Funds Disbursed! 💰</h2>
            <p>Hello <strong>{{ orphanage_name }}</strong>,</p>
            <p>Congratulations! Funds of <strong>₹{{ amount }}</strong> for your campaign <strong>{{ campaign }}</strong> have been disbursed.</p>
            <p>Please upload utilization reports to maintain transparency.</p>
            <br>
            <p>Best regards,<br>The Heart-Chain Team</p>
        </body>
    </html>
    """
    
    template = Template(html_template)
    html_content = template.render(
        orphanage_name=orphanage_name,
        amount=amount,
        campaign=campaign_title
    )
    
    await send_email(
        to_email=orphanage_email,
        subject="Fund Disbursement Notification",
        html_content=html_content
    )
