import { NavLink, Outlet } from "react-router-dom";

function Layout() {
  return (
    <div className="app-layout">
      <aside className="sidebar">
        <h2>Clinic System</h2>

        <nav className="nav">
          <NavLink to="/">Dashboard</NavLink>
          <NavLink to="/doctors">Doctors</NavLink>
          <NavLink to="/patients">Patients</NavLink>
          <NavLink to="/appointments">Appointments</NavLink>
        </nav>
      </aside>

      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
}

export default Layout;