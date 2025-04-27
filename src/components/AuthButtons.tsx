"use client";

import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Modal } from "./Modal";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged, User } from "firebase/auth";
import { useRouter } from "next/navigation";

export const AuthButtons = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<"login" | "signup" | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const router = useRouter();

  const openModal = (type: "login" | "signup") => {
    setModalType(type);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
    });
    return () => unsubscribe();
  }, []);

  return (
    <div className="fixed top-4 right-4 flex space-x-4 z-10">
      {user ? (
        // logged in
        <>
          <Button
            onClick={() => router.push("/profile")}
            className="py-2 px-6 text-white rounded-lg text-lg shadow-lg bg-green-500 hover:bg-green-600"
          >
            プロフィール
          </Button>
        </>
      ) : (
        <>
          <Button
            onClick={() => openModal("login")}
            className="py-2 px-6 text-white rounded-lg text-lg shadow-lg bg-blue-500 hover:bg-blue-600"
          >
            ログイン
          </Button>
          <Button
            onClick={() => openModal("signup")}
            variant="secondary"
            className="py-2 px-6 text-white rounded-lg text-lg shadow-lg bg-red-500 hover:bg-red-600"
          >
            新規登録
          </Button>
        </>
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        onOpen={openModal}
        type={modalType}
      />
    </div>
  );
};
