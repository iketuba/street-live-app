"use client";

import { FaInstagram, FaTwitter, FaTiktok, FaYoutube } from "react-icons/fa";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

export default function ContactPage() {
  const router = useRouter();
  return (
    <div className="max-w-2xl mx-auto px-4 py-10 text-center space-y-6">
      <h1 className="text-3xl font-bold">お問い合わせ・SNS</h1>
      <p className="text-gray-700">
        ご質問・コラボ依頼・応援メッセージなどがありましたら、以下のSNSからお気軽にご連絡ください！
        <br />
        各リンクからSNSページへ移動できます。フォローもお待ちしています🎵
      </p>

      <div className="flex justify-center gap-6 text-4xl text-gray-600">
        <Link
          href="https://www.instagram.com/tsubagon_music/"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Instagram"
        >
          <FaInstagram className="hover:text-pink-500 transition" />
        </Link>

        <Link
          href="https://x.com/tsu_music55"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Twitter"
        >
          <FaTwitter className="hover:text-sky-500 transition" />
        </Link>

        <Link
          href="https://www.tiktok.com/@tsubagon_music"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="TikTok"
        >
          <FaTiktok className="hover:text-black transition" />
        </Link>

        <Link
          href="https://www.youtube.com/@tsubagon_music"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="YouTube"
        >
          <FaYoutube className="hover:text-red-500 transition" />
        </Link>
      </div>

      <p className="text-sm text-gray-500">
        ※ お急ぎのご用件はInstagramのDMが一番早く確認できます。
      </p>

      <div className="pt-8">
        <Button
          onClick={() => router.back()} // または router.push("/") にしてもOK
          className="bg-gray-300 text-black hover:bg-gray-400"
        >
          ← 戻る
        </Button>
      </div>
    </div>
  );
}
