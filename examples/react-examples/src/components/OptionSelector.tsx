import { cn } from "@/lib/utils";

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
    <div className="flex flex-col gap-3">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onSelect(option.value)}
          className={cn(
            "p-4 text-left rounded-lg border-2 transition-all",
            "hover:border-primary/50 hover:bg-accent/50",
            selectedValue === option.value
              ? "border-primary bg-primary/10"
              : "border-border bg-card",
          )}
        >
          <div className="font-semibold text-base">{option.title}</div>
          <div className="text-sm text-muted-foreground mt-1">
            {option.description}
          </div>
        </button>
      ))}
    </div>
  );
}
