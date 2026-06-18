type FormCardProps = {
  title?: string;
  children: React.ReactNode;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
};

function FormCard({ title, children, onSubmit }: FormCardProps) {
  return (
    <form className="standard-form-card" onSubmit={onSubmit}>
      {title && <h2>{title}</h2>}
      <div className="standard-form-fields">{children}</div>
    </form>
  );
}

export default FormCard;
