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
import imageCompression from "browser-image-compression";
import { PostDataForFirestore } from "../post/PostClient";

export default function EditPostClient() {
  // 投稿のIDをURLから取得
  const searchParams = useSearchParams();
  const postId = searchParams.get("id");
  const router = useRouter();
  const [post, setPost] = useState<PostDataForFirestore | null>(null);
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
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const fetchPost = async () => {
      if (!postId) return;
      const postDoc = await getDoc(doc(db, "posts", postId));
      if (postDoc.exists()) {
        const data = postDoc.data() as PostDataForFirestore;
        setPost(data);
        setTitle(data.title || "");
        setDate(data.date || "");
        setStartTime(data.startTime || "");
        setEndTime(data.endTime || "");
        setPrice(data.price || "");
        setDetail(data.detail || "");
        setImagePreview(data.imageUrl || null);
      }
      setLoading(false);
    };
    fetchPost();
  }, [postId]);

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const options = {
          maxSizeMB: 1,
          maxWidthOrHeight: 1000,
          useWebWorker: true,
        };
        const compressedFile = await imageCompression(file, options);
        setImage(compressedFile);
        setImagePreview(URL.createObjectURL(compressedFile));
      } catch (error) {
        console.error("画像圧縮エラー:", error);
        setErrorMessage("画像の読み込みに失敗しました。");
      }
    }
  };

  const handleSubmit = async () => {
    if (!postId) return;
    if (!title || !date || !startTime || !endTime) {
      setErrorMessage("タイトル、日付、開始時間、終了時間は必須です");
      return;
    }
    const selectedDate = new Date(`${date}T${startTime}`);
    const now = new Date();
    if (startTime >= endTime) {
      setErrorMessage("開始時間は終了時間より前にしてください");
      return;
    }
    if (selectedDate < now) {
      setErrorMessage("開始時間は現在以降の時刻を設定してください");
      return;
    }
    if (image && image.size > 5 * 1024 * 1024) {
      setErrorMessage("画像サイズは5MB以下にしてください");
      return;
    }

    setUpdating(true);
    let imageUrl = post?.imageUrl || "";

    try {
      if (image) {
        const ext = image.name.split(".").pop();
        const imageRef = ref(storage, `images/${postId}.${ext}`);
        if (post?.imageUrl) {
          const path = new URL(post.imageUrl).pathname
            .split("/o/")[1]
            ?.split("?")[0]
            ?.replace(/%2F/g, "/");
          if (path) {
            const oldRef = ref(storage, path);
            await deleteObject(oldRef);
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
        price,
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
    <div className="fixed inset-0 overflow-y-auto bg-white p-4 max-w-md mx-auto space-y-4 pb-24 overscroll-none">
      <h2 className="text-xl font-bold">投稿を編集</h2>

      {/* 各入力項目 */}
      <div className="space-y-2">
        <label className="block font-semibold">
          タイトル <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="例: 路上ライブ＠渋谷"
          className="w-full border rounded p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="space-y-2">
        <label className="block font-semibold">
          日付 <span className="text-red-500">*</span>
        </label>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="w-full border rounded p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          min="2020-01-01"
          max="2099-12-31"
        />
      </div>

      <div className="space-y-2">
        <label className="block font-semibold">
          開始時間 <span className="text-red-500">*</span>
        </label>
        <input
          type="time"
          value={startTime}
          onChange={(e) => setStartTime(e.target.value)}
          className="w-full border rounded p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="space-y-2">
        <label className="block font-semibold">
          終了時間 <span className="text-red-500">*</span>
        </label>
        <input
          type="time"
          value={endTime}
          onChange={(e) => setEndTime(e.target.value)}
          className="w-full border rounded p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="space-y-2">
        <label className="block font-semibold">料金</label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
            ¥
          </span>
          <input
            type="text"
            inputMode="numeric"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder="例: 1000 または 無料"
            className="w-full border rounded p-2 pl-8 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div className="space-y-2">
        <label className="block font-semibold">詳細</label>
        <textarea
          value={detail}
          onChange={(e) => setDetail(e.target.value)}
          placeholder="イベントの詳細など"
          className="w-full border rounded p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* 写真アップロード */}
      <div className="space-y-2">
        <label className="block font-semibold">写真</label>
        {!imagePreview && (
          <div className="border-2 border-dashed border-gray-300 p-4 rounded-lg text-center">
            <p className="mb-2 text-gray-500">画像を選択してください</p>
            <input
              id="image-upload"
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="hidden"
            />
            <label
              htmlFor="image-upload"
              className="inline-block px-4 py-2 bg-blue-500 text-white rounded cursor-pointer hover:bg-blue-600 transition"
            >
              ファイルを選択
            </label>
          </div>
        )}

        {imagePreview && (
          <div className="relative">
            <Image
              src={imagePreview}
              alt="preview"
              width={300}
              height={300}
              className="rounded-md mx-auto"
            />
            <div className="text-center mt-2">
              <Button
                variant="destructive"
                onClick={() => {
                  setImage(null);
                  setImagePreview(null);
                }}
                className="mt-2"
              >
                画像を削除
              </Button>
            </div>
          </div>
        )}
      </div>

      <Button
        onClick={handleSubmit}
        disabled={updating}
        className="w-full bg-blue-500 text-white flex justify-center items-center"
      >
        {updating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} 保存する
      </Button>

      {errorMessage && (
        <div className="bg-red-100 text-red-700 p-3 rounded border border-red-400">
          <p>{errorMessage}</p>
          <button
            className="text-sm text-red-500 underline mt-1"
            onClick={() => setErrorMessage("")}
          >
            閉じる
          </button>
        </div>
      )}
    </div>
  );
}
