"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, PlusCircle, User } from "lucide-react";
import { cn } from "@/lib/utils"; // shadcnのクラス結合ユーティリティ
import { Button } from "@/components/ui/button";

export default function BottomNav() {
  const pathname = usePathname();

  const navItems = [
    { href: "/home", label: "ホーム", icon: <Home className="w-5 h-5" /> },
    { href: "/location-select", label: "投稿", icon: <PlusCircle className="w-5 h-5" /> },
    {
      href: "/mypage",
      label: "マイページ",
      icon: <User className="w-5 h-5" />,
    },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t z-50 flex justify-around py-2">
      {navItems.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className="flex flex-col items-center text-xs"
        >
          <Button
            variant="ghost"
            className={cn(
              "flex flex-col items-center text-muted-foreground px-3",
              pathname === item.href && "text-primary"
            )}
          >
            {item.icon}
            <span>{item.label}</span>
          </Button>
        </Link>
      ))}
    </nav>
  );
}
