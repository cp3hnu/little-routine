"use client";

const HOURS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, "0"));
const MINUTES = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, "0"));

function splitTime(value: string) {
  const [h = "07", m = "00"] = (value || "07:00").split(":");
  return {
    hour: h.padStart(2, "0").slice(0, 2),
    minute: m.padStart(2, "0").slice(0, 2),
  };
}

export function TimePicker({
  value,
  onChange,
  id,
}: {
  value: string;
  onChange: (next: string) => void;
  id?: string;
}) {
  const { hour, minute } = splitTime(value);

  return (
    <div className="time-picker" id={id}>
      <label className="time-picker-field">
        <span className="sr-only">Hour</span>
        <select
          className="time-picker-select"
          value={hour}
          onChange={(e) => onChange(`${e.target.value}:${minute}`)}
        >
          {HOURS.map((h) => (
            <option key={h} value={h}>
              {h}
            </option>
          ))}
        </select>
      </label>
      <span className="time-picker-sep" aria-hidden="true">
        :
      </span>
      <label className="time-picker-field">
        <span className="sr-only">Minute</span>
        <select
          className="time-picker-select"
          value={minute}
          onChange={(e) => onChange(`${hour}:${e.target.value}`)}
        >
          {MINUTES.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}
