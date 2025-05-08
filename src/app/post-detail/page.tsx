export const dynamic = "force-dynamic";

import { Suspense } from "react";
import PostDetailClient from "./PostDetailClient";

export default function PostDetailPage() {
  return (
    <Suspense fallback={<div>読み込み中...</div>}>
      <PostDetailClient />
    </Suspense>
  );
}
