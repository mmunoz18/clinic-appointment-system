import type { Appointment } from "../api/clinicApi";
import AppointmentStatusBadge from "./AppointmentStatusBadge";
import EmptyState from "./EmptyState";
import { formatDateTime } from "../utils/dateTime";
import ReminderStatusBadge from "./ReminderStatusBadge";

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
          <th>Reminder</th>
        </tr>
      </thead>
      <tbody>
        {appointments.length === 0 ? (
          <EmptyState
            message={emptyMessage}
            colSpan={showDoctor ? 5 : 4}
          />
        ) : (
          appointments.map((appointment) => (
            <tr key={appointment.id}>
              {showDoctor && <td>{appointment.doctorName}</td>}
              <td>{appointment.patientName}</td>
              <td>{formatDateTime(appointment.appointmentDate)}</td>
              <td>
                <AppointmentStatusBadge status={appointment.status} />
              </td>
              <td>
                <ReminderStatusBadge status={appointment.reminderStatus} />
              </td>
            </tr>
          ))
        )}
      </tbody>
    </table>
  );
}

export default AppointmentTable;
