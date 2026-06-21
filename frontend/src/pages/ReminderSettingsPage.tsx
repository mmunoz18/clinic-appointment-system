import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { toast } from "react-toastify";
import {
  getReminderSettings,
  updateReminderSettings,
  type ReminderSettings,
} from "../api/clinicApi";
import FormActions from "../components/FormActions";
import FormCard from "../components/FormCard";
import { formatDateTime } from "../utils/dateTime";

function ReminderSettingsPage() {
  const role = localStorage.getItem("role");
  const [settings, setSettings] = useState<ReminderSettings | null>(null);
  const [savedSettings, setSavedSettings] =
    useState<ReminderSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function loadSettings() {
      try {
        const data = await getReminderSettings();
        setSettings(data);
        setSavedSettings(data);
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : "Error loading reminder settings";
        toast.error(message);
      } finally {
        setLoading(false);
      }
    }

    if (role === "Admin") {
      loadSettings();
    }
  }, [role]);

  if (role !== "Admin") {
    return <Navigate to="/" replace />;
  }

  const hasChanges =
    settings != null &&
    savedSettings != null &&
    (settings.enabled !== savedSettings.enabled ||
      settings.send24HoursBefore !== savedSettings.send24HoursBefore ||
      settings.send2HoursBefore !== savedSettings.send2HoursBefore);
  const hasReminderTime =
    settings?.send24HoursBefore || settings?.send2HoursBefore;
  const saveDisabled =
    !settings ||
    !hasChanges ||
    saving ||
    (settings.enabled && !hasReminderTime);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    if (!settings || saveDisabled) {
      return;
    }

    setSaving(true);

    try {
      const updatedSettings = await updateReminderSettings(settings);
      setSettings(updatedSettings);
      setSavedSettings(updatedSettings);
      toast.success("Reminder settings saved successfully");
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Error saving reminder settings";
      toast.error(message);
    } finally {
      setSaving(false);
    }
  }

  function cancelChanges() {
    if (!saving && savedSettings) {
      setSettings({ ...savedSettings });
    }
  }

  return (
    <section className="reminder-settings-page">
      <div className="page-header">
        <h1>Reminder Settings</h1>
        <p>Configure automatic email reminders for scheduled appointments.</p>
      </div>

      {loading ? (
        <p className="loading-state">Loading reminder settings...</p>
      ) : settings ? (
        <FormCard onSubmit={handleSubmit}>
          <div
            className={`reminder-settings-status ${
              settings.enabled
                ? "reminder-settings-status-on"
                : "reminder-settings-status-off"
            }`}
          >
            <strong>
              Automatic reminders are {settings.enabled ? "ON" : "OFF"}
            </strong>
            <span>
              {settings.enabled
                ? "Patients will receive email reminders at the selected times."
                : "No reminders will be sent automatically. You can still send a reminder manually from the Appointments page."}
            </span>
          </div>

          <label className="settings-checkbox">
            <input
              type="checkbox"
              checked={settings.enabled}
              disabled={saving}
              onChange={(event) =>
                setSettings((current) =>
                  current
                    ? { ...current, enabled: event.target.checked }
                    : current
                )
              }
            />
            <span>Enable automatic reminders</span>
          </label>

          <div
            className={`settings-options ${
              !settings.enabled ? "settings-options-disabled" : ""
            }`}
          >
            <div>
              <h2>Reminder timing</h2>
              <p>Choose when patients should receive automatic reminders.</p>
            </div>

            <label className="settings-checkbox">
              <input
                type="checkbox"
                checked={settings.send24HoursBefore}
                disabled={saving || !settings.enabled}
                onChange={(event) =>
                  setSettings((current) =>
                    current
                      ? {
                          ...current,
                          send24HoursBefore: event.target.checked,
                        }
                      : current
                  )
                }
              />
              <span>24 hours before the appointment</span>
            </label>

            <label className="settings-checkbox">
              <input
                type="checkbox"
                checked={settings.send2HoursBefore}
                disabled={saving || !settings.enabled}
                onChange={(event) =>
                  setSettings((current) =>
                    current
                      ? {
                          ...current,
                          send2HoursBefore: event.target.checked,
                        }
                      : current
                  )
                }
              />
              <span>2 hours before the appointment</span>
            </label>

            {settings.enabled && !hasReminderTime && (
              <span className="field-error">
                Select at least one reminder time.
              </span>
            )}
          </div>

          <div className="form-info-message">
            When enabled, the clinic system checks regularly for upcoming
            appointments and sends reminders at the selected times.
          </div>

          <section className="reminder-execution">
            <div className="reminder-execution-header">
              <div>
                <h2>Last execution</h2>
                <p>Recent automatic reminder activity.</p>
              </div>
              <strong
                className={
                  settings.enabled
                    ? "reminder-execution-on"
                    : "reminder-execution-off"
                }
              >
                Automatic reminders are {settings.enabled ? "ON" : "OFF"}
              </strong>
            </div>

            <div className="reminder-execution-grid">
              <div>
                <span>Last check</span>
                <strong>
                  {settings.lastCheckAt
                    ? formatDateTime(settings.lastCheckAt)
                    : "Not checked yet"}
                </strong>
              </div>
              <div>
                <span>Last reminder sent</span>
                <strong>
                  {settings.lastReminderSentAt
                    ? formatDateTime(settings.lastReminderSentAt)
                    : "No automatic reminders sent yet"}
                </strong>
              </div>
              <div>
                <span>Next check</span>
                <strong>
                  {settings.enabled && settings.nextCheckAt
                    ? formatDateTime(settings.nextCheckAt)
                    : "—"}
                </strong>
              </div>
            </div>
          </section>

          <FormActions
            saving={saving}
            saveDisabled={saveDisabled}
            onCancel={cancelChanges}
            saveText="Save Settings"
          />
        </FormCard>
      ) : null}
    </section>
  );
}

export default ReminderSettingsPage;
