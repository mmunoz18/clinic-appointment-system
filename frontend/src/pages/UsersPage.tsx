import { useEffect, useState } from "react";
import {
  getDoctors,
  getUsers,
  updateUserRole,
  type Doctor,
  type User,
} from "../api/clinicApi";
import { toast } from "react-toastify";
import FormActions from "../components/FormActions";
import Modal from "../components/Modal";
import EmptyState from "../components/EmptyState";

const roles = ["Admin", "Receptionist", "Doctor"];

function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [drafts, setDrafts] = useState<
    Record<number, { role: string; doctorId: number | null }>
  >({});
  const [saving, setSaving] = useState(false);
  const [showSaveConfirmation, setShowSaveConfirmation] = useState(false);

  const changedUsers = users.filter((user) => {
    const draft = drafts[user.id];

    return (
      draft &&
      (draft.role !== user.role || draft.doctorId !== user.doctorId)
    );
  });
  const hasChanges = changedUsers.length > 0;

  async function loadData() {
    try {
      const [usersData, doctorsData] = await Promise.all([
        getUsers(),
        getDoctors(),
      ]);

      setUsers(usersData);
      setDoctors(doctorsData);
      setDrafts(
        Object.fromEntries(
          usersData.map((user: User) => [
            user.id,
            { role: user.role, doctorId: user.doctorId },
          ])
        )
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : "Error loading users";
      toast.error(message);
    }
  }

  useEffect(() => {
    async function loadUsersPage() {
      await loadData();
    }

    loadUsersPage();
  }, []);

  async function saveAllChanges() {
    if (!hasChanges) {
      return;
    }

    setSaving(true);

    try {
      for (const user of changedUsers) {
        const draft = drafts[user.id];
        await updateUserRole(user.id, draft.role, draft.doctorId);
      }

      toast.success("User access changes saved successfully");
      await loadData();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Error updating user access";
      toast.error(message);
      await loadData();
    } finally {
      setSaving(false);
      setShowSaveConfirmation(false);
    }
  }

  function cancelAllChanges() {
    if (saving) {
      return;
    }

    setDrafts(
      Object.fromEntries(
        users.map((user) => [
          user.id,
          { role: user.role, doctorId: user.doctorId },
        ])
      )
    );
    setShowSaveConfirmation(false);
  }

  return (
    <section>
      <div className="page-header">
        <h1>User Access</h1>
        <p>Manage login accounts, roles, and linked doctor profiles.</p>
      </div>

      <div className="table-card">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Doctor Profile</th>
              <th>Status</th>
            </tr>
          </thead>

          <tbody>
            {users.length === 0 ? (
                <EmptyState message="No users found." colSpan={5} />
            ) : (
            users.map((user) => (
              <tr key={user.id}>
                <td>{user.name}</td>
                <td>{user.email}</td>
                <td>
                  <select
                    value={drafts[user.id]?.role ?? user.role}
                    onChange={(event) => {
                      const role = event.target.value;
                      setDrafts((current) => ({
                        ...current,
                        [user.id]: {
                          role,
                          doctorId:
                            role === "Doctor"
                              ? current[user.id]?.doctorId ?? null
                              : null,
                        },
                      }));
                    }}
                  >
                    {roles.map((role) => (
                      <option key={role} value={role}>
                        {role}
                      </option>
                    ))}
                  </select>
                </td>
                <td>
                  {(drafts[user.id]?.role ?? user.role) === "Doctor" ? (
                    <select
                      value={drafts[user.id]?.doctorId ?? ""}
                      onChange={(event) =>
                        setDrafts((current) => ({
                          ...current,
                          [user.id]: {
                            role: current[user.id]?.role ?? user.role,
                            doctorId: event.target.value
                              ? Number(event.target.value)
                              : null,
                          },
                        }))
                      }
                    >
                      <option value="">Select doctor</option>
                      {doctors.map((doctor) => (
                        <option key={doctor.id} value={doctor.id}>
                          {doctor.name} — {doctor.specialty}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <span className="muted-text">—</span>
                  )}
                </td>
                <td>
                  {(drafts[user.id]?.role ?? user.role) === "Doctor" ? (
                    drafts[user.id]?.doctorId ? (
                      <span className="entity-status entity-status-active">
                        Linked
                      </span>
                    ) : (
                      <span className="status status-cancelled">
                        Missing profile
                      </span>
                    )
                  ) : (
                    <span className="entity-status entity-status-inactive">
                      Not required
                    </span>
                  )}
                </td>
              </tr>
            )))}
          </tbody>
        </table>
      </div>

      <div className="user-access-actions">
        <div className="standard-form-actions">
          <button
            type="button"
            className="secondary-button"
            disabled={!hasChanges || saving}
            onClick={cancelAllChanges}
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={!hasChanges || saving}
            onClick={() => setShowSaveConfirmation(true)}
          >
            Save Changes
          </button>
        </div>
      </div>

      {showSaveConfirmation && hasChanges && (
        <Modal
          titleId="save-user-access-changes-title"
          title="Save changes?"
          onClose={() => {
            if (!saving) {
              setShowSaveConfirmation(false);
            }
          }}
        >
          <form
            onSubmit={(event) => {
              event.preventDefault();
              void saveAllChanges();
            }}
          >
            <p>
              You have {changedUsers.length} pending{" "}
              {changedUsers.length === 1 ? "change" : "changes"}.
            </p>

            <FormActions
              saving={saving}
              saveDisabled={!hasChanges || saving}
              onCancel={() => setShowSaveConfirmation(false)}
              saveText="Save"
            />
          </form>
        </Modal>
      )}
    </section>
  );
}

export default UsersPage;
