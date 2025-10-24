"""
Razorpay Payment Integration
Handle payment creation, verification, and webhooks
"""
import razorpay
import hmac
import hashlib
from typing import Dict, Any
from fastapi import HTTPException, status

from app.core.config import settings


# Initialize Razorpay client
razorpay_client = razorpay.Client(
    auth=(settings.RAZORPAY_KEY_ID, settings.RAZORPAY_KEY_SECRET)
)


def create_payment_order(amount: float, currency: str = "INR", notes: Dict[str, Any] = None) -> Dict:
    """
    Create a Razorpay payment order
    
    Args:
        amount: Amount in rupees (will be converted to paise)
        currency: Currency code (default: INR)
        notes: Additional information about the order
    
    Returns:
        Order details from Razorpay
    """
    try:
        # Convert amount to paise (smallest currency unit)
        amount_paise = int(amount * 100)
        
        order_data = {
            "amount": amount_paise,
            "currency": currency,
            "notes": notes or {}
        }
        
        order = razorpay_client.order.create(data=order_data)
        return order
    
    except Exception as e:
        print(f"❌ Failed to create Razorpay order: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create payment order"
        )


def verify_payment_signature(
    razorpay_order_id: str,
    razorpay_payment_id: str,
    razorpay_signature: str
) -> bool:
    """
    Verify Razorpay payment signature for security
    
    Args:
        razorpay_order_id: Order ID from Razorpay
        razorpay_payment_id: Payment ID from Razorpay
        razorpay_signature: Signature to verify
    
    Returns:
        True if signature is valid, False otherwise
    """
    try:
        # Create signature string
        sign_string = f"{razorpay_order_id}|{razorpay_payment_id}"
        
        # Generate expected signature
        expected_signature = hmac.new(
            settings.RAZORPAY_KEY_SECRET.encode(),
            sign_string.encode(),
            hashlib.sha256
        ).hexdigest()
        
        # Compare signatures
        return hmac.compare_digest(expected_signature, razorpay_signature)
    
    except Exception as e:
        print(f"❌ Payment signature verification failed: {str(e)}")
        return False


def verify_webhook_signature(payload: bytes, signature: str) -> bool:
    """
    Verify Razorpay webhook signature
    
    Args:
        payload: Raw webhook payload
        signature: X-Razorpay-Signature header value
    
    Returns:
        True if signature is valid, False otherwise
    """
    try:
        expected_signature = hmac.new(
            settings.RAZORPAY_WEBHOOK_SECRET.encode(),
            payload,
            hashlib.sha256
        ).hexdigest()
        
        return hmac.compare_digest(expected_signature, signature)
    
    except Exception as e:
        print(f"❌ Webhook signature verification failed: {str(e)}")
        return False


def get_payment_details(payment_id: str) -> Dict:
    """
    Fetch payment details from Razorpay
    
    Args:
        payment_id: Razorpay payment ID
    
    Returns:
        Payment details
    """
    try:
        payment = razorpay_client.payment.fetch(payment_id)
        return payment
    except Exception as e:
        print(f"❌ Failed to fetch payment details: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch payment details"
        )


def refund_payment(payment_id: str, amount: int = None) -> Dict:
    """
    Create a refund for a payment
    
    Args:
        payment_id: Razorpay payment ID
        amount: Amount to refund in paise (None for full refund)
    
    Returns:
        Refund details
    """
    try:
        refund_data = {}
        if amount:
            refund_data["amount"] = amount
        
        refund = razorpay_client.payment.refund(payment_id, refund_data)
        return refund
    except Exception as e:
        print(f"❌ Failed to create refund: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create refund"
        )
