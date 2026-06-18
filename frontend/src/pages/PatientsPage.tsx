import { useCallback, useEffect, useState } from "react";
import { 
    createPatient,
    activatePatient,
    deactivatePatient,
    getPatients,
    updatePatient,
    type Patient,
} from "../api/clinicApi";
import { toast } from "react-toastify";
import ConfirmModal from "../components/ConfirmModal";
import { Link } from "react-router-dom";

function PatientsPage() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [cedula, setCedula] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [editingPatient, setEditingPatient] = useState<Patient | null>(null);
  const [patientToDeactivate, setPatientToDeactivate] = useState<Patient | null>(null);

  const role = localStorage.getItem("role");
  const canManagePatients = role === "Admin" || role === "Receptionist";
  const canEditPatients = role === "Admin" || role === "Receptionist";
  const canDeletePatients = role === "Admin";
  const canViewNotes = role === "Admin";
  const showPatientActions = canEditPatients || canDeletePatients;

  const loadPatients = useCallback(async () => {
    try {
      const data = await getPatients(role === "Admin");
      setPatients(data);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Error loading patients";
      toast.error(message);
    }
  }, [role]);

  useEffect(() => {
    async function loadPatientsPage() {
      await loadPatients();
    }

    loadPatientsPage();
  }, [loadPatients]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    try {
        if (editingPatient) {
        await updatePatient({
            id: editingPatient.id,
            name,
            email,
            cedula,
            phoneNumber,
            isActive: editingPatient.isActive,
        });
        toast.success("Patient updated successfully");
        } else {
        await createPatient({
            name,
            email,
            cedula,
            phoneNumber,
        });
        toast.success("Patient created successfully");
        }

        setName("");
        setEmail("");
        setCedula("");
        setPhoneNumber("");
        setEditingPatient(null);
        await loadPatients();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Error saving patient";
      toast.error(message);
    }
  }

  async function handleEditPatient(patient: Patient) {
    setEditingPatient(patient);
    setName(patient.name);
    setEmail(patient.email);
    setCedula(patient.cedula);
    setPhoneNumber(patient.phoneNumber);
  }

  async function confirmDeactivatePatient() {
    if (!patientToDeactivate) {
      return;
    }

    try {
      await deactivatePatient(patientToDeactivate.id);
      toast.success("Patient deactivated successfully");
      setPatientToDeactivate(null);
      await loadPatients();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Error deactivating patient";
      toast.error(message);
    }
  }

  async function handleActivatePatient(patient: Patient) {
    try {
      await activatePatient(patient.id);
      toast.success("Patient activated successfully");
      await loadPatients();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Error activating patient";
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
              
              <input
              type="text"
              placeholder="Cedula"
              value={cedula}
              onChange={(event) => setCedula(event.target.value)}
              required
              />
              
              <input
              type="text"
              placeholder="Phone Number"
              value={phoneNumber}
              onChange={(event) => setPhoneNumber(event.target.value)}
              />

              <button type="submit">{editingPatient ? "Update Patient" : "Add Patient"}</button>
              
              {editingPatient && (
                <button
                  type="button"
                  onClick={() => {
                    setEditingPatient(null);
                    setName("");
                    setEmail("");
                    setCedula("");
                    setPhoneNumber("");
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
                <th>Cedula</th>
                <th>Phone Number</th>
                <th>Status</th>
                {canViewNotes && <th>Medical Notes</th>}
                {showPatientActions && <th>Actions</th>}
            </tr>
            </thead>
            <tbody>
            {patients.length === 0 ? (
                <tr>
                    <td
                      colSpan={
                        5 + (canViewNotes ? 1 : 0) + (showPatientActions ? 1 : 0)
                      }
                      className="empty-state"
                    >
                        No patients found.
                    </td>
                </tr>
            ) : (
            patients.map((patient) => (
              <tr key={patient.id}>
                <td>{patient.name}</td>
                <td>{patient.email}</td>
                <td>{patient.cedula}</td>
                <td>{patient.phoneNumber}</td>
                <td>
                  <span
                    className={`entity-status ${
                      patient.isActive ? "entity-status-active" : "entity-status-inactive"
                    }`}
                  >
                    {patient.isActive ? "Active" : "Inactive"}
                  </span>
                </td>
                {canViewNotes && (
                  <td>
                    <Link
                      className="table-link-button"
                      to={`/patients/${patient.id}`}
                    >
                      View Notes
                    </Link>
                  </td>
                )}
                {showPatientActions && (
                <td>
                  {canEditPatients && (
                    <button onClick={() => handleEditPatient(patient)}>Edit</button>
                  )}
                  {canDeletePatients && (
                    patient.isActive ? (
                      <button onClick={() => setPatientToDeactivate(patient)}>
                        Deactivate
                      </button>
                    ) : (
                      <button
                        className="activate-button"
                        onClick={() => handleActivatePatient(patient)}
                      >
                        Activate
                      </button>
                    )
                  )}
                </td>
                )}
              </tr>
            )))}
          </tbody>
        </table>
        </div>
        
        {patientToDeactivate && (
          <ConfirmModal
            title="Deactivate patient?"
            message={
              <>
                Are you sure you want to deactivate{" "}
                <strong>{patientToDeactivate.name}</strong>?
              </>
            }
            warning="Inactive patients cannot be assigned to new appointments."
            confirmText="Deactivate"
            reversible
            onCancel={() => setPatientToDeactivate(null)}
            onConfirm={confirmDeactivatePatient}
          />
        )}
    </section>
  );
}

export default PatientsPage;
