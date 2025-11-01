import { AlertCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface FormFieldProps {
  id: string;
  label: string;
  type?: string;
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  disabled?: boolean;
  maxLength?: number;
  helperText?: string;
  className?: string;
}

/**
 * Reusable form field component with validation error display
 *
 * Shows validation errors inline below the input instead of just
 * disabling the submit button, providing better UX feedback.
 */
export function FormField({
  id,
  label,
  type = "text",
  placeholder,
  value,
  onChange,
  error,
  disabled,
  maxLength,
  helperText,
  className,
}: FormFieldProps) {
  const hasError = !!error;

  return (
    <div className={`space-y-2 ${className || ""}`}>
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        maxLength={maxLength}
        className={hasError ? "border-red-300 focus-visible:ring-red-400" : ""}
        aria-invalid={hasError}
        aria-describedby={
          hasError ? `${id}-error` : helperText ? `${id}-helper` : undefined
        }
      />
      {hasError && (
        <div
          id={`${id}-error`}
          className="flex items-start gap-1.5 text-sm text-red-600"
        >
          <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}
      {!hasError && helperText && (
        <p id={`${id}-helper`} className="text-sm text-muted-foreground">
          {helperText}
        </p>
      )}
    </div>
  );
}
