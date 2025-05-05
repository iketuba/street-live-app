"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { db, storage } from "@/lib/firebase";
import { doc, getDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from "firebase/storage";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import Image from "next/image";

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

export default function EditPostPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const postId = searchParams.get("id");

  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [price, setPrice] = useState("");
  const [detail, setDetail] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  useEffect(() => {
    const fetchPost = async () => {
      if (!postId) return;
      const postDoc = await getDoc(doc(db, "posts", postId));
      if (postDoc.exists()) {
        const data = postDoc.data() as Post;
        setPost(data);
        setTitle(data.title || "");
        setDate(data.date || "");
        setStartTime(data.startTime || "");
        setEndTime(data.endTime || "");
        setPrice(data.price?.toString() || "");
        setDetail(data.detail || "");
        setImagePreview(data.imageUrl || null);
      }
      setLoading(false);
    };
    fetchPost();
  }, [postId]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImage(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async () => {
    if (!postId) return;
    setUpdating(true);

    let imageUrl = post?.imageUrl || "";

    try {
      if (image) {
        const ext = image.name.split(".").pop();
        const imageRef = ref(storage, `images/${postId}.${ext}`);

        // 旧画像削除（安全のため try-catch）
        if (post?.imageUrl) {
          try {
            const oldExt = post.imageUrl.split(".").pop();
            const oldRef = ref(storage, `images/${postId}.${oldExt}`);
            await deleteObject(oldRef);
          } catch (e) {
            console.warn("旧画像削除失敗:", e);
          }
        }

        await uploadBytes(imageRef, image);
        imageUrl = await getDownloadURL(imageRef);
      }

      await updateDoc(doc(db, "posts", postId), {
        title,
        date,
        startTime,
        endTime,
        price: Number(price),
        detail,
        imageUrl,
        updatedAt: serverTimestamp(),
      });

      router.push(`/post-detail?id=${postId}`);
    } catch (err) {
      console.error("更新エラー:", err);
      alert("保存に失敗しました");
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-gray-500" />
      </div>
    );
  }

  if (!post) {
    return <div className="text-center p-8">投稿が見つかりません</div>;
  }

  return (
    <div className="max-w-xl mx-auto p-4 space-y-6">
      <h1 className="text-2xl font-bold text-center">投稿を編集</h1>

      <div className="space-y-4">
        <input
          className="w-full border p-2 rounded"
          type="text"
          placeholder="タイトル"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <input
          className="w-full border p-2 rounded"
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />
        <div className="flex space-x-2">
          <input
            className="flex-1 border p-2 rounded"
            type="time"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
          />
          <span className="self-center">〜</span>
          <input
            className="flex-1 border p-2 rounded"
            type="time"
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
          />
        </div>
        <input
          className="w-full border p-2 rounded"
          type="number"
          placeholder="料金（円）"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
        />
        <textarea
          className="w-full border p-2 rounded"
          rows={4}
          placeholder="詳細"
          value={detail}
          onChange={(e) => setDetail(e.target.value)}
        />
        <div className="space-y-2">
          <label className="block font-semibold">画像</label>
          <input type="file" accept="image/*" onChange={handleImageChange} />
          {imagePreview && (
            <Image
              src={imagePreview}
              alt="preview"
              width={200}
              height={200}
              className="rounded"
            />
          )}
        </div>
      </div>
      <div className="pb-24">
        <Button className="w-full" onClick={handleSubmit} disabled={updating}>
          {updating ? "保存中..." : "保存する"}
        </Button>
      </div>
    </div>
  );
}
