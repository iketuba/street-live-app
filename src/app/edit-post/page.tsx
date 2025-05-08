import { Suspense } from "react";
import EditPostClient from "./EditPostClient";
import { Loader2 } from "lucide-react";

export default function EditPostPage() {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center items-center h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
        </div>
      }
    >
      <EditPostClient />
    </Suspense>
  );
}
