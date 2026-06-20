import type { Appointment } from "../api/clinicApi";
import AppointmentStatusBadge from "./AppointmentStatusBadge";
import EmptyState from "./EmptyState";

type AppointmentTableProps = {
  appointments: Appointment[];
  emptyMessage: string;
  showDoctor?: boolean;
};

function AppointmentTable({
  appointments,
  emptyMessage,
  showDoctor = false,
}: AppointmentTableProps) {
  return (
    <table>
      <thead>
        <tr>
          {showDoctor && <th>Doctor</th>}
          <th>Patient</th>
          <th>Date</th>
          <th>Status</th>
        </tr>
      </thead>
      <tbody>
        {appointments.length === 0 ? (
          <EmptyState
            message={emptyMessage}
            colSpan={showDoctor ? 4 : 3}
          />
        ) : (
          appointments.map((appointment) => (
            <tr key={appointment.id}>
              {showDoctor && <td>{appointment.doctorName}</td>}
              <td>{appointment.patientName}</td>
              <td>
                {new Date(appointment.appointmentDate).toLocaleString("es-CR", {
                  dateStyle: "medium",
                  timeStyle: "short",
                })}
              </td>
              <td>
                <AppointmentStatusBadge status={appointment.status} />
              </td>
            </tr>
          ))
        )}
      </tbody>
    </table>
  );
}

export default AppointmentTable;
