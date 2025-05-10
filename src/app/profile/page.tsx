"use client";

import React, { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { auth, db, storage } from "@/lib/firebase";
import { User } from "firebase/auth";
import { doc, getDoc, setDoc, Timestamp } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import toast from "react-hot-toast";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import {
  FaInstagram,
  FaTwitter,
  FaYoutube,
  FaTiktok,
  FaLink,
} from "react-icons/fa";
import { Skeleton } from "@/components/ui/skeleton";
import { Loader2 } from "lucide-react";

export interface UserProfileData {
  username?: string;
  bio?: string;
  instagram?: string;
  twitter?: string;
  youtube?: string;
  tiktok?: string;
  other?: string;
  photoURL?: string;
}

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [photoURL, setPhotoURL] = useState("");
  const [sns, setSNS] = useState({
    instagram: "",
    twitter: "",
    youtube: "",
    tiktok: "",
    other: "",
  });
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const isValidSNSUrl = (platform: string, url: string) => {
    const patterns: Record<string, RegExp> = {
      instagram: /^https?:\/\/(www\.)?instagram\.com\/[\w.-]+\/?$/,
      twitter: /^https?:\/\/(www\.)?twitter\.com\/[\w.-]+\/?$/,
      youtube:
        /^https?:\/\/(www\.)?(youtube\.com\/(channel|c|user)\/[\w-]+|youtu\.be\/[\w-]+)\/?$/,
      tiktok: /^https?:\/\/(www\.)?tiktok\.com\/@[\w.-]+\/?$/,
      other:
        /^https?:\/\/[\w.-]+\.[a-z]{2,}(\/[\w\-._~:/?#[\]@!$&'()*+,;=]*)?$/i,
    };

    const pattern = patterns[platform] || patterns.other;
    return pattern.test(url);
  };

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (currentUser) => {
      if (!currentUser) {
        router.push("/");
        return;
      }

      setUser(currentUser);
      const userDocRef = doc(db, "users", currentUser.uid);
      const userDoc = await getDoc(userDocRef);
      if (userDoc.exists()) {
        const data = userDoc.data();
        setUsername(data.username || "");
        setBio(data.bio || "");
        setPhotoURL(data.photoURL || "");
        setSNS({
          instagram: data.instagram || "",
          twitter: data.twitter || "",
          youtube: data.youtube || "",
          tiktok: data.tiktok || "",
          other: data.other || "",
        });
      }
      setIsLoadingProfile(false);
    });

    return () => unsubscribe();
  }, [router]);

  const updateUserProfile = async (data: UserProfileData) => {
    if (!user) return;
    await setDoc(
      doc(db, "users", user.uid),
      {
        ...data,
        updatedAt: Timestamp.now(),
      },
      { merge: true }
    );
  };

  const handleImageClick = () => {
    fileInputRef.current?.click();
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!user) return;
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);

    try {
      const storageRef = ref(storage, `profileImages/${user.uid}`);
      await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(storageRef);
      await updateUserProfile({ photoURL: downloadURL });
      setPhotoURL(downloadURL);
      toast.success("プロフィール画像をアップロードしました！");
    } catch {
      toast.error("画像アップロードに失敗しました");
    } finally {
      setIsUploading(false);
    }
  };

  const normalizeURL = (url: string) => {
    if (!url.trim()) return "";
    return /^https?:\/\//i.test(url) ? url : `https://${url}`;
  };

  const handleSaveProfile = async () => {
    if (!user) return;
    if (!username.trim()) {
      toast.error("ユーザー名を入力してください");
      return;
    }

    const trimmedSNS = Object.fromEntries(
      Object.entries(sns).map(([key, value]) => [
        key,
        normalizeURL(value.trim()),
      ])
    );

    for (const [key, value] of Object.entries(trimmedSNS)) {
      if (value && !isValidSNSUrl(key, value)) {
        toast.error(`${key} のURLが正しくありません`);
        return;
      }
    }
    setIsSaving(true);

    try {
      await updateUserProfile({
        username: username.trim(),
        bio: bio.trim(),
        ...trimmedSNS,
      });
      toast.success("プロフィールを保存しました！");
    } catch {
      toast.error("プロフィールの保存に失敗しました");
    } finally {
      setIsSaving(false);
    }
  };

  const handleBack = () => {
    router.push("/mypage");
  };

  if (!user) return null;

  const snsFields = [
    { label: "Instagram", value: "instagram", icon: <FaInstagram /> },
    { label: "Twitter", value: "twitter", icon: <FaTwitter /> },
    { label: "YouTube", value: "youtube", icon: <FaYoutube /> },
    { label: "TikTok", value: "tiktok", icon: <FaTiktok /> },
    { label: "その他", value: "other", icon: <FaLink /> },
  ];

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 pb-24">
      {isLoadingProfile ? (
        <div className="w-full max-w-md space-y-4">
          <Skeleton className="w-24 h-24 rounded-full mx-auto" />
          <Skeleton className="w-full h-10 rounded" />
          <Skeleton className="w-full h-24 rounded" />
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="w-full h-10 rounded" />
          ))}
        </div>
      ) : (
        <>
          <div
            className="relative w-24 h-24 mb-4 group cursor-pointer"
            onClick={handleImageClick}
          >
            {isUploading && (
              <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center rounded-full z-10">
                <Loader2 className="h-6 w-6 animate-spin text-white" />
              </div>
            )}
            <Image
              src={photoURL || "/default-profile.png"}
              alt="プロフィール画像"
              layout="fill"
              objectFit="cover"
              className="rounded-full"
            />
            <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black bg-opacity-40 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              <span className="text-white text-3xl">＋</span>
            </div>
            <input
              type="file"
              accept="image/*"
              ref={fileInputRef}
              onChange={handleImageChange}
              className="hidden"
            />
          </div>

          {/* ユーザー名 */}
          <div className="w-full max-w-md mb-4">
            <label className="block mb-1 font-semibold">
              ユーザー名 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={username}
              placeholder="例: 山田太郎"
              onChange={(e) => setUsername(e.target.value)}
              className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* 自己紹介 */}
          <div className="w-full max-w-md mb-6">
            <label className="block mb-1 font-semibold">
              自己紹介{" "}
              <span className="text-gray-500 text-sm">(100文字以内)</span>
            </label>
            <textarea
              value={bio}
              maxLength={100}
              placeholder="例: シンガーソングライター。都内中心に活動中！"
              onChange={(e) => setBio(e.target.value)}
              className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* SNSリンク */}
          <div className="w-full max-w-md flex flex-col space-y-4 mb-6">
            {snsFields.map(({ label, value, icon }) => (
              <div key={value}>
                <label className="flex items-center space-x-2 font-semibold mb-1">
                  {icon}
                  <span>{label} URL</span>
                </label>
                <input
                  type="text"
                  placeholder={`https://...`}
                  value={sns[value as keyof typeof sns]}
                  onChange={(e) => setSNS({ ...sns, [value]: e.target.value })}
                  className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            ))}
          </div>

          {/* 保存ボタン */}
          <Button
            onClick={handleSaveProfile}
            className="w-full max-w-md py-2 bg-blue-500 text-white rounded-lg mb-4"
            disabled={isSaving}
          >
            {isSaving ? (
              <span className="flex items-center justify-center">
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                保存中...
              </span>
            ) : (
              "プロフィールを保存"
            )}
          </Button>

          {/* 戻るボタン */}
          <Button
            onClick={handleBack}
            className="w-full max-w-md py-2 bg-gray-300 text-black rounded-lg"
          >
            戻る
          </Button>
        </>
      )}
    </div>
  );
}
