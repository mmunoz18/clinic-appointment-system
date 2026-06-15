import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { register } from "../api/clinicApi";

function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  if (token) {
    return <Navigate to="/" replace />;
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    try {
      await register({ name, email, password });
      toast.success("User registered successfully");
      navigate("/login");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Registration failed";

      toast.error(message);
    }
  }

  return (
    <section>
      <div className="page-header">
        <h1>Register</h1>
        <p>Create an account to access the clinic system.</p>
      </div>

      <form onSubmit={handleSubmit} className="form-card">
        <input
          type="text"
          placeholder="Name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          required
        />

        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          required
        />

        <button type="submit">Register</button>

        <p>
          Already have an account? <Link to="/login">Login</Link>
        </p>
      </form>
    </section>
  );
}

export default RegisterPage;