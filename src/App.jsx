import { Routes, Route } from "react-router-dom";
import RequireRole from "./components/RequireRole";
import DashLayout from "./components/DashLayout";

import Landing from "./pages/Landing";
import Login from "./pages/auth/Login";
import SignUp from "./pages/auth/SignUp";
import Welcome from "./pages/auth/Welcome";

import CustomerHome from "./pages/customer/CustomerHome";
import NewBooking from "./pages/customer/NewBooking";
import BookingDetail from "./pages/customer/BookingDetail";
import Profile from "./pages/customer/Profile";

import DriverHome from "./pages/driver/DriverHome";
import TripDetail from "./pages/driver/TripDetail";

import AdminOverview from "./pages/admin/AdminOverview";
import AdminBookings from "./pages/admin/AdminBookings";
import AdminBookingDetail from "./pages/admin/AdminBookingDetail";
import AdminFleet from "./pages/admin/AdminFleet";
import AdminDrivers from "./pages/admin/AdminDrivers";
import AdminCustomers from "./pages/admin/AdminCustomers";
import AdminSettings from "./pages/admin/AdminSettings";
import AdminReports from "./pages/admin/AdminReports";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<SignUp />} />
      <Route path="/welcome" element={<Welcome />} />

      {/* Customer */}
      <Route path="/app" element={<RequireRole role="customer"><DashLayout role="customer" /></RequireRole>}>
        <Route index element={<CustomerHome />} />
        <Route path="book/new" element={<NewBooking />} />
        <Route path="bookings/:id" element={<BookingDetail />} />
        <Route path="profile" element={<Profile />} />
      </Route>

      {/* Driver */}
      <Route path="/driver" element={<RequireRole role="driver"><DashLayout role="driver" /></RequireRole>}>
        <Route index element={<DriverHome />} />
        <Route path="trips/:id" element={<TripDetail />} />
      </Route>

      {/* Admin */}
      <Route path="/admin" element={<RequireRole role="admin"><DashLayout role="admin" /></RequireRole>}>
        <Route index element={<AdminOverview />} />
        <Route path="bookings" element={<AdminBookings />} />
        <Route path="bookings/:id" element={<AdminBookingDetail />} />
        <Route path="fleet" element={<AdminFleet />} />
        <Route path="drivers" element={<AdminDrivers />} />
        <Route path="customers" element={<AdminCustomers />} />
        <Route path="settings" element={<AdminSettings />} />
        <Route path="reports" element={<AdminReports />} />
      </Route>
    </Routes>
  );
}
