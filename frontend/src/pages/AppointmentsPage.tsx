import { useEffect, useState } from "react";
import {
  createAppointment,
  deleteAppointment,
  getAppointments,
  getDoctorAvailability,
  getDoctors,
  getPatients,
  updateAppointment,
  type Appointment,
  type Doctor,
  type DoctorAvailability,
  type Patient,
} from "../api/clinicApi";
import { toast } from "react-toastify";
import ConfirmModal from "../components/ConfirmModal";
import EmptyState from "../components/EmptyState";
import FormActions from "../components/FormActions";
import FormCard from "../components/FormCard";
import Modal from "../components/Modal";
import AppointmentStatusBadge from "../components/AppointmentStatusBadge";
import StatusBadge from "../components/StatusBadge";

function AppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [doctorAvailability, setDoctorAvailability] = useState<
    DoctorAvailability[]
  >([]);
  const [loadingAvailability, setLoadingAvailability] = useState(false);

  const [doctorId, setDoctorId] = useState("");
  const [patientId, setPatientId] = useState("");
  const [appointmentDate, setAppointmentDate] = useState("");
  const [status, setStatus] = useState("Scheduled");
  const [editingAppointment, setEditingAppointment] =
    useState<Appointment | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [appointmentToDelete, setAppointmentToDelete] = useState<Appointment | null>(null);
  const [appointmentToComplete, setAppointmentToComplete] =
    useState<Appointment | null>(null);
  
  const role = localStorage.getItem("role");
  const canCreateAppointments = role === "Admin" || role === "Receptionist";
  const canDeleteAppointments = role === "Admin" || role === "Receptionist";
  const canEditAppointments = role === "Admin" || role === "Receptionist" || role === "Doctor";
  const isPastAppointment =
    editingAppointment != null &&
    new Date(editingAppointment.appointmentDate) < new Date();
  const requiredFieldsComplete =
    doctorId !== "" &&
    patientId !== "" &&
    appointmentDate !== "" &&
    status !== "";
  const dateError =
    appointmentDate !== "" &&
    !isPastAppointment &&
    new Date(appointmentDate) <= new Date()
      ? "Appointments must be scheduled in the future."
      : "";
  const appointmentChanged =
    editingAppointment == null ||
    Number(doctorId) !== editingAppointment.doctorId ||
    Number(patientId) !== editingAppointment.patientId ||
    appointmentDate !== editingAppointment.appointmentDate.slice(0, 16) ||
    status !== editingAppointment.status;
  const saveDisabled =
    !requiredFieldsComplete ||
    dateError !== "" ||
    !appointmentChanged ||
    saving;

  async function loadData() {
    setLoading(true);

    try {
      const [appointmentsData, doctorsData, patientsData] = await Promise.all([
        getAppointments(),
        getDoctors(),
        getPatients(),
      ]);

      setAppointments(appointmentsData);
      setDoctors(doctorsData);
      setPatients(patientsData);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Error loading appointments";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    async function loadAppointmentsPage() {
      await loadData();
    }

    loadAppointmentsPage();
  }, []);

  useEffect(() => {
    async function loadSelectedDoctorAvailability() {
      if (!doctorId) {
        setDoctorAvailability([]);
        return;
      }

      setLoadingAvailability(true);

      try {
        setDoctorAvailability(
          await getDoctorAvailability(Number(doctorId))
        );
      } catch (error) {
        setDoctorAvailability([]);
        const message =
          error instanceof Error
            ? error.message
            : "Error loading doctor availability";
        toast.error(message);
      } finally {
        setLoadingAvailability(false);
      }
    }

    loadSelectedDoctorAvailability();
  }, [doctorId]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    if (saveDisabled) {
      return;
    }

    const appointmentPayload = {
      doctorId:
        isPastAppointment && editingAppointment
          ? editingAppointment.doctorId
          : Number(doctorId),
      patientId:
        isPastAppointment && editingAppointment
          ? editingAppointment.patientId
          : Number(patientId),
      appointmentDate:
        isPastAppointment && editingAppointment
          ? editingAppointment.appointmentDate
          : appointmentDate,
      status,
    };

    if (editingAppointment && status === "Completed") {
      setAppointmentToComplete({
        ...appointmentPayload,
        id: editingAppointment.id,
        doctorName: editingAppointment.doctorName,
        patientName: editingAppointment.patientName,
      });
      clearAppointmentForm();
      return;
    }

    setSaving(true);

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

      clearAppointmentForm();
      await loadData();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Something went wrong";
      toast.error(message);
    } finally {
      setSaving(false);
    }
  }

  function handleAddAppointment() {
    clearAppointmentForm();
    setIsFormOpen(true);
  }

  function handleEdit(appointment: Appointment) {
    setEditingAppointment(appointment);
    setDoctorId(String(appointment.doctorId));
    setPatientId(String(appointment.patientId));
    setAppointmentDate(appointment.appointmentDate.slice(0, 16));
    setStatus(appointment.status);
    setIsFormOpen(true);
  }

  function clearAppointmentForm() {
    setEditingAppointment(null);
    setDoctorId("");
    setPatientId("");
    setAppointmentDate("");
    setStatus("Scheduled");
    setDoctorAvailability([]);
    setIsFormOpen(false);
  }

  async function confirmDeleteAppointment() {
    if (!appointmentToDelete) {
        return;
    }

    try {
        await deleteAppointment(appointmentToDelete.id);
        toast.success("Appointment deleted successfully");
        setAppointmentToDelete(null);
        await loadData();
    } catch (error) {
        const message = error instanceof Error ? error.message : "Error deleting appointment";
        toast.error(message);
    }
}

  async function confirmCompleteAppointment() {
    if (!appointmentToComplete) {
      return;
    }

    try {
      await updateAppointment({
        ...appointmentToComplete,
        status: "Completed",
      });
      toast.success("Appointment marked as completed");
      setAppointmentToComplete(null);
      await loadData();
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Error completing appointment";
      toast.error(message);
    }
  }

  return (
    <section>
      <div className="page-header">
        <h1>Appointments</h1>
        <p>Schedule and manage clinic appointments.</p>
      </div>


      {canCreateAppointments && !isFormOpen && (
        <button
          type="button"
          className="add-record-button"
          onClick={handleAddAppointment}
        >
          + New Appointment
        </button>
      )}

      {isFormOpen && (
        <Modal
          titleId="appointment-form-modal-title"
          title={editingAppointment ? "Edit Appointment" : "New Appointment"}
          onClose={() => {
            if (!saving) {
              clearAppointmentForm();
            }
          }}
        >
          <FormCard onSubmit={handleSubmit}>
            {isPastAppointment && (
              <div className="form-info-message">
                This appointment is in the past. Only its status can be edited.
              </div>
            )}

            <div className="appointment-doctor-field">
              <label>
                <span>Doctor</span>
                <select
                  value={doctorId}
                  disabled={isPastAppointment}
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
              </label>

              {doctorId && !isPastAppointment && (
                <DoctorAvailabilityPreview
                  doctor={doctors.find(
                    (doctor) => doctor.id === Number(doctorId)
                  )}
                  availability={doctorAvailability}
                  loading={loadingAvailability}
                />
              )}
            </div>

            <label>
              <span>Patient</span>
              <select
                value={patientId}
                disabled={isPastAppointment}
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
            </label>

            <label>
              <span>Date</span>
              <input
                type="datetime-local"
                value={appointmentDate}
                disabled={isPastAppointment}
                min={editingAppointment ? undefined : new Date().toISOString().slice(0, 16)}
                onChange={(event) => setAppointmentDate(event.target.value)}
                aria-invalid={dateError !== ""}
                aria-describedby={dateError ? "appointment-date-error" : undefined}
                required
              />
              {dateError && (
                <span id="appointment-date-error" className="field-error">
                  {dateError}
                </span>
              )}
            </label>

            {editingAppointment && (
              <label>
                <span>Status</span>
                <select
                  value={status}
                  onChange={(event) => setStatus(event.target.value)}
                >
                  <option value="Scheduled">Scheduled</option>
                  <option value="Cancelled">Cancelled</option>
                  {(editingAppointment.status === "Scheduled" ||
                    (isPastAppointment &&
                      editingAppointment.status === "Cancelled")) && (
                    <option value="Completed">Completed</option>
                  )}
                </select>
              </label>
            )}

            <FormActions
              saving={saving}
              saveDisabled={saveDisabled}
              onCancel={clearAppointmentForm}
              saveText={
                editingAppointment
                  ? "Update Appointment"
                  : "Save Appointment"
              }
            />
          </FormCard>
        </Modal>
      )}

      {loading ? (
        <p className="loading-state">Loading appointments...</p>
      ) : (
      <div className="table-card">
        <table>
          <thead>
            <tr>
              <th>Doctor</th>
              <th>Patient</th>
              <th>Date</th>
              <th>Status</th>
              {canEditAppointments && <th>Actions</th>}
            </tr>
          </thead>

          <tbody>
            {appointments.length === 0 ? (
              <EmptyState
                message="No appointments found."
                colSpan={canEditAppointments ? 5 : 4}
              />
            ) : (
              appointments.map((appointment) => (
                <tr key={appointment.id}>
                  <td>{appointment.doctorName}</td>
                  <td>{appointment.patientName}</td>
                  <td>{new Date(appointment.appointmentDate).toLocaleString("es-ES", {dateStyle: "medium",timeStyle: "short"})}</td>
                  <td>
                    <AppointmentStatusBadge status={appointment.status} />
                  </td>
                  {canEditAppointments && (
                    <td>
                      {appointment.status === "Completed" && (
                        <StatusBadge
                          active={false}
                          inactiveLabel="✓ Finalized"
                        />
                      )}
                      {appointment.status !== "Completed" && (
                        <button onClick={() => handleEdit(appointment)}>
                          Edit
                        </button>
                      )}
                      {appointment.status === "Scheduled" && (
                        <button
                          className="complete-button"
                          onClick={() => setAppointmentToComplete(appointment)}
                        >
                          Mark completed
                        </button>
                      )}
                      {canDeleteAppointments &&
                        appointment.status !== "Completed" && (
                        <button onClick={() => setAppointmentToDelete(appointment)}>
                          Delete
                        </button>
                      )}
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      )}
      
      {appointmentToDelete && (
        <ConfirmModal
          title="Delete appointment?"
          message={
            <>
              Are you sure you want to delete appointment with{" "}
              <strong>{appointmentToDelete.doctorName}</strong> and{" "}
              <strong>{appointmentToDelete.patientName}</strong>?
            </>
          }
          confirmText="Delete"
          onCancel={() => setAppointmentToDelete(null)}
          onConfirm={confirmDeleteAppointment}
        />
      )}

      {appointmentToComplete && (
        <ConfirmModal
          title="Mark appointment as completed?"
          message="Once completed, the appointment can no longer be edited or deleted."
          confirmText="Mark completed"
          onCancel={() => setAppointmentToComplete(null)}
          onConfirm={confirmCompleteAppointment}
        />
      )}
    </section>
  );
}

export default AppointmentsPage;

const availabilityDays = [
  { dayOfWeek: 1, label: "Monday" },
  { dayOfWeek: 2, label: "Tuesday" },
  { dayOfWeek: 3, label: "Wednesday" },
  { dayOfWeek: 4, label: "Thursday" },
  { dayOfWeek: 5, label: "Friday" },
  { dayOfWeek: 6, label: "Saturday" },
  { dayOfWeek: 0, label: "Sunday" },
];

type DoctorAvailabilityPreviewProps = {
  doctor?: Doctor;
  availability: DoctorAvailability[];
  loading: boolean;
};

function DoctorAvailabilityPreview({
  doctor,
  availability,
  loading,
}: DoctorAvailabilityPreviewProps) {
  return (
    <div className="appointment-availability-preview">
      <strong>{doctor?.name ?? "Doctor"} availability</strong>

      {loading ? (
        <p>Loading availability...</p>
      ) : (
        <div className="appointment-availability-days">
          {availabilityDays.map((day) => {
            const windows = availability
              .filter((item) => item.dayOfWeek === day.dayOfWeek)
              .sort((a, b) => a.startTime.localeCompare(b.startTime));

            return (
              <p key={day.dayOfWeek}>
                <span>{day.label}:</span>{" "}
                {windows.length === 0
                  ? "Unavailable"
                  : windows
                      .map(
                        (window) =>
                          `${window.startTime.slice(0, 5)}-${window.endTime.slice(0, 5)}`
                      )
                      .join(", ")}
              </p>
            );
          })}
        </div>
      )}
    </div>
  );
}
