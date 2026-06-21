export const API_BASE_URL = "http://localhost:5121";

export type Doctor = {
  id: number;
  name: string;
  specialty: string;
  cedula: string;
  isActive: boolean;
  hasLinkedUser: boolean;
  linkedUserIsActive: boolean;
}

export type Patient = {
  id: number;
  name: string;
  email: string;
  cedula: string;
  phoneNumber: string;
  isActive: boolean;
}

export type Appointment = {
  id: number;
  doctorId: number;
  doctorName: string;
  patientId: number;
  patientName: string;
  appointmentDate: string;
  status: string;
  reminderStatus?: "Pending" | "Sent" | "Failed" | "NotApplicable";
  reminderSentAt?: string | null;
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
  isActive: boolean;
  doctorId: number | null;
  doctorName: string | null;
};

export type DoctorPatient = Patient & {
  appointmentCount: number;
  lastAppointmentDate: string;
};

export type DoctorDashboard = {
  counts: {
    myPatients: number;
    todaysAppointments: number;
    upcomingAppointments: number;
    completedAppointments: number;
    cancelledAppointments: number;
  };
  todaysAppointments: Appointment[];
  upcomingAppointments: Appointment[];
};

export type DoctorAvailability = {
  id: number;
  doctorId: number;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  isActive: boolean;
};

export type DoctorAvailabilityRequest = {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
};

export type DoctorAvailabilitySummary = {
  id: number;
  name: string;
  specialty: string;
  isActive: boolean;
  availability: DoctorAvailability[];
};

export type PatientNote = {
  id: number;
  patientId: number;
  doctorId: number;
  doctorName: string;
  note: string;
  createdAt: string;
  updatedAt: string;
  canEdit: boolean;
};

export type PagedResult<T> = {
  items: T[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
};

export type AppointmentFilters = {
  doctorId?: number;
  patientId?: number;
  status?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  pageSize?: number;
};

export type ReminderSettings = {
  id: number;
  enabled: boolean;
  send24HoursBefore: boolean;
  send2HoursBefore: boolean;
  lastCheckAt: string | null;
  lastReminderSentAt: string | null;
  nextCheckAt: string | null;
};

function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem("token");

  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export async function getDoctors(includeInactive = false) {
  const response = await fetch(
    `${API_BASE_URL}/api/doctors?includeInactive=${includeInactive}`,
    {
    headers: getAuthHeaders(),
    }
  );

  return handleResponse(response, "Failed to fetch doctors");
}

export async function getDoctorsPaged(options: {
  search?: string;
  includeInactive?: boolean;
  page?: number;
  pageSize?: number;
}): Promise<PagedResult<Doctor>> {
  const params = new URLSearchParams({
    search: options.search ?? "",
    includeInactive: String(options.includeInactive ?? false),
    page: String(options.page ?? 1),
    pageSize: String(options.pageSize ?? 10),
  });
  const response = await fetch(
    `${API_BASE_URL}/api/doctors/paged?${params}`,
    { headers: getAuthHeaders() }
  );

  return handleResponse(response, "Failed to fetch doctors");
}

export async function getPatients(includeInactive = false) {
  const response = await fetch(
    `${API_BASE_URL}/api/patients?includeInactive=${includeInactive}`,
    {
    headers: getAuthHeaders(),
    }
  );

  return handleResponse(response, "Failed to fetch patients");
}

export async function getPatientsPaged(options: {
  search?: string;
  includeInactive?: boolean;
  page?: number;
  pageSize?: number;
}): Promise<PagedResult<Patient>> {
  const params = new URLSearchParams({
    search: options.search ?? "",
    includeInactive: String(options.includeInactive ?? false),
    page: String(options.page ?? 1),
    pageSize: String(options.pageSize ?? 10),
  });
  const response = await fetch(
    `${API_BASE_URL}/api/patients/paged?${params}`,
    { headers: getAuthHeaders() }
  );

  return handleResponse(response, "Failed to fetch patients");
}

export async function getPatient(id: number): Promise<Patient> {
  const response = await fetch(`${API_BASE_URL}/api/patients/${id}`, {
    headers: getAuthHeaders(),
  });

  return handleResponse(response, "Failed to fetch patient");
}

export async function getAppointments() {
  const response = await fetch(`${API_BASE_URL}/api/appointments`, {
    headers: getAuthHeaders(),
  });

  return handleResponse(response, "Failed to fetch appointments");
}

export async function getAppointmentsPaged(
  filters: AppointmentFilters
): Promise<PagedResult<Appointment>> {
  const params = new URLSearchParams({
    page: String(filters.page ?? 1),
    pageSize: String(filters.pageSize ?? 10),
  });

  if (filters.doctorId) params.set("doctorId", String(filters.doctorId));
  if (filters.patientId) params.set("patientId", String(filters.patientId));
  if (filters.status) params.set("status", filters.status);
  if (filters.dateFrom) params.set("dateFrom", filters.dateFrom);
  if (filters.dateTo) params.set("dateTo", filters.dateTo);

  const response = await fetch(
    `${API_BASE_URL}/api/appointments/paged?${params}`,
    { headers: getAuthHeaders() }
  );

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

export async function deactivateDoctor(id: number) {
  const response = await fetch(`${API_BASE_URL}/api/doctors/${id}/deactivate`, {
    method: "PUT",
    headers: getAuthHeaders(),
  });

  return handleResponse(response, "Failed to deactivate doctor");
}

export async function activateDoctor(
  id: number,
  activateLinkedUser = false
) {
  const response = await fetch(
    `${API_BASE_URL}/api/doctors/${id}/activate?activateLinkedUser=${activateLinkedUser}`,
    {
      method: "PUT",
      headers: getAuthHeaders(),
    }
  );

  return handleResponse(response, "Failed to activate doctor");
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

export async function deactivatePatient(id: number) {
  const response = await fetch(`${API_BASE_URL}/api/patients/${id}/deactivate`, {
    method: "PUT",
    headers: getAuthHeaders(),
  });

  return handleResponse(response, "Failed to deactivate patient");
}

export async function activatePatient(id: number) {
  const response = await fetch(`${API_BASE_URL}/api/patients/${id}/activate`, {
    method: "PUT",
    headers: getAuthHeaders(),
  });

  return handleResponse(response, "Failed to activate patient");
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

export async function sendAppointmentReminder(
  id: number
): Promise<{ message: string }> {
  const response = await fetch(
    `${API_BASE_URL}/api/appointments/${id}/send-reminder`,
    {
      method: "POST",
      headers: getAuthHeaders(),
    }
  );

  return handleResponse(response, "Failed to send appointment reminder");
}

export async function getReminderSettings(): Promise<ReminderSettings> {
  const response = await fetch(`${API_BASE_URL}/api/reminder-settings`, {
    headers: getAuthHeaders(),
  });

  return handleResponse(response, "Failed to fetch reminder settings");
}

export async function updateReminderSettings(
  settings: ReminderSettings
): Promise<ReminderSettings> {
  const response = await fetch(`${API_BASE_URL}/api/reminder-settings`, {
    method: "PUT",
    headers: getAuthHeaders(),
    body: JSON.stringify({
      enabled: settings.enabled,
      send24HoursBefore: settings.send24HoursBefore,
      send2HoursBefore: settings.send2HoursBefore,
    }),
  });

  return handleResponse(response, "Failed to update reminder settings");
}

export async function login(email: string, password: string): Promise<AuthResponse> {
  const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  return handleResponse(response, "Failed to login", false);
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

export async function updateUserRole(
  id: number,
  role: string,
  doctorId: number | null
): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/users/${id}/role`, {
    method: "PUT",
    headers: getAuthHeaders(),
    body: JSON.stringify({ role, doctorId }),
  });

  return handleResponse(response, "Failed to update user role");
}

export async function deactivateUser(id: number): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/users/${id}/deactivate`, {
    method: "PUT",
    headers: getAuthHeaders(),
  });

  return handleResponse(response, "Failed to deactivate user");
}

export async function activateUser(id: number): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/users/${id}/activate`, {
    method: "PUT",
    headers: getAuthHeaders(),
  });

  return handleResponse(response, "Failed to activate user");
}

export async function getDoctorDashboard(): Promise<DoctorDashboard> {
  const response = await fetch(`${API_BASE_URL}/api/doctor-dashboard`, {
    headers: getAuthHeaders(),
  });

  return handleResponse(response, "Failed to fetch doctor dashboard");
}

export async function getDoctorPatients(): Promise<DoctorPatient[]> {
  const response = await fetch(`${API_BASE_URL}/api/doctor-patients`, {
    headers: getAuthHeaders(),
  });

  return handleResponse(response, "Failed to fetch your patients");
}

export async function getDoctorAppointments(): Promise<Appointment[]> {
  const response = await fetch(`${API_BASE_URL}/api/doctor-appointments`, {
    headers: getAuthHeaders(),
  });

  return handleResponse(response, "Failed to fetch your appointments");
}

export async function getDoctorAvailability(
  doctorId: number
): Promise<DoctorAvailability[]> {
  const response = await fetch(
    `${API_BASE_URL}/api/doctors/${doctorId}/availability`,
    { headers: getAuthHeaders() }
  );

  return handleResponse(response, "Failed to fetch doctor availability");
}

export async function getDoctorAvailabilitySummary(): Promise<
  DoctorAvailabilitySummary[]
> {
  const response = await fetch(
    `${API_BASE_URL}/api/doctor-availability/summary`,
    { headers: getAuthHeaders() }
  );

  return handleResponse(
    response,
    "Failed to fetch doctor availability summary"
  );
}

export async function getMyDoctorProfile(): Promise<Doctor> {
  const response = await fetch(`${API_BASE_URL}/api/doctor-profile`, {
    headers: getAuthHeaders(),
  });

  return handleResponse(response, "Failed to fetch your doctor profile");
}

export async function createDoctorAvailability(
  doctorId: number,
  availability: DoctorAvailabilityRequest
): Promise<DoctorAvailability> {
  const response = await fetch(
    `${API_BASE_URL}/api/doctors/${doctorId}/availability`,
    {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(availability),
    }
  );

  return handleResponse(response, "Failed to create doctor availability");
}

export async function updateDoctorAvailability(
  id: number,
  availability: DoctorAvailabilityRequest
): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/doctor-availability/${id}`, {
    method: "PUT",
    headers: getAuthHeaders(),
    body: JSON.stringify(availability),
  });

  return handleResponse(response, "Failed to update doctor availability");
}

export async function deactivateDoctorAvailability(id: number): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/doctor-availability/${id}`, {
    method: "DELETE",
    headers: getAuthHeaders(),
  });

  return handleResponse(response, "Failed to deactivate doctor availability");
}

export async function getPatientNotes(patientId: number): Promise<PatientNote[]> {
  const response = await fetch(`${API_BASE_URL}/api/patients/${patientId}/notes`, {
    headers: getAuthHeaders(),
  });

  return handleResponse(response, "Failed to fetch patient notes");
}

export async function createPatientNote(
  patientId: number,
  note: string
): Promise<PatientNote> {
  const response = await fetch(`${API_BASE_URL}/api/patients/${patientId}/notes`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify({ note }),
  });

  return handleResponse(response, "Failed to create patient note");
}

export async function updatePatientNote(
  id: number,
  note: string
): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/patient-notes/${id}`, {
    method: "PUT",
    headers: getAuthHeaders(),
    body: JSON.stringify({ note }),
  });

  return handleResponse(response, "Failed to update patient note");
}

async function handleResponse(
  response: Response,
  fallbackMessage: string,
  redirectOnUnauthorized = true
) {
  if (redirectOnUnauthorized) {
    handleUnauthorized(response);
  }

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
