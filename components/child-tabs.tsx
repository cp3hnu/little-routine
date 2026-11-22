"use client";

type Child = { id: string; name: string };

export function ChildTabs({
  childrenList,
  value,
  onChange,
}: {
  childrenList: Child[];
  value: string;
  onChange: (id: string) => void;
}) {
  if (childrenList.length <= 1) return null;

  return (
    <div className="child-tabs" role="tablist">
      {childrenList.map((c) => (
        <button
          key={c.id}
          type="button"
          role="tab"
          aria-selected={value === c.id}
          className={value === c.id ? "active" : ""}
          onClick={() => onChange(c.id)}
        >
          {c.name}
        </button>
      ))}
    </div>
  );
}
