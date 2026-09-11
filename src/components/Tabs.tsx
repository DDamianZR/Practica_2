import clsx from "clsx";

export interface TabItem {
  id: string;
  label: string;
}

export function Tabs({
  items,
  active,
  onChange,
}: {
  items: readonly TabItem[];
  active: string;
  onChange: (id: string) => void;
}) {
  return (
    <div role="tablist" aria-label="Vistas del simulador" className="flex gap-1 rounded-xl border border-line bg-panel p-1">
      {items.map((item) => (
        <button
          key={item.id}
          type="button"
          role="tab"
          aria-selected={active === item.id}
          aria-label={item.label}
          onClick={() => onChange(item.id)}
          className={clsx(
            "flex-1 rounded-lg px-2 py-2 font-mono text-[11px] uppercase tracking-wide transition-colors duration-150",
            active === item.id ? "bg-hi/15 text-hi" : "text-muted hover:text-text",
          )}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}
