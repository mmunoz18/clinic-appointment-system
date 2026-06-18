import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import {
  getDoctorDashboard,
  type DoctorDashboard,
} from "../api/clinicApi";
import AppointmentTable from "../components/AppointmentTable";

function DoctorDashboardPage() {
  const [dashboard, setDashboard] = useState<DoctorDashboard | null>(null);

  useEffect(() => {
    async function loadDashboard() {
      try {
        setDashboard(await getDoctorDashboard());
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Error loading your dashboard";
        toast.error(message);
      }
    }

    loadDashboard();
  }, []);

  const counts = dashboard?.counts;

  return (
    <section>
      <div className="page-header">
        <h1>My Dashboard</h1>
        <p>Your patients and appointment schedule at a glance.</p>
      </div>

      <div className="card-grid doctor-card-grid">
        <div className="card">
          <h3>My Patients</h3>
          <p>{counts?.myPatients ?? 0}</p>
        </div>
        <div className="card">
          <h3>Today&apos;s Appointments</h3>
          <p>{counts?.todaysAppointments ?? 0}</p>
        </div>
        <div className="card">
          <h3>Upcoming Appointments</h3>
          <p>{counts?.upcomingAppointments ?? 0}</p>
        </div>
        <div className="card">
          <h3>Completed Appointments</h3>
          <p>{counts?.completedAppointments ?? 0}</p>
        </div>
        <div className="card">
          <h3>Cancelled Appointments</h3>
          <p>{counts?.cancelledAppointments ?? 0}</p>
        </div>
      </div>

      <div className="table-card">
        <h2>Today&apos;s Appointments</h2>
        <AppointmentTable
          appointments={dashboard?.todaysAppointments ?? []}
          emptyMessage="No appointments scheduled for today."
        />
      </div>

      <div className="table-card">
        <h2>Upcoming Appointments</h2>
        <AppointmentTable
          appointments={dashboard?.upcomingAppointments ?? []}
          emptyMessage="No upcoming appointments."
        />
      </div>
    </section>
  );
}

export default DoctorDashboardPage;
