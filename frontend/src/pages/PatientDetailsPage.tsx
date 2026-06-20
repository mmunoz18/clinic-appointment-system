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
import FormActions from "../components/FormActions";
import StatusBadge from "../components/StatusBadge";
import EmptyState from "../components/EmptyState";

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
  const trimmedNote = noteText.trim();
  const hasChanges =
    trimmedNote !== "" &&
    (editingNote == null || trimmedNote !== editingNote.note.trim());
  const saveDisabled = !hasChanges || saving;

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

    if (saveDisabled) {
      return;
    }

    setSaving(true);

    try {
      if (editingNote) {
        await updatePatientNote(editingNote.id, trimmedNote);
        toast.success("Patient note updated successfully");
      } else {
        await createPatientNote(patientId, trimmedNote);
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
            <StatusBadge active={patient.isActive} />
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

        {isDoctor && patient?.isActive && (
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
              <FormActions
                saving={saving}
                saveDisabled={saveDisabled}
                onCancel={clearNoteForm}
                saveText={editingNote ? "Update Note" : "Save Note"}
              />
            </div>
          </form>
        )}

        <div className="notes-list">
          {notes.length === 0 ? (
            <EmptyState message="No medical notes to show." />
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
