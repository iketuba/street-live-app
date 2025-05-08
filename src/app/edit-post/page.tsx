import { Suspense } from "react";
import EditPostClient from "./EditPostClient";

export default function EditPostPage() {
  return (
    <Suspense fallback={<div>読み込み中...</div>}>
      <EditPostClient />
    </Suspense>
  );
}
