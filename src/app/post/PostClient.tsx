"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { db, storage, auth } from "@/lib/firebase";
import { doc, setDoc, Timestamp } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { useAuthState } from "react-firebase-hooks/auth";
import { Loader2 } from "lucide-react";
import { v4 as uuidv4 } from "uuid";
import imageCompression from "browser-image-compression";

// フォームの状態型
interface PostFormData {
  title: string;
  date: string;
  startTime: string;
  endTime: string;
  price: string;
  detail: string;
}

// Firestoreに保存するデータ型
export interface PostDataForFirestore {
  uid: string;
  title: string;
  date: string;
  startTime: string;
  endTime: string;
  price: string;
  detail: string;
  imageUrl: string;
  lat: number;
  lng: number;
  createdAt: Timestamp;
}

export default function PostClient() {
  // URLから緯度経度を取得
  const searchParams = useSearchParams();
  const latitude = searchParams.get("latitude");
  const longitude = searchParams.get("longitude");
  const lat =
    latitude && !isNaN(Number(latitude)) ? parseFloat(latitude) : undefined;
  const lng =
    longitude && !isNaN(Number(longitude)) ? parseFloat(longitude) : undefined;

  // 認証状態を取得
  const [user] = useAuthState(auth);
  // ルーターを取得
  const router = useRouter();
  // 投稿状態
  const [isPosting, setIsPosting] = useState(false);
  // エラーメッセージ
  const [errorMessage, setErrorMessage] = useState("");
  // ポップアップ状態
  const [showPopup, setShowPopup] = useState(false);
  // 投稿情報
  const [formData, setFormData] = useState<PostFormData>({
    title: "",
    date: "",
    startTime: "",
    endTime: "",
    price: "",
    detail: "",
  });
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  // 投稿ボタンのクリック処理
  const handlePost = async () => {
    const { title, date, startTime, endTime, price, detail } = formData;
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
    const selectedDate = new Date(`${date}T${startTime}`);
    const now = new Date();
    // 開始時間が現在より前ならエラー（未来のみ許可）
    if (selectedDate < now) {
      setErrorMessage("開始時間は現在以降の時刻を設定してください");
      return;
    }
    // 開始時間と終了時間の形式チェック
    if (startTime >= endTime) {
      setErrorMessage("開始時間は終了時間より前にしてください");
      return;
    }
    if (image && image.size > 5 * 1024 * 1024) {
      setErrorMessage("画像サイズは5MB以下にしてください");
      return;
    }
    if (
      image &&
      !["image/jpeg", "image/png", "image/gif"].includes(image.type)
    ) {
      setErrorMessage("JPEG, PNG, GIF形式の画像を選択してください");
      return;
    }
    setIsPosting(true);
    try {
      const postId = uuidv4();
      let imageUrl = "";

      if (image) {
        const ext = image.name.split(".").pop();
        const imageRef = ref(storage, `images/${postId}.${ext}`);
        await uploadBytes(imageRef, image);
        imageUrl = await getDownloadURL(imageRef);
      }
      // Firestoreに保存するデータ
      const postData: PostDataForFirestore = {
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
      };
      // Firestoreに投稿データを保存
      await setDoc(doc(db, "posts", postId), postData);
      setShowPopup(true);
    } catch (error) {
      console.error("投稿エラー:", error);
      alert("投稿に失敗しました。");
    } finally {
      setIsPosting(false);
    }
  };

  // 画像選択時の処理
  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!["image/jpeg", "image/png", "image/gif"].includes(file.type)) {
        setErrorMessage("JPEG, PNG, GIF形式の画像を選択してください");
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        setErrorMessage("画像サイズは5MB以下にしてください");
        return;
      }
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


  return (
    <div className="fixed inset-0 overflow-y-auto bg-white p-4 max-w-md mx-auto space-y-4 pb-24 overscroll-none">
      <h2 className="text-xl font-bold">投稿情報入力</h2>

      {/* タイトル */}
      <div className="space-y-2">
        <label className="block mb-1 font-semibold">
          タイトル <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
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
          value={formData.date}
          onChange={(e) => setFormData({ ...formData, date: e.target.value })}
          className="w-full border rounded p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
          min="2020-01-01"
          max="2099-12-31"
        />
      </div>

      {/* 開始時間 */}
      <div className="space-y-2">
        <label className="block mb-1 font-semibold">
          開始時間 <span className="text-red-500">*</span>
        </label>
        <input
          type="time"
          value={formData.startTime}
          onChange={(e) =>
            setFormData({ ...formData, startTime: e.target.value })
          }
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
          value={formData.endTime}
          onChange={(e) =>
            setFormData({ ...formData, endTime: e.target.value })
          }
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
            inputMode="numeric"
            value={formData.price}
            onChange={(e) =>
              setFormData({ ...formData, price: e.target.value })
            }
            placeholder="例: 1000 または 無料"
            className="w-full border rounded p-2 pl-8 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* 詳細 */}
      <div className="space-y-2">
        <label className="block font-semibold">詳細</label>
        <textarea
          value={formData.detail}
          onChange={(e) => setFormData({ ...formData, detail: e.target.value })}
          placeholder="イベントの詳細など"
          className="w-full border rounded p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* 写真アップロードエリア */}
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
              ホームへ
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
