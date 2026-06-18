type EmptyStateProps = {
  message: string;
  colSpan?: number;
};

function EmptyState({ message, colSpan }: EmptyStateProps) {
  if (colSpan) {
    return (
      <tr>
        <td colSpan={colSpan} className="empty-state">
          {message}
        </td>
      </tr>
    );
  }

  return <div className="empty-state">{message}</div>;
}

export default EmptyState;
