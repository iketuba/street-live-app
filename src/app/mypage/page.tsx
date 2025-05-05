"use client";

import { useEffect, useState } from "react";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged, User, signOut } from "firebase/auth";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { toast } from "react-hot-toast";
import {
  doc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
} from "firebase/firestore";
import { FaInstagram, FaTwitter, FaTiktok, FaYoutube } from "react-icons/fa"; // SNSアイコンをインポート
import { Loader2 } from "lucide-react";

export default function MyPage() {
  const [authUser, setAuthUser] = useState<User | null | undefined>(undefined);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [activeTab, setActiveTab] = useState<"posts" | "likes">("posts");
  const [posts, setPosts] = useState<Post[]>([]);
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

        // 投稿データ取得
        const postQuery = query(
          collection(db, "posts"),
          where("uid", "==", user.uid)
        );
        const snapshot = await getDocs(postQuery);
        const postList: Post[] = snapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            title: data.title || "",
            date: data.date || "",
            startTime: data.startTime || "",
            endTime: data.endTime || "",
            price: data.price || 0,
          };
        });
        setPosts(postList);
        setIsLoadingProfile(false);
      }
    });

    return () => unsubscribe();
  }, [router]);

  if (authUser === undefined || authUser === null) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
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
      {isLoadingProfile ? (
        <div className="flex flex-col items-center space-y-2 mb-8">
          <div className="w-24 h-24 rounded-full bg-gray-200 animate-pulse" />
          <div className="w-32 h-5 bg-gray-200 rounded animate-pulse" />
        </div>
      ) : (
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
      )}

      {/* SNSアイコンの表示 */}
      <div className="flex space-x-4 mb-4">
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

      {/* プロフィール編集 */}
      <div className="w-full max-w-md mb-4">
        <Link href="/mypage/profile">
          <Button variant="ghost" className="w-full text-left">
            プロフィールを編集
          </Button>
        </Link>
      </div>

      {/* タブ */}
      <div className="flex space-x-4 mb-4">
        <button
          onClick={() => setActiveTab("posts")}
          className={`px-4 py-2 rounded ${
            activeTab === "posts" ? "bg-gray-300" : "bg-gray-100"
          }`}
        >
          自分の投稿
        </button>
        <button
          onClick={() => setActiveTab("likes")}
          className={`px-4 py-2 rounded ${
            activeTab === "likes" ? "bg-gray-300" : "bg-gray-100"
          }`}
        >
          いいねした投稿
        </button>
      </div>

      {/* 投稿表示 */}
      <div className="w-full max-w-md space-y-4">
        {activeTab === "posts" &&
          posts.map((post) => (
            <div key={post.id} className="border-b border-gray-300 pb-2">
              <h2 className="font-semibold text-lg">{post.title}</h2>
              <p className="text-sm text-gray-600">
                {post.date} {post.startTime}~{post.endTime}
              </p>
              <p className="text-sm text-gray-600">
                料金: {post.price ? `¥${post.price}` : "未設定"}
              </p>
              <Link href={`/post-detail?id=${post.id}`}>
                <Button variant="outline" size="sm" className="mt-2">
                  詳細を表示
                </Button>
              </Link>
            </div>
          ))}

        {activeTab === "likes" && (
          <div className="text-gray-500 text-center">
            表示する投稿がありません
          </div>
        )}
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

interface Post {
  id: string;
  title: string;
  date: string;
  startTime: string;
  endTime: string;
  price: string | number;
}
