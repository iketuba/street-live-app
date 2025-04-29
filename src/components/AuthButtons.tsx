"use client";

import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Modal } from "./Modal";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged, User } from "firebase/auth";

export const AuthButtons = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<"login" | "signup" | null>(null);
  const [user, setUser] = useState<User | null>(null);

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

  // 判定中は何も表示しない
  if (user === undefined) return null;

  // ログイン中も何も表示しない
  if (user) return null;

  return (
    <div className="fixed top-4 right-4 flex space-x-4 z-10">
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

      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        onOpen={openModal}
        type={modalType}
      />
    </div>
  );
};
