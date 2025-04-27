// src/app/profile/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged, signOut, User } from "firebase/auth";
import { Button } from "@/components/ui/button";
import Image from "next/image";

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
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) {
        router.push("/");
      } else {
        setUser(user);
      }
    });
    return () => unsubscribe();
  }, [router]);

  const handleLogout = async () => {
    await signOut(auth);
    router.push("/");
  };

  if (!user) {
    return null;
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      {/* プロフィール画像 */}
      <div className="mb-4">
        <Image
          src={user.photoURL || "/default-profile.png"}
          alt="プロフィール写真"
          width={96}
          height={96}
          className="rounded-full object-cover"
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

      <div className="w-full max-w-md flex flex-col space-y-3 mb-6">
        <input
          type="text"
          placeholder="Instagram URL"
          value={sns.instagram}
          onChange={(e) => setSNS({ ...sns, instagram: e.target.value })}
          className="p-2 border rounded focus:outline-none focus:ring-2 focus:ring-pink-500"
        />
        <input
          type="text"
          placeholder="Twitter URL"
          value={sns.twitter}
          onChange={(e) => setSNS({ ...sns, twitter: e.target.value })}
          className="p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
        />
        <input
          type="text"
          placeholder="YouTube URL"
          value={sns.youtube}
          onChange={(e) => setSNS({ ...sns, youtube: e.target.value })}
          className="p-2 border rounded focus:outline-none focus:ring-2 focus:ring-red-500"
        />
        <input
          type="text"
          placeholder="TikTok URL"
          value={sns.tiktok}
          onChange={(e) => setSNS({ ...sns, tiktok: e.target.value })}
          className="p-2 border rounded focus:outline-none focus:ring-2 focus:ring-black"
        />
        <input
          type="text"
          placeholder="その他のSNSやURL"
          value={sns.other}
          onChange={(e) => setSNS({ ...sns, other: e.target.value })}
          className="p-2 border rounded focus:outline-none focus:ring-2 focus:ring-gray-500"
        />
      </div>

      <Button
        onClick={handleLogout}
        className="w-full max-w-md py-2 bg-red-500 text-white rounded-lg"
      >
        ログアウト
      </Button>
    </div>
  );
}
