import { Suspense } from "react";
import PostClient from "./PostClient";
import { Loader2 } from "lucide-react";

export default function PostPage() {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center items-center h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
        </div>
      }
    >
      <PostClient />
    </Suspense>
  );
}
