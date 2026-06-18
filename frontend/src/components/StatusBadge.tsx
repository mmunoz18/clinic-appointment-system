type StatusBadgeProps = {
  active: boolean;
  activeLabel?: string;
  inactiveLabel?: string;
};

function StatusBadge({
  active,
  activeLabel = "Active",
  inactiveLabel = "Inactive",
}: StatusBadgeProps) {
  return (
    <span
      className={`entity-status ${
        active ? "entity-status-active" : "entity-status-inactive"
      }`}
    >
      {active ? activeLabel : inactiveLabel}
    </span>
  );
}

export default StatusBadge;
