type FormActionsProps = {
  saving: boolean;
  saveDisabled: boolean;
  onCancel: () => void;
  saveText?: string;
};

function FormActions({
  saving,
  saveDisabled,
  onCancel,
  saveText = "Save",
}: FormActionsProps) {
  return (
    <div className="standard-form-actions">
      <button
        type="button"
        className="secondary-button"
        disabled={saving}
        onClick={onCancel}
      >
        Cancel
      </button>
      <button type="submit" disabled={saveDisabled}>
        {saving ? "Saving..." : saveText}
      </button>
    </div>
  );
}

export default FormActions;
