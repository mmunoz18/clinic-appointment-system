import { useEffect, useState } from "react";
import {
  createAppointment,
  deleteAppointment,
  getAppointments,
  getDoctors,
  getPatients,
  updateAppointment,
  type Appointment,
  type Doctor,
  type Patient,
} from "../api/clinicApi";
import { toast } from "react-toastify";

function AppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);

  const [doctorId, setDoctorId] = useState("");
  const [patientId, setPatientId] = useState("");
  const [appointmentDate, setAppointmentDate] = useState("");
  const [status, setStatus] = useState("Scheduled");
  const [editingAppointment, setEditingAppointment] =
    useState<Appointment | null>(null);

  async function loadData() {
    const [appointmentsData, doctorsData, patientsData] = await Promise.all([
      getAppointments(),
      getDoctors(),
      getPatients(),
    ]);

    setAppointments(appointmentsData);
    setDoctors(doctorsData);
    setPatients(patientsData);
  }

  useEffect(() => {
    loadData();
  }, []);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    const appointmentPayload = {
      doctorId: Number(doctorId),
      patientId: Number(patientId),
      appointmentDate,
      status,
    };

    try {
      if (editingAppointment) {
        await updateAppointment({
          ...appointmentPayload,
          id: editingAppointment.id,
          doctorName: editingAppointment.doctorName,
          patientName: editingAppointment.patientName,
        });
        toast.success("Appointment updated successfully");
      } else {
        await createAppointment(appointmentPayload);
        toast.success("Appointment created successfully");
      }

      setDoctorId("");
      setPatientId("");
      setAppointmentDate("");
      setStatus("Scheduled");
      setEditingAppointment(null);
      await loadData();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Something went wrong";

      toast.error(message);
    }
  }

  function handleEdit(appointment: Appointment) {
    setEditingAppointment(appointment);
    setDoctorId(String(appointment.doctorId));
    setPatientId(String(appointment.patientId));
    setAppointmentDate(appointment.appointmentDate.slice(0, 16));
    setStatus(appointment.status);
  }

  async function handleDelete(id: number) {
    const confirmed = window.confirm(
        "Are you sure you want to delete this appointment? This action cannot be undone."
    );

    if (!confirmed) {
        return;
    }

    try {
        await deleteAppointment(id);
        toast.success("Appointment deleted successfully");
        await loadData();
    } catch (error) {
        const message =
        error instanceof Error ? error.message : "Error deleting appointment";

        toast.error(message);
    }
}

  return (
    <section>
      <div className="page-header">
        <h1>Appointments</h1>
        <p>Schedule and manage clinic appointments.</p>
      </div>

      <form onSubmit={handleSubmit} className="form-card">
        <h2>{editingAppointment ? "Edit Appointment" : "Add Appointment"}</h2>

        <select
          value={doctorId}
          onChange={(event) => setDoctorId(event.target.value)}
          required
        >
          <option value="">Select doctor</option>
          {doctors.map((doctor) => (
            <option key={doctor.id} value={doctor.id}>
              {doctor.name} - {doctor.specialty}
            </option>
          ))}
        </select>

        <select
          value={patientId}
          onChange={(event) => setPatientId(event.target.value)}
          required
        >
          <option value="">Select patient</option>
          {patients.map((patient) => (
            <option key={patient.id} value={patient.id}>
              {patient.name}
            </option>
          ))}
        </select>

        <input
          type="datetime-local"
          value={appointmentDate}
          onChange={(event) => setAppointmentDate(event.target.value)}
          required
        />

        <select
          value={status}
          onChange={(event) => setStatus(event.target.value)}
        >
          <option value="Scheduled">Scheduled</option>
          <option value="Cancelled">Cancelled</option>
          <option value="Completed">Completed</option>
        </select>

        <button type="submit">
          {editingAppointment ? "Update Appointment" : "Add Appointment"}
        </button>

        {editingAppointment && (
          <button
            type="button"
            onClick={() => {
              setEditingAppointment(null);
              setDoctorId("");
              setPatientId("");
              setAppointmentDate("");
              setStatus("Scheduled");
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
              <th>Doctor</th>
              <th>Patient</th>
              <th>Date</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>

          <tbody>
            {appointments.map((appointment) => (
              <tr key={appointment.id}>
                <td>{appointment.doctorName}</td>
                <td>{appointment.patientName}</td>
                <td>{new Date(appointment.appointmentDate).toLocaleString()}</td>
                <td>
                  <span className="status">{appointment.status}</span>
                </td>
                <td>
                  <button onClick={() => handleEdit(appointment)}>Edit</button>
                  <button onClick={() => handleDelete(appointment.id)}>
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

export default AppointmentsPage;