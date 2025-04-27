"use client";

import { useState } from "react";
import { auth } from "@/lib/firebase";
import {
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signInWithEmailAndPassword,
} from "firebase/auth";
import { Button } from "./ui/button";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpen: (type: "login" | "signup") => void;
  type: "login" | "signup" | null;
}

export const Modal = ({ isOpen, onClose, onOpen, type }: ModalProps) => {
  if (!isOpen || !type) return null;

  const handleModalClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-20"
      onClick={onClose}
    >
      <div
        className="bg-white p-8 rounded-lg w-96 relative"
        onClick={handleModalClick}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-lg bg-white"
        >
          ×
        </button>
        {type === "login" ? (
          <LoginForm onClose={onClose} onOpen={onOpen} />
        ) : (
          <SignUpForm onClose={onClose} onOpen={onOpen} />
        )}
      </div>
    </div>
  );
};

const SignUpForm = ({
  onClose,
  onOpen,
}: {
  onClose: () => void;
  onOpen: (type: "login" | "signup") => void;
}) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSignUp = async () => {
    setLoading(true);
    try {
      await createUserWithEmailAndPassword(auth, email, password);
      console.log("新規登録成功");
      onClose();
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
      onClose();
    } catch (error) {
      console.error("Googleでの登録失敗", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">新規登録</h2>
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
        <button
          onClick={() => {
            onClose();
            setTimeout(() => onOpen("login"), 100);
          }}
          className="text-blue-500"
        >
          ログイン
        </button>
      </p>
    </div>
  );
};

const LoginForm = ({
  onClose,
  onOpen,
}: {
  onClose: () => void;
  onOpen: (type: "login" | "signup") => void;
}) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleLogin = async () => {
    setLoading(true);
    setErrorMessage(null);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      console.log("ログイン成功");
      onClose();
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
      onClose();
    } catch (error) {
      console.error("Googleでのログイン失敗", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
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
          onClick={() => {
            onClose();
            setTimeout(() => onOpen("signup"), 100);
          }}
          className="text-blue-500"
        >
          新規登録
        </button>
      </p>
    </div>
  );
};
