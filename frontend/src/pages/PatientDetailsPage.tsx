import { useEffect, useState } from "react";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import {
  createPatientNote,
  getPatient,
  getPatientNotes,
  updatePatientNote,
  type Patient,
  type PatientNote,
} from "../api/clinicApi";

function PatientDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const role = localStorage.getItem("role");
  const patientId = Number(id);
  const [patient, setPatient] = useState<Patient | null>(null);
  const [notes, setNotes] = useState<PatientNote[]>([]);
  const [noteText, setNoteText] = useState("");
  const [editingNote, setEditingNote] = useState<PatientNote | null>(null);
  const [saving, setSaving] = useState(false);
  const isDoctor = role === "Doctor";

  useEffect(() => {
    async function loadPatientDetails() {
      if (role !== "Admin" && role !== "Doctor") {
        return;
      }

      if (!Number.isInteger(patientId) || patientId <= 0) {
        return;
      }

      try {
        const [patientData, notesData] = await Promise.all([
          getPatient(patientId),
          getPatientNotes(patientId),
        ]);

        setPatient(patientData);
        setNotes(notesData);
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Error loading patient details";
        toast.error(message);
      }
    }

    loadPatientDetails();
  }, [patientId, role]);

  if (role !== "Admin" && role !== "Doctor") {
    return <Navigate to="/" replace />;
  }

  if (!Number.isInteger(patientId) || patientId <= 0) {
    return <Navigate to="/" replace />;
  }

  async function reloadNotes() {
    setNotes(await getPatientNotes(patientId));
  }

  function clearNoteForm() {
    setEditingNote(null);
    setNoteText("");
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);

    try {
      if (editingNote) {
        await updatePatientNote(editingNote.id, noteText);
        toast.success("Patient note updated successfully");
      } else {
        await createPatientNote(patientId, noteText);
        toast.success("Patient note added successfully");
      }

      clearNoteForm();
      await reloadNotes();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Error saving patient note";
      toast.error(message);
    } finally {
      setSaving(false);
    }
  }

  function handleEdit(note: PatientNote) {
    setEditingNote(note);
    setNoteText(note.note);
  }

  return (
    <section>
      <button
        type="button"
        className="secondary-button back-button"
        onClick={() => navigate(-1)}
      >
        Back
      </button>

      <div className="page-header">
        <h1>{patient?.name ?? "Patient Details"}</h1>
        <p>Patient information and medical notes.</p>
      </div>

      {patient && (
        <div className="patient-summary">
          <div>
            <span>Email</span>
            <strong>{patient.email}</strong>
          </div>
          <div>
            <span>Phone</span>
            <strong>{patient.phoneNumber || "—"}</strong>
          </div>
          <div>
            <span>Cedula</span>
            <strong>{patient.cedula}</strong>
          </div>
          <div>
            <span>Status</span>
            <strong>{patient.isActive ? "Active" : "Inactive"}</strong>
          </div>
        </div>
      )}

      <div className="notes-section">
        <div className="notes-header">
          <div>
            <h2>Patient Notes</h2>
            <p>Clinical notes are listed newest first.</p>
          </div>
        </div>

        {isDoctor && (
          <form className="note-form" onSubmit={handleSubmit}>
            <label htmlFor="patient-note">
              {editingNote ? "Edit note" : "Add note"}
            </label>
            <textarea
              id="patient-note"
              value={noteText}
              maxLength={4000}
              rows={5}
              placeholder="Enter clinical observations or follow-up notes..."
              onChange={(event) => setNoteText(event.target.value)}
              required
            />
            <div className="note-form-actions">
              <span>{noteText.length}/4000</span>
              {editingNote && (
                <button
                  type="button"
                  className="secondary-button"
                  onClick={clearNoteForm}
                >
                  Cancel
                </button>
              )}
              <button type="submit" disabled={saving}>
                {saving
                  ? "Saving..."
                  : editingNote
                    ? "Update Note"
                    : "Add Note"}
              </button>
            </div>
          </form>
        )}

        <div className="notes-list">
          {notes.length === 0 ? (
            <div className="empty-state">No medical notes to show.</div>
          ) : (
            notes.map((note) => (
              <article className="note-card" key={note.id}>
                <div className="note-card-header">
                  <div>
                    <strong>{note.doctorName}</strong>
                    <time>
                      {new Date(note.createdAt).toLocaleString("es-CR", {
                        dateStyle: "medium",
                        timeStyle: "short",
                      })}
                    </time>
                  </div>
                  {note.canEdit && (
                    <button
                      type="button"
                      className="secondary-button"
                      onClick={() => handleEdit(note)}
                    >
                      Edit
                    </button>
                  )}
                </div>
                <p>{note.note}</p>
                {note.updatedAt !== note.createdAt && (
                  <small>
                    Updated{" "}
                    {new Date(note.updatedAt).toLocaleString("es-CR", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}
                  </small>
                )}
              </article>
            ))
          )}
        </div>
      </div>
    </section>
  );
}

export default PatientDetailsPage;
