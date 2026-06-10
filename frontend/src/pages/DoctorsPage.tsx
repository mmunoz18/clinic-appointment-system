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
      <h1>Doctors</h1>

      {doctors.map((doctor) => (
        <div key={doctor.id}>
          <h3>{doctor.name}</h3>
          <p>{doctor.specialty}</p>
        </div>
      ))}
    </section>
  );
}

export default DoctorsPage;