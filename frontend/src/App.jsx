import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'

// Layout
import Layout from './components/Layout'
import ProtectedRoute from './components/ProtectedRoute'

// Public Pages
import HomePage from './pages/Home'
import LoginPage from './pages/Login'
import RegisterPage from './pages/Register'
import CampaignsPage from './pages/Campaigns'
import CampaignDetailPage from './pages/CampaignDetail'
import AboutPage from './pages/About'
import OrphanagesPage from './pages/Orphanages'
import HowItWorksPage from './pages/HowItWorks'
import OrphanageProfile from './pages/orphanage/Profile'
import DonatePage from './pages/Donate'

// Donor Pages
import DonorDashboard from './pages/donor/Dashboard'
import MyDonations from './pages/donor/MyDonations'

// Orphanage Pages
import OrphanageDashboard from './pages/orphanage/Dashboard'
import MyCampaigns from './pages/orphanage/MyCampaigns'
import CreateCampaign from './pages/orphanage/CreateCampaign'
import MyReports from './pages/orphanage/MyReports'
import CreateReport from './pages/orphanage/CreateReport'
import PayoutHistory from './pages/orphanage/PayoutHistory'

// Admin Pages
import AdminDashboard from './pages/admin/Dashboard'
import ManageOrphanages from './pages/admin/ManageOrphanages'
import ManageCampaigns from './pages/admin/ManageCampaigns'
import ManageReports from './pages/admin/ManageReports'
import Disbursements from './pages/admin/Disbursements'
import ProfilePage from './pages/Profile'

function App() {
  return (
    <BrowserRouter>
      <Toaster position="top-right" />
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Layout />}>
          <Route index element={<HomePage />} />
          <Route path="login" element={<LoginPage />} />
          <Route path="register" element={<RegisterPage />} />
          <Route path="campaigns" element={<CampaignsPage />} />
          <Route path="campaigns/:id" element={<CampaignDetailPage />} />
          <Route path="orphanages" element={<OrphanagesPage />} />
          <Route path="orphanages/:id" element={<OrphanageProfile />} />
          <Route path="donate/:orphanageId" element={<DonatePage />} />
          <Route path="donate/:orphanageId/:campaignId" element={<DonatePage />} />
          <Route path="how-it-works" element={<HowItWorksPage />} />
          <Route path="about" element={<AboutPage />} />
          
          {/* User Profile (any authenticated role) */}
          <Route path="profile" element={<ProtectedRoute />}> 
            <Route index element={<ProfilePage />} />
          </Route>
          
          {/* Donor Routes */}
          <Route path="donor" element={<ProtectedRoute role="donor" />}>
            <Route path="dashboard" element={<DonorDashboard />} />
            <Route path="donations" element={<MyDonations />} />
          </Route>
          
          {/* Orphanage Routes */}
          <Route path="orphanage" element={<ProtectedRoute role="orphanage" />}>
            <Route path="dashboard" element={<OrphanageDashboard />} />
            <Route path="profile" element={<OrphanageProfile />} />
            <Route path="campaigns" element={<MyCampaigns />} />
            <Route path="campaigns/create" element={<CreateCampaign />} />
            <Route path="reports" element={<MyReports />} />
            <Route path="reports/create" element={<CreateReport />} />
            <Route path="payouts" element={<PayoutHistory />} />
          </Route>
          
          {/* Admin Routes */}
          <Route path="admin" element={<ProtectedRoute role="admin" />}>
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="orphanages" element={<ManageOrphanages />} />
            <Route path="campaigns" element={<ManageCampaigns />} />
            <Route path="reports" element={<ManageReports />} />
            <Route path="disbursements" element={<Disbursements />} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
