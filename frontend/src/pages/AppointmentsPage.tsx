import { useCallback, useEffect, useState } from "react";
import {
  createAppointment,
  deleteAppointment,
  getAppointmentsPaged,
  getDoctors,
  getPatients,
  sendAppointmentReminder,
  updateAppointment,
  type Appointment,
  type Doctor,
  type Patient,
} from "../api/clinicApi";
import { toast } from "react-toastify";
import ConfirmModal from "../components/ConfirmModal";
import EmptyState from "../components/EmptyState";
import Modal from "../components/Modal";
import AppointmentStatusBadge from "../components/AppointmentStatusBadge";
import StatusBadge from "../components/StatusBadge";
import Pagination from "../components/Pagination";
import { formatDateTime } from "../utils/dateTime";
import ReminderStatusBadge from "../components/ReminderStatusBadge";
import TableActions from "../components/TableActions";
import AppointmentForm, {
  type AppointmentFormValues,
} from "../components/AppointmentForm";
import PageHeader from "../components/PageHeader";

function AppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingAppointment, setEditingAppointment] =
    useState<Appointment | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [appointmentToDelete, setAppointmentToDelete] = useState<Appointment | null>(null);
  const [appointmentToComplete, setAppointmentToComplete] =
    useState<Appointment | null>(null);
  const [filterDoctorId, setFilterDoctorId] = useState("");
  const [filterPatientId, setFilterPatientId] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [sendingReminderId, setSendingReminderId] = useState<number | null>(
    null
  );
  const [cancellingAppointmentId, setCancellingAppointmentId] = useState<
    number | null
  >(null);
  
  const role = localStorage.getItem("role");
  const canCreateAppointments = role === "Admin" || role === "Receptionist";
  const canDeleteAppointments = role === "Admin" || role === "Receptionist";
  const canEditAppointments = role === "Admin" || role === "Receptionist" || role === "Doctor";

  const loadAppointments = useCallback(async () => {
    setLoading(true);

    try {
      const data = await getAppointmentsPaged({
        doctorId: filterDoctorId ? Number(filterDoctorId) : undefined,
        patientId: filterPatientId ? Number(filterPatientId) : undefined,
        status: filterStatus || undefined,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
        page,
      });

      if (data.totalPages > 0 && page > data.totalPages) {
        setPage(data.totalPages);
        return;
      }

      setAppointments(data.items);
      setTotalPages(data.totalPages);
      setTotalCount(data.totalCount);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Error loading appointments";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, [
    dateFrom,
    dateTo,
    filterDoctorId,
    filterPatientId,
    filterStatus,
    page,
  ]);

  useEffect(() => {
    async function loadLookups() {
      try {
        const [doctorsData, patientsData] = await Promise.all([
          getDoctors(),
          getPatients(),
        ]);
        setDoctors(doctorsData);
        setPatients(patientsData);
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Error loading form options";
        toast.error(message);
      }
    }

    loadLookups();
  }, []);

  useEffect(() => {
    async function loadAppointmentsPage() {
      await loadAppointments();
    }

    loadAppointmentsPage();
  }, [loadAppointments]);

  async function handleSubmit(values: AppointmentFormValues) {
    if (editingAppointment && values.status === "Completed") {
      setAppointmentToComplete({
        ...values,
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
          ...values,
          id: editingAppointment.id,
          doctorName: editingAppointment.doctorName,
          patientName: editingAppointment.patientName,
        });
        toast.success("Appointment updated successfully");
      } else {
        await createAppointment(values);
        toast.success("Appointment created successfully");
      }

      clearAppointmentForm();
      await loadAppointments();
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
    setIsFormOpen(true);
  }

  function clearAppointmentForm() {
    setEditingAppointment(null);
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
        await loadAppointments();
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
      await loadAppointments();
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Error completing appointment";
      toast.error(message);
    }
  }

  async function handleSendReminder(appointment: Appointment) {
    if (sendingReminderId != null) {
      return;
    }

    setSendingReminderId(appointment.id);

    try {
      const result = await sendAppointmentReminder(appointment.id);
      toast.success(result.message);
      await loadAppointments();
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Error sending appointment reminder";
      toast.error(message);
    } finally {
      setSendingReminderId(null);
    }
  }

  async function handleCancelAppointment(appointment: Appointment) {
    if (cancellingAppointmentId != null) {
      return;
    }

    setCancellingAppointmentId(appointment.id);

    try {
      await updateAppointment({
        ...appointment,
        status: "Cancelled",
      });
      toast.success("Appointment cancelled successfully");
      await loadAppointments();
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Error cancelling appointment";
      toast.error(message);
    } finally {
      setCancellingAppointmentId(null);
    }
  }

  return (
    <section>
      <PageHeader
        title="Appointments"
        description="Schedule and manage clinic appointments."
        action={
          canCreateAppointments && !isFormOpen ? (
            <button
              type="button"
              className="add-record-button"
              onClick={handleAddAppointment}
            >
              + New Appointment
            </button>
          ) : undefined
        }
      />

      <div className="list-filters appointment-filters">
        {role !== "Doctor" && (
          <label>
            <span>Doctor</span>
            <select
              value={filterDoctorId}
              onChange={(event) => {
                setFilterDoctorId(event.target.value);
                setPage(1);
              }}
            >
              <option value="">All doctors</option>
              {doctors.map((doctor) => (
                <option key={doctor.id} value={doctor.id}>
                  {doctor.name}
                </option>
              ))}
            </select>
          </label>
        )}

        <label>
          <span>Patient</span>
          <select
            value={filterPatientId}
            onChange={(event) => {
              setFilterPatientId(event.target.value);
              setPage(1);
            }}
          >
            <option value="">All patients</option>
            {patients.map((patient) => (
              <option key={patient.id} value={patient.id}>
                {patient.name}
              </option>
            ))}
          </select>
        </label>

        <label>
          <span>Status</span>
          <select
            value={filterStatus}
            onChange={(event) => {
              setFilterStatus(event.target.value);
              setPage(1);
            }}
          >
            <option value="">All statuses</option>
            <option value="Scheduled">Scheduled</option>
            <option value="Completed">Completed</option>
            <option value="Cancelled">Cancelled</option>
          </select>
        </label>

        <label>
          <span>From</span>
          <input
            type="date"
            value={dateFrom}
            onChange={(event) => {
              setDateFrom(event.target.value);
              setPage(1);
            }}
          />
        </label>

        <label>
          <span>To</span>
          <input
            type="date"
            value={dateTo}
            min={dateFrom || undefined}
            onChange={(event) => {
              setDateTo(event.target.value);
              setPage(1);
            }}
          />
        </label>

        <button
          type="button"
          className="secondary-button clear-filters-button"
          disabled={
            !filterDoctorId &&
            !filterPatientId &&
            !filterStatus &&
            !dateFrom &&
            !dateTo
          }
          onClick={() => {
            setFilterDoctorId("");
            setFilterPatientId("");
            setFilterStatus("");
            setDateFrom("");
            setDateTo("");
            setPage(1);
          }}
        >
          Clear filters
        </button>
      </div>

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
          <AppointmentForm
            key={editingAppointment?.id ?? "new-appointment"}
            doctors={doctors}
            patients={patients}
            appointment={editingAppointment}
            saving={saving}
            onCancel={clearAppointmentForm}
            onSubmit={handleSubmit}
          />
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
              <th>Reminder</th>
              {canEditAppointments && <th>Actions</th>}
            </tr>
          </thead>

          <tbody>
            {appointments.length === 0 ? (
              <EmptyState
                message="No appointments found."
                colSpan={canEditAppointments ? 6 : 5}
              />
            ) : (
              appointments.map((appointment) => (
                <tr key={appointment.id}>
                  <td>{appointment.doctorName}</td>
                  <td>{appointment.patientName}</td>
                  <td>{formatDateTime(appointment.appointmentDate)}</td>
                  <td>
                    <AppointmentStatusBadge status={appointment.status} />
                  </td>
                  <td>
                    <ReminderStatusBadge
                      status={appointment.reminderStatus}
                    />
                  </td>
                  {canEditAppointments && (
                    <td>
                      <TableActions
                        status={
                          appointment.status === "Completed" ? (
                            <StatusBadge
                              active={false}
                              inactiveLabel="✓ Finalized"
                            />
                          ) : undefined
                        }
                        primaryActions={[
                          ...(appointment.status !== "Completed"
                            ? [
                                {
                                  label: "Edit",
                                  onClick: () => handleEdit(appointment),
                                },
                              ]
                            : []),
                          ...(appointment.status === "Scheduled"
                            ? [
                                {
                                  label: "Complete",
                                  tone: "positive" as const,
                                  onClick: () =>
                                    setAppointmentToComplete(appointment),
                                },
                              ]
                            : []),
                        ]}
                        menuActions={[
                          ...(canCreateAppointments &&
                          appointment.status === "Scheduled" &&
                          new Date(appointment.appointmentDate) > new Date()
                            ? [
                                {
                                  label:
                                    sendingReminderId === appointment.id
                                      ? "Sending..."
                                      : "Send Reminder",
                                  disabled: sendingReminderId != null,
                                  onClick: () =>
                                    void handleSendReminder(appointment),
                                },
                              ]
                            : []),
                          ...(appointment.status === "Scheduled"
                            ? [
                                {
                                  label:
                                    cancellingAppointmentId === appointment.id
                                      ? "Cancelling..."
                                      : "Cancel Appointment",
                                  tone: "info" as const,
                                  disabled: cancellingAppointmentId != null,
                                  onClick: () =>
                                    void handleCancelAppointment(appointment),
                                },
                              ]
                            : []),
                          ...(canDeleteAppointments &&
                          appointment.status !== "Completed"
                            ? [
                                {
                                  label: "Delete Appointment",
                                  tone: "danger" as const,
                                  onClick: () =>
                                    setAppointmentToDelete(appointment),
                                },
                              ]
                            : []),
                        ]}
                      />
                    </td>
                  )}
                </tr>
              ))
            )}
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
