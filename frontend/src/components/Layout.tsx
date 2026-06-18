import { NavLink, Outlet } from "react-router-dom";

function Layout() {
  const userName = localStorage.getItem("userName");
  const role = localStorage.getItem("role");
  const isAdmin = role === "Admin";
  const isReceptionist = role === "Receptionist";
  const isDoctor = role === "Doctor";
  
  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userName");
    localStorage.removeItem("role");
    window.location.href = "/login";
  };
  
  return (
    <div className="app-layout">
      <aside className="sidebar">
        <h2>Clinic System</h2>
        {userName && <p className="sidebar-user">Welcome, {userName}</p>}

        <nav className="nav">
          <NavLink to="/">{isDoctor ? "My Dashboard" : "Dashboard"}</NavLink>
          {(isAdmin || isReceptionist) && (
            <NavLink to="/doctors">Doctors</NavLink>
          )}

          {(isAdmin || isReceptionist) && (
            <NavLink to="/patients">Patients</NavLink>
          )}

          {(isAdmin || isReceptionist) && (
            <NavLink to="/appointments">Appointments</NavLink>
          )}
          {isDoctor && <NavLink to="/my-patients">My Patients</NavLink>}
          {isDoctor && <NavLink to="/my-appointments">My Appointments</NavLink>}
          {isDoctor && <NavLink to="/my-availability">My Availability</NavLink>}
          {isAdmin && (
            <NavLink to="/users">User Access</NavLink>
          )}
          {isAdmin && (
            <NavLink to="/doctor-availability">Doctor Availability</NavLink>
          )}
        </nav>
        <button className="logout-button" onClick={handleLogout}>
          Logout
        </button>
      </aside>

      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
}

export default Layout;
