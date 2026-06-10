function DashboardPage() {
  return (
    <section>
      <div className="page-header">
        <h1>Dashboard</h1>
        <p>Clinic appointment management overview.</p>
      </div>

      <div className="card-grid">
        <div className="card">
          <h3>Doctors</h3>
          <p>View and manage doctors</p>
        </div>

        <div className="card">
          <h3>Patients</h3>
          <p>View and manage patients</p>
        </div>

        <div className="card">
          <h3>Appointments</h3>
          <p>Schedule and manage appointments</p>
        </div>
      </div>
    </section>
  );
}

export default DashboardPage;