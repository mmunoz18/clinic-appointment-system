import { useCallback, useEffect, useState } from "react";
import {
  createDoctor,
  activateDoctor,
  deactivateDoctor,
  getDoctors,
  updateDoctor,
  type Doctor,
} from "../api/clinicApi";
import { toast } from "react-toastify";
import ConfirmModal from "../components/ConfirmModal";
import EmptyState from "../components/EmptyState";
import FormActions from "../components/FormActions";
import FormCard from "../components/FormCard";
import Modal from "../components/Modal";
import StatusBadge from "../components/StatusBadge";

function DoctorsPage() {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [specialty, setSpecialty] = useState("");
  const [cedula, setCedula] = useState("");
  const [editingDoctor, setEditingDoctor] = useState<Doctor | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showValidation, setShowValidation] = useState(false);
  const [serverErrors, setServerErrors] = useState<
    Partial<Record<"name" | "specialty" | "cedula", string>>
  >({});
  const [doctorToDeactivate, setDoctorToDeactivate] = useState<Doctor | null>(null);

  const role = localStorage.getItem("role");
  const canManageDoctors = role === "Admin";
  const nameError =
    showValidation && name.trim() === "" ? "Name is required." : "";
  const specialtyError =
    showValidation && specialty.trim() === ""
      ? "Specialty is required."
      : "";
  const cedulaError =
    showValidation && cedula.trim() === ""
      ? "Cedula is required."
      : cedula.trim() !== "" && cedula.trim().length !== 9
        ? "Cedula must be 9 characters long."
        : "";
  const requiredFieldsComplete =
    name.trim() !== "" &&
    specialty.trim() !== "" &&
    cedula.trim() !== "";
  const doctorChanged =
    editingDoctor == null ||
    name.trim() !== editingDoctor.name ||
    specialty.trim() !== editingDoctor.specialty ||
    cedula.trim() !== editingDoctor.cedula;
  const saveDisabled =
    !requiredFieldsComplete ||
    cedula.trim().length !== 9 ||
    !doctorChanged ||
    saving;

  const loadDoctors = useCallback(async () => {
    setLoading(true);

    try {
      const data = await getDoctors(canManageDoctors);
      setDoctors(data);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Error loading doctors";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, [canManageDoctors]);

  useEffect(() => {
    async function loadDoctorsPage() {
      await loadDoctors();
    }

    loadDoctorsPage();
  }, [loadDoctors]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setShowValidation(true);
    setServerErrors({});

    if (saveDisabled) {
      return;
    }

    setSaving(true);

    try {
      if (editingDoctor) {
        await updateDoctor({
          id: editingDoctor.id,
          name: name.trim(),
          specialty: specialty.trim(),
          cedula: cedula.trim(),
          isActive: editingDoctor.isActive,
        });
        toast.success("Doctor updated successfully");
      } else {
        await createDoctor({
          name: name.trim(),
          specialty: specialty.trim(),
          cedula: cedula.trim(),
        });
        toast.success("Doctor created successfully");
      }

      clearDoctorForm();
      await loadDoctors();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Error saving doctor";
      const normalizedMessage = message.toLowerCase();

      if (normalizedMessage.includes("cedula")) {
        setServerErrors({ cedula: message });
      } else if (normalizedMessage.includes("specialty")) {
        setServerErrors({ specialty: message });
      } else if (normalizedMessage.includes("name")) {
        setServerErrors({ name: message });
      }

      toast.error(message);
    } finally {
      setSaving(false);
    }
  }

  function handleAddDoctor() {
    clearDoctorForm();
    setIsFormOpen(true);
  }

  function handleEdit(doctor: Doctor) {
    setEditingDoctor(doctor);
    setName(doctor.name);
    setSpecialty(doctor.specialty);
    setCedula(doctor.cedula);
    setIsFormOpen(true);
  }

  function clearDoctorForm() {
    setEditingDoctor(null);
    setName("");
    setSpecialty("");
    setCedula("");
    setShowValidation(false);
    setServerErrors({});
    setIsFormOpen(false);
  }

  async function confirmDeactivateDoctor() {
    if (!doctorToDeactivate) {
      return;
    }

    try {
      await deactivateDoctor(doctorToDeactivate.id);
      toast.success("Doctor deactivated successfully");
      setDoctorToDeactivate(null);
      clearDoctorForm();
      await loadDoctors();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to deactivate doctor";
      toast.error(message);
    }
  }

  async function handleActivateDoctor(doctor: Doctor) {
    try {
      await activateDoctor(doctor.id);
      toast.success("Doctor activated successfully");
      clearDoctorForm();
      await loadDoctors();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to activate doctor";
      toast.error(message);
    }
  }

  return (
    <section>
      <div className="page-header">
        <h1>Doctors</h1>
        <p>View and manage clinic doctors.</p>
      </div>

      {canManageDoctors && !isFormOpen && (
        <button
          type="button"
          className="add-record-button"
          onClick={handleAddDoctor}
        >
          + Add Doctor
        </button>
      )}

      {canManageDoctors && isFormOpen && (
        <Modal
          titleId="doctor-form-modal-title"
          title={editingDoctor ? "Edit Doctor" : "Add Doctor"}
          onClose={() => {
            if (!saving) {
              clearDoctorForm();
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
                  setServerErrors((current) => ({ ...current, name: undefined }));
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
              <span>Specialty</span>
              <input
                type="text"
                value={specialty}
                onChange={(event) => {
                  setSpecialty(event.target.value);
                  setServerErrors((current) => ({
                    ...current,
                    specialty: undefined,
                  }));
                }}
                onBlur={() => setShowValidation(true)}
                aria-invalid={Boolean(
                  specialtyError || serverErrors.specialty
                )}
                required
              />
              {(specialtyError || serverErrors.specialty) && (
                <span className="field-error">
                  {specialtyError || serverErrors.specialty}
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

            <FormActions
              saving={saving}
              saveDisabled={saveDisabled}
              onCancel={clearDoctorForm}
              saveText={editingDoctor ? "Update Doctor" : "Save Doctor"}
            />
          </FormCard>
        </Modal>
      )}

      {loading ? (
        <p className="loading-state">Loading doctors...</p>
      ) : (
      <div className="table-card">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Specialty</th>
              <th>Cedula</th>
              <th>Status</th>
              {canManageDoctors && <th>Actions</th>}
            </tr>
          </thead>

          <tbody>
            {doctors.length === 0 ? (
              <EmptyState
                message="No doctors found."
                colSpan={canManageDoctors ? 5 : 4}
              />
            ) : (
            doctors.map((doctor) => (
              <tr key={doctor.id}>
                <td>{doctor.name}</td>
                <td>{doctor.specialty}</td>
                <td>{doctor.cedula}</td>
                <td>
                  <StatusBadge active={doctor.isActive} />
                </td>
                {canManageDoctors && (
                  <td>
                    <button
                      disabled={!doctor.isActive}
                      onClick={() => handleEdit(doctor)}
                    >
                      Edit
                    </button>
                    {doctor.isActive ? (
                      <button onClick={() => setDoctorToDeactivate(doctor)}>
                        Deactivate
                      </button>
                    ) : (
                      <button
                        className="activate-button"
                        onClick={() => handleActivateDoctor(doctor)}
                      >
                        Activate
                      </button>
                    )}
                  </td>
                )}
              </tr>
            )))}
          </tbody>
        </table>
      </div>
      )}
      
      {doctorToDeactivate && (
        <ConfirmModal
          title="Deactivate doctor?"
          message={
            <>
              Are you sure you want to deactivate{" "}
              <strong>{doctorToDeactivate.name}</strong>?
            </>
          }
          warning="Inactive doctors cannot be assigned to new appointments."
          confirmText="Deactivate"
          reversible
          onCancel={() => setDoctorToDeactivate(null)}
          onConfirm={confirmDeactivateDoctor}
        />
      )}
    </section>
  );
}

export default DoctorsPage;
