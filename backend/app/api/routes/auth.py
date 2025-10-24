"""
Authentication Routes
User registration, login, and token management
"""
from fastapi import APIRouter, HTTPException, status, Depends
from datetime import timedelta
from typing import Dict

from app.schemas.auth import UserRegister, UserLogin, Token, UserResponse, PasswordChange, OrphanageFullRegister
from app.models.user import User, UserRole
from app.core.security import hash_password, verify_password, create_access_token, get_current_user_token
from app.core.config import settings
from app.utils.email import send_welcome_email


router = APIRouter()


@router.post("/register", response_model=Token, status_code=status.HTTP_201_CREATED)
async def register(user_data: UserRegister):
    """
    Register a new user
    
    - **email**: Valid email address (must be unique)
    - **password**: Strong password (min 8 chars, uppercase, digit)
    - **full_name**: User's full name
    - **role**: User role (orphanage, donor, admin)
    - **phone**: Optional phone number
    """
    # Check if user already exists
    existing_user = await User.find_one(User.email == user_data.email)
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Create new user
    hashed_pwd = hash_password(user_data.password)
    new_user = User(
        email=user_data.email,
        hashed_password=hashed_pwd,
        full_name=user_data.full_name,
        role=user_data.role,
        phone=user_data.phone,
        is_active=True,
        is_verified=False
    )
    
    await new_user.insert()
    
    # Send welcome email (non-blocking)
    try:
        await send_welcome_email(new_user.email, new_user.full_name, new_user.role.value)
    except Exception as e:
        print(f"Warning: Failed to send welcome email: {str(e)}")
    
    # Create access token
    access_token = create_access_token(
        data={
            "sub": str(new_user.id),
            "email": new_user.email,
            "role": new_user.role.value
        }
    )
    
    # Prepare response
    user_response = UserResponse(
        id=str(new_user.id),
        email=new_user.email,
        full_name=new_user.full_name,
        role=new_user.role,
        phone=new_user.phone,
        is_active=new_user.is_active,
        is_verified=new_user.is_verified,
        profile_image=new_user.profile_image,
        created_at=new_user.created_at.isoformat()
    )
    
    return Token(access_token=access_token, user=user_response)


@router.post("/register-orphanage", response_model=Token, status_code=status.HTTP_201_CREATED)
async def register_orphanage(full: OrphanageFullRegister):
    """
    Atomically register an orphanage user and their orphanage profile.
    - Validates email uniqueness and orphanage registration number.
    - Creates user with role=orphanage, then orphanage document.
    - Rolls back user creation if orphanage creation fails.
    """
    # 1) Email must be unique
    existing_user = await User.find_one(User.email == full.email)
    if existing_user:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email already registered")

    # 2) Orphanage registration number must be unique
    from app.models.orphanage import Orphanage, OrphanageStatus
    existing_reg = await Orphanage.find_one(Orphanage.registration_number == full.orphanage.registration_number)
    if existing_reg:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Registration number already exists")

    # 3) Create user
    hashed_pwd = hash_password(full.password)
    user = User(
        email=full.email,
        hashed_password=hashed_pwd,
        full_name=full.full_name,
        role=UserRole.ORPHANAGE,
        phone=full.phone,
        is_active=True,
        is_verified=False,
    )
    await user.insert()

    try:
        # 4) Create orphanage linked to user
        odata = full.orphanage.dict()
        orphanage = Orphanage(
            **odata,
            user=user,
            status=OrphanageStatus.PENDING,
        )
        await orphanage.insert()
    except Exception as e:
        # Rollback user if orphanage creation fails
        try:
            await user.delete()
        except Exception:
            pass
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Failed to create orphanage: {str(e)}")

    # Send welcome email (non-blocking)
    try:
        await send_welcome_email(user.email, user.full_name, user.role.value)
    except Exception as e:
        print(f"Warning: Failed to send welcome email: {str(e)}")

    # Issue token
    access_token = create_access_token(
        data={
            "sub": str(user.id),
            "email": user.email,
            "role": user.role.value,
        }
    )

    user_response = UserResponse(
        id=str(user.id),
        email=user.email,
        full_name=user.full_name,
        role=user.role,
        phone=user.phone,
        is_active=user.is_active,
        is_verified=user.is_verified,
        profile_image=user.profile_image,
        created_at=user.created_at.isoformat(),
    )

    return Token(access_token=access_token, user=user_response)


@router.post("/login", response_model=Token)
async def login(credentials: UserLogin):
    """
    User login with email and password
    
    Returns JWT access token and user information
    """
    # Find user by email
    user = await User.find_one(User.email == credentials.email)
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )
    
    # Verify password
    if not verify_password(credentials.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )
    
    # Check if user is active
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is inactive. Please contact support."
        )
    
    # Update last login
    from datetime import datetime
    user.last_login = datetime.utcnow()
    await user.save()
    
    # Create access token
    access_token = create_access_token(
        data={
            "sub": str(user.id),
            "email": user.email,
            "role": user.role.value
        }
    )
    
    # Prepare response
    user_response = UserResponse(
        id=str(user.id),
        email=user.email,
        full_name=user.full_name,
        role=user.role,
        phone=user.phone,
        is_active=user.is_active,
        is_verified=user.is_verified,
        profile_image=user.profile_image,
        created_at=user.created_at.isoformat()
    )
    
    return Token(access_token=access_token, user=user_response)


@router.get("/me", response_model=UserResponse)
async def get_current_user(token_data: Dict = Depends(get_current_user_token)):
    """
    Get current authenticated user information
    
    Requires valid JWT token in Authorization header
    """
    user_id = token_data.get("sub")
    user = await User.get(user_id)
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    return UserResponse(
        id=str(user.id),
        email=user.email,
        full_name=user.full_name,
        role=user.role,
        phone=user.phone,
        is_active=user.is_active,
        is_verified=user.is_verified,
        profile_image=user.profile_image,
        created_at=user.created_at.isoformat()
    )


@router.post("/change-password")
async def change_password(
    password_data: PasswordChange,
    token_data: Dict = Depends(get_current_user_token)
):
    """
    Change user password
    
    Requires current password and new password
    """
    user_id = token_data.get("sub")
    user = await User.get(user_id)
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Verify old password
    if not verify_password(password_data.old_password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Incorrect current password"
        )
    
    # Update password
    user.hashed_password = hash_password(password_data.new_password)
    await user.save()
    
    return {"message": "Password changed successfully"}


@router.post("/refresh")
async def refresh_token(token_data: Dict = Depends(get_current_user_token)):
    """
    Refresh JWT access token
    
    Returns a new access token
    """
    # Create new access token
    access_token = create_access_token(
        data={
            "sub": token_data.get("sub"),
            "email": token_data.get("email"),
            "role": token_data.get("role")
        }
    )
    
    return {"access_token": access_token, "token_type": "bearer"}
