import { useEffect, useState } from "react";
import { 
    createPatient,
    deletePatient,
    getPatients,
    updatePatient,
    type Patient,
} from "../api/clinicApi";

function PatientsPage() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [editingPatient, setEditingPatient] = useState<Patient | null>(null);

  function loadPatients() {
    getPatients()
      .then((data) => setPatients(data))
      .catch((error) => console.error(error));
  }

  useEffect(() => {
    loadPatients();
  }, []);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    if (editingPatient) {
      await updatePatient({
        id: editingPatient.id,
        name,
        email,
      });
    } else {
      await createPatient({
        name,
        email,
      });
    }

    setName("");
    setEmail("");
    setEditingPatient(null);
    loadPatients();
  }

  async function handleEditPatient(patient: Patient) {
    setEditingPatient(patient);
    setName(patient.name);
    setEmail(patient.email);
  }

  async function handleDeletePatient(id: number) {
    await deletePatient(id);
    loadPatients();
  }

  return (
    <section>
        <div className="page-header">
        <h1>Patients</h1>
        <p>View and manage patient records.</p>
        </div>

        <form onSubmit={handleSubmit} className="form-card">
            <h2>{editingPatient ? "Edit Patient" : "Add Patient"}</h2>

            <input
            type="text"
            placeholder="Patient name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            required
            />

            <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
            />

            <button type="submit">{editingPatient ? "Update Patient" : "Add Patient"}</button>
            
            {editingPatient && (
              <button
                type="button"
                onClick={() => {
                  setEditingPatient(null);
                  setName("");
                  setEmail("");
                }}
              >
                Cancel
              </button>
            )}
        </form>

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
                <td>
                  <button onClick={() => handleEditPatient(patient)}>Edit</button>
                  <button onClick={() => handleDeletePatient(patient.id)}>
                    Delete
                  </button>
                </td>
                </tr>
            ))}
            </tbody>
        </table>
        </div>
    </section>
  );
}

export default PatientsPage;