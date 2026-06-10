export const API_BASE_URL = "http://localhost:5121";

export interface Doctor {
  id: number;
  name: string;
  specialty: string;
}

export type CreateDoctorRequest = {
  name: string;
  specialty: string;
};

export async function getDoctors() {
  const response = await fetch(`${API_BASE_URL}/api/doctors`);

  if (!response.ok) {
    throw new Error("Failed to fetch doctors");
  }

  return response.json();
}

export async function getPatients() {
  const response = await fetch(`${API_BASE_URL}/api/patients`);

  if (!response.ok) {
    throw new Error("Failed to fetch patients");
  }

  return response.json();
}

export async function getAppointments() {
  const response = await fetch(`${API_BASE_URL}/api/appointments`);

  if (!response.ok) {
    throw new Error("Failed to fetch appointments");
  }

  return response.json();
}

export async function createDoctor(doctor: CreateDoctorRequest) {
  const response = await fetch(`${API_BASE_URL}/api/doctors`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
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
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(doctor),
  });

  if (!response.ok) {
    throw new Error("Failed to update doctor");
  }
}

export async function deleteDoctor(id: number) {
  const response = await fetch(`${API_BASE_URL}/api/doctors/${id}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    throw new Error("Failed to delete doctor");
  }
}