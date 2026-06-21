import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import {
  getDoctorPatients,
  type DoctorPatient,
} from "../api/clinicApi";
import StatusBadge from "../components/StatusBadge";
import EmptyState from "../components/EmptyState";
import { formatDateTime } from "../utils/dateTime";
import TableActions from "../components/TableActions";

function DoctorPatientsPage() {
  const [patients, setPatients] = useState<DoctorPatient[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    async function loadPatients() {
      try {
        setPatients(await getDoctorPatients());
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Error loading your patients";
        toast.error(message);
      }
    }

    loadPatients();
  }, []);

  return (
    <section>
      <div className="page-header">
        <h1>My Patients</h1>
        <p>Patients who have appointments assigned to you.</p>
      </div>

      <div className="table-card">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Phone Number</th>
              <th>Status</th>
              <th>Appointments</th>
              <th>Latest Appointment</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {patients.length === 0 ? (
              <EmptyState message="No patients to show." colSpan={7} />
            ) : (
              patients.map((patient) => (
                <tr key={patient.id}>
                  <td>{patient.name}</td>
                  <td>{patient.email}</td>
                  <td>{patient.phoneNumber || "—"}</td>
                  <td>
                    <StatusBadge active={patient.isActive} />
                  </td>
                  <td>{patient.appointmentCount}</td>
                  <td>{formatDateTime(patient.lastAppointmentDate)}</td>
                  <td>
                    <TableActions
                      primaryActions={[
                        {
                          label: "View Notes",
                          onClick: () =>
                            navigate(`/patients/${patient.id}`),
                        },
                      ]}
                    />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export default DoctorPatientsPage;
