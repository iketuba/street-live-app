"use client";

import { useEffect, useState } from "react";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged, User, signOut } from "firebase/auth";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { toast } from "react-hot-toast";
import { doc, getDoc } from "firebase/firestore";
import { FaInstagram, FaTwitter, FaTiktok, FaYoutube } from "react-icons/fa"; // SNSアイコンをインポート

export default function MyPage() {
  const [authUser, setAuthUser] = useState<User | null | undefined>(undefined);
  const [profile, setProfile] = useState<{
    photoURL: string;
    username: string;
    instagram: string;
    twitter: string;
    tiktok: string;
    youtube: string;
  }>({
    photoURL: "",
    username: "",
    instagram: "",
    twitter: "",
    tiktok: "",
    youtube: "",
  });
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setAuthUser(user);
      if (!user) {
        router.push("/login");
      } else {
        const userDocRef = doc(db, "users", user.uid);
        const userDocSnap = await getDoc(userDocRef);

        if (userDocSnap.exists()) {
          const data = userDocSnap.data();
          setProfile({
            photoURL: data.photoURL || "/default-profile.png",
            username: data.username || "ユーザー名未設定",
            instagram: data.instagram || "",
            twitter: data.twitter || "",
            tiktok: data.tiktok || "",
            youtube: data.youtube || "",
          });
        }
      }
    });

    return () => unsubscribe();
  }, [router]);

  if (authUser === undefined) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <p>読み込み中...</p>
      </div>
    );
  }

  const handleLogout = async () => {
    await signOut(auth);
    toast.success("ログアウトしました");
    router.push("/");
  };

  return (
    <div className="flex flex-col items-center px-4 pt-8 pb-32 min-h-screen">
      {/* プロフィール画像と名前 */}
      <div className="flex flex-col items-center space-y-2 mb-8">
        <div className="relative w-24 h-24">
          <Image
            src={profile.photoURL || "/default-profile.png"}
            alt="プロフィール画像"
            layout="fill"
            objectFit="cover"
            className="rounded-full"
          />
        </div>
        <h1 className="text-xl font-semibold">{profile.username}</h1>
      </div>

      {/* SNSアイコンの表示 */}
      <div className="flex space-x-4 mb-8">
        {profile.instagram && (
          <Link href={profile.instagram} passHref>
            <FaInstagram size={24} className="text-blue-600" />
          </Link>
        )}
        {profile.twitter && (
          <Link href={profile.twitter} passHref>
            <FaTwitter size={24} className="text-blue-400" />
          </Link>
        )}
        {profile.tiktok && (
          <Link href={profile.tiktok} passHref>
            <FaTiktok size={24} className="text-black" />
          </Link>
        )}
        {profile.youtube && (
          <Link href={profile.youtube} passHref>
            <FaYoutube size={24} className="text-red-600" />
          </Link>
        )}
      </div>

      {/* メニュー */}
      <div className="w-full max-w-md space-y-4">
        <Link href="/mypage/profile">
          <Button variant="ghost" className="w-full text-left">
            プロフィールを編集
          </Button>
        </Link>
        <Link href="/profile/posts">
          <Button variant="ghost" className="w-full text-left">
            自分の投稿
          </Button>
        </Link>
        <Link href="/profile/likes">
          <Button variant="ghost" className="w-full text-left">
            いいねした投稿
          </Button>
        </Link>
      </div>

      {/* ログアウト */}
      <Button
        onClick={handleLogout}
        variant="link"
        className="text-sm text-gray-500 mt-8"
      >
        ログアウト
      </Button>
    </div>
  );
}
