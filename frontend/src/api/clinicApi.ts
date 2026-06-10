export const API_BASE_URL = "http://localhost:5121";

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