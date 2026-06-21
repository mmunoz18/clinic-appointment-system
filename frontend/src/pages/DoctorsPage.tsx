import { useCallback, useDeferredValue, useEffect, useState } from "react";
import {
  createDoctor,
  activateDoctor,
  deactivateDoctor,
  getDoctorsPaged,
  updateDoctor,
  type Doctor,
} from "../api/clinicApi";
import { toast } from "react-toastify";
import ConfirmModal from "../components/ConfirmModal";
import EmptyState from "../components/EmptyState";
import FormActions from "../components/FormActions";
import FormCard from "../components/FormCard";
import Modal from "../components/Modal";
import StatusBadge from "../components/StatusBadge";
import Pagination from "../components/Pagination";
import TableActions from "../components/TableActions";

function DoctorsPage() {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [specialty, setSpecialty] = useState("");
  const [cedula, setCedula] = useState("");
  const [editingDoctor, setEditingDoctor] = useState<Doctor | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showValidation, setShowValidation] = useState(false);
  const [serverErrors, setServerErrors] = useState<
    Partial<Record<"name" | "specialty" | "cedula", string>>
  >({});
  const [doctorToDeactivate, setDoctorToDeactivate] = useState<Doctor | null>(null);
  const [doctorToActivate, setDoctorToActivate] = useState<Doctor | null>(null);
  const [changingStatus, setChangingStatus] = useState(false);
  const [search, setSearch] = useState("");
  const [showInactive, setShowInactive] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const deferredSearch = useDeferredValue(search);

  const role = localStorage.getItem("role");
  const canManageDoctors = role === "Admin";
  const nameError =
    showValidation && name.trim() === "" ? "Name is required." : "";
  const specialtyError =
    showValidation && specialty.trim() === ""
      ? "Specialty is required."
      : "";
  const cedulaError =
    showValidation && cedula.trim() === ""
      ? "Cedula is required."
      : cedula.trim() !== "" && cedula.trim().length !== 9
        ? "Cedula must be 9 characters long."
        : "";
  const requiredFieldsComplete =
    name.trim() !== "" &&
    specialty.trim() !== "" &&
    cedula.trim() !== "";
  const doctorChanged =
    editingDoctor == null ||
    name.trim() !== editingDoctor.name ||
    specialty.trim() !== editingDoctor.specialty ||
    cedula.trim() !== editingDoctor.cedula;
  const saveDisabled =
    !requiredFieldsComplete ||
    cedula.trim().length !== 9 ||
    !doctorChanged ||
    saving;

  const loadDoctors = useCallback(async () => {
    setLoading(true);

    try {
      const data = await getDoctorsPaged({
        search: deferredSearch,
        includeInactive: canManageDoctors && showInactive,
        page,
      });

      if (data.totalPages > 0 && page > data.totalPages) {
        setPage(data.totalPages);
        return;
      }

      setDoctors(data.items);
      setTotalPages(data.totalPages);
      setTotalCount(data.totalCount);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Error loading doctors";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, [canManageDoctors, deferredSearch, page, showInactive]);

  useEffect(() => {
    async function loadDoctorsPage() {
      await loadDoctors();
    }

    loadDoctorsPage();
  }, [loadDoctors]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setShowValidation(true);
    setServerErrors({});

    if (saveDisabled) {
      return;
    }

    setSaving(true);

    try {
      if (editingDoctor) {
        await updateDoctor({
          ...editingDoctor,
          name: name.trim(),
          specialty: specialty.trim(),
          cedula: cedula.trim(),
        });
        toast.success("Doctor updated successfully");
      } else {
        await createDoctor({
          name: name.trim(),
          specialty: specialty.trim(),
          cedula: cedula.trim(),
        });
        toast.success("Doctor created successfully");
      }

      clearDoctorForm();
      await loadDoctors();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Error saving doctor";
      const normalizedMessage = message.toLowerCase();

      if (normalizedMessage.includes("cedula")) {
        setServerErrors({ cedula: message });
      } else if (normalizedMessage.includes("specialty")) {
        setServerErrors({ specialty: message });
      } else if (normalizedMessage.includes("name")) {
        setServerErrors({ name: message });
      }

      toast.error(message);
    } finally {
      setSaving(false);
    }
  }

  function handleAddDoctor() {
    clearDoctorForm();
    setIsFormOpen(true);
  }

  function handleEdit(doctor: Doctor) {
    setEditingDoctor(doctor);
    setName(doctor.name);
    setSpecialty(doctor.specialty);
    setCedula(doctor.cedula);
    setIsFormOpen(true);
  }

  function clearDoctorForm() {
    setEditingDoctor(null);
    setName("");
    setSpecialty("");
    setCedula("");
    setShowValidation(false);
    setServerErrors({});
    setIsFormOpen(false);
  }

  async function confirmDeactivateDoctor() {
    if (!doctorToDeactivate || changingStatus) {
      return;
    }

    setChangingStatus(true);

    try {
      await deactivateDoctor(doctorToDeactivate.id);
      toast.success(
        doctorToDeactivate.hasLinkedUser
          ? "Doctor and linked user account deactivated successfully"
          : "Doctor deactivated successfully"
      );
      setDoctorToDeactivate(null);
      clearDoctorForm();
      await loadDoctors();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to deactivate doctor";
      toast.error(message);
    } finally {
      setChangingStatus(false);
    }
  }

  async function handleActivateDoctor(
    doctor: Doctor,
    activateLinkedUser = false
  ) {
    if (changingStatus) {
      return;
    }

    setChangingStatus(true);

    try {
      await activateDoctor(doctor.id, activateLinkedUser);
      toast.success(
        activateLinkedUser
          ? "Doctor and linked user account activated successfully"
          : "Doctor activated successfully"
      );
      setDoctorToActivate(null);
      clearDoctorForm();
      await loadDoctors();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to activate doctor";
      toast.error(message);
    } finally {
      setChangingStatus(false);
    }
  }

  function openActivateDoctor(doctor: Doctor) {
    if (doctor.hasLinkedUser) {
      setDoctorToActivate(doctor);
      return;
    }

    void handleActivateDoctor(doctor);
  }

  return (
    <section>
      <div className="page-header">
        <h1>Doctors</h1>
        <p>View and manage clinic doctors.</p>
      </div>

      {canManageDoctors && !isFormOpen && (
        <button
          type="button"
          className="add-record-button"
          onClick={handleAddDoctor}
        >
          + Add Doctor
        </button>
      )}

      <div className="list-filters">
        <label className="filter-search">
          <span>Search doctors</span>
          <input
            type="search"
            value={search}
            placeholder="Name or specialty"
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
            }}
          />
        </label>

        {canManageDoctors && (
          <label className="checkbox-filter">
            <input
              type="checkbox"
              checked={showInactive}
              onChange={(event) => {
                setShowInactive(event.target.checked);
                setPage(1);
              }}
            />
            Show inactive
          </label>
        )}
      </div>

      {canManageDoctors && isFormOpen && (
        <Modal
          titleId="doctor-form-modal-title"
          title={editingDoctor ? "Edit Doctor" : "Add Doctor"}
          onClose={() => {
            if (!saving) {
              clearDoctorForm();
            }
          }}
        >
          <FormCard onSubmit={handleSubmit}>
            <label>
              <span>Name</span>
              <input
                type="text"
                value={name}
                onChange={(event) => {
                  setName(event.target.value);
                  setServerErrors((current) => ({ ...current, name: undefined }));
                }}
                onBlur={() => setShowValidation(true)}
                aria-invalid={Boolean(nameError || serverErrors.name)}
                required
              />
              {(nameError || serverErrors.name) && (
                <span className="field-error">
                  {nameError || serverErrors.name}
                </span>
              )}
            </label>

            <label>
              <span>Specialty</span>
              <input
                type="text"
                value={specialty}
                onChange={(event) => {
                  setSpecialty(event.target.value);
                  setServerErrors((current) => ({
                    ...current,
                    specialty: undefined,
                  }));
                }}
                onBlur={() => setShowValidation(true)}
                aria-invalid={Boolean(
                  specialtyError || serverErrors.specialty
                )}
                required
              />
              {(specialtyError || serverErrors.specialty) && (
                <span className="field-error">
                  {specialtyError || serverErrors.specialty}
                </span>
              )}
            </label>

            <label>
              <span>Cedula</span>
              <input
                type="text"
                value={cedula}
                onChange={(event) => {
                  setCedula(event.target.value);
                  setServerErrors((current) => ({
                    ...current,
                    cedula: undefined,
                  }));
                }}
                onBlur={() => setShowValidation(true)}
                aria-invalid={Boolean(cedulaError || serverErrors.cedula)}
                required
              />
              {(cedulaError || serverErrors.cedula) && (
                <span className="field-error">
                  {cedulaError || serverErrors.cedula}
                </span>
              )}
            </label>

            <FormActions
              saving={saving}
              saveDisabled={saveDisabled}
              onCancel={clearDoctorForm}
              saveText={editingDoctor ? "Update Doctor" : "Save Doctor"}
            />
          </FormCard>
        </Modal>
      )}

      {loading ? (
        <p className="loading-state">Loading doctors...</p>
      ) : (
      <div className="table-card">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Specialty</th>
              <th>Cedula</th>
              <th>Status</th>
              {canManageDoctors && <th>Actions</th>}
            </tr>
          </thead>

          <tbody>
            {doctors.length === 0 ? (
              <EmptyState
                message="No doctors found."
                colSpan={canManageDoctors ? 5 : 4}
              />
            ) : (
            doctors.map((doctor) => (
              <tr key={doctor.id}>
                <td>{doctor.name}</td>
                <td>{doctor.specialty}</td>
                <td>{doctor.cedula}</td>
                <td>
                  <StatusBadge active={doctor.isActive} />
                </td>
                {canManageDoctors && (
                  <td>
                    <TableActions
                      primaryActions={
                        doctor.isActive
                          ? [
                              {
                                label: "Edit",
                                onClick: () => handleEdit(doctor),
                              },
                            ]
                          : [
                              {
                                label: "Activate",
                                tone: "positive",
                                disabled: changingStatus,
                                onClick: () => openActivateDoctor(doctor),
                              },
                            ]
                      }
                      menuActions={
                        doctor.isActive
                          ? [
                              {
                                label: "Deactivate",
                                tone: "danger",
                                onClick: () => setDoctorToDeactivate(doctor),
                              },
                            ]
                          : []
                      }
                    />
                  </td>
                )}
              </tr>
            )))}
          </tbody>
        </table>
      </div>
      )}

      {!loading && (
        <Pagination
          page={page}
          totalPages={totalPages}
          totalCount={totalCount}
          onPageChange={setPage}
        />
      )}
      
      {doctorToDeactivate && (
        <ConfirmModal
          title="Deactivate doctor?"
          message={
            <>
              Are you sure you want to deactivate{" "}
              <strong>{doctorToDeactivate.name}</strong>?
            </>
          }
          warning={
            doctorToDeactivate.hasLinkedUser
              ? "This doctor has a linked user account. Deactivating the doctor will also disable the login account."
              : "Inactive doctors cannot be assigned to new appointments."
          }
          confirmText={changingStatus ? "Deactivating..." : "Deactivate"}
          reversible
          onCancel={() => {
            if (!changingStatus) {
              setDoctorToDeactivate(null);
            }
          }}
          onConfirm={() => void confirmDeactivateDoctor()}
        />
      )}

      {doctorToActivate && (
        <Modal
          titleId="activate-doctor-modal-title"
          title="Activate doctor?"
          onClose={() => {
            if (!changingStatus) {
              setDoctorToActivate(null);
            }
          }}
        >
          <p>
            <strong>{doctorToActivate.name}</strong> has a linked login
            account. Choose whether to activate only the doctor profile or
            activate both the doctor profile and login account.
          </p>

          <div className="modal-actions">
            <button
              type="button"
              className="secondary-button"
              disabled={changingStatus}
              onClick={() => setDoctorToActivate(null)}
            >
              Cancel
            </button>
            <button
              type="button"
              className="secondary-button"
              disabled={changingStatus}
              onClick={() =>
                void handleActivateDoctor(doctorToActivate, false)
              }
            >
              Activate Doctor Only
            </button>
            <button
              type="button"
              className="activate-button"
              disabled={changingStatus}
              onClick={() =>
                void handleActivateDoctor(doctorToActivate, true)
              }
            >
              {changingStatus ? "Activating..." : "Activate Both"}
            </button>
          </div>
        </Modal>
      )}
    </section>
  );
}

export default DoctorsPage;
