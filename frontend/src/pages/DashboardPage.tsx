import { useEffect, useState } from "react";
import { getDoctors } from "../api/clinicApi";
import { getPatients } from "../api/clinicApi";
import { getAppointments } from "../api/clinicApi";

interface Doctor {
  id: number;
  name: string;
  specialty: string;
}

function DashboardPage() {
  const [doctorCount, setDoctorCount] = useState(0);
  const [patientCount, setPatientCount] = useState(0);
  const [appointmentCount, setAppointmentCount] = useState(0);

  useEffect(() => {
    getDoctors()
      .then((data) => setDoctorCount(data.length))
      .catch((error) => console.error(error));
    
    getPatients()
      .then((data) => setPatientCount(data.length))
      .catch((error) => console.error(error));
    
    getAppointments()
      .then((data) => setAppointmentCount(data.length))
      .catch((error) => console.error(error));
  }, []);

  return (
    <section>
      <div className="page-header">
        <h1>Dashboard</h1>
        <p>Clinic appointment management overview.</p>
      </div>

      <div className="card-grid">
        <div className="card">
          <h3>Doctors</h3>
          <p>{doctorCount}</p>
        </div>

        <div className="card">
          <h3>Patients</h3>
          <p>{patientCount}</p>
        </div>

        <div className="card">
          <h3>Appointments</h3>
          <p>{appointmentCount}</p>
        </div>
      </div>
    </section>
  );
}

export default DashboardPage;