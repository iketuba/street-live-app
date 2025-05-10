"use client";

import { useEffect, useState } from "react";
import { hasLiked, toggleLike, getLikeCount } from "@/lib/firebase/like";
import { useRouter } from "next/navigation";

interface LikeButtonProps {
  postId: string;
  uid?: string;
}

export default function LikeButton({ postId, uid }: LikeButtonProps) {
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState<number>(0);
  const router = useRouter();

  useEffect(() => {
    // いいね済みか確認
    if (uid) {
      hasLiked(postId, uid).then(setLiked);
    }

    // いいね数を取得
    getLikeCount(postId).then(setLikeCount);
  }, [postId, uid]);

  const handleToggle = async () => {
    if (!uid) {
      router.push("/login");
      return;
    }

    const newLiked = await toggleLike(postId, uid);
    setLiked(newLiked);

    // 更新後に再取得
    const count = await getLikeCount(postId);
    setLikeCount(count);
  };

  return (
    <div className="flex items-center space-x-1">
      <button
        onClick={handleToggle}
        className={`text-xl transition-transform active:scale-90 ${
          liked ? "text-red-500" : "text-gray-400"
        }`}
        style={{ background: "none", border: "none", padding: 0 }}
      >
        {liked ? "❤️" : "🤍"}
      </button>
      {likeCount > 0 && (
        <span className="text-sm text-gray-600">{likeCount}</span>
      )}
    </div>
  );
}
