interface Option<T extends string = string> {
  value: T;
  title: string;
  description: string;
}

interface OptionSelectorProps<T extends string> {
  options: readonly Option<T>[];
  selectedValue?: T;
  onSelect: (value: T) => void;
}

export function OptionSelector<T extends string>({
  options,
  selectedValue,
  onSelect,
}: OptionSelectorProps<T>) {
  return (
    <div
      style={{
        display: "flex",
        gap: "1rem",
        flexDirection: "column",
        marginTop: "1rem",
      }}
    >
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          className={selectedValue === option.value ? "selected" : ""}
          onClick={() => onSelect(option.value)}
          style={{
            padding: "1.5rem",
            border:
              selectedValue === option.value
                ? "2px solid #646cff"
                : "1px solid #ccc",
            borderRadius: "8px",
            background:
              selectedValue === option.value
                ? "rgba(100, 108, 255, 0.1)"
                : "transparent",
            color: "inherit",
            cursor: "pointer",
            textAlign: "left",
          }}
        >
          <strong>{option.title}</strong>
          <div
            style={{ fontSize: "0.9rem", marginTop: "0.5rem", opacity: 0.8 }}
          >
            {option.description}
          </div>
        </button>
      ))}
    </div>
  );
}
