// ============================================================================
// ارائه‌دهندگان (Providers) - رپر اصلی
// شامل: Auth.js SessionProvider، React Query، و اعلان‌ها
// ============================================================================

"use client";

import { SessionProvider } from "next-auth/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "react-hot-toast";
import { useState } from "react";
import { ArtistProfileQuickAccess } from "@/components/features/profile/ArtistProfileQuickAccess";

interface ProvidersProps {
  children: React.ReactNode;
  session?: React.ComponentProps<typeof SessionProvider>["session"];
}

/**
 * ارائه‌دهنده اصلی اپلیکیشن
 * تمام providerهای client-side در اینجا ترکیب می‌شوند
 */
export default function Providers({ children, session }: ProvidersProps) {
  // ایجاد QueryClient در سمت کلاینت
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 5 * 60 * 1000,
            gcTime: 30 * 60 * 1000,
            retry: 2,
            retryDelay: (attemptIndex) =>
              Math.min(1000 * 2 ** attemptIndex, 30000),
            refetchOnWindowFocus: false,
          },
        },
      })
  );

  return (
    <SessionProvider session={session}>
      <QueryClientProvider client={queryClient}>
        {children}
        <ArtistProfileQuickAccess />
        <Toaster
          position="top-center"
          toastOptions={{
            duration: 4000,
            style: {
              background: "#1e1e1e",
              color: "#f5f5f5",
              border: "1px solid #262626",
              borderRadius: "12px",
              fontSize: "14px",
              fontFamily: "Sahel, Tahoma, sans-serif",
            },
            success: {
              iconTheme: {
                primary: "#22c55e",
                secondary: "#f5f5f5",
              },
            },
            error: {
              iconTheme: {
                primary: "#ef4444",
                secondary: "#f5f5f5",
              },
            },
          }}
        />
      </QueryClientProvider>
    </SessionProvider>
  );
}
