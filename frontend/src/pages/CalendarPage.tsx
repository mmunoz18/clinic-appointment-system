import { useEffect, useMemo, useRef, useState } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import esLocale from "@fullcalendar/core/locales/es";
import { toast } from "react-toastify";
import {
  createAppointment,
  deleteAppointment,
  getCalendarAppointments,
  getDoctors,
  getPatients,
  sendAppointmentReminder,
  updateAppointment,
  type Appointment,
  type CalendarAppointment,
  type Doctor,
  type Patient,
} from "../api/clinicApi";
import AppointmentForm, {
  type AppointmentFormValues,
} from "../components/AppointmentForm";
import AppointmentStatusBadge from "../components/AppointmentStatusBadge";
import ConfirmModal from "../components/ConfirmModal";
import Modal from "../components/Modal";
import PageHeader from "../components/PageHeader";
import ReminderStatusBadge from "../components/ReminderStatusBadge";
import TableActions from "../components/TableActions";
import { formatDateTime } from "../utils/dateTime";

const statusColors = {
  Scheduled: {
    backgroundColor: "#dcfce7",
    borderColor: "#86efac",
    textColor: "#166534",
  },
  Completed: {
    backgroundColor: "#dbeafe",
    borderColor: "#93c5fd",
    textColor: "#1e40af",
  },
  Cancelled: {
    backgroundColor: "#fee2e2",
    borderColor: "#fca5a5",
    textColor: "#991b1b",
  },
};

function CalendarPage() {
  const calendarRef = useRef<FullCalendar | null>(null);
  const [appointments, setAppointments] = useState<CalendarAppointment[]>([]);
  const [formDoctors, setFormDoctors] = useState<Doctor[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [doctorId, setDoctorId] = useState("");
  const [visibleStatuses, setVisibleStatuses] = useState({
    Scheduled: true,
    Completed: true,
    Cancelled: true,
  });
  const [selectedAppointment, setSelectedAppointment] =
    useState<CalendarAppointment | null>(null);
  const [appointmentToComplete, setAppointmentToComplete] =
    useState<CalendarAppointment | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [editingAppointment, setEditingAppointment] =
    useState<CalendarAppointment | null>(null);
  const [isCreatingAppointment, setIsCreatingAppointment] =
    useState(false);
  const [initialDate, setInitialDate] = useState("");
  const [initialTime, setInitialTime] = useState("");
  const [saving, setSaving] = useState(false);
  const [sendingReminder, setSendingReminder] = useState(false);
  const [appointmentToDelete, setAppointmentToDelete] =
    useState<CalendarAppointment | null>(null);
  const role = localStorage.getItem("role");
  const canEditAppointmentDetails =
    role === "Admin" || role === "Receptionist";

  async function loadCalendar(showLoading = false) {
    if (showLoading) {
      setLoading(true);
    }

    try {
      const data = await getCalendarAppointments();
      setAppointments(data);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Error loading calendar";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    async function loadInitialCalendar() {
      try {
        const data = await getCalendarAppointments();
        setAppointments(data);
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : "Error loading calendar";
        toast.error(message);
      } finally {
        setLoading(false);
      }
    }

    void loadInitialCalendar();
  }, []);

  useEffect(() => {
    if (!canEditAppointmentDetails) {
      return;
    }

    async function loadFormOptions() {
      try {
        const [doctorData, patientData] = await Promise.all([
          getDoctors(),
          getPatients(),
        ]);
        setFormDoctors(doctorData);
        setPatients(patientData);
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : "Error loading appointment options";
        toast.error(message);
      }
    }

    void loadFormOptions();
  }, [canEditAppointmentDetails]);

  const doctors = useMemo(() => {
    const doctorMap = new Map<number, string>();

    appointments.forEach((appointment) => {
      doctorMap.set(appointment.doctorId, appointment.doctorName);
    });

    return Array.from(doctorMap, ([id, name]) => ({ id, name }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [appointments]);

  const filteredAppointments = useMemo(
    () =>
      appointments.filter(
        (appointment) =>
          (!doctorId || appointment.doctorId === Number(doctorId)) &&
          visibleStatuses[appointment.status]
      ),
    [appointments, doctorId, visibleStatuses]
  );

  const events = useMemo(
    () =>
      filteredAppointments.map((appointment) => ({
        id: String(appointment.id),
        title: appointment.title,
        start: appointment.start,
        end: appointment.end,
        ...statusColors[appointment.status],
        extendedProps: {
          status: appointment.status,
          doctorId: appointment.doctorId,
          patientId: appointment.patientId,
        },
      })),
    [filteredAppointments]
  );

  function getAppointmentPayload(
    appointment: CalendarAppointment
  ): Appointment {
    return {
      id: appointment.id,
      doctorId: appointment.doctorId,
      doctorName: appointment.doctorName,
      patientId: appointment.patientId,
      patientName: appointment.patientName,
      appointmentDate: appointment.start,
      status: appointment.status,
    };
  }

  function handleEditAppointment(appointment: CalendarAppointment) {
    setSelectedAppointment(null);
    setEditingAppointment(appointment);
    setInitialDate("");
    setInitialTime("");
  }

  function handleCreateAppointment(
    prefilledDate = "",
    prefilledTime = ""
  ) {
    setSelectedAppointment(null);
    setEditingAppointment(null);
    setIsCreatingAppointment(true);
    setInitialDate(prefilledDate);
    setInitialTime(prefilledTime);
  }

  function closeEditModal() {
    setEditingAppointment(null);
    setIsCreatingAppointment(false);
    setInitialDate("");
    setInitialTime("");
  }

  async function handleFormSubmit(values: AppointmentFormValues) {
    if (editingAppointment && values.status === "Completed") {
      closeEditModal();
      setAppointmentToComplete({
        ...editingAppointment,
        doctorId: values.doctorId,
        patientId: values.patientId,
        start: values.appointmentDate,
        status: "Completed",
      });
      return;
    }

    setSaving(true);

    try {
      if (editingAppointment) {
        await updateAppointment({
          ...getAppointmentPayload(editingAppointment),
          ...values,
        });
        toast.success("Appointment updated successfully");
      } else {
        await createAppointment(values);
        toast.success("Appointment created successfully");
      }

      closeEditModal();
      await loadCalendar();
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Error updating appointment";
      toast.error(message);
    } finally {
      setSaving(false);
    }
  }

  async function handleCancelAppointment(
    appointment: CalendarAppointment
  ) {
    if (updatingStatus) {
      return;
    }

    setUpdatingStatus(true);

    try {
      await updateAppointment({
        ...getAppointmentPayload(appointment),
        status: "Cancelled",
      });
      toast.success("Appointment cancelled successfully");
      setSelectedAppointment(null);
      await loadCalendar();
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Error cancelling appointment";
      toast.error(message);
    } finally {
      setUpdatingStatus(false);
    }
  }

  async function confirmCompleteAppointment() {
    if (!appointmentToComplete || updatingStatus) {
      return;
    }

    setUpdatingStatus(true);

    try {
      await updateAppointment({
        ...getAppointmentPayload(appointmentToComplete),
        status: "Completed",
      });
      toast.success("Appointment marked as completed");
      setAppointmentToComplete(null);
      await loadCalendar();
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Error completing appointment";
      toast.error(message);
    } finally {
      setUpdatingStatus(false);
    }
  }

  async function handleSendReminder(
    appointment: CalendarAppointment
  ) {
    if (sendingReminder) {
      return;
    }

    setSendingReminder(true);

    try {
      const result = await sendAppointmentReminder(appointment.id);
      toast.success(result.message);
      setSelectedAppointment(null);
      await loadCalendar();
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Error sending appointment reminder";
      toast.error(message);
    } finally {
      setSendingReminder(false);
    }
  }

  async function confirmDeleteAppointment() {
    if (!appointmentToDelete || updatingStatus) {
      return;
    }

    setUpdatingStatus(true);

    try {
      await deleteAppointment(appointmentToDelete.id);
      toast.success("Appointment deleted successfully");
      setAppointmentToDelete(null);
      await loadCalendar();
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Error deleting appointment";
      toast.error(message);
    } finally {
      setUpdatingStatus(false);
    }
  }

  const allStatusesVisible = Object.values(visibleStatuses).every(Boolean);
  const selectedAppointmentCanBeCompleted =
    selectedAppointment?.status === "Scheduled" ||
    (selectedAppointment?.status === "Cancelled" &&
      new Date(selectedAppointment.start) < new Date());
  const editingAppointmentFormValue: Appointment | null =
    editingAppointment
      ? getAppointmentPayload(editingAppointment)
      : null;

  return (
    <section>
      <PageHeader
        title="Calendar"
        description="View clinic appointments by month, week, or day."
        action={
          canEditAppointmentDetails &&
          !editingAppointment &&
          !isCreatingAppointment ? (
            <button
              type="button"
              className="add-record-button"
              onClick={() => handleCreateAppointment()}
            >
              + New Appointment
            </button>
          ) : undefined
        }
      />

      <div className="list-filters calendar-filters">
        {role !== "Doctor" && (
          <label>
            <span>Doctor</span>
            <select
              value={doctorId}
              onChange={(event) => setDoctorId(event.target.value)}
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

        <fieldset className="calendar-status-filters">
          <legend>Status</legend>
          {(["Scheduled", "Completed", "Cancelled"] as const).map(
            (status) => (
              <label key={status}>
                <input
                  type="checkbox"
                  checked={visibleStatuses[status]}
                  onChange={(event) =>
                    setVisibleStatuses((current) => ({
                      ...current,
                      [status]: event.target.checked,
                    }))
                  }
                />
                <i
                  className={`calendar-legend-dot calendar-legend-${status.toLowerCase()}`}
                />
                {status}
              </label>
            )
          )}
        </fieldset>

        <button
          type="button"
          className="secondary-button calendar-today-button"
          onClick={() => calendarRef.current?.getApi().today()}
        >
          Today
        </button>

        <button
          type="button"
          className="secondary-button clear-filters-button"
          disabled={!doctorId && allStatusesVisible}
          onClick={() => {
            setDoctorId("");
            setVisibleStatuses({
              Scheduled: true,
              Completed: true,
              Cancelled: true,
            });
          }}
        >
          Clear filters
        </button>
      </div>

      {loading ? (
        <p className="loading-state">Loading calendar...</p>
      ) : (
        <div className="calendar-card">
          <FullCalendar
            ref={calendarRef}
            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
            initialView="dayGridMonth"
            locale={esLocale}
            headerToolbar={{
              left: "prev,next today",
              center: "title",
              right: "dayGridMonth,timeGridWeek,timeGridDay",
            }}
            buttonText={{
              today: "Today",
              month: "Month",
              week: "Week",
              day: "Day",
            }}
            events={events}
            eventClick={(eventInfo) => {
              const appointment = appointments.find(
                (item) => item.id === Number(eventInfo.event.id)
              );

              if (appointment) {
                setSelectedAppointment(appointment);
              }
            }}
            dateClick={(dateInfo) => {
              if (!canEditAppointmentDetails) {
                return;
              }

              handleCreateAppointment(
                formatLocalDateInput(dateInfo.date),
                dateInfo.view.type.startsWith("timeGrid")
                  ? formatLocalTimeInput(dateInfo.date)
                  : ""
              );
            }}
            editable={false}
            selectable={canEditAppointmentDetails}
            allDaySlot={false}
            nowIndicator
            dayMaxEvents
            height="auto"
            slotMinTime="07:00:00"
            slotMaxTime="20:00:00"
            eventTimeFormat={{
              hour: "numeric",
              minute: "2-digit",
              meridiem: "short",
              hour12: true,
            }}
            slotLabelFormat={{
              hour: "numeric",
              minute: "2-digit",
              meridiem: "short",
              hour12: true,
            }}
          />
        </div>
      )}

      {selectedAppointment && (
        <Modal
          titleId="calendar-appointment-details-title"
          title="Appointment Details"
          onClose={() => {
            if (!updatingStatus) {
              setSelectedAppointment(null);
            }
          }}
        >
          <div className="appointment-details">
            <dl>
              <div>
                <dt>Patient</dt>
                <dd>{selectedAppointment.patientName}</dd>
              </div>
              <div>
                <dt>Doctor</dt>
                <dd>
                  {selectedAppointment.doctorName}
                  {selectedAppointment.doctorSpecialty
                    ? ` - ${selectedAppointment.doctorSpecialty}`
                    : ""}
                </dd>
              </div>
              <div>
                <dt>Date</dt>
                <dd>{formatDateTime(selectedAppointment.start)}</dd>
              </div>
              <div>
                <dt>Status</dt>
                <dd>
                  <AppointmentStatusBadge
                    status={selectedAppointment.status}
                  />
                </dd>
              </div>
              <div>
                <dt>Reminder</dt>
                <dd>
                  <ReminderStatusBadge
                    status={selectedAppointment.reminderStatus}
                  />
                </dd>
              </div>
            </dl>

            {selectedAppointment.status === "Completed" ? (
              <>
                <p className="form-info-message">
                  This appointment is finalized and cannot be changed.
                </p>
                <div className="modal-actions appointment-detail-actions">
                  <TableActions
                    primaryActions={[
                      {
                        label: "Close",
                        onClick: () => setSelectedAppointment(null),
                      },
                    ]}
                  />
                </div>
              </>
            ) : (
              <div className="modal-actions appointment-detail-actions">
                <TableActions
                  primaryActions={[
                    {
                      label: "Close",
                      onClick: () => setSelectedAppointment(null),
                      disabled: updatingStatus || sendingReminder,
                    },
                    ...(canEditAppointmentDetails
                      ? [
                          {
                            label: "Edit",
                            onClick: () =>
                              handleEditAppointment(selectedAppointment),
                            disabled: updatingStatus || sendingReminder,
                          },
                        ]
                      : []),
                    ...(selectedAppointmentCanBeCompleted
                      ? [
                          {
                            label: "Complete",
                            tone: "positive" as const,
                            disabled: updatingStatus || sendingReminder,
                            onClick: () => {
                              setAppointmentToComplete(selectedAppointment);
                              setSelectedAppointment(null);
                            },
                          },
                        ]
                      : []),
                  ]}
                  menuActions={[
                    ...(canEditAppointmentDetails &&
                    selectedAppointment.status === "Scheduled" &&
                    new Date(selectedAppointment.start) > new Date()
                      ? [
                          {
                            label: sendingReminder
                              ? "Sending..."
                              : "Send Reminder",
                            disabled: sendingReminder || updatingStatus,
                            onClick: () =>
                              void handleSendReminder(selectedAppointment),
                          },
                        ]
                      : []),
                    ...(selectedAppointment.status === "Scheduled"
                      ? [
                          {
                            label: updatingStatus
                              ? "Cancelling..."
                              : "Cancel Appointment",
                            tone: "info" as const,
                            disabled: updatingStatus || sendingReminder,
                            onClick: () =>
                              void handleCancelAppointment(
                                selectedAppointment
                              ),
                          },
                        ]
                      : []),
                    ...(canEditAppointmentDetails
                      ? [
                          {
                            label: "Delete Appointment",
                            tone: "danger" as const,
                            disabled: updatingStatus || sendingReminder,
                            onClick: () => {
                              setAppointmentToDelete(selectedAppointment);
                              setSelectedAppointment(null);
                            },
                          },
                        ]
                      : []),
                  ]}
                />
              </div>
            )}
          </div>
        </Modal>
      )}

      {(editingAppointment || isCreatingAppointment) && (
        <Modal
          titleId="calendar-edit-appointment-title"
          title={
            editingAppointment
              ? "Edit Appointment"
              : "New Appointment"
          }
          onClose={() => {
            if (!saving) {
              closeEditModal();
            }
          }}
        >
          <AppointmentForm
            key={
              editingAppointment?.id ??
              `new-${initialDate}-${initialTime}`
            }
            doctors={formDoctors}
            patients={patients}
            appointment={editingAppointmentFormValue}
            initialDate={initialDate}
            initialTime={initialTime}
            saving={saving}
            onCancel={closeEditModal}
            onSubmit={handleFormSubmit}
          />
        </Modal>
      )}

      {appointmentToComplete && (
        <ConfirmModal
          title="Mark appointment as completed?"
          message="Once completed, the appointment can no longer be edited."
          confirmText={
            updatingStatus ? "Completing..." : "Mark completed"
          }
          onCancel={() => {
            if (!updatingStatus) {
              setAppointmentToComplete(null);
            }
          }}
          onConfirm={() => void confirmCompleteAppointment()}
        />
      )}

      {appointmentToDelete && (
        <ConfirmModal
          title="Delete appointment?"
          message={
            <>
              Are you sure you want to delete the appointment for{" "}
              <strong>{appointmentToDelete.patientName}</strong> with{" "}
              <strong>{appointmentToDelete.doctorName}</strong>?
            </>
          }
          confirmText={
            updatingStatus ? "Deleting..." : "Delete Appointment"
          }
          onCancel={() => {
            if (!updatingStatus) {
              setAppointmentToDelete(null);
            }
          }}
          onConfirm={() => void confirmDeleteAppointment()}
        />
      )}
    </section>
  );
}

export default CalendarPage;

function formatLocalDateInput(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function formatLocalTimeInput(date: Date) {
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");

  return `${hours}:${minutes}`;
}
