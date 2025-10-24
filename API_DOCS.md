# Heart-Chain API Reference

## Base URL
```
http://localhost:8000/api
```

## Authentication
All protected endpoints require JWT token in Authorization header:
```
Authorization: Bearer <token>
```

---

## Authentication Endpoints

### Register User
```http
POST /auth/register
```

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "Password123",
  "full_name": "John Doe",
  "role": "donor",
  "phone": "+919876543210"
}
```

**Response:**
```json
{
  "access_token": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "token_type": "bearer",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "email": "user@example.com",
    "full_name": "John Doe",
    "role": "donor",
    "is_active": true,
    "is_verified": false,
    "created_at": "2024-01-01T00:00:00"
  }
}
```

### Login
```http
POST /auth/login
```

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "Password123"
}
```

**Response:** Same as register

### Get Current User
```http
GET /auth/me
```

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "id": "507f1f77bcf86cd799439011",
  "email": "user@example.com",
  "full_name": "John Doe",
  "role": "donor",
  "phone": "+919876543210",
  "is_active": true,
  "is_verified": false,
  "created_at": "2024-01-01T00:00:00"
}
```

---

## Orphanage Endpoints

### Register Orphanage
```http
POST /orphanages
```

**Headers:** `Authorization: Bearer <token>` (orphanage role)

**Request Body:**
```json
{
  "name": "Hope Children's Home",
  "registration_number": "ORG123456",
  "description": "Providing care and education to underprivileged children",
  "email": "contact@hopehome.org",
  "phone": "+919876543210",
  "address": "123 Main Street",
  "city": "Mumbai",
  "state": "Maharashtra",
  "pincode": "400001",
  "capacity": 50,
  "current_occupancy": 35,
  "established_year": 2010
}
```

**Response:**
```json
{
  "id": "507f1f77bcf86cd799439012",
  "name": "Hope Children's Home",
  "status": "pending",
  "created_at": "2024-01-01T00:00:00"
}
```

### List Orphanages
```http
GET /orphanages?status=verified&city=Mumbai&limit=20&skip=0
```

**Query Parameters:**
- `status`: Filter by verification status (pending, verified, rejected)
- `city`: Filter by city
- `state`: Filter by state
- `limit`: Maximum results (default 20, max 100)
- `skip`: Pagination offset (default 0)

**Response:**
```json
[
  {
    "id": "507f1f77bcf86cd799439012",
    "name": "Hope Children's Home",
    "city": "Mumbai",
    "state": "Maharashtra",
    "status": "verified",
    "capacity": 50,
    "current_occupancy": 35
  }
]
```

---

## Campaign Endpoints

### Create Campaign
```http
POST /campaigns
```

**Headers:** `Authorization: Bearer <token>` (orphanage role)

**Request Body:**
```json
{
  "title": "Educational Materials for 50 Children",
  "description": "Help us provide books, uniforms, and supplies",
  "category": "education",
  "target_amount": 100000.0,
  "end_date": "2024-12-31T23:59:59"
}
```

**Response:**
```json
{
  "id": "507f1f77bcf86cd799439013",
  "message": "Campaign created successfully"
}
```

### List Campaigns
```http
GET /campaigns?status=active&category=education&limit=20
```

**Query Parameters:**
- `status`: Filter by status (active, completed, pending_approval)
- `category`: Filter by category (education, food, medical, etc.)
- `limit`: Maximum results
- `skip`: Pagination offset

### Get Campaign Details
```http
GET /campaigns/{campaign_id}
```

**Response:**
```json
{
  "id": "507f1f77bcf86cd799439013",
  "title": "Educational Materials for 50 Children",
  "description": "Help us provide books, uniforms, and supplies",
  "category": "education",
  "target_amount": 100000.0,
  "raised_amount": 45000.0,
  "disbursed_amount": 0.0,
  "status": "active",
  "orphanage": {
    "id": "507f1f77bcf86cd799439012",
    "name": "Hope Children's Home",
    "city": "Mumbai"
  },
  "total_donors": 15,
  "created_at": "2024-01-01T00:00:00"
}
```

---

## Donation Endpoints

### Create Donation Order
```http
POST /donations/create-order
```

**Headers:** `Authorization: Bearer <token>` (donor role)

**Request Body:**
```json
{
  "campaign_id": "507f1f77bcf86cd799439013",
  "amount": 5000.0,
  "is_anonymous": false,
  "message": "Happy to help!"
}
```

**Response:**
```json
{
  "order_id": "order_MNxlPZq7tZ2Ogh",
  "amount": 500000,
  "currency": "INR",
  "donation_id": "507f1f77bcf86cd799439014"
}
```

### Verify Payment
```http
POST /donations/verify-payment
```

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "donation_id": "507f1f77bcf86cd799439014",
  "razorpay_order_id": "order_MNxlPZq7tZ2Ogh",
  "razorpay_payment_id": "pay_MNxlPZq7tZ2Ogh",
  "razorpay_signature": "abc123..."
}
```

**Response:**
```json
{
  "message": "Donation successful",
  "transaction_id": "TXN123456789",
  "donation_id": "507f1f77bcf86cd799439014"
}
```

### Get My Donations
```http
GET /donations/my-donations
```

**Headers:** `Authorization: Bearer <token>` (donor role)

**Response:**
```json
[
  {
    "id": "507f1f77bcf86cd799439014",
    "amount": 5000.0,
    "status": "completed",
    "campaign_title": "Educational Materials for 50 Children",
    "transaction_date": "2024-01-01T10:30:00",
    "created_at": "2024-01-01T10:25:00"
  }
]
```

---

## Admin Endpoints

### Verify Orphanage
```http
POST /admin/orphanages/{orphanage_id}/verify
```

**Headers:** `Authorization: Bearer <token>` (admin role)

**Request Body:**
```json
{
  "status": "verified",
  "rejection_reason": null
}
```

**Response:**
```json
{
  "message": "Orphanage verified successfully"
}
```

### Approve Campaign
```http
POST /admin/campaigns/{campaign_id}/approve
```

**Headers:** `Authorization: Bearer <token>` (admin role)

**Request Body:**
```json
{
  "approved": true,
  "rejection_reason": null
}
```

**Response:**
```json
{
  "message": "Campaign approved successfully"
}
```

### Disburse Funds
```http
POST /admin/campaigns/{campaign_id}/disburse
```

**Headers:** `Authorization: Bearer <token>` (admin role)

**Request Body:**
```json
{
  "amount": 45000.0,
  "disbursement_method": "bank_transfer",
  "disbursement_reference": "REF123456"
}
```

**Response:**
```json
{
  "message": "Funds disbursed successfully",
  "transaction_id": "TXN987654321"
}
```

### Admin Dashboard
```http
GET /admin/dashboard
```

**Headers:** `Authorization: Bearer <token>` (admin role)

**Response:**
```json
{
  "total_orphanages": 45,
  "verified_orphanages": 38,
  "total_campaigns": 120,
  "active_campaigns": 65,
  "total_donations": 2500000.0,
  "total_donors": 850
}
```

---

## Report Endpoints

### Submit Report
```http
POST /reports
```

**Headers:** `Authorization: Bearer <token>` (orphanage role)

**Request Body:**
```json
{
  "campaign_id": "507f1f77bcf86cd799439013",
  "title": "Q1 2024 Utilization Report",
  "description": "Report on usage of funds for educational materials",
  "report_type": "utilization",
  "amount_utilized": 45000.0,
  "beneficiaries_count": 50,
  "activities_conducted": [
    "Purchased textbooks",
    "Distributed uniforms"
  ],
  "reporting_period_start": "2024-01-01T00:00:00",
  "reporting_period_end": "2024-03-31T23:59:59"
}
```

**Response:**
```json
{
  "id": "507f1f77bcf86cd799439015",
  "message": "Report submitted successfully"
}
```

### Get Campaign Reports
```http
GET /reports/campaign/{campaign_id}
```

**Response:**
```json
[
  {
    "id": "507f1f77bcf86cd799439015",
    "title": "Q1 2024 Utilization Report",
    "report_type": "utilization",
    "amount_utilized": 45000.0,
    "beneficiaries_count": 50,
    "status": "verified",
    "submitted_at": "2024-04-01T00:00:00",
    "verified_at": "2024-04-05T00:00:00"
  }
]
```

### Verify Report (Admin)
```http
POST /reports/{report_id}/verify
```

**Headers:** `Authorization: Bearer <token>` (admin role)

**Request Body:**
```json
{
  "status": "verified",
  "verification_notes": "All documentation verified",
  "rejection_reason": null
}
```

**Response:**
```json
{
  "message": "Report verified successfully"
}
```

---

## Status Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Internal Server Error

---

## Rate Limiting

No rate limiting currently implemented. Consider adding for production.

---

## Webhook Integration

### Razorpay Webhook
```http
POST /donations/webhook
```

**Headers:**
- `X-Razorpay-Signature`: Webhook signature

**Payload:** Razorpay event data

Configure webhook URL in Razorpay dashboard:
```
https://your-domain.com/api/donations/webhook
```

---

For more details, visit the interactive API documentation at:
**http://localhost:8000/docs**
