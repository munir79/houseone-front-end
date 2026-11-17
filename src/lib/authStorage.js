const TOKEN_KEY = "accessToken";

export const getToken = () => {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
};

export const setToken = (token) => localStorage.setItem(TOKEN_KEY, token);

export const clearAuth = () => localStorage.removeItem(TOKEN_KEY);
