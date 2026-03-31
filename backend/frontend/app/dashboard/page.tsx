"use client";

import React, { useState } from 'react';
import ProtocolGuard from '../../components/ProtocolGuard';
import AIDashboard from '@/components/AIDashboard';
import WordBank from '@/components/WordBank';
import { useRouter } from 'next/navigation';

export default function DashboardPage() {
  const [showWordBank, setShowWordBank] = useState(false);
  const router = useRouter();

  const handleStartSession = (scenario?: string) => {
    if (scenario) {
      router.push(`/session?topic=${encodeURIComponent(scenario)}`);
    } else {
      router.push('/scenes');
    }
  };

  return (
    <ProtocolGuard>
      <div className="min-h-screen bg-slate-950">
        <AIDashboard 
          onStartSession={handleStartSession}
          onOpenWordBank={() => setShowWordBank(true)}
        />
        
        <WordBank 
          isOpen={showWordBank} 
          onClose={() => setShowWordBank(false)} 
        />
      </div>
    </ProtocolGuard>
  );
}
