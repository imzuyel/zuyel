"use client";

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function StudentJoinRedirectContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const pin = searchParams ? searchParams.get("pin") : null;
    if (pin) {
      router.replace(`/live-quizzes/join?pin=${pin}`);
    } else {
      router.replace("/live-quizzes/join");
    }
  }, [router, searchParams]);

  return null;
}

export default function StudentJoinRedirect() {
  return (
    <Suspense fallback={null}>
      <StudentJoinRedirectContent />
    </Suspense>
  );
}
