import { useEffect, useState } from "react";
import {
  activateUser,
  deactivateUser,
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
import ConfirmModal from "../components/ConfirmModal";
import StatusBadge from "../components/StatusBadge";
import TableActions from "../components/TableActions";

const roles = ["Admin", "Receptionist", "Doctor"];

function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [drafts, setDrafts] = useState<
    Record<number, { role: string; doctorId: number | null }>
  >({});
  const [saving, setSaving] = useState(false);
  const [showSaveConfirmation, setShowSaveConfirmation] = useState(false);
  const [userToDeactivate, setUserToDeactivate] = useState<User | null>(null);
  const [accountActionUserId, setAccountActionUserId] = useState<number | null>(
    null
  );

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
        getDoctors(true),
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

  async function handleDeactivateUser() {
    if (!userToDeactivate || accountActionUserId != null) {
      return;
    }

    setAccountActionUserId(userToDeactivate.id);

    try {
      await deactivateUser(userToDeactivate.id);
      setUsers((current) =>
        current.map((user) =>
          user.id === userToDeactivate.id
            ? { ...user, isActive: false }
            : user
        )
      );
      setDrafts((current) => ({
        ...current,
        [userToDeactivate.id]: {
          role: userToDeactivate.role,
          doctorId: userToDeactivate.doctorId,
        },
      }));
      toast.success("User account deactivated successfully");
      setUserToDeactivate(null);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Error deactivating user";
      toast.error(message);
    } finally {
      setAccountActionUserId(null);
    }
  }

  async function handleActivateUser(user: User) {
    if (accountActionUserId != null) {
      return;
    }

    setAccountActionUserId(user.id);

    try {
      await activateUser(user.id);
      setUsers((current) =>
        current.map((currentUser) =>
          currentUser.id === user.id
            ? { ...currentUser, isActive: true }
            : currentUser
        )
      );
      toast.success("User account activated successfully");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Error activating user";
      toast.error(message);
    } finally {
      setAccountActionUserId(null);
    }
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
              <th>Profile Status</th>
              <th>Account Status</th>
              <th>Actions</th>
            </tr>
          </thead>

          <tbody>
            {users.length === 0 ? (
                <EmptyState message="No users found." colSpan={7} />
            ) : (
            users.map((user) => (
              <tr key={user.id}>
                <td>{user.name}</td>
                <td>{user.email}</td>
                <td>
                  <select
                    value={drafts[user.id]?.role ?? user.role}
                    disabled={saving}
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
                      disabled={saving}
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
                        <option
                          key={doctor.id}
                          value={doctor.id}
                          disabled={
                            !doctor.isActive &&
                            doctor.id !== drafts[user.id]?.doctorId
                          }
                        >
                          {doctor.name} — {doctor.specialty}
                          {!doctor.isActive ? " (Inactive)" : ""}
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
                <td>
                  <StatusBadge active={user.isActive} />
                </td>
                <td>
                  <TableActions
                    primaryActions={
                      user.isActive
                        ? []
                        : [
                            {
                              label:
                                accountActionUserId === user.id
                                  ? "Activating..."
                                  : "Activate",
                              tone: "positive",
                              disabled:
                                saving || accountActionUserId === user.id,
                              onClick: () =>
                                void handleActivateUser(user),
                            },
                          ]
                    }
                    menuActions={
                      user.isActive
                        ? [
                            {
                              label: "Deactivate",
                              tone: "danger",
                              disabled:
                                saving || accountActionUserId === user.id,
                              onClick: () => setUserToDeactivate(user),
                            },
                          ]
                        : []
                    }
                  />
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

      {userToDeactivate && (
        <ConfirmModal
          title="Deactivate user?"
          message={
            <>
              Are you sure you want to deactivate{" "}
              <strong>{userToDeactivate.name}</strong>?
            </>
          }
          warning="The user will be signed out and will not be able to log in until their account is activated again."
          confirmText={
            accountActionUserId === userToDeactivate.id
              ? "Deactivating..."
              : "Deactivate"
          }
          reversible
          onConfirm={() => void handleDeactivateUser()}
          onCancel={() => {
            if (accountActionUserId == null) {
              setUserToDeactivate(null);
            }
          }}
        />
      )}
    </section>
  );
}

export default UsersPage;
