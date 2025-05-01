"use client";

import { useState } from "react";
import { auth } from "@/lib/firebase";
import {
  GoogleAuthProvider,
  signInWithEmailAndPassword,
  signInWithPopup,
} from "firebase/auth";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

const LoginPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const router = useRouter();

  const handleLogin = async () => {
    setLoading(true);
    setErrorMessage(null);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      console.log("ログイン成功");
      router.push("/"); // ログイン後、ホームページにリダイレクト
    } catch (error) {
      console.error("ログイン失敗", error);
      setErrorMessage("メールアドレスもしくはパスワードに誤りがあります。");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      console.log("Googleでログイン成功");
      router.push("/mypage");
    } catch (error) {
      console.error("Googleでのログイン失敗", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-sm mx-auto p-6 bg-white rounded-lg">
      <h2 className="text-xl font-semibold mb-4">ログイン</h2>
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
        onClick={handleLogin}
        disabled={loading}
        className="w-full py-2 bg-blue-500 text-white rounded-lg mb-4"
      >
        メールでログイン
      </Button>
      {errorMessage && (
        <p className="text-red-500 text-xs text-center mb-4">{errorMessage}</p>
      )}
      <div className="flex items-center mb-4">
        <hr className="flex-grow border-t border-gray-300" />
        <span className="mx-4 text-sm">または</span>
        <hr className="flex-grow border-t border-gray-300" />
      </div>
      <Button
        onClick={handleGoogleLogin}
        disabled={loading}
        className="w-full py-2 bg-red-500 text-white rounded-lg mb-4"
      >
        Googleでログイン
      </Button>
      <p className="text-center text-sm">
        アカウントをお持ちでないですか？{" "}
        <button
          onClick={() => router.push("/signup")}
          className="text-blue-500"
        >
          新規登録
        </button>
      </p>
    </div>
  );
};

export default LoginPage;
