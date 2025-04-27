// src/components/LoginButton.tsx
"use client";

import { auth } from "@/lib/firebase";
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { useState } from "react";

export const LoginButton = () => {
  const [loading, setLoading] = useState(false);

  const loginWithGoogle = async () => {
    setLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      console.log("ログイン成功", user);
    } catch (error) {
      console.error("ログイン失敗", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={loginWithGoogle}
      disabled={loading}
      className="fixed top-4 right-4 py-2 px-6 bg-blue-500 text-white rounded-lg text-lg shadow-lg z-10"
    >
      {loading ? "ログイン中..." : "Googleでログイン"}
    </button>
  );
};
