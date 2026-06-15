export const API_BASE_URL = "http://localhost:5121";

function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem("token");

  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export type Doctor = {
  id: number;
  name: string;
  specialty: string;
}

export type Patient = {
  id: number;
  name: string;
  email: string;
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
}

export type RegisterRequest = {
  name: string;
  email: string;
  password: string;
}

export type CreateDoctorRequest = {
  name: string;
  specialty: string;
};

export type CreatePatientRequest = {
  name: string;
  email: string;
};

export type CreateAppointmentRequest = {
  doctorId: number;
  patientId: number;
  appointmentDate: string;
  status: string;
};

export async function getDoctors() {
  const response = await fetch(`${API_BASE_URL}/api/doctors`, {
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    throw new Error("Failed to fetch doctors");
  }

  return response.json();
}

export async function getPatients() {
  const response = await fetch(`${API_BASE_URL}/api/patients`, {
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    throw new Error("Failed to fetch patients");
  }

  return response.json();
}

export async function getAppointments() {
  const response = await fetch(`${API_BASE_URL}/api/appointments`, {
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    throw new Error("Failed to fetch appointments");
  }

  return response.json();
}

export async function createDoctor(doctor: CreateDoctorRequest) {
  const response = await fetch(`${API_BASE_URL}/api/doctors`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(doctor),
  });

  if (!response.ok) {
    throw new Error("Failed to create doctor");
  }

  return response.json();
}

export async function updateDoctor(doctor: Doctor) {
  const response = await fetch(`${API_BASE_URL}/api/doctors/${doctor.id}`, {
    method: "PUT",
    headers: getAuthHeaders(),
    body: JSON.stringify(doctor),
  });

  if (!response.ok) {
    throw new Error("Failed to update doctor");
  }
}

export async function deleteDoctor(id: number) {
  const response = await fetch(`${API_BASE_URL}/api/doctors/${id}`, {
    method: "DELETE",
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    throw new Error("Failed to delete doctor");
  }
}

export async function createPatient(patient: CreatePatientRequest) {
  const response = await fetch(`${API_BASE_URL}/api/patients`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(patient),
  });

  if (!response.ok) {
    throw new Error("Failed to create patient");
  }

  return response.json();
}

export async function updatePatient(patient: Patient) {
  const response = await fetch(`${API_BASE_URL}/api/patients/${patient.id}`, {
    method: "PUT",
    headers: getAuthHeaders(),
    body: JSON.stringify(patient),
  });

  if (!response.ok) {
    throw new Error("Failed to update patient");
  }
}

export async function deletePatient(id: number) {
  const response = await fetch(`${API_BASE_URL}/api/patients/${id}`, {
    method: "DELETE",
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    throw new Error("Failed to delete patient");
  }
}

export async function createAppointment(appointment: CreateAppointmentRequest) {
  const response = await fetch(`${API_BASE_URL}/api/appointments`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(appointment),
  });

  if (!response.ok) {
    throw new Error(await response.text());
  }

  return response.json();
}

export async function updateAppointment(appointment: Appointment) {
  const response = await fetch(`${API_BASE_URL}/api/appointments/${appointment.id}`, {
    method: "PUT",
    headers: getAuthHeaders(),
    body: JSON.stringify(appointment),
  });

  if (!response.ok) {
    throw new Error(await response.text());
  }
}

export async function deleteAppointment(id: number) {
  const response = await fetch(`${API_BASE_URL}/api/appointments/${id}`, {
    method: "DELETE",
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    throw new Error("Failed to delete appointment");
  }
}

export async function login(email: string, password: string): Promise<AuthResponse> {
  const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  if (!response.ok) {
    throw new Error("Failed to login");
  }

  return response.json();
}

export async function register(user: RegisterRequest): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(user),
  });

  if (!response.ok) {
    throw new Error(await response.text());
  }
}