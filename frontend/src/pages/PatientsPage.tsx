import { useEffect, useState } from "react";
import { 
    createPatient,
    deletePatient,
    getPatients,
    updatePatient,
    type Patient,
} from "../api/clinicApi";
import { toast } from "react-toastify";

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

    try {
        if (editingPatient) {
        await updatePatient({
            id: editingPatient.id,
            name,
            email,
        });
        toast.success("Patient updated successfully");
        } else {
        await createPatient({
            name,
            email,
        });
        toast.success("Patient created successfully");
        }

        setName("");
        setEmail("");
        setEditingPatient(null);
        loadPatients();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Error updating patient";
      toast.error(message);
    }
  }

  async function handleEditPatient(patient: Patient) {
    setEditingPatient(patient);
    setName(patient.name);
    setEmail(patient.email);
  }

  async function handleDeletePatient(id: number) {
    const confirmed = window.confirm(
        "Are you sure you want to delete this patient? This action cannot be undone."
    );

    if (!confirmed) {
        return;
    }

    try {
      await deletePatient(id);
      toast.success("Patient deleted successfully");
      loadPatients();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Error deleting patient";
      toast.error(message);
    }
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