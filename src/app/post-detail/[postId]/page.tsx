import { Suspense } from "react";
import PostDetailClient from "./postDetailClient";

export default function PostDetailPage({ params }: PageProps) {
  return (
    <Suspense fallback={<div>読み込み中...</div>}>
      <PostDetailClient postId={params.postId} />
    </Suspense>
  );
}

interface PageProps {
  params: { postId: string };
}
