# Heart-Chain 💖⛓️

**Transparent Donation and Orphanage Support Platform**

Heart-Chain is a full-stack web application that connects **orphanages**, **donors**, and **government administrators** to create a transparent ecosystem for charitable donations. Built with **FastAPI** (Python) for the backend and **React** (JavaScript) for the frontend.

---

## 🌟 Project Overview

Heart-Chain enables:
- **Orphanages** to register, create funding campaigns, and submit utilization reports
- **Donors** to browse campaigns, donate securely via Razorpay, and track impact
- **Admins** to verify orphanages, approve campaigns, disburse funds, and ensure transparency

### Key Features
✅ JWT-based authentication with role-based access control  
✅ Orphanage registration and government verification  
✅ Campaign creation and management  
✅ Secure donations via Razorpay payment gateway  
✅ Fund disbursement tracking  
✅ Utilization report submission and verification  
✅ Role-specific dashboards (Donor, Orphanage, Admin)  
✅ Transparent transaction logging  
✅ Email notifications for key events  

---

## 🛠️ Tech Stack

### Backend
- **FastAPI** - Modern Python web framework
- **MongoDB** - NoSQL database
- **Beanie ODM** - Async MongoDB object-document mapper
- **JWT** - JSON Web Tokens for authentication
- **Razorpay SDK** - Payment gateway integration
- **Pydantic** - Data validation
- **Uvicorn** - ASGI server

### Frontend
- **React 18** - UI library
- **Vite** - Build tool
- **React Router** - Client-side routing
- **Zustand** - State management
- **Axios** - HTTP client
- **Tailwind CSS** - Utility-first CSS framework
- **Lucide React** - Icon library
- **React Hot Toast** - Notifications

### DevOps
- **Docker** - Containerization
- **Docker Compose** - Multi-container orchestration
- **MongoDB** - Database container

---

## 📁 Project Structure

```
CN/
├── backend/                    # FastAPI Backend
│   ├── app/
│   │   ├── api/
│   │   │   └── routes/        # API endpoints
│   │   │       ├── auth.py
│   │   │       ├── users.py
│   │   │       ├── orphanages.py
│   │   │       ├── campaigns.py
│   │   │       ├── donations.py
│   │   │       ├── admin.py
│   │   │       └── reports.py
│   │   ├── core/              # Core configuration
│   │   │   ├── config.py
│   │   │   ├── database.py
│   │   │   └── security.py
│   │   ├── models/            # Database models
│   │   │   ├── user.py
│   │   │   ├── orphanage.py
│   │   │   ├── campaign.py
│   │   │   ├── donation.py
│   │   │   ├── report.py
│   │   │   └── transaction.py
│   │   ├── schemas/           # Pydantic schemas
│   │   │   ├── auth.py
│   │   │   └── orphanage.py
│   │   └── utils/             # Utility functions
│   │       ├── email.py
│   │       └── razorpay.py
│   ├── main.py               # FastAPI app entry point
│   ├── requirements.txt      # Python dependencies
│   ├── .env.example          # Environment variables template
│   └── Dockerfile
│
├── frontend/                  # React Frontend
│   ├── src/
│   │   ├── components/       # Reusable components
│   │   │   ├── Layout.jsx
│   │   │   ├── Navbar.jsx
│   │   │   ├── Footer.jsx
│   │   │   └── ProtectedRoute.jsx
│   │   ├── pages/            # Page components
│   │   │   ├── Home.jsx
│   │   │   ├── Login.jsx
│   │   │   ├── Register.jsx
│   │   │   ├── donor/        # Donor pages
│   │   │   ├── orphanage/    # Orphanage pages
│   │   │   └── admin/        # Admin pages
│   │   ├── services/         # API service layer
│   │   │   ├── api.js
│   │   │   ├── auth.js
│   │   │   ├── campaign.js
│   │   │   ├── donation.js
│   │   │   ├── orphanage.js
│   │   │   ├── admin.js
│   │   │   └── report.js
│   │   ├── store/            # State management
│   │   │   └── authStore.js
│   │   ├── App.jsx           # Main app component
│   │   ├── main.jsx          # Entry point
│   │   └── index.css         # Global styles
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── Dockerfile
│
└── docker-compose.yml        # Docker orchestration
```

---

## 🚀 Getting Started

### Prerequisites
- **Python 3.11+**
- **Node.js 20+**
- **MongoDB** (local or Docker)
- **Razorpay account** (for payment integration)

### Installation

#### 1. Clone the Repository
```bash
git clone <repository-url>
cd CN
```

#### 2. Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Create .env file
cp .env.example .env

# Edit .env and add your configuration:
# - MongoDB connection string
# - JWT secret key
# - Razorpay credentials
# - SMTP settings

# Run the backend
uvicorn main:app --reload
```

Backend will run on: `http://localhost:8000`

#### 3. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Create .env file
cp .env.example .env

# Edit .env and configure:
# - API URL (backend URL)
# - Razorpay Key ID

# Run the frontend
npm run dev
```

Frontend will run on: `http://localhost:5173`

---

## 🐳 Docker Setup (Recommended)

Run the entire stack with Docker Compose:

```bash
# From project root
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

Services:
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:8000
- **MongoDB**: localhost:27017

---

## 📚 API Documentation

Once the backend is running, visit:
- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

### Key API Endpoints

#### Authentication
```
POST /api/auth/register     - Register new user
POST /api/auth/login        - Login user
GET  /api/auth/me           - Get current user
POST /api/auth/change-password - Change password
```

#### Orphanages
```
POST /api/orphanages        - Register orphanage
GET  /api/orphanages        - List orphanages
GET  /api/orphanages/{id}   - Get orphanage details
GET  /api/orphanages/my     - Get my orphanage
PUT  /api/orphanages/{id}   - Update orphanage
```

#### Campaigns
```
POST /api/campaigns         - Create campaign
GET  /api/campaigns         - List campaigns
GET  /api/campaigns/{id}    - Get campaign details
PUT  /api/campaigns/{id}    - Update campaign
```

#### Donations
```
POST /api/donations/create-order    - Create Razorpay order
POST /api/donations/verify-payment  - Verify payment
GET  /api/donations/my-donations    - Get my donations
POST /api/donations/webhook         - Razorpay webhook
```

#### Admin
```
POST /api/admin/orphanages/{id}/verify  - Verify orphanage
POST /api/admin/campaigns/{id}/approve  - Approve campaign
POST /api/admin/campaigns/{id}/disburse - Disburse funds
GET  /api/admin/dashboard               - Admin dashboard stats
```

#### Reports
```
POST /api/reports                  - Submit report
GET  /api/reports/campaign/{id}    - Get campaign reports
POST /api/reports/{id}/verify      - Verify report (admin)
```

---

## 👥 User Roles

### 1. **Donor**
- Browse active campaigns
- Make secure donations via Razorpay
- View donation history
- Track utilization reports
- Receive email confirmations

### 2. **Orphanage**
- Register and submit verification documents
- Create funding campaigns
- Track donations received
- Submit utilization reports
- Update orphanage profile

### 3. **Admin (Government)**
- Verify orphanage registrations
- Approve/reject campaigns
- Disburse approved funds
- Verify utilization reports
- Access transparency dashboard
- Monitor all transactions

---

## 🔐 Environment Variables

### Backend (.env)
```env
# Database
MONGODB_URL=mongodb://localhost:27017
DATABASE_NAME=heartchain_db

# JWT
SECRET_KEY=your-secret-key-change-in-production
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=1440

# Razorpay
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret
RAZORPAY_WEBHOOK_SECRET=your_webhook_secret

# Email (SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
SMTP_FROM_EMAIL=noreply@heartchain.org

# Admin
ADMIN_EMAIL=admin@heartchain.org
ADMIN_PASSWORD=change-this-password
```

### Frontend (.env)
```env
VITE_API_URL=http://localhost:8000/api
VITE_RAZORPAY_KEY_ID=your_razorpay_key_id
```

---

## 🎨 Frontend Pages

### Public Pages
- **Home** - Landing page with features
- **Campaigns** - Browse all active campaigns
- **Campaign Detail** - View campaign details and donate
- **Login/Register** - Authentication pages
- **About** - About Heart-Chain

### Donor Dashboard
- **Dashboard** - Overview of donations and impact
- **My Donations** - Donation history with reports

### Orphanage Dashboard
- **Dashboard** - Campaign performance overview
- **Profile** - Manage orphanage details
- **My Campaigns** - View and manage campaigns
- **Create Campaign** - Submit new funding request
- **My Reports** - View and submit utilization reports

### Admin Dashboard
- **Dashboard** - System-wide statistics
- **Manage Orphanages** - Verify/reject orphanages
- **Manage Campaigns** - Approve/reject campaigns
- **Manage Reports** - Verify utilization reports
- **Disbursements** - Process fund transfers

---

## 💳 Payment Integration

Heart-Chain uses **Razorpay** for secure payment processing.

### Setup Razorpay
1. Create account at https://razorpay.com/
2. Get API keys from Dashboard
3. Add keys to `.env` files
4. Configure webhook URL for payment verification

### Payment Flow
1. Donor clicks "Donate" on campaign
2. Frontend creates Razorpay order via backend
3. Razorpay checkout modal opens
4. Payment completed
5. Backend verifies signature
6. Donation recorded, campaign updated
7. Confirmation email sent

---

## 📧 Email Notifications

Automated emails are sent for:
- ✉️ Welcome email on registration
- ✉️ Orphanage verification status
- ✉️ Donation confirmation
- ✉️ Fund disbursement notification
- ✉️ Campaign approval/rejection

Configure SMTP settings in backend `.env`.

---

## 🧪 Testing

### Backend Tests
```bash
cd backend
pytest
```

### Frontend Tests
```bash
cd frontend
npm run test
```

---

## 🚢 Deployment

### Backend (Render / Railway / Heroku)
1. Set environment variables
2. Deploy from GitHub
3. Configure MongoDB Atlas for production
4. Set up custom domain

### Frontend (Vercel / Netlify)
1. Connect GitHub repository
2. Set environment variables
3. Build command: `npm run build`
4. Deploy

### Docker Deployment
```bash
# Build for production
docker-compose -f docker-compose.prod.yml up -d
```

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open Pull Request

---

## 📝 License

This project is licensed under the MIT License.

---

## 📞 Support

For questions or support:
- **Email**: support@heartchain.org
- **GitHub Issues**: [Create an issue](https://github.com/your-repo/issues)

---

## 🙏 Acknowledgments

- FastAPI for the amazing web framework
- React team for the excellent UI library
- Razorpay for secure payment processing
- All contributors and supporters

---

## 🎯 Future Enhancements

- [ ] Real-time notifications using WebSockets
- [ ] Mobile app (React Native)
- [ ] Blockchain integration for immutable transaction records
- [ ] AI-powered campaign recommendations
- [ ] Multi-language support
- [ ] Advanced analytics dashboard
- [ ] Social media integration
- [ ] Volunteer management system

---

**Built with ❤️ for a transparent future**
