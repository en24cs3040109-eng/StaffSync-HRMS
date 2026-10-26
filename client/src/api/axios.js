import axios from "axios";

export const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
export const API_ORIGIN = API_URL.replace(/\/api\/?$/, "");

const api = axios.create({ baseURL: API_URL });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// An expired or revoked session sends the user back to the login page
api.interceptors.response.use(
  (res) => res,
  (err) => {
    const isLogin = err.config?.url?.includes("/auth/login");
    if (err.response?.status === 401 && !isLogin && localStorage.getItem("token")) {
      localStorage.removeItem("token");
      window.location.assign("/login?expired=1");
    }
    return Promise.reject(err);
  }
);

export const errMsg = (err) => err?.response?.data?.message || err?.message || "Something went wrong";

export default api;
