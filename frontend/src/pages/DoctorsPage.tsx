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

function DoctorsPage() {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [name, setName] = useState("");
  const [specialty, setSpecialty] = useState("");
  const [cedula, setCedula] = useState("");
  const [editingDoctor, setEditingDoctor] = useState<Doctor | null>(null);
  const [doctorToDeactivate, setDoctorToDeactivate] = useState<Doctor | null>(null);

  const role = localStorage.getItem("role");
  const canManageDoctors = role === "Admin";

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

    try {
        if (editingDoctor) {
        await updateDoctor({
            id: editingDoctor.id,
            name,
            specialty,
            cedula,
            isActive: editingDoctor.isActive,
        });
        toast.success("Doctor updated successfully");
        } else {
        await createDoctor({
            name,
            specialty,
            cedula,
        });
        toast.success("Doctor created successfully");
        }

        setName("");
        setSpecialty("");
        setCedula("");
        setEditingDoctor(null);
        await loadDoctors();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Error saving doctor";
      toast.error(message);
    }
  }

  function handleEdit(doctor: Doctor) {
    setEditingDoctor(doctor);
    setName(doctor.name);
    setSpecialty(doctor.specialty);
    setCedula(doctor.cedula);
  }

  function clearDoctorForm() {
    setEditingDoctor(null);
    setName("");
    setSpecialty("");
    setCedula("");
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

      {canManageDoctors && (
        <form onSubmit={handleSubmit} className="form-card">
          <h2>{editingDoctor ? "Edit Doctor" : "Add Doctor"}</h2>

          <input
            type="text"
            placeholder="Doctor name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            required
          />

          <input
            type="text"
            placeholder="Specialty"
            value={specialty}
            onChange={(event) => setSpecialty(event.target.value)}
            required
          />

          <input
            type="text"
            placeholder="Cedula"
            value={cedula}
            onChange={(event) => setCedula(event.target.value)}
            required
          />

          <button type="submit">
            {editingDoctor ? "Update Doctor" : "Add Doctor"}
          </button>

          {editingDoctor && (
            <button
              type="button"
              className="secondary-button"
              onClick={clearDoctorForm}
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
              <th>Specialty</th>
              <th>Cedula</th>
              <th>Status</th>
              {canManageDoctors && <th>Actions</th>}
            </tr>
          </thead>

          <tbody>
            {doctors.length === 0 ? (
                <tr>
                    <td colSpan={canManageDoctors ? 5 : 4} className="empty-state">
                        No doctors found.
                    </td>
                </tr>
            ) : (
            doctors.map((doctor) => (
              <tr key={doctor.id}>
                <td>{doctor.name}</td>
                <td>{doctor.specialty}</td>
                <td>{doctor.cedula}</td>
                <td>
                  <span
                    className={`entity-status ${
                      doctor.isActive ? "entity-status-active" : "entity-status-inactive"
                    }`}
                  >
                    {doctor.isActive ? "Active" : "Inactive"}
                  </span>
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
