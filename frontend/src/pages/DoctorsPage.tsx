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
  const [name, setName] = useState("");
  const [specialty, setSpecialty] = useState("");
  const [cedula, setCedula] = useState("");
  const [editingDoctor, setEditingDoctor] = useState<Doctor | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [doctorToDeactivate, setDoctorToDeactivate] = useState<Doctor | null>(null);

  const role = localStorage.getItem("role");
  const canManageDoctors = role === "Admin";
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
    !doctorChanged ||
    saving;

  const loadDoctors = useCallback(async () => {
    try {
      const data = await getDoctors(canManageDoctors);
      setDoctors(data);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Error loading doctors";
      toast.error(message);
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
                onChange={(event) => setName(event.target.value)}
                required
              />
            </label>

            <label>
              <span>Specialty</span>
              <input
                type="text"
                value={specialty}
                onChange={(event) => setSpecialty(event.target.value)}
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

            <FormActions
              saving={saving}
              saveDisabled={saveDisabled}
              onCancel={clearDoctorForm}
              saveText={editingDoctor ? "Update Doctor" : "Save Doctor"}
            />
          </FormCard>
        </Modal>
      )}

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
