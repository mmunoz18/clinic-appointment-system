import { useEffect, useState } from "react";
import { getPatients } from "../api/clinicApi";

interface Patient {
  id: number;
  name: string;
  email: string;
}

function PatientsPage() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getPatients()
      .then((data) => setPatients(data))
      .catch((error) => console.error(error))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <p>Loading patients...</p>;
  }

  return (
    <section>
        <div className="page-header">
        <h1>Patients</h1>
        <p>View and manage patient records.</p>
        </div>

        <div className="table-card">
        <table>
            <thead>
            <tr>
                <th>Name</th>
                <th>Email</th>
            </tr>
            </thead>
            <tbody>
            {patients.map((patient) => (
                <tr key={patient.id}>
                <td>{patient.name}</td>
                <td>{patient.email}</td>
                </tr>
            ))}
            </tbody>
        </table>
        </div>
    </section>
  );
}

export default PatientsPage;