import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { Link } from "react-router-dom";
import {
  getDoctorPatients,
  type DoctorPatient,
} from "../api/clinicApi";

function DoctorPatientsPage() {
  const [patients, setPatients] = useState<DoctorPatient[]>([]);

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
              <th>Appointments</th>
              <th>Latest Appointment</th>
              <th>Details</th>
            </tr>
          </thead>
          <tbody>
            {patients.length === 0 ? (
              <tr>
                <td colSpan={6} className="empty-state">
                  No patients to show.
                </td>
              </tr>
            ) : (
              patients.map((patient) => (
                <tr key={patient.id}>
                  <td>{patient.name}</td>
                  <td>{patient.email}</td>
                  <td>{patient.phoneNumber || "—"}</td>
                  <td>{patient.appointmentCount}</td>
                  <td>
                    {new Date(patient.lastAppointmentDate).toLocaleString("es-CR", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}
                  </td>
                  <td>
                    <Link
                      className="table-link-button"
                      to={`/patients/${patient.id}`}
                    >
                      View Notes
                    </Link>
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
