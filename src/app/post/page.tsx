"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { db, storage, auth } from "@/lib/firebase";
import { addDoc, collection, Timestamp } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { useAuthState } from "react-firebase-hooks/auth";

export default function PostPage() {
  const searchParams = useSearchParams();
  const latitude = searchParams.get("latitude");
  const longitude = searchParams.get("longitude");
  const lat = latitude ? parseFloat(latitude) : null;
  const lng = longitude ? parseFloat(longitude) : null;
  const [user] = useAuthState(auth);
  const router = useRouter();

  // 入力状態
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [price, setPrice] = useState("");
  const [detail, setDetail] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");

  // ポップアップ状態ç
  const [showPopup, setShowPopup] = useState(false);

  const handlePost = async () => {
    if (!title || !date || !startTime || !endTime || !latitude || !longitude) {
      alert("タイトル、日付、開始時間、終了時間は必須です");
      return;
    }

    if (!user) {
      alert("ログインが必要です");
      return;
    }

    try {
      let imageUrl = "";

      // 画像アップロード（存在する場合のみ）
      if (image) {
        const imageRef = ref(storage, `posts/${user.uid}/${Date.now()}.jpg`);
        const snapshot = await uploadBytes(imageRef, image);
        imageUrl = await getDownloadURL(snapshot.ref);
      }

      // Firestoreに投稿データ保存
      const postRef = collection(db, "posts");
      await addDoc(postRef, {
        uid: user.uid,
        title,
        date,
        startTime,
        endTime,
        price,
        detail,
        imageUrl,
        lat,
        lng,
        createdAt: Timestamp.now(),
      });

      // 投稿完了ポップアップ表示
      setShowPopup(true);
    } catch (error) {
      console.error("投稿エラー:", error);
      alert("投稿に失敗しました。");
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setImage(file);
  };

  return (
    <div className="p-4 max-w-md mx-auto space-y-4 pb-24">
      <h2 className="text-xl font-bold">投稿情報入力</h2>
      {/* タイトル */}
      <div className="space-y-2">
        <label className="block font-semibold">タイトル（必須）</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="例: 路上ライブ＠渋谷"
          className="w-full border rounded p-2"
          required
        />
      </div>

      {/* 日付 */}
      <div className="space-y-2">
        <label className="block font-semibold">日付（必須）</label>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="w-full border rounded p-2"
          required
        />
      </div>

      {/* 時刻 */}
      <div className="space-y-2">
        <label className="block font-semibold">開始時間（必須）</label>
        <input
          type="time"
          value={startTime}
          onChange={(e) => setStartTime(e.target.value)}
          className="w-full border rounded p-2"
          required
        />
      </div>

      <div className="space-y-2">
        <label className="block font-semibold">終了時間（必須）</label>
        <input
          type="time"
          value={endTime}
          onChange={(e) => setEndTime(e.target.value)}
          className="w-full border rounded p-2"
          required
        />
      </div>

      {/* 料金 */}
      <div className="space-y-2">
        <label className="block font-semibold">料金（任意）</label>
        <input
          type="text"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          placeholder="例: 投げ銭制 / ¥1000"
          className="w-full border rounded p-2"
        />
      </div>

      {/* 詳細 */}
      <div className="space-y-2">
        <label className="block font-semibold">詳細（任意）</label>
        <textarea
          value={detail}
          onChange={(e) => setDetail(e.target.value)}
          placeholder="イベントの詳細など"
          className="w-full border rounded p-2"
        />
      </div>

      {/* 写真 */}
      <div className="space-y-2">
        <label className="block font-semibold">写真（任意）</label>
        <input type="file" accept="image/*" onChange={handleImageChange} />
        {image && (
          <Image
            src={URL.createObjectURL(image)}
            alt="preview"
            width={200}
            height={200}
            className="rounded"
          />
        )}
      </div>

      {/* 投稿ボタン */}
      <Button onClick={handlePost} className="w-full bg-blue-500 text-white">
        投稿する
      </Button>

      {/* ポップアップ */}
      {showPopup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg text-center space-y-4">
            <h3 className="text-xl font-bold">投稿完了！</h3>
            <Button
              onClick={() => router.push("/location-select")}
              className="w-full bg-green-500 text-white"
            >
              続けて投稿
            </Button>
            <Button
              onClick={() => router.push("/")}
              className="w-full bg-gray-300 text-black"
            >
              マップで確認
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
