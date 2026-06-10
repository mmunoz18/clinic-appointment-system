import { Link, Outlet } from "react-router-dom";

function Layout() {
  return (
    <div>
      <aside>
        <h2>Clinic System</h2>
        <nav>
          <Link to="/">Dashboard</Link> |{" "}
          <Link to="/doctors">Doctors</Link> |{" "}
          <Link to="/patients">Patients</Link> |{" "}
          <Link to="/appointments">Appointments</Link>
        </nav>
      </aside>

      <main>
        <Outlet />
      </main>
    </div>
  );
}

export default Layout;