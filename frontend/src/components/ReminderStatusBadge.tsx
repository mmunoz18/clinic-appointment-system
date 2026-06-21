type ReminderStatusBadgeProps = {
  status?: string;
};

function ReminderStatusBadge({ status }: ReminderStatusBadgeProps) {
  if (!status || status === "NotApplicable") {
    return <span className="muted-text">—</span>;
  }

  return (
    <span className={`reminder-status reminder-status-${status.toLowerCase()}`}>
      {status === "Sent" ? "Sent ✓" : status}
    </span>
  );
}

export default ReminderStatusBadge;
