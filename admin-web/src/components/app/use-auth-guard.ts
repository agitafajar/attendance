"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  clearAuthSession,
  getAuthUser,
  normalizeAuthUser,
  saveAuthUser,
  type AuthUser,
  type RoleName,
} from "@/lib/auth-storage";
import { api } from "@/lib/api";

type UseAuthGuardOptions = {
  allowedRoles?: readonly RoleName[];
};

export function useAuthGuard(options: UseAuthGuardOptions = {}) {
  const router = useRouter();
  const allowedRolesKey = options.allowedRoles?.join(",") ?? "";
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const accessToken = window.localStorage.getItem("accessToken");

    if (!accessToken) {
      clearAuthSession();
      router.replace("/login");
      return () => {
        isMounted = false;
      };
    }

    setUser(getAuthUser());

    async function verifySession() {
      try {
        const { data } = await api.get<AuthUser>("/auth/me");
        const verifiedUser = normalizeAuthUser(data);
        const role = verifiedUser.role?.name;
        const allowedRoles = allowedRolesKey
          ? (allowedRolesKey.split(",") as RoleName[])
          : [];
        const hasRequiredRole = allowedRoles.length
          ? Boolean(role && allowedRoles.includes(role))
          : true;

        if (!isMounted) {
          return;
        }

        if (!hasRequiredRole) {
          router.replace("/dashboard");
          return;
        }

        saveAuthUser(verifiedUser);
        setUser(verifiedUser);
        setIsAuthorized(true);
        setIsReady(true);
      } catch {
        if (!isMounted) {
          return;
        }

        clearAuthSession();
        router.replace("/login");
      }
    }

    verifySession();

    return () => {
      isMounted = false;
    };
  }, [allowedRolesKey, router]);

  return { user, isReady, isAuthorized };
}
