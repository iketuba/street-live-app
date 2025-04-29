"use client";

import { useEffect, useState } from "react";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged, User, signOut } from "firebase/auth";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button"; // shadcn/uiからButtonをインポート
import { toast } from "react-hot-toast"; // Optional: トースト通知
import { AuthButtons } from "@/components/AuthButtons";

export default function MyPage() {
  const [user, setUser] = useState<User | null>(null);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
    });
    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    await signOut(auth);
    toast.success("ログアウトしました");
    router.push("/");
  };

  if (!user) return (
    <div className="flex justify-center items-center min-h-screen">
      <AuthButtons />
    </div>
  );;

  return (
    <div className="flex flex-col items-center px-4 pt-8 pb-32 min-h-screen">
      {/* プロフィール画像と名前 */}
      <div className="flex flex-col items-center space-y-2 mb-8">
        <div className="relative w-24 h-24">
          <Image
            src={user.photoURL || "/default-profile.png"}
            alt="プロフィール画像"
            layout="fill"
            objectFit="cover"
            className="rounded-full"
          />
        </div>
        <h1 className="text-xl font-semibold">
          {user.displayName || "ユーザー名未設定"}
        </h1>
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
