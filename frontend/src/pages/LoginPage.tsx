import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { login } from "../api/clinicApi";
import { toast } from "react-toastify";
import { Navigate } from "react-router-dom";
import { Link } from "react-router-dom";

function LoginPage() {
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
      const result = await login(email, password);

      localStorage.setItem("token", result.token);
      localStorage.setItem("userName", result.name);

      toast.success("Login successful");

      navigate("/");
    } catch {
      toast.error("Invalid email or password");
    }
  }

  return (
    <section>
      <div className="page-header">
        <h1>Login</h1>
        <p>Sign in to access the clinic system.</p>
      </div>

      <form onSubmit={handleSubmit} className="form-card">
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

        <button type="submit">
          Login
        </button>
        
        <p>
          Don&apos;t have an account?{" "}
          <Link to="/register" className="auth-link">
            Register
          </Link>
        </p>
      </form>
    </section>
  );
}

export default LoginPage;