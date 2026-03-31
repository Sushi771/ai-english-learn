"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to the new polished dashboard page provided by the App Router
    router.replace("/dashboard");
  }, [router]);

  return (
    <div className="min-h-screen bg-[#060e20] flex items-center justify-center font-sans tracking-tight">
      <div className="flex flex-col items-center gap-6">
        <div className="w-12 h-12 rounded-full border-4 border-t-[#ba9eff] border-[#141f38] animate-spin"></div>
        <div className="text-[#a3aac4] font-medium animate-pulse">正在唤醒 AI 导师...</div>
      </div>
    </div>
  );
}
