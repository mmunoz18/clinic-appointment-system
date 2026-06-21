import { useCallback, useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { toast } from "react-toastify";
import {
  createDoctorAvailability,
  deactivateDoctorAvailability,
  getDoctorAvailability,
  getDoctorAvailabilitySummary,
  getDoctors,
  getMyDoctorProfile,
  updateDoctorAvailability,
  type Doctor,
  type DoctorAvailability,
  type DoctorAvailabilitySummary,
} from "../api/clinicApi";
import EmptyState from "../components/EmptyState";
import StatusBadge from "../components/StatusBadge";
import FormActions from "../components/FormActions";
import FormCard from "../components/FormCard";
import Modal from "../components/Modal";
import TableActions from "../components/TableActions";

type AvailabilityWindow = {
  key: string;
  availabilityId: number | null;
  startTime: string;
  endTime: string;
};

type AvailabilityDay = {
  dayOfWeek: number;
  label: string;
  windows: AvailabilityWindow[];
};

const days = [
  { dayOfWeek: 1, label: "Monday" },
  { dayOfWeek: 2, label: "Tuesday" },
  { dayOfWeek: 3, label: "Wednesday" },
  { dayOfWeek: 4, label: "Thursday" },
  { dayOfWeek: 5, label: "Friday" },
  { dayOfWeek: 6, label: "Saturday" },
  { dayOfWeek: 0, label: "Sunday" },
];

function newWindow(
  dayOfWeek: number,
  startTime = "08:00",
  endTime = "17:00"
): AvailabilityWindow {
  return {
    key: `new-${dayOfWeek}-${Date.now()}-${Math.random()}`,
    availabilityId: null,
    startTime,
    endTime,
  };
}

function createDefaultRows(): AvailabilityDay[] {
  return days.map((day) => ({
    ...day,
    windows:
      day.dayOfWeek >= 1 && day.dayOfWeek <= 5
        ? [newWindow(day.dayOfWeek)]
        : [],
  }));
}

function DoctorAvailabilityPage() {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [summary, setSummary] = useState<DoctorAvailabilitySummary[]>([]);
  const [doctorId, setDoctorId] = useState("");
  const [rows, setRows] = useState<AvailabilityDay[]>(createDefaultRows);
  const [savedRows, setSavedRows] = useState<AvailabilityDay[]>(createDefaultRows);
  const [removedAvailabilityIds, setRemovedAvailabilityIds] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingAvailability, setLoadingAvailability] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const role = localStorage.getItem("role");
  const isAdmin = role === "Admin";
  const isReceptionist = role === "Receptionist";
  const isDoctor = role === "Doctor";
  const windowErrors = getWindowErrors(rows);
  const hasValidationErrors = Object.keys(windowErrors).length > 0;
  const hasChanges =
    availabilitySignature(rows) !== availabilitySignature(savedRows) ||
    removedAvailabilityIds.length > 0;
  const saveDisabled =
    !doctorId ||
    !hasChanges ||
    hasValidationErrors ||
    saving;

  const loadDoctors = useCallback(async () => {
    try {
      const [doctorsData, summaryData] = await Promise.all([
        getDoctors(true),
        getDoctorAvailabilitySummary(),
      ]);

      setDoctors(doctorsData);
      setSummary(summaryData);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Error loading doctors";
      toast.error(message);
    }
  }, []);

  useEffect(() => {
    async function loadPage() {
      try {
        if (isAdmin) {
          await loadDoctors();
          return;
        }

        if (isReceptionist) {
          setSummary(await getDoctorAvailabilitySummary());
          return;
        }

        if (isDoctor) {
          const doctor = await getMyDoctorProfile();
          setDoctors([doctor]);
          setDoctorId(String(doctor.id));

          const availability = await getDoctorAvailability(doctor.id);
          const loadedRows = buildRows(availability);
          setRows(loadedRows);
          setSavedRows(cloneRows(loadedRows));
          setRemovedAvailabilityIds([]);
        }
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : "Error loading availability";
        toast.error(message);
      } finally {
        setLoading(false);
      }
    }

    loadPage();
  }, [isAdmin, isDoctor, isReceptionist, loadDoctors]);

  if (!isAdmin && !isReceptionist && !isDoctor) {
    return <Navigate to="/" replace />;
  }

  function updateWindow(
    dayOfWeek: number,
    key: string,
    changes: Partial<AvailabilityWindow>
  ) {
    setRows((current) =>
      current.map((day) =>
        day.dayOfWeek === dayOfWeek
          ? {
              ...day,
              windows: day.windows.map((window) =>
                window.key === key ? { ...window, ...changes } : window
              ),
            }
          : day
      )
    );
  }

  function addWindow(dayOfWeek: number) {
    setRows((current) =>
      current.map((day) =>
        day.dayOfWeek === dayOfWeek
          ? { ...day, windows: [...day.windows, newWindow(dayOfWeek)] }
          : day
      )
    );
  }

  function removeWindow(dayOfWeek: number, window: AvailabilityWindow) {
    if (window.availabilityId) {
      setRemovedAvailabilityIds((current) => [
        ...current,
        window.availabilityId as number,
      ]);
    }

    setRows((current) =>
      current.map((day) =>
        day.dayOfWeek === dayOfWeek
          ? {
              ...day,
              windows: day.windows.filter((item) => item.key !== window.key),
            }
          : day
      )
    );
  }

  async function handleSave(event: React.FormEvent) {
    event.preventDefault();
    setFormError("");

    if (saveDisabled) {
      return;
    }

    setSaving(true);

    try {
      for (const availabilityId of removedAvailabilityIds) {
        await deactivateDoctorAvailability(availabilityId);
      }

      for (const day of rows) {
        for (const window of day.windows) {
          const request = {
            dayOfWeek: day.dayOfWeek,
            startTime: `${window.startTime}:00`,
            endTime: `${window.endTime}:00`,
          };

          if (window.availabilityId) {
            await updateDoctorAvailability(window.availabilityId, request);
          } else {
            await createDoctorAvailability(Number(doctorId), request);
          }
        }
      }

      const availability = await getDoctorAvailability(Number(doctorId));
      const loadedRows = buildRows(availability);
      setRows(loadedRows);
      setSavedRows(cloneRows(loadedRows));
      setRemovedAvailabilityIds([]);
      setIsFormOpen(false);
      if (isAdmin) {
        setSummary(await getDoctorAvailabilitySummary());
      }
      toast.success("Doctor availability saved successfully");
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Error saving doctor availability";
      setFormError(message);
      toast.error(message);
    } finally {
      setSaving(false);
    }
  }

  function closeAvailabilityForm() {
    if (saving) {
      return;
    }

    setRows(cloneRows(savedRows));
    setRemovedAvailabilityIds([]);
    setFormError("");
    setIsFormOpen(false);
  }

  const selectedDoctor = doctors.find(
    (doctor) => doctor.id === Number(doctorId)
  );
  const hasSavedAvailability = savedRows.some(
    (day) => day.windows.length > 0
  );

  async function openAvailabilityForm(summaryDoctor: DoctorAvailabilitySummary) {
    setDoctorId(String(summaryDoctor.id));
    setFormError("");
    setLoadingAvailability(true);

    try {
      const availability = await getDoctorAvailability(summaryDoctor.id);
      const loadedRows = buildRows(availability);
      setRows(loadedRows);
      setSavedRows(cloneRows(loadedRows));
      setRemovedAvailabilityIds([]);
      setIsFormOpen(true);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Error loading doctor availability";
      toast.error(message);
    } finally {
      setLoadingAvailability(false);
    }
  }

  return (
    <section>
      <div className="page-header">
        <h1>{isDoctor ? "My Availability" : "Doctor Availability"}</h1>
        <p>
          {isDoctor
            ? "Configure your weekly working hours for appointment scheduling."
            : isReceptionist
              ? "Review doctors' weekly working hours for appointment scheduling."
            : "Configure the weekly working hours used for appointment scheduling."}
        </p>
      </div>

      {loading ? (
        <p className="loading-state">Loading availability...</p>
      ) : isAdmin || isReceptionist ? (
        <div className="table-card availability-summary-table">
          <table>
            <thead>
              <tr>
                <th>Doctor</th>
                <th>Specialty</th>
                <th>Weekly Availability</th>
                <th>Coverage</th>
                <th>Status</th>
                {isAdmin && <th>Action</th>}
              </tr>
            </thead>
            <tbody>
              {summary.length === 0 ? (
                <EmptyState
                  message="No doctors found."
                  colSpan={isAdmin ? 6 : 5}
                />
              ) : (
                summary.map((doctor) => {
                  const configuredDays = new Set(
                    doctor.availability.map((item) => item.dayOfWeek)
                  ).size;
                  const isConfigured = doctor.availability.length > 0;

                  return (
                    <tr key={doctor.id}>
                      <td>{doctor.name}</td>
                      <td>{doctor.specialty}</td>
                      <td>
                        {isConfigured ? (
                          <div className="availability-summary-days">
                            {formatAvailabilitySummary(doctor.availability)}
                          </div>
                        ) : (
                          <span className="muted-text">None configured</span>
                        )}
                      </td>
                      <td>
                        {isConfigured
                          ? `${configuredDays} ${
                              configuredDays === 1 ? "day" : "days"
                            }`
                          : "—"}
                      </td>
                      <td>
                        {!doctor.isActive ? (
                          <StatusBadge active={false} />
                        ) : isConfigured ? (
                          <StatusBadge
                            active
                            activeLabel="Configured"
                          />
                        ) : (
                          <span className="status status-cancelled">
                            Missing availability
                          </span>
                        )}
                      </td>
                      {isAdmin && (
                        <td>
                          <TableActions
                            primaryActions={[
                              {
                                label: isConfigured ? "Edit" : "Configure",
                                disabled:
                                  !doctor.isActive || loadingAvailability,
                                onClick: () =>
                                  void openAvailabilityForm(doctor),
                              },
                            ]}
                          />
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="table-card availability-summary-table">
          <table>
            <thead>
              <tr>
                <th>Doctor</th>
                <th>Specialty</th>
                <th>Weekly Availability</th>
                <th>Coverage</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {!doctors[0] ? (
                <EmptyState
                  message="Doctor profile not found."
                  colSpan={6}
                />
              ) : (
                <tr>
                  <td>{doctors[0].name}</td>
                  <td>{doctors[0].specialty}</td>
                  <td>
                    {hasSavedAvailability ? (
                      <div className="availability-summary-days">
                        {formatAvailabilityRows(savedRows)}
                      </div>
                    ) : (
                      <span className="muted-text">None configured</span>
                    )}
                  </td>
                  <td>
                    {hasSavedAvailability
                      ? `${countConfiguredDays(savedRows)} ${
                          countConfiguredDays(savedRows) === 1
                            ? "day"
                            : "days"
                        }`
                      : "—"}
                  </td>
                  <td>
                    {!doctors[0].isActive ? (
                      <StatusBadge active={false} />
                    ) : hasSavedAvailability ? (
                      <StatusBadge active activeLabel="Configured" />
                    ) : (
                      <span className="status status-cancelled">
                        Missing availability
                      </span>
                    )}
                  </td>
                  <td>
                    <TableActions
                      primaryActions={[
                        {
                          label: hasSavedAvailability ? "Edit" : "Configure",
                          disabled:
                            !doctors[0].isActive ||
                            !doctorId ||
                            loadingAvailability,
                          onClick: () => setIsFormOpen(true),
                        },
                      ]}
                    />
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {isFormOpen && doctorId && (isAdmin || isDoctor) && (
        <Modal
          titleId="availability-form-modal-title"
          title={
            isDoctor
              ? "Edit My Availability"
              : `${hasSavedAvailability ? "Edit" : "Add"} Availability`
          }
          onClose={closeAvailabilityForm}
        >
          <FormCard onSubmit={handleSave}>
            <div className="availability-profile-summary">
              <span>Doctor Profile</span>
              <strong>
                {selectedDoctor
                  ? `${selectedDoctor.name} — ${selectedDoctor.specialty}`
                  : "Doctor"}
              </strong>
            </div>

            {formError && (
              <div className="form-error-message">{formError}</div>
            )}

            <div className="availability-list">
              {rows.map((day) => (
                <div className="availability-day-card" key={day.dayOfWeek}>
                  <div className="availability-day-header">
                    <strong>{day.label}</strong>
                    <button
                      type="button"
                      className="secondary-button"
                      disabled={saving}
                      onClick={() => addWindow(day.dayOfWeek)}
                    >
                      Add time
                    </button>
                  </div>

                  {day.windows.length === 0 ? (
                    <p className="availability-unavailable">Unavailable</p>
                  ) : (
                    day.windows.map((window) => {
                      const windowError = windowErrors[window.key];

                      return (
                        <div
                          className="availability-window-group"
                          key={window.key}
                        >
                          <div className="availability-row">
                            <input
                              type="time"
                              value={window.startTime}
                              disabled={saving}
                              aria-invalid={Boolean(windowError)}
                              onChange={(event) =>
                                updateWindow(day.dayOfWeek, window.key, {
                                  startTime: event.target.value,
                                })
                              }
                              required
                            />

                            <span className="availability-separator">to</span>

                            <input
                              type="time"
                              value={window.endTime}
                              disabled={saving}
                              aria-invalid={Boolean(windowError)}
                              onChange={(event) =>
                                updateWindow(day.dayOfWeek, window.key, {
                                  endTime: event.target.value,
                                })
                              }
                              required
                            />

                            <button
                              type="button"
                              className="danger-button"
                              disabled={saving}
                              onClick={() =>
                                removeWindow(day.dayOfWeek, window)
                              }
                            >
                              Remove
                            </button>
                          </div>

                          {windowError && (
                            <span className="field-error">{windowError}</span>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              ))}
            </div>

            <FormActions
              saving={saving}
              saveDisabled={saveDisabled}
              onCancel={closeAvailabilityForm}
              saveText="Save Availability"
            />
          </FormCard>
        </Modal>
      )}
    </section>
  );
}

function buildRows(
  availability: DoctorAvailability[]
): AvailabilityDay[] {
  return days.map((day) => ({
    ...day,
    windows: availability
      .filter((item) => item.dayOfWeek === day.dayOfWeek)
      .map((item) => ({
        key: `saved-${item.id}`,
        availabilityId: item.id,
        startTime: item.startTime.slice(0, 5),
        endTime: item.endTime.slice(0, 5),
      })),
  }));
}

function cloneRows(rows: AvailabilityDay[]): AvailabilityDay[] {
  return rows.map((day) => ({
    ...day,
    windows: day.windows.map((window) => ({ ...window })),
  }));
}

function availabilitySignature(rows: AvailabilityDay[]) {
  return JSON.stringify(
    rows.map((day) => ({
      dayOfWeek: day.dayOfWeek,
      windows: day.windows
        .map((window) => ({
          availabilityId: window.availabilityId,
          startTime: window.startTime,
          endTime: window.endTime,
        }))
        .sort((a, b) => a.startTime.localeCompare(b.startTime)),
    }))
  );
}

function getWindowErrors(rows: AvailabilityDay[]) {
  const errors: Record<string, string> = {};

  for (const day of rows) {
    for (const window of day.windows) {
      if (!window.startTime || !window.endTime) {
        errors[window.key] = "Start and end time are required.";
      } else if (window.startTime >= window.endTime) {
        errors[window.key] = "Start time must be before end time.";
      }
    }

    for (let index = 0; index < day.windows.length; index += 1) {
      for (
        let comparisonIndex = index + 1;
        comparisonIndex < day.windows.length;
        comparisonIndex += 1
      ) {
        const first = day.windows[index];
        const second = day.windows[comparisonIndex];
        const overlaps =
          first.startTime < second.endTime &&
          first.endTime > second.startTime;

        if (overlaps) {
          errors[first.key] = `Overlaps another ${day.label} window.`;
          errors[second.key] = `Overlaps another ${day.label} window.`;
        }
      }
    }
  }

  return errors;
}

const summaryDayLabels: Record<number, string> = {
  0: "Sun",
  1: "Mon",
  2: "Tue",
  3: "Wed",
  4: "Thu",
  5: "Fri",
  6: "Sat",
};

function formatAvailabilitySummary(availability: DoctorAvailability[]) {
  return days
    .map((day) => {
      const windows = availability
        .filter((item) => item.dayOfWeek === day.dayOfWeek)
        .sort((a, b) => a.startTime.localeCompare(b.startTime));

      if (windows.length === 0) {
        return null;
      }

      return (
        <span key={day.dayOfWeek}>
          <strong>{summaryDayLabels[day.dayOfWeek]}</strong>{" "}
          {windows
            .map(
              (window) =>
                `${window.startTime.slice(0, 5)}–${window.endTime.slice(0, 5)}`
            )
            .join(", ")}
        </span>
      );
    })
    .filter(Boolean);
}

function formatAvailabilityRows(rows: AvailabilityDay[]) {
  return rows
    .filter((day) => day.windows.length > 0)
    .map((day) => (
      <span key={day.dayOfWeek}>
        <strong>{summaryDayLabels[day.dayOfWeek]}</strong>{" "}
        {day.windows
          .slice()
          .sort((a, b) => a.startTime.localeCompare(b.startTime))
          .map((window) => `${window.startTime}–${window.endTime}`)
          .join(", ")}
      </span>
    ));
}

function countConfiguredDays(rows: AvailabilityDay[]) {
  return rows.filter((day) => day.windows.length > 0).length;
}

export default DoctorAvailabilityPage;
