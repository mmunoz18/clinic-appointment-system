import { useEffect, useState } from "react";
import { getAppointments } from "../api/clinicApi";

interface Appointment {
  id: number;
  patientId: number;
  doctorId: number;
  appointmentDate: string;
  status: string;
}

function AppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAppointments()
      .then((data) => setAppointments(data))
      .catch((error) => console.error(error))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <p>Loading appointments...</p>;
  }

  return (
    <section>
      <h1>Appointments</h1>

      {appointments.map((appointment) => (
        <div key={appointment.id}>
          <h3>Patient: {appointment.patientId}</h3>
          <p>Doctor: {appointment.doctorId}</p>
          <p>Date: {appointment.appointmentDate}</p>
          <p>Status: {appointment.status}</p>
        </div>
      ))}
    </section>
  );
}

export default AppointmentsPage;