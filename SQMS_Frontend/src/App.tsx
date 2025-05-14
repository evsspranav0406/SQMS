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
import AdminRoute from '@/components/AdminRoute';
import Unauthorized from './pages/Unauthorized';
import PaymentPage from './pages/Payment';
const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/about" element={<About />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/login" element={<Login />} />
          <Route path="/reset-password/:token" element={<ResetPassword />} />

          {/* Protected Routes */}
          
         
        <Route
        
            path="/reserve"
            element={
              <ProtectedRoute>
                <Reserve />
              </ProtectedRoute>
            }
          />
          <Route path='/payment' element={<PaymentPage/>}/>
          <Route path="/menu" element={<Menu />} />
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin/dashboard" element={<AdminRoute><AdminDashboard/></AdminRoute>} />
          <Route path="/admin/menu" element={<AdminRoute><AdminMenuPage/></AdminRoute>} />
          <Route path='/admin/menu/add' element={<AdminRoute><AdminMenuItem/></AdminRoute>} />
          <Route path='/admin/reservations' element={<AdminRoute><AdminReservations/></AdminRoute>} />
          <Route path="*" element={<NotFound />} />
          <Route path="/unauthorized" element={<Unauthorized />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
