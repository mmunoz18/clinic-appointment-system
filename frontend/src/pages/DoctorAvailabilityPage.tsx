import { useCallback, useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { toast } from "react-toastify";
import {
  createDoctorAvailability,
  deactivateDoctorAvailability,
  getDoctorAvailability,
  getDoctors,
  getMyDoctorProfile,
  updateDoctorAvailability,
  type Doctor,
  type DoctorAvailability,
} from "../api/clinicApi";

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
  const [doctorId, setDoctorId] = useState("");
  const [rows, setRows] = useState<AvailabilityDay[]>(createDefaultRows);
  const [removedAvailabilityIds, setRemovedAvailabilityIds] = useState<number[]>([]);
  const [saving, setSaving] = useState(false);
  const role = localStorage.getItem("role");
  const isAdmin = role === "Admin";
  const isDoctor = role === "Doctor";

  const loadDoctors = useCallback(async () => {
    try {
      setDoctors(await getDoctors());
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Error loading doctors";
      toast.error(message);
    }
  }, []);

  useEffect(() => {
    async function loadPage() {
      if (isAdmin) {
        await loadDoctors();
        return;
      }

      if (isDoctor) {
        try {
          const doctor = await getMyDoctorProfile();
          setDoctors([doctor]);
          setDoctorId(String(doctor.id));

          const availability = await getDoctorAvailability(doctor.id);
          setRows(buildRows(availability));
          setRemovedAvailabilityIds([]);
        } catch (error) {
          const message =
            error instanceof Error
              ? error.message
              : "Error loading your availability";
          toast.error(message);
        }
      }
    }

    loadPage();
  }, [isAdmin, isDoctor, loadDoctors]);

  if (!isAdmin && !isDoctor) {
    return <Navigate to="/" replace />;
  }

  async function handleDoctorChange(selectedDoctorId: string) {
    setDoctorId(selectedDoctorId);

    if (!selectedDoctorId) {
      setRows(createDefaultRows());
      setRemovedAvailabilityIds([]);
      return;
    }

    try {
      const availability = await getDoctorAvailability(Number(selectedDoctorId));
      setRows(buildRows(availability));
      setRemovedAvailabilityIds([]);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Error loading doctor availability";
      toast.error(message);
    }
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

    if (!doctorId) {
      return;
    }

    const invalidDay = rows.find((day) =>
      day.windows.some((window) => window.startTime >= window.endTime)
    );

    if (invalidDay) {
      toast.error(`${invalidDay.label}: start time must be before end time`);
      return;
    }

    const overlappingDay = rows.find((day) => hasOverlappingWindows(day.windows));

    if (overlappingDay) {
      toast.error(`${overlappingDay.label}: availability windows cannot overlap`);
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
      setRows(buildRows(availability));
      setRemovedAvailabilityIds([]);
      toast.success("Doctor availability saved successfully");
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Error saving doctor availability";
      toast.error(message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <section>
      <div className="page-header">
        <h1>{isDoctor ? "My Availability" : "Doctor Availability"}</h1>
        <p>
          {isDoctor
            ? "Configure your weekly working hours for appointment scheduling."
            : "Configure the weekly working hours used for appointment scheduling."}
        </p>
      </div>

      <form className="availability-card" onSubmit={handleSave}>
        {isAdmin ? (
          <label className="availability-doctor-select">
            <span>Select Doctor</span>
            <select
              value={doctorId}
              onChange={(event) => handleDoctorChange(event.target.value)}
              required
            >
              <option value="">Select doctor</option>
              {doctors.map((doctor) => (
                <option key={doctor.id} value={doctor.id}>
                  {doctor.name} — {doctor.specialty}
                </option>
              ))}
            </select>
          </label>
        ) : (
          <div className="availability-profile-summary">
            <span>Doctor Profile</span>
            <strong>
              {doctors[0]
                ? `${doctors[0].name} — ${doctors[0].specialty}`
                : "Loading doctor profile..."}
            </strong>
          </div>
        )}

        <div className="availability-list">
          {rows.map((day) => (
            <div className="availability-day-card" key={day.dayOfWeek}>
              <div className="availability-day-header">
                <strong>{day.label}</strong>
                <button
                  type="button"
                  className="secondary-button"
                  disabled={!doctorId}
                  onClick={() => addWindow(day.dayOfWeek)}
                >
                  Add time
                </button>
              </div>

              {day.windows.length === 0 ? (
                <p className="availability-unavailable">Unavailable</p>
              ) : (
                day.windows.map((window) => (
                  <div className="availability-row" key={window.key}>
                    <input
                      type="time"
                      value={window.startTime}
                      disabled={!doctorId}
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
                      disabled={!doctorId}
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
                      disabled={!doctorId}
                      onClick={() => removeWindow(day.dayOfWeek, window)}
                    >
                      Remove
                    </button>
                  </div>
                ))
              )}
            </div>
          ))}
        </div>

        <button type="submit" disabled={!doctorId || saving}>
          {saving ? "Saving..." : "Save Availability"}
        </button>
      </form>
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

function hasOverlappingWindows(windows: AvailabilityWindow[]) {
  const sorted = [...windows].sort((a, b) =>
    a.startTime.localeCompare(b.startTime)
  );

  return sorted.some(
    (window, index) =>
      index > 0 && window.startTime < sorted[index - 1].endTime
  );
}

export default DoctorAvailabilityPage;
