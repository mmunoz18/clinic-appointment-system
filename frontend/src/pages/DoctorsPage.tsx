import { useEffect, useState } from "react";
import { getDoctors } from "../api/clinicApi";

interface Doctor {
  id: number;
  name: string;
  specialty: string;
}

function DoctorsPage() {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getDoctors()
      .then((data) => setDoctors(data))
      .catch((error) => console.error(error))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <p>Loading doctors...</p>;
  }

  return (
    <section>
        <div className="page-header">
        <h1>Doctors</h1>
        <p>View and manage clinic doctors.</p>
        </div>

        <div className="table-card">
        <table>
            <thead>
            <tr>
                <th>Name</th>
                <th>Specialty</th>
            </tr>
            </thead>
            <tbody>
            {doctors.map((doctor) => (
                <tr key={doctor.id}>
                <td>{doctor.name}</td>
                <td>{doctor.specialty}</td>
                </tr>
            ))}
            </tbody>
        </table>
        </div>
    </section>
  );
}

export default DoctorsPage;