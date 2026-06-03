export type RoleName = "ADMIN" | "SUPERVISOR" | "EMPLOYEE";

export type AuthUser = {
  id?: string;
  sub?: string;
  email: string;
  fullName?: string;
  role?: {
    name: RoleName;
  };
};

type AuthUserInput = Omit<AuthUser, "role"> & {
  role?: RoleName | { name: RoleName };
};

export function normalizeAuthUser(user: AuthUserInput): AuthUser {
  return {
    ...user,
    id: user.id ?? user.sub,
    role:
      typeof user.role === "string"
        ? { name: user.role }
        : user.role,
  };
}

export function saveAuthSession(payload: {
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
}) {
  window.localStorage.setItem("accessToken", payload.accessToken);
  window.localStorage.setItem("refreshToken", payload.refreshToken);
  window.localStorage.setItem("authUser", JSON.stringify(normalizeAuthUser(payload.user)));
}

export function clearAuthSession() {
  window.localStorage.removeItem("accessToken");
  window.localStorage.removeItem("refreshToken");
  window.localStorage.removeItem("authUser");
}

export function saveAuthUser(user: AuthUser) {
  window.localStorage.setItem("authUser", JSON.stringify(normalizeAuthUser(user)));
}

export function getAuthUser(): AuthUser | null {
  if (typeof window === "undefined") {
    return null;
  }

  const rawUser = window.localStorage.getItem("authUser");
  return rawUser ? normalizeAuthUser(JSON.parse(rawUser) as AuthUserInput) : null;
}
