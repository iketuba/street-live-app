"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import SimpleMap from "@/components/Map";
import { Modal } from "@/components/Modal";
import { Loader2 } from "lucide-react";

export default function LocationSelectPage() {
  const [showPopup, setShowPopup] = useState(true);
  const [markerPosition, setMarkerPosition] =
    useState<google.maps.LatLngLiteral | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState<"login" | "signup" | null>(null);
  const [shouldRedirectAfterLogin, setShouldRedirectAfterLogin] =
    useState(false);
  const [authChecked, setAuthChecked] = useState(false);

  const router = useRouter();

  // 初回のみログイン状態を確認
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setIsLoggedIn(!!user);
      setAuthChecked(true);

      if (user && shouldRedirectAfterLogin && markerPosition) {
        const query = new URLSearchParams({
          latitude: markerPosition.lat.toString(),
          longitude: markerPosition.lng.toString(),
        });
        router.push(`/post?${query.toString()}`);
      }
    });

    return () => unsubscribe();
  }, [shouldRedirectAfterLogin, router, markerPosition]);

  // 最初のポップアップ表示制御（7秒後に非表示）
  useEffect(() => {
    const popupTimer = setTimeout(() => setShowPopup(false), 7000);
    return () => clearTimeout(popupTimer);
  }, []);

  // 地図から選択された場所の取得
  const handlePlaceSelected = (location: google.maps.LatLngLiteral) => {
    setMarkerPosition(location);
  };

  // 「次へ」ボタン押下時の処理
  const handleNext = () => {
    if (!markerPosition) return;

    const query = new URLSearchParams({
      latitude: markerPosition.lat.toString(),
      longitude: markerPosition.lng.toString(),
    });

    if (isLoggedIn) {
      router.push(`/post?${query.toString()}`);
    } else {
      setShouldRedirectAfterLogin(true);
      setModalType("login");
      setModalOpen(true);
    }
  };

  // モーダルの制御
  const closeModal = () => setModalOpen(false);
  const openModal = (type: "login" | "signup") => {
    setModalType(type);
    setModalOpen(true);
  };

  if (!authChecked) {
    return (
      <div className="w-full h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
      </div>
    );
  }

  return (
    <div className="relative w-full h-screen">
      <SimpleMap onPlaceSelected={handlePlaceSelected} />

      {showPopup && (
        <div className="absolute top-1/3 left-1/2 transform -translate-x-1/2 z-10 bg-yellow-100 border border-yellow-400 text-yellow-900 px-6 py-3 rounded-lg shadow-xl">
          <p className="text-center text-base font-semibold whitespace-nowrap">
            まずは場所を選んでね！
          </p>
        </div>
      )}

      <div className="fixed bottom-16 left-1/2 transform -translate-x-1/2 z-20 p-4">
        <Button
          onClick={handleNext}
          className={`w-32 py-3 text-white rounded-lg shadow-lg ${
            markerPosition ? "bg-blue-500 hover:bg-blue-600" : "bg-blue-300"
          }`}
          disabled={!markerPosition}
        >
          次へ
        </Button>
      </div>

      {/* ログイン／新規登録モーダル */}
      <Modal
        isOpen={modalOpen}
        onClose={closeModal}
        onOpen={openModal}
        type={modalType}
      />
    </div>
  );
}
