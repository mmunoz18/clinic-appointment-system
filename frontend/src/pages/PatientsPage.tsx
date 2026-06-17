import { useEffect, useState } from "react";
import { 
    createPatient,
    deletePatient,
    getPatients,
    updatePatient,
    type Patient,
} from "../api/clinicApi";
import { toast } from "react-toastify";
import ConfirmModal from "../components/ConfirmModal";

function PatientsPage() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [editingPatient, setEditingPatient] = useState<Patient | null>(null);
  const [patientToDelete, setPatientToDelete] = useState<Patient | null>(null);

  const role = localStorage.getItem("role");
  const canManagePatients = role === "Admin" || role === "Receptionist";
  const canEditPatients = role === "Admin" || role === "Receptionist";
  const canDeletePatients = role === "Admin";
  const showPatientActions = canEditPatients || canDeletePatients;

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

  async function confirmDeletePatient() {
    if (!patientToDelete) {
      return;
    }

    try {
      await deletePatient(patientToDelete.id);
      toast.success("Patient deleted successfully");
      setPatientToDelete(null);
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


        {canManagePatients && (
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
        )}

        <div className="table-card">
        <table>
            <thead>
            <tr>
                <th>Name</th>
                <th>Email</th>
                {showPatientActions && <th>Actions</th>}
            </tr>
            </thead>
            <tbody>
            {patients.length === 0 ? (
                <tr>
                    <td colSpan={3} className="empty-state">
                        No patients found.
                    </td>
                </tr>
            ) : (
            patients.map((patient) => (
              <tr key={patient.id}>
                <td>{patient.name}</td>
                <td>{patient.email}</td>
                {showPatientActions && (
                <td>
                  {canEditPatients && (
                    <button onClick={() => handleEditPatient(patient)}>Edit</button>
                  )}
                  {canDeletePatients && (
                    <button onClick={() => setPatientToDelete(patient)}>
                      Delete
                    </button>
                  )}
                </td>
                )}
              </tr>
            )))}
          </tbody>
        </table>
        </div>
        
        {patientToDelete && (
          <ConfirmModal
            title="Delete patient?"
            message={
              <>
                Are you sure you want to delete{" "}
                <strong>{patientToDelete.name}</strong>?
              </>
            }
            warning="If this patient has appointments, their appointment history may be affected."
            confirmText="Delete"
            onCancel={() => setPatientToDelete(null)}
            onConfirm={confirmDeletePatient}
          />
        )}
    </section>
  );
}

export default PatientsPage;