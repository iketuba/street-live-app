"use client";

import { useEffect, useState } from "react";
import { auth, db } from "@/lib/firebase";
import { signOut } from "firebase/auth";
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
import { FaInstagram, FaTwitter, FaTiktok, FaYoutube } from "react-icons/fa";
import { Loader2, Settings } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { categorizePosts } from "../../lib/categorizePosts";
import LikeButton from "@/components/LikeButton";
import { useCurrentUser } from "@/lib/hooks/useCurrentUser";

interface Post {
  id: string;
  title: string;
  date: string;
  startTime: string;
  endTime: string;
  price: string | number;
  uid: string;
}

export default function MyPage() {
  const router = useRouter();
  const authUser = useCurrentUser();
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"posts" | "likes">("posts");

  const [categorizedPosts, setCategorizedPosts] = useState<{
    liveNow: Post[];
    liveSoon: Post[];
    liveFuture: Post[];
    livePast: Post[];
  }>({
    liveNow: [],
    liveSoon: [],
    liveFuture: [],
    livePast: [],
  });

  const [likedCategorizedPosts, setLikedCategorizedPosts] = useState<{
    liveNow: Post[];
    liveSoon: Post[];
    liveFuture: Post[];
    livePast: Post[];
  }>({
    liveNow: [],
    liveSoon: [],
    liveFuture: [],
    livePast: [],
  });

  const [profile, setProfile] = useState({
    photoURL: "",
    username: "",
    instagram: "",
    twitter: "",
    tiktok: "",
    youtube: "",
  });

  useEffect(() => {
    if (!authUser) return;

    const fetchData = async () => {
      // ユーザー情報取得・投稿取得
      const userDocSnap = await getDoc(doc(db, "users", authUser.uid));
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
      const postQuery = query(
        collection(db, "posts"),
        where("uid", "==", authUser.uid)
      );
      const snapshot = await getDocs(postQuery);
      const postList: Post[] = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Post[];
      const categorized = categorizePosts(postList);
      setCategorizedPosts(categorized);

      // いいねした投稿を取得
      const likesSnap = await getDocs(
        collection(db, `users/${authUser.uid}/likes`)
      );
      const likedPostIds = likesSnap.docs.map((doc) => doc.id);
      const likedPostsData: Post[] = [];
      for (const postId of likedPostIds) {
        const postDoc = await getDoc(doc(db, "posts", postId));
        if (postDoc.exists()) {
          likedPostsData.push({ id: postDoc.id, ...postDoc.data() } as Post);
        }
      }
      setLikedCategorizedPosts(categorizePosts(likedPostsData));
      setIsLoading(false);
    };

    fetchData();
  }, [authUser]);

  const handleLogout = async () => {
    await signOut(auth);
    toast.success("ログアウトしました");
    router.push("/");
  };

  const snsLinks: {
    key: "instagram" | "twitter" | "tiktok" | "youtube";
    icon: React.ElementType;
    color: string;
  }[] = [
    { key: "instagram", icon: FaInstagram, color: "text-pink-500" },
    { key: "twitter", icon: FaTwitter, color: "text-blue-400" },
    { key: "tiktok", icon: FaTiktok, color: "text-black" },
    { key: "youtube", icon: FaYoutube, color: "text-red-600" },
  ];

  const sections = [
    { label: "🎤 ライブ中", key: "liveNow" },
    { label: "⏰ まもなくライブ", key: "liveSoon" },
    { label: "📅 今後のライブ", key: "liveFuture" },
    { label: "🕰️ 過去のライブ", key: "livePast" },
  ] as const;

  const PostCard = ({ post }: { post: Post }) => (
    <div className="relative border-b border-gray-300 pb-2 mb-2">
      <h2 className="font-semibold text-lg">{post.title}</h2>
      <div className="absolute top-2 right-2">
        <LikeButton postId={post.id} uid={authUser?.uid} />
      </div>
      <p className="text-sm text-gray-600">
        {post.date} {post.startTime}~{post.endTime}
      </p>
      <p className="text-sm text-gray-600">料金: {post.price}</p>
      <Link href={`/post-detail?id=${post.id}`}>
        <Button variant="outline" size="sm" className="mt-2">
          詳細を表示
        </Button>
      </Link>
    </div>
  );

  if (authUser === undefined || isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
      </div>
    );
  }

  return (
    <div className="fixed inset-0 overflow-y-auto bg-white px-4 pt-8 pb-32 flex flex-col items-center">
      {/* プロフィール表示 */}
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

      {/* SNSリンク */}
      <div className="flex space-x-4 mb-4">
        {snsLinks.map(
          ({ key, icon: Icon, color }) =>
            profile[key] && (
              <Link href={profile[key as keyof typeof profile]} key={key}>
                <Icon size={24} className={color} />
              </Link>
            )
        )}
      </div>

      {/* プロフィール編集リンク */}
      <Link href="/profile" className="w-full max-w-md mb-4">
        <Button variant="ghost" className="w-full text-left">
          プロフィールを編集
        </Button>
      </Link>

      {/* タブ切り替え */}
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
        {activeTab === "posts" ? (
          sections.map(
            ({ label, key }) =>
              categorizedPosts[key].length > 0 && (
                <div key={key}>
                  <h2 className="text-md font-bold mt-6 mb-2">{label}</h2>
                  {categorizedPosts[key].map((post) => (
                    <PostCard key={post.id} post={post} />
                  ))}
                </div>
              )
          )
        ) : sections.some(
            ({ key }) => likedCategorizedPosts[key].length > 0
          ) ? (
          sections.map(
            ({ label, key }) =>
              likedCategorizedPosts[key].length > 0 && (
                <div key={key}>
                  <h2 className="text-md font-bold mt-6 mb-2">{label}</h2>
                  {likedCategorizedPosts[key].map((post) => (
                    <PostCard key={post.id} post={post} />
                  ))}
                </div>
              )
          )
        ) : (
          <div className="text-gray-500 text-center">
            表示する投稿がありません
          </div>
        )}
      </div>

      {/* 設定メニュー */}
      <div className="absolute top-4 right-4 z-10">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <Settings className="size-[32px]" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem onClick={() => router.push("/reset-password")}>
              パスワード再設定
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => router.push("/contact")}>
              お問い合わせ
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => {
                if (window.confirm("本当にログアウトしますか？")) {
                  handleLogout();
                }
              }}
            >
              ログアウト
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={async () => {
                if (
                  window.confirm(
                    "アカウントを削除すると、すべてのデータが失われます。本当に削除しますか？"
                  )
                ) {
                  try {
                    await auth.currentUser?.delete();
                    toast.success("アカウントを削除しました");
                    router.push("/");
                  } catch {
                    toast.error("アカウント削除に失敗しました");
                  }
                }
              }}
              className="text-red-500"
            >
              アカウント削除
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
