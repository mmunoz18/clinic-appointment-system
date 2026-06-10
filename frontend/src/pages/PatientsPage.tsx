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
      <h1>Patients</h1>

      {patients.map((patient) => (
        <div key={patient.id}>
          <h3>{patient.name}</h3>
          <p>{patient.email}</p>
        </div>
      ))}
    </section>
  );
}

export default PatientsPage;