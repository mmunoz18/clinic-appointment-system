import { BrowserRouter, Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import ProtectedRoute from "./components/ProtectedRoute";
import DashboardPage from "./pages/DashboardPage";
import DoctorsPage from "./pages/DoctorsPage";
import PatientsPage from "./pages/PatientsPage";
import AppointmentsPage from "./pages/AppointmentsPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import UsersPage from "./pages/UsersPage";
import DoctorPatientsPage from "./pages/DoctorPatientsPage";
import DoctorAppointmentsPage from "./pages/DoctorAppointmentsPage";
import DoctorAvailabilityPage from "./pages/DoctorAvailabilityPage";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route index element={<DashboardPage />} />
          <Route path="doctors" element={<DoctorsPage />} />
          <Route path="patients" element={<PatientsPage />} />
          <Route path="appointments" element={<AppointmentsPage />} />
          <Route path="users" element={<UsersPage />} />
          <Route path="my-patients" element={<DoctorPatientsPage />} />
          <Route path="my-appointments" element={<DoctorAppointmentsPage />} />
          <Route path="doctor-availability" element={<DoctorAvailabilityPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
