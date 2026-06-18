import { useEffect, useState } from "react";
import {
  createDoctor,
  deleteDoctor,
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
  const [doctorToDelete, setDoctorToDelete] = useState<Doctor | null>(null);

  const role = localStorage.getItem("role");
  const canManageDoctors = role === "Admin";

  async function loadDoctors() {
    try {
      const data = await getDoctors();
      setDoctors(data);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Error loading doctors";
      toast.error(message);
    }
  }

  useEffect(() => {
    loadDoctors();
  }, []);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    try {
        if (editingDoctor) {
        await updateDoctor({
            id: editingDoctor.id,
            name,
            specialty,
            cedula,
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

  async function confirmDeleteDoctor() {
    if (!doctorToDelete) {
      return;
    }

    try {
      await deleteDoctor(doctorToDelete.id);
      toast.success("Doctor deleted successfully");
      setDoctorToDelete(null);
      await loadDoctors();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to delete doctor";
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
              onClick={() => {
                setEditingDoctor(null);
                setName("");
                setSpecialty("");
                setCedula("");
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
              <th>Specialty</th>
              <th>Cedula</th>
              {canManageDoctors && <th>Actions</th>}
            </tr>
          </thead>

          <tbody>
            {doctors.length === 0 ? (
                <tr>
                    <td colSpan={canManageDoctors ? 4 : 3} className="empty-state">
                        No doctors found.
                    </td>
                </tr>
            ) : (
            doctors.map((doctor) => (
              <tr key={doctor.id}>
                <td>{doctor.name}</td>
                <td>{doctor.specialty}</td>
                <td>{doctor.cedula}</td>
                {canManageDoctors && (
                  <td>
                    <button onClick={() => handleEdit(doctor)}>Edit</button>
                    <button onClick={() => setDoctorToDelete(doctor)}>
                      Delete
                    </button>
                  </td>
                )}
              </tr>
            )))}
          </tbody>
        </table>
      </div>
      
      {doctorToDelete && (
        <ConfirmModal
          title="Delete doctor?"
          message={
            <>
              Are you sure you want to delete{" "}
              <strong>{doctorToDelete.name}</strong>?
            </>
          }
          warning="If this doctor has appointments, deletion may fail. Reassign or cancel appointments first."
          confirmText="Delete"
          onCancel={() => setDoctorToDelete(null)}
          onConfirm={confirmDeleteDoctor}
        />
      )}
    </section>
  );
}

export default DoctorsPage;