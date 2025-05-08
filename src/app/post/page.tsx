import { Suspense } from "react";
import PostClient from "./PostClient";

export default function PostPage() {
  return (
    <Suspense fallback={<div>読み込み中...</div>}>
      <PostClient />
    </Suspense>
  );
}
