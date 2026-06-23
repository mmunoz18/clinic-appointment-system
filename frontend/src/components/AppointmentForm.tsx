import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import {
  getDoctorAvailability,
  type Appointment,
  type Doctor,
  type DoctorAvailability,
  type Patient,
} from "../api/clinicApi";
import DoctorAvailabilityPreview from "./DoctorAvailabilityPreview";
import FormActions from "./FormActions";
import FormCard from "./FormCard";

export type AppointmentFormValues = {
  doctorId: number;
  patientId: number;
  appointmentDate: string;
  status: string;
};

type AppointmentFormProps = {
  doctors: Doctor[];
  patients: Patient[];
  appointment?: Appointment | null;
  initialDate?: string;
  initialTime?: string;
  saving: boolean;
  onCancel: () => void;
  onSubmit: (values: AppointmentFormValues) => void | Promise<void>;
};

function AppointmentForm({
  doctors,
  patients,
  appointment = null,
  initialDate = "",
  initialTime = "",
  saving,
  onCancel,
  onSubmit,
}: AppointmentFormProps) {
  const [doctorId, setDoctorId] = useState(
    appointment ? String(appointment.doctorId) : ""
  );
  const [patientId, setPatientId] = useState(
    appointment ? String(appointment.patientId) : ""
  );
  const [date, setDate] = useState(
    appointment?.appointmentDate.slice(0, 10) ?? initialDate
  );
  const [time, setTime] = useState(
    appointment?.appointmentDate.slice(11, 16) ?? initialTime
  );
  const [status, setStatus] = useState(
    appointment?.status ?? "Scheduled"
  );
  const [availability, setAvailability] = useState<
    DoctorAvailability[]
  >([]);
  const [loadingAvailability, setLoadingAvailability] = useState(false);

  const isPast =
    appointment != null &&
    new Date(appointment.appointmentDate) < new Date();
  const dateTime = date && time ? `${date}T${time}` : "";
  const dateError =
    dateTime &&
    !isPast &&
    new Date(dateTime) <= new Date()
      ? "Appointments must be scheduled in the future."
      : "";
  const hasChanges =
    appointment == null ||
    Number(doctorId) !== appointment.doctorId ||
    Number(patientId) !== appointment.patientId ||
    date !== appointment.appointmentDate.slice(0, 10) ||
    time !== appointment.appointmentDate.slice(11, 16) ||
    status !== appointment.status;
  const saveDisabled =
    !doctorId ||
    !patientId ||
    !date ||
    !time ||
    dateError !== "" ||
    !hasChanges ||
    saving;

  useEffect(() => {
    if (!doctorId || isPast) {
      return;
    }

    async function loadAvailability() {
      setLoadingAvailability(true);

      try {
        setAvailability(
          await getDoctorAvailability(Number(doctorId))
        );
      } catch (error) {
        setAvailability([]);
        const message =
          error instanceof Error
            ? error.message
            : "Error loading doctor availability";
        toast.error(message);
      } finally {
        setLoadingAvailability(false);
      }
    }

    void loadAvailability();
  }, [doctorId, isPast]);

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    if (saveDisabled) {
      return;
    }

    void onSubmit({
      doctorId:
        isPast && appointment
          ? appointment.doctorId
          : Number(doctorId),
      patientId:
        isPast && appointment
          ? appointment.patientId
          : Number(patientId),
      appointmentDate:
        isPast && appointment
          ? appointment.appointmentDate
          : dateTime,
      status,
    });
  }

  return (
    <FormCard onSubmit={handleSubmit}>
      {isPast && (
        <div className="form-info-message">
          This appointment is in the past. Only its status can be edited.
        </div>
      )}

      <div className="appointment-doctor-field">
        <label>
          <span>Doctor</span>
          <select
            value={doctorId}
            disabled={isPast}
            onChange={(event) => {
              setDoctorId(event.target.value);
              setAvailability([]);
            }}
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

        {doctorId && !isPast && (
          <DoctorAvailabilityPreview
            doctor={doctors.find(
              (doctor) => doctor.id === Number(doctorId)
            )}
            availability={availability}
            loading={loadingAvailability}
          />
        )}
      </div>

      <label>
        <span>Patient</span>
        <select
          value={patientId}
          disabled={isPast}
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
          type="date"
          value={date}
          disabled={isPast}
          onChange={(event) => setDate(event.target.value)}
          aria-invalid={dateError !== ""}
          aria-describedby={
            dateError ? "appointment-date-error" : undefined
          }
          required
        />
      </label>

      <label>
        <span>Time</span>
        <input
          type="time"
          value={time}
          disabled={isPast}
          onChange={(event) => setTime(event.target.value)}
          aria-invalid={dateError !== ""}
          aria-describedby={
            dateError ? "appointment-date-error" : undefined
          }
          required
        />
        {dateError && (
          <span id="appointment-date-error" className="field-error">
            {dateError}
          </span>
        )}
      </label>

      {appointment && (
        <label>
          <span>Status</span>
          <select
            value={status}
            onChange={(event) => setStatus(event.target.value)}
          >
            <option value="Scheduled">Scheduled</option>
            <option value="Cancelled">Cancelled</option>
            {(appointment.status === "Scheduled" ||
              (isPast && appointment.status === "Cancelled")) && (
              <option value="Completed">Completed</option>
            )}
          </select>
        </label>
      )}

      <FormActions
        saving={saving}
        saveDisabled={saveDisabled}
        onCancel={onCancel}
        saveText={
          appointment ? "Update Appointment" : "Save Appointment"
        }
      />
    </FormCard>
  );
}

export default AppointmentForm;
