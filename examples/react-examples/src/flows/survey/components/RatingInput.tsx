import { Star } from "lucide-react";

type RatingInputProps = {
  value?: number;
  onChange: (value: number) => void;
  max?: number;
};

export function RatingInput({ value, onChange, max = 5 }: RatingInputProps) {
  return (
    <div className="flex gap-2">
      {Array.from({ length: max }, (_, i) => i + 1).map((rating) => (
        <button
          key={rating}
          type="button"
          onClick={() => onChange(rating)}
          className="group transition-transform hover:scale-110"
        >
          <Star
            className={`h-8 w-8 transition-colors ${
              value && rating <= value
                ? "fill-yellow-400 text-yellow-400"
                : "text-muted-foreground group-hover:text-yellow-400"
            }`}
          />
        </button>
      ))}
    </div>
  );
}
