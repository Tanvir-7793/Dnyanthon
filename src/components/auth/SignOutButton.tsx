"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type SignOutButtonProps = {
  className?: string;
  redirectTo?: string;
};

export function SignOutButton({
  className,
  redirectTo = "/login",
}: SignOutButtonProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSignOut() {
    try {
      setIsSubmitting(true);

      await fetch("/api/auth/logout", {
        method: "POST",
      });

      router.push(redirectTo);
      router.refresh();
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleSignOut}
      disabled={isSubmitting}
      className={className}
    >
      {isSubmitting ? "Signing Out..." : "Sign Out"}
    </button>
  );
}
