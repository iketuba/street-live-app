"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { doc, getDoc, deleteDoc } from "firebase/firestore";
import { db, auth, storage } from "@/lib/firebase";
import Image from "next/image";
import {
  FaInstagram,
  FaTwitter,
  FaYoutube,
  FaTiktok,
  FaLink,
} from "react-icons/fa";
import { Loader2 } from "lucide-react";
import { onAuthStateChanged, User as AuthUser } from "firebase/auth";
import { ref, deleteObject } from "firebase/storage";

export default function PostDetailClient({ postId }: PostDetailClientProps) {
  const router = useRouter();
  const [post, setPost] = useState<Post | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
    });

    const fetchData = async () => {
      const postDoc = await getDoc(doc(db, "posts", postId));
      if (!postDoc.exists()) return;
      const postData = postDoc.data() as Post;
      setPost(postData);
      const userDoc = await getDoc(doc(db, "users", postData.uid));
      if (userDoc.exists()) {
        setUser(userDoc.data());
      }
      setLoading(false);
    };

    fetchData();
    return () => unsubscribe();
  }, [postId]);

  const handleDelete = async () => {
    if (!post) return;
    const confirmDelete = confirm("この投稿を削除しますか？");
    if (!confirmDelete) return;

    if (post.imageUrl) {
      try {
        const ext = post.imageUrl.split(".").pop() ?? "jpg";
        const imageRef = ref(storage, `images/${postId}.${ext}`);
        await deleteObject(imageRef);
      } catch (e) {
        console.error("画像削除失敗:", e);
      }
    }

    await deleteDoc(doc(db, "posts", postId));
    router.push("/mypage");
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
      </div>
    );
  }

  if (!post || !user) {
    return <div className="text-center p-8">投稿が見つかりません</div>;
  }

  return (
    <div className="max-w-xl mx-auto p-4 space-y-6">
      {/* プロフィール */}
      <div className="flex flex-col items-center space-y-2">
        <Image
          src={user.photoURL || "/default-profile.png"}
          alt="プロフィール画像"
          width={96}
          height={96}
          className="rounded-full w-24 h-24 object-cover"
        />
        <p className="text-lg font-semibold">
          {user.username || "匿名ユーザー"}
        </p>
        <div className="flex space-x-4 text-xl">
          {user.instagram && (
            <a href={user.instagram} target="_blank" rel="noopener noreferrer">
              <FaInstagram />
            </a>
          )}
          {user.twitter && (
            <a href={user.twitter} target="_blank" rel="noopener noreferrer">
              <FaTwitter />
            </a>
          )}
          {user.youtube && (
            <a href={user.youtube} target="_blank" rel="noopener noreferrer">
              <FaYoutube />
            </a>
          )}
          {user.tiktok && (
            <a href={user.tiktok} target="_blank" rel="noopener noreferrer">
              <FaTiktok />
            </a>
          )}
          {user.other && (
            <a href={user.other} target="_blank" rel="noopener noreferrer">
              <FaLink />
            </a>
          )}
        </div>
      </div>

      {/* 投稿詳細 */}
      <div className="space-y-2 text-left">
        <h2 className="text-xl font-bold">{post.title}</h2>
        <p>
          {post.date} {post.startTime}~{post.endTime}
        </p>
        {typeof post.price === "number" && (
          <p>料金: {post.price === 0 ? "無料" : `¥${post.price}`}</p>
        )}
        {post.detail && <p>詳細: {post.detail}</p>}
        {post.imageUrl && (
          <Image
            src={post.imageUrl}
            alt="投稿画像"
            width={400}
            height={300}
            className="rounded mt-2"
          />
        )}
        <p>
          <a
            href={`https://www.google.com/maps/search/?api=1&query=${post.lat},${post.lng}`}
            className="text-blue-500 underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            Google Mapで開く
          </a>
        </p>
      </div>

      {/* 編集・削除ボタン */}
      {currentUser?.uid === post.uid && (
        <div className="flex gap-4">
          <button
            onClick={() => router.push(`/edit-post/${postId}`)}
            className="flex-1 bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600 transition"
          >
            編集する
          </button>
          <button
            onClick={handleDelete}
            className="flex-1 bg-red-500 text-white py-2 rounded-lg hover:bg-red-600 transition"
          >
            削除する
          </button>
        </div>
      )}

      <div className="pt-4 pb-24">
        <button
          onClick={() => router.back()}
          className="w-full bg-gray-300 text-black py-2 rounded-lg hover:bg-gray-400 transition"
        >
          戻る
        </button>
      </div>
    </div>
  );
}

interface Post {
  title: string;
  date: string;
  startTime: string;
  endTime: string;
  lat: number;
  lng: number;
  price?: number;
  detail?: string;
  imageUrl?: string;
  uid: string;
}

interface User {
  photoURL?: string;
  username?: string;
  instagram?: string;
  twitter?: string;
  youtube?: string;
  tiktok?: string;
  other?: string;
}

interface PostDetailClientProps {
  postId: string;
}
