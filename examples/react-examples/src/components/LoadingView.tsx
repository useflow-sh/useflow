import { Loader2 } from "lucide-react";

export function LoadingView() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center space-y-4">
        <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
        <p className="text-muted-foreground">Loading...</p>
      </div>
    </div>
  );
}
