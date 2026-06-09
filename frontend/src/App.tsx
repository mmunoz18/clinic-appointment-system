import { useEffect, useState } from "react";

interface Doctor {
  id: number;
  name: string;
  specialty: string;
}

function App() {
  const [doctors, setDoctors] = useState<Doctor[]>([]);

  useEffect(() => {
    fetch("http://localhost:5121/api/doctors")
      .then((response) => response.json())
      .then((data) => setDoctors(data))
      .catch((error) => console.error(error));
  }, []);

  return (
    <div>
      <h1>Doctors</h1>

      {doctors.map((doctor) => (
        <div key={doctor.id}>
          <h3>{doctor.name}</h3>
          <p>{doctor.specialty}</p>
        </div>
      ))}
    </div>
  );
}

export default App;