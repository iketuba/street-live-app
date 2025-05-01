"use client";

import { useState } from "react";
import { auth } from "@/lib/firebase";
import {
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  signInWithPopup,
} from "firebase/auth";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

const SignUpPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSignUp = async () => {
    setLoading(true);
    try {
      await createUserWithEmailAndPassword(auth, email, password);
      console.log("新規登録成功");
      router.push("/mypage"); // サインアップ後、ログインページにリダイレクト
    } catch (error) {
      console.error("新規登録失敗", error);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignUp = async () => {
    setLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      console.log("Googleで登録成功");
      router.push("/mypage");
    } catch (error) {
      console.error("Googleでの登録失敗", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-sm mx-auto p-6 bg-white rounded-lg">
      <h2 className="text-xl font-semibold mb-4">まずはアカウント作成！</h2>
      <input
        type="email"
        placeholder="メールアドレス"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="mb-4 p-2 border rounded w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      <input
        type="password"
        placeholder="パスワード"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className="mb-4 p-2 border rounded w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      <Button
        onClick={handleSignUp}
        disabled={loading}
        className="w-full py-2 bg-blue-500 text-white rounded-lg mb-4"
      >
        メールで登録
      </Button>
      <div className="flex items-center mb-4">
        <hr className="flex-grow border-t border-gray-300" />
        <span className="mx-4 text-sm">または</span>
        <hr className="flex-grow border-t border-gray-300" />
      </div>
      <Button
        onClick={handleGoogleSignUp}
        disabled={loading}
        className="w-full py-2 bg-red-500 text-white rounded-lg mb-4"
      >
        Googleで登録
      </Button>
      <p className="text-center text-sm">
        すでにアカウントをお持ちですか？{" "}
        <button onClick={() => router.push("/login")} className="text-blue-500">
          ログイン
        </button>
      </p>
    </div>
  );
};

export default SignUpPage;
