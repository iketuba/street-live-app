import { use } from "react";
import EditPostClient from "./EditPostClient";

export default function EditPostPage(props: {
  params: Promise<{ postId: string }>;
}) {
  const { postId } = use(props.params); // use() で unwrap
  return <EditPostClient postId={postId} />;
}
