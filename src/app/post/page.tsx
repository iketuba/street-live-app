"use client";

import { useState, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { db, storage, auth } from "@/lib/firebase";
import { doc, setDoc, Timestamp } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { useAuthState } from "react-firebase-hooks/auth";
import { Loader2 } from "lucide-react";
import { v4 as uuidv4 } from "uuid";

export default function PostPage() {
  const searchParams = useSearchParams();
  const latitude = searchParams.get("latitude");
  const longitude = searchParams.get("longitude");
  const lat =
    latitude && !isNaN(Number(latitude)) ? parseFloat(latitude) : undefined;
  const lng =
    longitude && !isNaN(Number(longitude)) ? parseFloat(longitude) : undefined;
  const [user] = useAuthState(auth);
  const router = useRouter();
  const [isPosting, setIsPosting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

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
  if (
    !title ||
    !date ||
    !startTime ||
    !endTime ||
    lat === undefined ||
    lng === undefined
  ) {
    setErrorMessage("タイトル、日付、開始時間、終了時間は必須です");
    return;
  }

  if (!user) {
    setErrorMessage("ログインが必要です");
    return;
  }

  if (isNaN(new Date(date).getTime())) {
    setErrorMessage("日付が無効です");
    return;
  }

  if (startTime >= endTime) {
    setErrorMessage("開始時間は終了時間より前にしてください");
    return;
  }

  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
    setErrorMessage("位置情報が不正です");
    return;
  }

  if (image && image.size > 5 * 1024 * 1024) {
    setErrorMessage("画像サイズは5MB以下にしてください");
    return;
  }

  setIsPosting(true);

  try {
    const postId = uuidv4(); // 先にIDを生成
    let imageUrl = "";

    if (image) {
      const ext = image.name.split(".").pop();
      const imageRef = ref(storage, `images/${postId}.${ext}`);
      await uploadBytes(imageRef, image);
      imageUrl = await getDownloadURL(imageRef);
    }

    await setDoc(doc(db, "posts", postId), {
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

    setShowPopup(true);
  } catch (error) {
    console.error("投稿エラー:", error);
    alert("投稿に失敗しました。");
  } finally {
    setIsPosting(false);
  }
};

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setImage(file);
  };

  const imagePreviewUrl = useMemo(() => {
    return image ? URL.createObjectURL(image) : null;
  }, [image]);

  return (
    <div className="p-4 max-w-md mx-auto space-y-4 pb-24">
      <h2 className="text-xl font-bold">投稿情報入力</h2>
      {/* タイトル */}
      <div className="space-y-2">
        <label className="block mb-1 font-semibold">
          タイトル <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="例: 路上ライブ＠渋谷"
          className="w-full border rounded p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        />
      </div>

      {/* 日付 */}
      <div className="space-y-2">
        <label className="block mb-1 font-semibold">
          日付 <span className="text-red-500">*</span>
        </label>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="w-full border rounded p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        />
      </div>

      {/* 開始時間 */}
      <div className="space-y-2">
        <label className="block mb-1 font-semibold">
          開始時間 <span className="text-red-500">*</span>
        </label>
        <input
          type="time"
          value={startTime}
          onChange={(e) => setStartTime(e.target.value)}
          className="w-full border rounded p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        />
      </div>

      {/* 終了時間 */}
      <div className="space-y-2">
        <label className="block mb-1 font-semibold">
          終了時間 <span className="text-red-500">*</span>
        </label>
        <input
          type="time"
          value={endTime}
          onChange={(e) => setEndTime(e.target.value)}
          className="w-full border rounded p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        />
      </div>

      {/* 料金 */}
      <div className="space-y-2">
        <label className="block font-semibold">料金</label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
            ¥
          </span>
          <input
            type="text"
            value={price}
            inputMode="numeric" // スマホなどで数字キーボードを表示
            onChange={(e) => {
              const value = e.target.value
                .replace(/[^\d０-９]/g, "") // 数字以外を除去
                .replace(/[０-９]/g, (s) =>
                  String.fromCharCode(s.charCodeAt(0) - 65248)
                ); // 全角→半角変換
              setPrice(value);
            }}
            placeholder="例: 1000"
            className="w-full border rounded p-2 pl-8 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* 詳細 */}
      <div className="space-y-2">
        <label className="block font-semibold">詳細</label>
        <textarea
          value={detail}
          onChange={(e) => setDetail(e.target.value)}
          placeholder="イベントの詳細など"
          className="w-full border rounded p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* 写真 */}
      <div className="space-y-2">
        <label className="block font-semibold">写真</label>
        <input type="file" accept="image/*" onChange={handleImageChange} />
        {imagePreviewUrl && (
          <Image
            src={imagePreviewUrl}
            alt="preview"
            width={200}
            height={200}
            className="rounded"
          />
        )}
      </div>

      {/* 投稿ボタン */}
      <Button
        onClick={handlePost}
        disabled={isPosting}
        className="w-full bg-blue-500 text-white flex justify-center items-center"
      >
        {isPosting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
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

      {/* エラー表示用ポップアップ */}
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
