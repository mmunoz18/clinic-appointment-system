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
import EmptyState from "../components/EmptyState";
import FormActions from "../components/FormActions";
import FormCard from "../components/FormCard";
import Modal from "../components/Modal";
import StatusBadge from "../components/StatusBadge";

function PatientsPage() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [cedula, setCedula] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [editingPatient, setEditingPatient] = useState<Patient | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [patientToDeactivate, setPatientToDeactivate] = useState<Patient | null>(null);

  const role = localStorage.getItem("role");
  const canManagePatients = role === "Admin" || role === "Receptionist";
  const canEditPatients = role === "Admin" || role === "Receptionist";
  const canDeletePatients = role === "Admin";
  const canViewNotes = role === "Admin";
  const showPatientActions = canEditPatients || canDeletePatients;
  const requiredFieldsComplete =
    name.trim() !== "" &&
    email.trim() !== "" &&
    cedula.trim() !== "";
  const patientChanged =
    editingPatient == null ||
    name.trim() !== editingPatient.name ||
    email.trim() !== editingPatient.email ||
    cedula.trim() !== editingPatient.cedula ||
    phoneNumber.trim() !== (editingPatient.phoneNumber ?? "");
  const saveDisabled =
    !requiredFieldsComplete ||
    !patientChanged ||
    saving;

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

    if (saveDisabled) {
      return;
    }

    setSaving(true);

    try {
      if (editingPatient) {
        await updatePatient({
          id: editingPatient.id,
          name: name.trim(),
          email: email.trim(),
          cedula: cedula.trim(),
          phoneNumber: phoneNumber.trim(),
          isActive: editingPatient.isActive,
        });
        toast.success("Patient updated successfully");
      } else {
        await createPatient({
          name: name.trim(),
          email: email.trim(),
          cedula: cedula.trim(),
          phoneNumber: phoneNumber.trim(),
        });
        toast.success("Patient created successfully");
      }

      clearPatientForm();
      await loadPatients();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Error saving patient";
      toast.error(message);
    } finally {
      setSaving(false);
    }
  }

  function handleAddPatient() {
    clearPatientForm();
    setIsFormOpen(true);
  }

  function handleEditPatient(patient: Patient) {
    setEditingPatient(patient);
    setName(patient.name);
    setEmail(patient.email);
    setCedula(patient.cedula);
    setPhoneNumber(patient.phoneNumber ?? "");
    setIsFormOpen(true);
  }

  function clearPatientForm() {
    setEditingPatient(null);
    setName("");
    setEmail("");
    setCedula("");
    setPhoneNumber("");
    setIsFormOpen(false);
  }

  async function confirmDeactivatePatient() {
    if (!patientToDeactivate) {
      return;
    }

    try {
      await deactivatePatient(patientToDeactivate.id);
      toast.success("Patient deactivated successfully");
      setPatientToDeactivate(null);
      clearPatientForm();
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
      clearPatientForm();
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


        {canManagePatients && !isFormOpen && (
          <button
            type="button"
            className="add-record-button"
            onClick={handleAddPatient}
          >
            + Add Patient
          </button>
        )}

        {canManagePatients && isFormOpen && (
          <Modal
            titleId="patient-form-modal-title"
            title={editingPatient ? "Edit Patient" : "Add Patient"}
            onClose={() => {
              if (!saving) {
                clearPatientForm();
              }
            }}
          >
            <FormCard onSubmit={handleSubmit}>
              <label>
                <span>Name</span>
                <input
                  type="text"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  required
                />
              </label>

              <label>
                <span>Email</span>
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                />
              </label>

              <label>
                <span>Cedula</span>
                <input
                  type="text"
                  value={cedula}
                  onChange={(event) => setCedula(event.target.value)}
                  required
                />
              </label>

              <label>
                <span>Phone</span>
                <input
                  type="text"
                  value={phoneNumber}
                  onChange={(event) => setPhoneNumber(event.target.value)}
                />
              </label>

              <FormActions
                saving={saving}
                saveDisabled={saveDisabled}
                onCancel={clearPatientForm}
                saveText={editingPatient ? "Update Patient" : "Save Patient"}
              />
            </FormCard>
          </Modal>
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
              <EmptyState
                message="No patients found."
                colSpan={
                  5 + (canViewNotes ? 1 : 0) + (showPatientActions ? 1 : 0)
                }
              />
            ) : (
            patients.map((patient) => (
              <tr key={patient.id}>
                <td>{patient.name}</td>
                <td>{patient.email}</td>
                <td>{patient.cedula}</td>
                <td>{patient.phoneNumber}</td>
                <td>
                  <StatusBadge active={patient.isActive} />
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
