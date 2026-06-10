import { useEffect, useState } from "react";
import {
  createDoctor,
  deleteDoctor,
  getDoctors,
  updateDoctor,
  type Doctor,
} from "../api/clinicApi";

function DoctorsPage() {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [name, setName] = useState("");
  const [specialty, setSpecialty] = useState("");
  const [editingDoctor, setEditingDoctor] = useState<Doctor | null>(null);

  async function loadDoctors() {
    const data = await getDoctors();
    setDoctors(data);
  }

  useEffect(() => {
    loadDoctors();
  }, []);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    if (editingDoctor) {
      await updateDoctor({
        id: editingDoctor.id,
        name,
        specialty,
      });
    } else {
      await createDoctor({
        name,
        specialty,
      });
    }

    setName("");
    setSpecialty("");
    setEditingDoctor(null);
    await loadDoctors();
  }

  function handleEdit(doctor: Doctor) {
    setEditingDoctor(doctor);
    setName(doctor.name);
    setSpecialty(doctor.specialty);
  }

  async function handleDelete(id: number) {
    await deleteDoctor(id);
    await loadDoctors();
  }

  return (
    <section>
      <div className="page-header">
        <h1>Doctors</h1>
        <p>View and manage clinic doctors.</p>
      </div>

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
              <th>Specialty</th>
              <th>Actions</th>
            </tr>
          </thead>

          <tbody>
            {doctors.map((doctor) => (
              <tr key={doctor.id}>
                <td>{doctor.name}</td>
                <td>{doctor.specialty}</td>
                <td>
                  <button onClick={() => handleEdit(doctor)}>Edit</button>
                  <button onClick={() => handleDelete(doctor.id)}>
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

export default DoctorsPage;