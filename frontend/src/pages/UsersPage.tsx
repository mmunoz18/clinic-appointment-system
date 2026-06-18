import { useEffect, useState } from "react";
import {
  getDoctors,
  getUsers,
  updateUserRole,
  type Doctor,
  type User,
} from "../api/clinicApi";
import { toast } from "react-toastify";

const roles = ["Admin", "Receptionist", "Doctor"];

function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [drafts, setDrafts] = useState<
    Record<number, { role: string; doctorId: number | null }>
  >({});

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

  async function saveUserAccess(userId: number) {
    const draft = drafts[userId];

    if (!draft) {
      return;
    }

    try {
      await updateUserRole(userId, draft.role, draft.doctorId);
      toast.success("User access updated successfully");
      await loadData();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Error updating user role";
      toast.error(message);
    }
  }

  return (
    <section>
      <div className="page-header">
        <h1>Users</h1>
        <p>Manage system users and their roles.</p>
      </div>

      <div className="table-card">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Doctor Profile</th>
              <th>Actions</th>
            </tr>
          </thead>

          <tbody>
            {users.length === 0 ? (
                <tr>
                    <td colSpan={5} className="empty-state">
                        No users found.
                    </td>
                </tr>
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
                  <select
                    value={drafts[user.id]?.doctorId ?? ""}
                    disabled={(drafts[user.id]?.role ?? user.role) !== "Doctor"}
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
                </td>
                <td>
                  <button onClick={() => saveUserAccess(user.id)}>Save</button>
                </td>
              </tr>
            )))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export default UsersPage;
