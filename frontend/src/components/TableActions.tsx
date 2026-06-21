import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

export type TableAction = {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  tone?: "default" | "info" | "positive" | "danger";
};

type TableActionsProps = {
  primaryActions?: TableAction[];
  menuActions?: TableAction[];
  status?: React.ReactNode;
};

function TableActions({
  primaryActions = [],
  menuActions = [],
  status,
}: TableActionsProps) {
  const [menuPosition, setMenuPosition] = useState<{
    top: number;
    right: number;
  } | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuPosition) {
      return;
    }

    function closeMenu(event: MouseEvent) {
      const target = event.target as Node;

      if (
        !triggerRef.current?.contains(target) &&
        !menuRef.current?.contains(target)
      ) {
        setMenuPosition(null);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setMenuPosition(null);
      }
    }

    function handleScroll() {
      setMenuPosition(null);
    }

    document.addEventListener("mousedown", closeMenu);
    document.addEventListener("keydown", handleKeyDown);
    window.addEventListener("scroll", handleScroll, true);

    return () => {
      document.removeEventListener("mousedown", closeMenu);
      document.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("scroll", handleScroll, true);
    };
  }, [menuPosition]);

  function toggleMenu() {
    if (menuPosition) {
      setMenuPosition(null);
      return;
    }

    const rectangle = triggerRef.current?.getBoundingClientRect();

    if (rectangle) {
      setMenuPosition({
        top: rectangle.bottom + 6,
        right: window.innerWidth - rectangle.right,
      });
    }
  }

  function runMenuAction(action: TableAction) {
    setMenuPosition(null);
    action.onClick();
  }

  return (
    <div className="table-actions">
      {status}

      {primaryActions.map((action) => (
        <button
          key={action.label}
          type="button"
          className={`table-action-button table-action-${action.tone ?? "default"}`}
          disabled={action.disabled}
          onClick={action.onClick}
        >
          {action.label}
        </button>
      ))}

      {menuActions.length > 0 && (
        <>
          <button
            ref={triggerRef}
            type="button"
            className="table-action-menu-trigger"
            aria-label="More actions"
            aria-expanded={menuPosition != null}
            onClick={toggleMenu}
          >
            ⋮
          </button>

          {menuPosition &&
            createPortal(
              <div
                ref={menuRef}
                className="table-action-menu-content"
                style={menuPosition}
              >
                {menuActions.map((action) => (
                  <button
                    key={action.label}
                    type="button"
                    className={`table-action-menu-item table-action-${action.tone ?? "default"}`}
                    disabled={action.disabled}
                    onClick={() => runMenuAction(action)}
                  >
                    {action.label}
                  </button>
                ))}
              </div>,
              document.body
            )}
        </>
      )}
    </div>
  );
}

export default TableActions;
