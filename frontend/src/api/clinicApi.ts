export const API_BASE_URL = "http://localhost:5121";

export type Doctor = {
  id: number;
  name: string;
  specialty: string;
  cedula: string;
}

export type Patient = {
  id: number;
  name: string;
  email: string;
  cedula: string;
  phoneNumber: string;
}

export type Appointment = {
  id: number;
  doctorId: number;
  doctorName: string;
  patientId: number;
  patientName: string;
  appointmentDate: string;
  status: string;
}

export type AuthResponse = {
  token: string;
  email: string;
  name: string;
  role: string;
}

export type RegisterRequest = {
  name: string;
  email: string;
  password: string;
}

export type CreateDoctorRequest = {
  name: string;
  specialty: string;
  cedula: string;
};

export type CreatePatientRequest = {
  name: string;
  email: string;
  cedula: string;
  phoneNumber: string;
};

export type CreateAppointmentRequest = {
  doctorId: number;
  patientId: number;
  appointmentDate: string;
  status: string;
};

export type User = {
  id: number;
  name: string;
  email: string;
  role: string;
};

function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem("token");

  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export async function getDoctors() {
  const response = await fetch(`${API_BASE_URL}/api/doctors`, {
    headers: getAuthHeaders(),
  });

  return handleResponse(response, "Failed to fetch doctors");
}

export async function getPatients() {
  const response = await fetch(`${API_BASE_URL}/api/patients`, {
    headers: getAuthHeaders(),
  });

  return handleResponse(response, "Failed to fetch patients");
}

export async function getAppointments() {
  const response = await fetch(`${API_BASE_URL}/api/appointments`, {
    headers: getAuthHeaders(),
  });

  return handleResponse(response, "Failed to fetch appointments");
}

export async function createDoctor(doctor: CreateDoctorRequest) {
  const response = await fetch(`${API_BASE_URL}/api/doctors`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(doctor),
  });

  return handleResponse(response, "Failed to create doctor");
}

export async function updateDoctor(doctor: Doctor) {
  const response = await fetch(`${API_BASE_URL}/api/doctors/${doctor.id}`, {
    method: "PUT",
    headers: getAuthHeaders(),
    body: JSON.stringify(doctor),
  });

  return handleResponse(response, "Failed to update doctor");
}

export async function deleteDoctor(id: number) {
  const response = await fetch(`${API_BASE_URL}/api/doctors/${id}`, {
    method: "DELETE",
    headers: getAuthHeaders(),
  });

  return handleResponse(response, "Failed to delete doctor");
}

export async function createPatient(patient: CreatePatientRequest) {
  const response = await fetch(`${API_BASE_URL}/api/patients`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(patient),
  });

  return handleResponse(response, "Failed to create patient");
}

export async function updatePatient(patient: Patient) {
  const response = await fetch(`${API_BASE_URL}/api/patients/${patient.id}`, {
    method: "PUT",
    headers: getAuthHeaders(),
    body: JSON.stringify(patient),
  });

  return handleResponse(response, "Failed to update patient");
}

export async function deletePatient(id: number) {
  const response = await fetch(`${API_BASE_URL}/api/patients/${id}`, {
    method: "DELETE",
    headers: getAuthHeaders(),
  });

  return handleResponse(response, "Failed to delete patient");
}

export async function createAppointment(appointment: CreateAppointmentRequest) {
  const response = await fetch(`${API_BASE_URL}/api/appointments`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(appointment),
  });

  return handleResponse(response, "Failed to create appointment");
}

export async function updateAppointment(appointment: Appointment) {
  const response = await fetch(`${API_BASE_URL}/api/appointments/${appointment.id}`, {
    method: "PUT",
    headers: getAuthHeaders(),
    body: JSON.stringify(appointment),
  });

  return handleResponse(response, "Failed to update appointment");
}

export async function deleteAppointment(id: number) {
  const response = await fetch(`${API_BASE_URL}/api/appointments/${id}`, {
    method: "DELETE",
    headers: getAuthHeaders(),
  });

  return handleResponse(response, "Failed to delete appointment");
}

export async function login(email: string, password: string): Promise<AuthResponse> {
  const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  return handleResponse(response, "Failed to login");
}

export async function register(user: RegisterRequest): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(user),
  });

  return handleResponse(response, "Failed to register");
}

export async function getUsers(): Promise<User[]> {
  const response = await fetch(`${API_BASE_URL}/api/users`, {
    headers: getAuthHeaders(),
  });

  return handleResponse(response, "Failed to fetch users");
}

export async function updateUserRole(id: number, role: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/users/${id}/role`, {
    method: "PUT",
    headers: getAuthHeaders(),
    body: JSON.stringify({ role }),
  });

  return handleResponse(response, "Failed to update user role");
}

async function handleResponse(response: Response, fallbackMessage: string) {
  handleUnauthorized(response);

  if (!response.ok) {
    const errorMessage = await response.text();
    throw new Error(errorMessage || fallbackMessage);
  }

  if (response.status === 204) {
    return null;
  }

  const text = await response.text();

  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

function handleUnauthorized(response: Response) {
  if (response.status === 401) {
    localStorage.removeItem("token");
    localStorage.removeItem("userName");
    localStorage.removeItem("role");
    window.location.href = "/login";

    throw new Error("Session expired. Please log in again.");
  }
}