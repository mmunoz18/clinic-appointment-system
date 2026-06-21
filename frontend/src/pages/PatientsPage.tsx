import { useCallback, useDeferredValue, useEffect, useState } from "react";
import { 
    createPatient,
    activatePatient,
    deactivatePatient,
    getPatientsPaged,
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
import Pagination from "../components/Pagination";

function PatientsPage() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [cedula, setCedula] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [editingPatient, setEditingPatient] = useState<Patient | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showValidation, setShowValidation] = useState(false);
  const [serverErrors, setServerErrors] = useState<
    Partial<Record<"name" | "email" | "cedula", string>>
  >({});
  const [patientToDeactivate, setPatientToDeactivate] = useState<Patient | null>(null);
  const [search, setSearch] = useState("");
  const [showInactive, setShowInactive] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const deferredSearch = useDeferredValue(search);

  const role = localStorage.getItem("role");
  const canManagePatients = role === "Admin" || role === "Receptionist";
  const canEditPatients = role === "Admin" || role === "Receptionist";
  const canDeletePatients = role === "Admin";
  const canViewNotes = role === "Admin";
  const showPatientActions = canEditPatients || canDeletePatients;
  const nameError =
    showValidation && name.trim() === "" ? "Name is required." : "";
  const emailIsValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  const emailError =
    showValidation && email.trim() === ""
      ? "Email is required."
      : email.trim() !== "" && !emailIsValid
        ? "Enter a valid email address."
        : "";
  const cedulaError =
    showValidation && cedula.trim() === ""
      ? "Cedula is required."
      : cedula.trim() !== "" && cedula.trim().length !== 9
        ? "Cedula must be 9 characters long."
        : "";
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
    !emailIsValid ||
    cedula.trim().length !== 9 ||
    !patientChanged ||
    saving;

  const loadPatients = useCallback(async () => {
    setLoading(true);

    try {
      const data = await getPatientsPaged({
        search: deferredSearch,
        includeInactive: role === "Admin" && showInactive,
        page,
      });

      if (data.totalPages > 0 && page > data.totalPages) {
        setPage(data.totalPages);
        return;
      }

      setPatients(data.items);
      setTotalPages(data.totalPages);
      setTotalCount(data.totalCount);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Error loading patients";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, [deferredSearch, page, role, showInactive]);

  useEffect(() => {
    async function loadPatientsPage() {
      await loadPatients();
    }

    loadPatientsPage();
  }, [loadPatients]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setShowValidation(true);
    setServerErrors({});

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
      const normalizedMessage = message.toLowerCase();

      if (normalizedMessage.includes("cedula")) {
        setServerErrors({ cedula: message });
      } else if (normalizedMessage.includes("email")) {
        setServerErrors({ email: message });
      } else if (normalizedMessage.includes("name")) {
        setServerErrors({ name: message });
      }

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
    setShowValidation(false);
    setServerErrors({});
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

        <div className="list-filters">
          <label className="filter-search">
            <span>Search patients</span>
            <input
              type="search"
              value={search}
              placeholder="Name or email"
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(1);
              }}
            />
          </label>

          {role === "Admin" && (
            <label className="checkbox-filter">
              <input
                type="checkbox"
                checked={showInactive}
                onChange={(event) => {
                  setShowInactive(event.target.checked);
                  setPage(1);
                }}
              />
              Show inactive
            </label>
          )}
        </div>

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
                  onChange={(event) => {
                    setName(event.target.value);
                    setServerErrors((current) => ({
                      ...current,
                      name: undefined,
                    }));
                  }}
                  onBlur={() => setShowValidation(true)}
                  aria-invalid={Boolean(nameError || serverErrors.name)}
                  required
                />
                {(nameError || serverErrors.name) && (
                  <span className="field-error">
                    {nameError || serverErrors.name}
                  </span>
                )}
              </label>

              <label>
                <span>Email</span>
                <input
                  type="email"
                  value={email}
                  onChange={(event) => {
                    setEmail(event.target.value);
                    setServerErrors((current) => ({
                      ...current,
                      email: undefined,
                    }));
                  }}
                  onBlur={() => setShowValidation(true)}
                  aria-invalid={Boolean(emailError || serverErrors.email)}
                  required
                />
                {(emailError || serverErrors.email) && (
                  <span className="field-error">
                    {emailError || serverErrors.email}
                  </span>
                )}
              </label>

              <label>
                <span>Cedula</span>
                <input
                  type="text"
                  value={cedula}
                  onChange={(event) => {
                    setCedula(event.target.value);
                    setServerErrors((current) => ({
                      ...current,
                      cedula: undefined,
                    }));
                  }}
                  onBlur={() => setShowValidation(true)}
                  aria-invalid={Boolean(cedulaError || serverErrors.cedula)}
                  required
                />
                {(cedulaError || serverErrors.cedula) && (
                  <span className="field-error">
                    {cedulaError || serverErrors.cedula}
                  </span>
                )}
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

        {loading ? (
          <p className="loading-state">Loading patients...</p>
        ) : (
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
                    <button
                      disabled={!patient.isActive}
                      onClick={() => handleEditPatient(patient)}
                    >
                      Edit
                    </button>
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
        )}

        {!loading && (
          <Pagination
            page={page}
            totalPages={totalPages}
            totalCount={totalCount}
            onPageChange={setPage}
          />
        )}
        
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
