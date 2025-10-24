"""
Application bootstrap helpers
 - Ensure default admin user exists based on environment variables
"""
from app.models.user import User, UserRole
from app.core.security import hash_password, verify_password
from app.core.config import settings


async def ensure_admin_user() -> None:
    """Create a default admin user if not present.

    Uses ADMIN_EMAIL, ADMIN_PASSWORD, and ADMIN_NAME from settings.
    If a user with ADMIN_EMAIL exists but not admin, it will be elevated to admin.
    """
    admin_email = (settings.ADMIN_EMAIL or "").strip().lower()
    admin_password = settings.ADMIN_PASSWORD
    admin_name = settings.ADMIN_NAME or "Administrator"

    if not admin_email or not admin_password:
        # Missing config; skip silently to avoid crashing app in dev
        print("ℹ️  Admin bootstrap skipped: ADMIN_EMAIL or ADMIN_PASSWORD not set")
        return

    # Find by email first
    existing = await User.find_one(User.email == admin_email)
    if existing:
        updated = False
        if existing.role != UserRole.ADMIN:
            existing.role = UserRole.ADMIN
            updated = True
        if not existing.is_active:
            existing.is_active = True
            updated = True
        if not existing.is_verified:
            existing.is_verified = True
            updated = True
        # Ensure password matches ADMIN_PASSWORD; if not, reset it
        try:
            if admin_password and not verify_password(admin_password, existing.hashed_password):
                existing.hashed_password = hash_password(admin_password)
                updated = True
        except Exception:
            # If verification fails for any reason, set to ADMIN_PASSWORD
            if admin_password:
                existing.hashed_password = hash_password(admin_password)
                updated = True
        if updated:
            await existing.save()
            print(f"✅ Admin user ensured (updated): {admin_email}")
        else:
            print(f"✅ Admin user ensured (exists): {admin_email}")
        return

    # Create new admin user
    hashed_pwd = hash_password(admin_password)
    admin_user = User(
        email=admin_email,
        hashed_password=hashed_pwd,
        full_name=admin_name,
        role=UserRole.ADMIN,
        phone=None,
        is_active=True,
        is_verified=True,
    )
    await admin_user.insert()
    print(f"✅ Admin user created: {admin_email}")
