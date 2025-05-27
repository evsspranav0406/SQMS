import { Toaster } from '@/components/ui/toaster';
import { Toaster as Sonner } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Index from './pages/Index';
import Menu from './pages/Menu';
import About from './pages/About';
import Reserve from './pages/Reserve';
import Login from './pages/Login';
import NotFound from './pages/NotFound';
import ProtectedRoute from './components/protectedRoute'; // import here
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import AdminMenuItem from './pages/AdminMenuItem';
import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/AdminDashboard';
import AdminMenuPage from './pages/AdminMenuPage';
import AdminReservations from './pages/AdminReservation';
import AdminTables from './pages/AdminTables';
import AdminWaiters from './pages/AdminWaiters';
import AdminRoute from '@/components/AdminRoute';
import Unauthorized from './pages/Unauthorized';
import PaymentPage from './pages/Payment';
import AdminCheckin from './pages/AdminCheckin';
import AdminTableAdd from './pages/AdminTableAdd';
import AdminWaiterAdd from './pages/AdminWaiterAdd';
import WalkInReservation from './pages/WalkInReservation';

const queryClient = new QueryClient();

import IdleTimer from './components/IdleTimer';

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <IdleTimer />
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/about" element={<About />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/login" element={<Login />} />
          <Route path="/reset-password/:token" element={<ResetPassword />} />
          <Route path="/walk-in" element={<WalkInReservation />}/>
          {/* Protected Routes */}
          <Route
            path="/reserve"
            element={
              <ProtectedRoute>
                <Reserve />
              </ProtectedRoute>
            }
          />
          <Route path="/payment" element={<PaymentPage />} />
          <Route path="/menu" element={<Menu />} />
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin/dashboard" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
          <Route path="/admin/menu" element={<AdminRoute><AdminMenuPage /></AdminRoute>} />
          <Route path="/admin/menu/add" element={<AdminRoute><AdminMenuItem /></AdminRoute>} />
          <Route path="/admin/tables/add" element={<AdminRoute><AdminTableAdd /></AdminRoute>} />
          <Route path="/admin/waiters/add" element={<AdminRoute><AdminWaiterAdd /></AdminRoute>} />
          <Route path="/admin/reservations" element={<AdminRoute><AdminReservations /></AdminRoute>} />
          <Route path="/admin/checkin" element={<AdminRoute><AdminCheckin /></AdminRoute>} />
          <Route path="/admin/tables" element={<AdminRoute><AdminTables /></AdminRoute>} />
          <Route path="/admin/waiters" element={<AdminRoute><AdminWaiters /></AdminRoute>} />
          <Route path="*" element={<NotFound />} />
          <Route path="/unauthorized" element={<Unauthorized />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
