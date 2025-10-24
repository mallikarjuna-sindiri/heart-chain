# 🏗️ Heart-Chain Project Architecture

## System Overview

```
┌─────────────────────────────────────────────────────────────┐
│                        HEART-CHAIN                          │
│              Transparent Donation Platform                  │
└─────────────────────────────────────────────────────────────┘

┌──────────────┐         ┌──────────────┐         ┌──────────────┐
│   DONORS     │         │  ORPHANAGES  │         │    ADMINS    │
│              │         │              │         │ (Government) │
│ • Browse     │         │ • Register   │         │ • Verify     │
│ • Donate     │         │ • Campaigns  │         │ • Approve    │
│ • Track      │         │ • Reports    │         │ • Disburse   │
└──────┬───────┘         └──────┬───────┘         └──────┬───────┘
       │                        │                        │
       └────────────────────────┼────────────────────────┘
                                │
                ┌───────────────▼──────────────┐
                │     REACT FRONTEND           │
                │   (Vite + Tailwind CSS)      │
                │                              │
                │ • Authentication UI          │
                │ • Role-based Dashboards      │
                │ • Campaign Browser           │
                │ • Razorpay Integration       │
                └───────────────┬──────────────┘
                                │
                        REST API (JSON)
                                │
                ┌───────────────▼──────────────┐
                │    FASTAPI BACKEND           │
                │    (Python 3.11+)            │
                │                              │
                │ • JWT Authentication         │
                │ • Role-based Authorization   │
                │ • Business Logic             │
                │ • Payment Processing         │
                │ • Email Notifications        │
                └───────────────┬──────────────┘
                                │
                ┌───────────────▼──────────────┐
                │    MONGODB DATABASE          │
                │    (Beanie ODM)              │
                │                              │
                │ Collections:                 │
                │ • users                      │
                │ • orphanages                 │
                │ • campaigns                  │
                │ • donations                  │
                │ • reports                    │
                │ • transactions               │
                └──────────────────────────────┘

External Services:
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│  RAZORPAY   │    │    SMTP     │    │   Storage   │
│  (Payments) │    │   (Email)   │    │   (Future)  │
└─────────────┘    └─────────────┘    └─────────────┘
```

---

## Data Flow Diagrams

### 1. User Registration Flow
```
User → Frontend → POST /api/auth/register
                     ↓
                  Validate Data
                     ↓
                  Hash Password
                     ↓
                  Save to DB
                     ↓
                  Generate JWT
                     ↓
                  Send Welcome Email
                     ↓
                  Return Token + User
```

### 2. Donation Flow
```
Donor → Browse Campaigns → Select Campaign
          ↓
    Click "Donate" → Enter Amount
          ↓
    Create Razorpay Order (Backend)
          ↓
    Razorpay Checkout Modal
          ↓
    Complete Payment
          ↓
    Verify Signature (Backend)
          ↓
    Update Campaign Raised Amount
          ↓
    Create Transaction Record
          ↓
    Send Confirmation Email
          ↓
    Show Success Message
```

### 3. Campaign Approval Flow
```
Orphanage → Create Campaign
             ↓
       Status: pending_approval
             ↓
    Admin Reviews Campaign
             ↓
       ┌─────┴─────┐
    Approve    Reject
       │           │
       ↓           ↓
   Active      Rejected
       │           │
       ↓           ↓
  Send Email   Send Email
```

### 4. Fund Disbursement Flow
```
Campaign Raised Funds
       ↓
Admin Reviews
       ↓
Initiate Disbursement
       ↓
Create Transaction (Type: disbursement)
       ↓
Update Campaign disbursed_amount
       ↓
Send Notification to Orphanage
       ↓
Orphanage Submits Report
       ↓
Admin Verifies Report
       ↓
Donors View Report
```

---

## Database Schema

### Users Collection
```javascript
{
  _id: ObjectId,
  email: String (unique),
  hashed_password: String,
  full_name: String,
  role: Enum["donor", "orphanage", "admin"],
  phone: String,
  is_active: Boolean,
  is_verified: Boolean,
  profile_image: String,
  created_at: DateTime,
  updated_at: DateTime,
  last_login: DateTime
}
```

### Orphanages Collection
```javascript
{
  _id: ObjectId,
  name: String,
  registration_number: String (unique),
  description: String,
  email: String,
  phone: String,
  address: String,
  city: String,
  state: String,
  pincode: String,
  status: Enum["pending", "verified", "rejected", "suspended"],
  capacity: Integer,
  current_occupancy: Integer,
  verification_documents: [String],
  logo: String,
  images: [String],
  user: Link<User>,
  verified_by: Link<User>,
  verified_at: DateTime,
  created_at: DateTime,
  updated_at: DateTime
}
```

### Campaigns Collection
```javascript
{
  _id: ObjectId,
  title: String,
  description: String,
  category: Enum["education", "food", "medical", "infrastructure", "clothing", "emergency", "other"],
  target_amount: Float,
  raised_amount: Float,
  disbursed_amount: Float,
  status: Enum["draft", "pending_approval", "approved", "active", "completed", "rejected", "closed"],
  orphanage: Link<Orphanage>,
  images: [String],
  documents: [String],
  total_donors: Integer,
  is_featured: Boolean,
  start_date: DateTime,
  end_date: DateTime,
  created_at: DateTime,
  updated_at: DateTime
}
```

### Donations Collection
```javascript
{
  _id: ObjectId,
  donor: Link<User>,
  donor_name: String,
  donor_email: String,
  donor_phone: String,
  campaign: Link<Campaign>,
  amount: Float,
  currency: String,
  payment_method: String,
  razorpay_order_id: String,
  razorpay_payment_id: String,
  razorpay_signature: String,
  status: Enum["initiated", "pending", "completed", "failed", "refunded"],
  is_anonymous: Boolean,
  message: String,
  transaction_date: DateTime,
  receipt_number: String,
  created_at: DateTime,
  updated_at: DateTime
}
```

### Reports Collection
```javascript
{
  _id: ObjectId,
  title: String,
  description: String,
  report_type: Enum["utilization", "progress", "completion", "quarterly"],
  campaign: Link<Campaign>,
  orphanage: Link<Orphanage>,
  amount_utilized: Float,
  beneficiaries_count: Integer,
  activities_conducted: [String],
  images: [String],
  receipts: [String],
  documents: [String],
  status: Enum["submitted", "under_review", "verified", "rejected", "revision_required"],
  verified_by: String,
  verified_at: DateTime,
  verification_notes: String,
  reporting_period_start: DateTime,
  reporting_period_end: DateTime,
  submitted_at: DateTime,
  created_at: DateTime,
  updated_at: DateTime
}
```

### Transactions Collection
```javascript
{
  _id: ObjectId,
  transaction_id: String (unique),
  transaction_type: Enum["donation", "disbursement", "refund"],
  amount: Float,
  currency: String,
  status: Enum["pending", "completed", "failed", "reversed"],
  campaign: Link<Campaign>,
  orphanage: Link<Orphanage>,
  donor: Link<User>,
  donation: Link<Donation>,
  payment_gateway: String,
  gateway_transaction_id: String,
  disbursed_by: String,
  disbursement_method: String,
  description: String,
  transaction_date: DateTime,
  created_at: DateTime,
  updated_at: DateTime
}
```

---

## API Endpoint Structure

### Authentication (`/api/auth`)
- POST `/register` - Register new user
- POST `/login` - Login user
- GET `/me` - Get current user
- POST `/change-password` - Change password
- POST `/refresh` - Refresh token

### Users (`/api/users`)
- GET `/profile` - Get user profile
- PUT `/profile` - Update profile
- POST `/profile/image` - Upload profile image
- DELETE `/profile` - Delete account

### Orphanages (`/api/orphanages`)
- POST `/` - Register orphanage
- GET `/` - List orphanages
- GET `/my` - Get my orphanage
- GET `/{id}` - Get orphanage by ID
- PUT `/{id}` - Update orphanage
- DELETE `/{id}` - Delete orphanage

### Campaigns (`/api/campaigns`)
- POST `/` - Create campaign
- GET `/` - List campaigns
- GET `/{id}` - Get campaign by ID
- PUT `/{id}` - Update campaign
- DELETE `/{id}` - Delete campaign

### Donations (`/api/donations`)
- POST `/create-order` - Create Razorpay order
- POST `/verify-payment` - Verify payment
- GET `/my-donations` - Get my donations
- GET `/{id}` - Get donation by ID
- POST `/webhook` - Razorpay webhook

### Admin (`/api/admin`)
- POST `/orphanages/{id}/verify` - Verify orphanage
- POST `/campaigns/{id}/approve` - Approve campaign
- POST `/campaigns/{id}/disburse` - Disburse funds
- GET `/pending-verifications` - Get pending items
- GET `/dashboard` - Admin dashboard stats

### Reports (`/api/reports`)
- POST `/` - Submit report
- GET `/` - List reports
- GET `/campaign/{id}` - Get campaign reports
- GET `/{id}` - Get report by ID
- POST `/{id}/verify` - Verify report

---

## Technology Stack Details

### Backend Technologies
```
Python 3.11+
├── FastAPI 0.109.0          # Web framework
├── Uvicorn 0.27.0           # ASGI server
├── Motor 3.3.2              # Async MongoDB driver
├── Beanie 1.24.0            # ODM
├── Pydantic 2.5.3           # Data validation
├── python-jose 3.3.0        # JWT
├── passlib 1.7.4            # Password hashing
├── razorpay 1.4.1           # Payment gateway
├── aiosmtplib 3.0.1         # Async email
└── jinja2 3.1.3             # Email templates
```

### Frontend Technologies
```
React 18.2.0
├── React Router 6.20.1      # Routing
├── Vite 5.0.8               # Build tool
├── Axios 1.6.2              # HTTP client
├── Zustand 4.4.7            # State management
├── React Hook Form 7.49.2   # Form handling
├── React Hot Toast 2.4.1    # Notifications
├── Tailwind CSS 3.4.0       # Styling
├── Lucide React 0.303.0     # Icons
└── clsx 2.0.0               # Class utilities
```

### Infrastructure
```
Docker 24+
├── MongoDB 7.0              # Database
├── Node 20 Alpine           # Frontend container
└── Python 3.11 Slim         # Backend container
```

---

## Security Architecture

### Authentication & Authorization
```
JWT Token Flow:
1. User login with credentials
2. Server validates and generates JWT
3. Token stored in localStorage
4. Token sent in Authorization header
5. Server validates token on each request
6. Extracts user role for authorization
```

### Password Security
```
1. Password requirements enforced
2. Bcrypt hashing with salt
3. Never stored in plain text
4. Password change requires current password
```

### API Security
```
1. CORS configuration
2. JWT validation on protected routes
3. Role-based access control
4. Input validation with Pydantic
5. SQL injection prevention (MongoDB)
6. XSS protection
```

### Payment Security
```
1. Razorpay PCI compliant
2. Signature verification
3. Webhook validation
4. No card data stored
5. Secure token exchange
```

---

## Deployment Architecture

### Development
```
┌─────────────────────────────────────┐
│         Docker Compose              │
├─────────────────────────────────────┤
│ Frontend (Vite Dev Server) :5173    │
│ Backend (Uvicorn with reload) :8000 │
│ MongoDB :27017                       │
└─────────────────────────────────────┘
```

### Production (Recommended)
```
                    ┌──────────────┐
                    │  CloudFlare  │
                    │     CDN      │
                    └──────┬───────┘
                           │
                    ┌──────▼───────┐
                    │   Nginx      │
                    │ Load Balancer│
                    └──┬───────┬───┘
                       │       │
            ┌──────────▼─┐   ┌─▼──────────┐
            │  Frontend  │   │  Backend   │
            │  (Vercel)  │   │  (Render)  │
            └────────────┘   └─────┬──────┘
                                   │
                            ┌──────▼──────┐
                            │   MongoDB   │
                            │   Atlas     │
                            └─────────────┘

External Services:
├── Razorpay (Payments)
├── SendGrid (Email)
└── AWS S3 (File Storage)
```

---

## Performance Considerations

### Backend Optimization
- Async operations with asyncio
- Database connection pooling
- Index optimization for queries
- Caching frequently accessed data
- Lazy loading of relationships

### Frontend Optimization
- Code splitting by route
- Lazy loading components
- Image optimization
- Bundle size monitoring
- Memoization of expensive computations

---

**This architecture provides a scalable, secure, and maintainable foundation for Heart-Chain.**
