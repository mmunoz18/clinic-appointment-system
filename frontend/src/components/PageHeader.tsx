type PageHeaderProps = {
  title: string;
  description: string;
  action?: React.ReactNode;
};

function PageHeader({
  title,
  description,
  action,
}: PageHeaderProps) {
  return (
    <div
      className={`page-header${action ? " page-header-with-action" : ""}`}
    >
      <div>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      {action}
    </div>
  );
}

export default PageHeader;
