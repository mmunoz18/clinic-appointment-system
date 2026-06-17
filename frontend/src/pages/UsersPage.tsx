import { useEffect, useState } from "react";
import { getUsers, updateUserRole, type User } from "../api/clinicApi";
import { toast } from "react-toastify";

const roles = ["Admin", "Receptionist", "Doctor"];

function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);

  async function loadUsers() {
    try {
      const data = await getUsers();
      setUsers(data);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Error loading users";
      toast.error(message);
    }
  }

  useEffect(() => {
    loadUsers();
  }, []);

  async function handleRoleChange(userId: number, role: string) {
    try {
      await updateUserRole(userId, role);
      toast.success("User role updated successfully");
      await loadUsers();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Error updating user role";
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
            </tr>
          </thead>

          <tbody>
            {users.length === 0 ? (
                <tr>
                    <td colSpan={3} className="empty-state">
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
                    value={user.role}
                    onChange={(event) =>
                      handleRoleChange(user.id, event.target.value)
                    }
                  >
                    {roles.map((role) => (
                      <option key={role} value={role}>
                        {role}
                      </option>
                    ))}
                  </select>
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