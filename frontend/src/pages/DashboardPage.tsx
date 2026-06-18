import { useEffect, useState } from "react";
import { getDoctors, getPatients, getAppointments, type Appointment } from "../api/clinicApi";
import { toast } from "react-toastify";
import DoctorDashboardPage from "./DoctorDashboardPage";
import AppointmentTable from "../components/AppointmentTable";

function DashboardPage() {
  const role = localStorage.getItem("role");

  if (role === "Doctor") {
    return <DoctorDashboardPage />;
  }

  return <ClinicDashboard />;
}

function ClinicDashboard() {
  const [doctorCount, setDoctorCount] = useState(0);
  const [patientCount, setPatientCount] = useState(0);
  const [appointmentCount, setAppointmentCount] = useState(0);
  const [appointments, setAppointments] = useState<Appointment[]>([]);

  const now = new Date();
  const startOfToday = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate()
  );
  const startOfTomorrow = new Date(startOfToday);
  startOfTomorrow.setDate(startOfTomorrow.getDate() + 1);

  const todaysAppointments = appointments.filter((appointment) => {
    const appointmentDate = new Date(appointment.appointmentDate);

    return (
      appointmentDate >= startOfToday &&
      appointmentDate < startOfTomorrow
    );
  });

  const upcomingAppointments = appointments.filter((appointment) => {
    const appointmentDate = new Date(appointment.appointmentDate);

    return (
      appointmentDate >= startOfTomorrow &&
      appointment.status === "Scheduled"
    );
  });

  const completedAppointments = appointments.filter(
    (appointment) => appointment.status === "Completed"
  );

  const cancelledAppointments = appointments.filter(
    (appointment) => appointment.status === "Cancelled"
  );

  const sortedTodayAppointments = [...todaysAppointments].sort(
    (a, b) =>
      new Date(a.appointmentDate).getTime() -
      new Date(b.appointmentDate).getTime()
  );

  const nextAppointments = [...upcomingAppointments]
    .sort(
      (a, b) =>
        new Date(a.appointmentDate).getTime() -
        new Date(b.appointmentDate).getTime()
    )
    .slice(0, 5);

  async function loadData() {
    try {
      const [doctorsData, patientsData, appointmentsData] = await Promise.all([
        getDoctors(),
        getPatients(),
        getAppointments()
      ]);
    
      setDoctorCount(doctorsData.length);
      setPatientCount(patientsData.length);
      setAppointments(appointmentsData);
      setAppointmentCount(appointmentsData.length);
    
    } catch (error) {
      const message = error instanceof Error ? error.message : "Error loading data";
      toast.error(message);
    }
  }

  useEffect(() => {
    async function loadClinicDashboard() {
      await loadData();
    }

    loadClinicDashboard();
  }, []);

  return (
    <section>
      <div className="page-header">
        <h1>Dashboard</h1>
        <p>Clinic appointment management overview.</p>
      </div>

      <div className="card-grid">
        <div className="card">
          <h3>Doctors</h3>
          <p>{doctorCount}</p>
        </div>

        <div className="card">
          <h3>Patients</h3>
          <p>{patientCount}</p>
        </div>

        <div className="card">
          <h3>Appointments</h3>
          <p>{appointmentCount}</p>
        </div>

        <div className="card">
          <h3>Today's Appointments</h3>
          <p>{todaysAppointments.length}</p>
        </div>

        <div className="card">
          <h3>Upcoming</h3>
          <p>{upcomingAppointments.length}</p>
        </div>

        <div className="card">
          <h3>Completed</h3>
          <p>{completedAppointments.length}</p>
        </div>

        <div className="card">
          <h3>Cancelled</h3>
          <p>{cancelledAppointments.length}</p>
        </div>
      </div>

      <div className="table-card">
        <h2>Today&apos;s Appointments</h2>
        <AppointmentTable
          appointments={sortedTodayAppointments}
          emptyMessage="No appointments scheduled for today."
          showDoctor
        />
      </div>

      <div className="table-card">
        <h2>Upcoming Appointments</h2>
        <AppointmentTable
          appointments={nextAppointments}
          emptyMessage="No upcoming appointments."
          showDoctor
        />
      </div>
    </section>
  );
}

export default DashboardPage;
