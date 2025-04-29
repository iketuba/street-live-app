"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { auth, storage } from "@/lib/firebase";
import { onAuthStateChanged, signOut, User } from "firebase/auth";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { db } from "@/lib/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import Link from "next/link";
import toast from "react-hot-toast";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [bio, setBio] = useState("");
  const [sns, setSNS] = useState({
    instagram: "",
    twitter: "",
    youtube: "",
    tiktok: "",
    other: "",
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.push("/");
      } else {
        setUser(user);

        const userDocRef = doc(db, "users", user.uid);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
          const data = userDoc.data();
          setBio(data.bio || "");
          setSNS({
            instagram: data.instagram || "",
            twitter: data.twitter || "",
            youtube: data.youtube || "",
            tiktok: data.tiktok || "",
            other: data.other || "",
          });
        }
      }
    });
    return () => unsubscribe();
  }, [router]);

  const handleLogout = async () => {
    await signOut(auth);
    router.push("/");
  };

  const handleSaveProfile = async () => {
    if (!user) return;

    const userDocRef = doc(db, "users", user.uid);
    await setDoc(userDocRef, {
      bio,
      instagram: sns.instagram,
      twitter: sns.twitter,
      youtube: sns.youtube,
      tiktok: sns.tiktok,
      other: sns.other,
      updatedAt: new Date(),
    });

    toast.success("プロフィールを保存しました！");
  };

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleImageClick = () => {
    fileInputRef.current?.click();
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!user) return;
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const storageRef = ref(storage, `profileImages/${user.uid}`);
      await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(storageRef);

      const userDocRef = doc(db, "users", user.uid);
      await setDoc(userDocRef, { photoURL: downloadURL }, { merge: true });

      setUser({ ...user, photoURL: downloadURL });

      toast.success("プロフィール画像をアップロードしました！");
    } catch (error) {
      console.error("画像アップロードエラー:", error);
      toast.error("画像アップロードに失敗しました");
    }
  };

  if (!user) {
    return null;
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <div
        className="relative w-24 h-24 mb-4 group cursor-pointer"
        onClick={handleImageClick}
      >
        <Image
          src={user?.photoURL || "/default-profile.png"}
          alt="プロフィール画像"
          layout="fill"
          objectFit="cover"
          className="rounded-full"
        />

        {/* ホバー時に出現する + ボタン */}
        <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black bg-opacity-40 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <span className="text-white text-3xl">＋</span>
        </div>

        {/* 非表示のファイルインプット */}
        <input
          type="file"
          accept="image/*"
          ref={fileInputRef}
          onChange={handleImageChange}
          className="hidden"
        />
      </div>

      <h2 className="text-2xl font-semibold mb-4">
        {user.displayName || "ユーザー名未設定"}
      </h2>
      <textarea
        value={bio}
        onChange={(e) => setBio(e.target.value)}
        placeholder="自己紹介 (100文字以内)"
        maxLength={100}
        className="w-full max-w-md p-2 border rounded mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
      />

      <div className="w-full max-w-md flex flex-col space-y-4 mb-6">
        <div className="flex flex-col space-y-1">
          <label className="text-sm font-semibold">Instagram URL</label>
          <input
            type="text"
            value={sns.instagram}
            onChange={(e) => setSNS({ ...sns, instagram: e.target.value })}
            className="p-2 border rounded focus:outline-none focus:ring-2 focus:ring-pink-500"
          />
        </div>

        <div className="flex flex-col space-y-1">
          <label className="text-sm font-semibold">Twitter URL</label>
          <input
            type="text"
            value={sns.twitter}
            onChange={(e) => setSNS({ ...sns, twitter: e.target.value })}
            className="p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
        </div>

        <div className="flex flex-col space-y-1">
          <label className="text-sm font-semibold">YouTube URL</label>
          <input
            type="text"
            value={sns.youtube}
            onChange={(e) => setSNS({ ...sns, youtube: e.target.value })}
            className="p-2 border rounded focus:outline-none focus:ring-2 focus:ring-red-500"
          />
        </div>

        <div className="flex flex-col space-y-1">
          <label className="text-sm font-semibold">TikTok URL</label>
          <input
            type="text"
            value={sns.tiktok}
            onChange={(e) => setSNS({ ...sns, tiktok: e.target.value })}
            className="p-2 border rounded focus:outline-none focus:ring-2 focus:ring-black"
          />
        </div>

        <div className="flex flex-col space-y-1">
          <label className="text-sm font-semibold">その他のSNSやURL</label>
          <input
            type="text"
            value={sns.other}
            onChange={(e) => setSNS({ ...sns, other: e.target.value })}
            className="p-2 border rounded focus:outline-none focus:ring-2 focus:ring-gray-500"
          />
        </div>
      </div>

      <Button
        onClick={handleSaveProfile}
        className="w-full max-w-md py-2 bg-blue-500 text-white rounded-lg mb-4"
      >
        プロフィールを保存
      </Button>

      <Button
        onClick={handleLogout}
        className="w-full max-w-md py-2 bg-red-500 text-white rounded-lg"
      >
        ログアウト
      </Button>

      <Link
        href="/"
        className="fixed bottom-4 left-4 bg-gray-800 text-white px-4 py-2 rounded-full shadow-lg"
      >
        地図に戻る
      </Link>
    </div>
  );
}
