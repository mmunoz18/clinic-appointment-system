import { NavLink, Outlet } from "react-router-dom";

function Layout() {
  const userName = localStorage.getItem("userName");
  
  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userName");
    window.location.href = "/login";
  };
  
  return (
    <div className="app-layout">
      <aside className="sidebar">
        <h2>Clinic System</h2>
        {userName && <p className="sidebar-user">Welcome, {userName}</p>}

        <nav className="nav">
          <NavLink to="/">Dashboard</NavLink>
          <NavLink to="/doctors">Doctors</NavLink>
          <NavLink to="/patients">Patients</NavLink>
          <NavLink to="/appointments">Appointments</NavLink>
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