import {
  useCallback,
  useDeferredValue,
  useEffect,
  useState,
} from "react";
import { Navigate } from "react-router-dom";
import { toast } from "react-toastify";
import {
  getAuditLogs,
  type AuditLog,
} from "../api/clinicApi";
import EmptyState from "../components/EmptyState";
import Pagination from "../components/Pagination";
import { formatDateTime } from "../utils/dateTime";

const entityOptions = ["Appointment", "Patient", "Doctor", "User"];
const actionOptions = [
  "Created",
  "Updated",
  "Cancelled",
  "Completed",
  "Deleted",
  "Deactivated",
  "Activated",
  "RoleChanged",
  "ReminderSent",
  "ReminderFailed",
];

const actionLabels: Record<string, string> = {
  Created: "created",
  Updated: "updated",
  Cancelled: "cancelled",
  Completed: "completed",
  Deleted: "deleted",
  Deactivated: "deactivated",
  Activated: "activated",
  RoleChanged: "changed access for",
};

function getEventDescription(log: AuditLog) {
  const entity = log.entityType.toLowerCase();
  const entityLabel = log.entityName
    ? `${entity} ${log.entityName}`
    : `${entity} #${log.entityId}`;

  if (log.action === "ReminderSent") {
    return `Reminder sent for ${entityLabel}`;
  }

  if (log.action === "ReminderFailed") {
    return `Reminder failed for ${entityLabel}`;
  }

  const action = actionLabels[log.action] ?? log.action.toLowerCase();
  return `${log.userName} ${action} ${entityLabel}`;
}

function AuditLogPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [entity, setEntity] = useState("");
  const [action, setAction] = useState("");
  const [user, setUser] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const deferredUser = useDeferredValue(user);
  const isAdmin = localStorage.getItem("role") === "Admin";

  const loadAuditLogs = useCallback(async () => {
    setLoading(true);

    try {
      const data = await getAuditLogs({
        entity,
        action,
        user: deferredUser.trim(),
        dateFrom,
        dateTo,
        page,
      });

      if (data.totalPages > 0 && page > data.totalPages) {
        setPage(data.totalPages);
        return;
      }

      setLogs(data.items);
      setTotalPages(data.totalPages);
      setTotalCount(data.totalCount);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Error loading audit log";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, [action, dateFrom, dateTo, deferredUser, entity, page]);

  useEffect(() => {
    async function loadAuditLogPage() {
      await loadAuditLogs();
    }

    if (isAdmin) {
      void loadAuditLogPage();
    }
  }, [isAdmin, loadAuditLogs]);

  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  const hasFilters =
    entity !== "" ||
    action !== "" ||
    user !== "" ||
    dateFrom !== "" ||
    dateTo !== "";

  function clearFilters() {
    setEntity("");
    setAction("");
    setUser("");
    setDateFrom("");
    setDateTo("");
    setPage(1);
  }

  return (
    <section>
      <div className="page-header">
        <h1>Audit Log</h1>
        <p>Review important changes and activity across the clinic.</p>
      </div>

      <div className="list-filters audit-log-filters">
        <label>
          <span>Entity</span>
          <select
            value={entity}
            onChange={(event) => {
              setEntity(event.target.value);
              setPage(1);
            }}
          >
            <option value="">All entities</option>
            {entityOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>

        <label>
          <span>Action</span>
          <select
            value={action}
            onChange={(event) => {
              setAction(event.target.value);
              setPage(1);
            }}
          >
            <option value="">All actions</option>
            {actionOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>

        <label className="filter-search">
          <span>User</span>
          <input
            type="search"
            value={user}
            placeholder="Search by user name"
            onChange={(event) => {
              setUser(event.target.value);
              setPage(1);
            }}
          />
        </label>

        <label>
          <span>From</span>
          <input
            type="date"
            value={dateFrom}
            max={dateTo || undefined}
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
          disabled={!hasFilters}
          onClick={clearFilters}
        >
          Clear filters
        </button>
      </div>

      {loading ? (
        <p className="loading-state">Loading audit log...</p>
      ) : (
        <div className="table-card audit-log-table">
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Event</th>
                <th>Entity</th>
                <th>Action</th>
                <th>User</th>
                <th>Details</th>
              </tr>
            </thead>
            <tbody>
              {logs.length === 0 ? (
                <EmptyState
                  message="No audit events found."
                  colSpan={6}
                />
              ) : (
                logs.map((log) => (
                  <tr key={log.id}>
                    <td className="audit-log-date">
                      {formatDateTime(log.createdAt)}
                    </td>
                    <td className="audit-log-event">
                      {getEventDescription(log)}
                    </td>
                    <td>
                      <span className="audit-badge audit-badge-entity">
                        {log.entityType}
                      </span>
                    </td>
                    <td>
                      <span
                        className={`audit-badge audit-action-${log.action.toLowerCase()}`}
                      >
                        {log.action}
                      </span>
                    </td>
                    <td>{log.userName}</td>
                    <td className="audit-log-details">
                      {log.details || "—"}
                    </td>
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
    </section>
  );
}

export default AuditLogPage;
