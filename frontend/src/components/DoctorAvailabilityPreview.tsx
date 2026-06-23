import type {
  Doctor,
  DoctorAvailability,
} from "../api/clinicApi";

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

export default DoctorAvailabilityPreview;
