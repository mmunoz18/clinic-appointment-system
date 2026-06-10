import { useEffect, useState } from "react";
import { getAppointments } from "../api/clinicApi";

interface Appointment {
  id: number;
  patientId: number;
  patientName: string;
  doctorId: number;
  doctorName: string;
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
        <div className="page-header">
        <h1>Appointments</h1>
        <p>View scheduled clinic appointments.</p>
        </div>

        <div className="table-card">
        <table>
            <thead>
            <tr>
                <th>Doctor</th>
                <th>Patient</th>
                <th>Date</th>
                <th>Status</th>
            </tr>
            </thead>
            <tbody>
            {appointments.map((appointment) => (
                <tr key={appointment.id}>
                <td>{appointment.doctorName}</td>
                <td>{appointment.patientName}</td>
                <td>{new Date(appointment.appointmentDate).toLocaleString()}</td>
                <td>
                    <span className="status">{appointment.status}</span>
                </td>
                </tr>
            ))}
            </tbody>
        </table>
        </div>
    </section>
  );
}

export default AppointmentsPage;