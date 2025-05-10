"use client";

import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Modal } from "./Modal";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged, User } from "firebase/auth";

export const AuthButtons = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<"login" | "signup" | null>(null);
  const [user, setUser] = useState<User | null | undefined>(undefined);

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
    <div className="fixed top-20 right-4 flex space-x-2 z-10">
      <Button
        onClick={() => openModal("login")}
        className="py-1.5 px-4 text-white rounded-md text-sm bg-blue-300 hover:bg-blue-400"
      >
        ログイン
      </Button>
      <Button
        onClick={() => openModal("signup")}
        variant="secondary"
        className="py-1.5 px-4 text-white rounded-md text-sm bg-red-300 hover:bg-red-400"
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
