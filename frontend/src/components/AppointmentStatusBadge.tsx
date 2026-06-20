type AppointmentStatus = "Scheduled" | "Completed" | "Cancelled";

type AppointmentStatusBadgeProps = {
  status: AppointmentStatus | string;
};

function AppointmentStatusBadge({
  status,
}: AppointmentStatusBadgeProps) {
  return (
    <span className={`status status-${status.toLowerCase()}`}>
      {status}
    </span>
  );
}

export default AppointmentStatusBadge;
