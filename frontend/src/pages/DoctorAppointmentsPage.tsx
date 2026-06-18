import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import {
  getDoctorAppointments,
  type Appointment,
} from "../api/clinicApi";
import AppointmentTable from "../components/AppointmentTable";

function DoctorAppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);

  useEffect(() => {
    async function loadAppointments() {
      try {
        setAppointments(await getDoctorAppointments());
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Error loading your appointments";
        toast.error(message);
      }
    }

    loadAppointments();
  }, []);

  return (
    <section>
      <div className="page-header">
        <h1>My Appointments</h1>
        <p>Your complete appointment history and schedule.</p>
      </div>

      <div className="table-card">
        <AppointmentTable
          appointments={appointments}
          emptyMessage="No appointments to show."
        />
      </div>
    </section>
  );
}

export default DoctorAppointmentsPage;
