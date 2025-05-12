import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import { set_auth_token, set_current_user, set_is_authenticated } from "@/store/main";
import { RootState } from "@/store/main";

const UV_Login: React.FC = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const isAuthenticated = useSelector((state: RootState) => state.global.is_authenticated);

  // Local state variables for email, password, and error message
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [error_message, setErrorMessage] = useState<string>("");

  // Determine the backend API base URL using environment variable VITE_API_BASE_URL
  const api_base_url = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

  // Function to handle login submission
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(""); // Clear previous error message
    try {
      const response = await fetch(`${api_base_url}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        setErrorMessage(errorData.error || "Invalid credentials");
        return;
      }
      const data = await response.json();
      // Extract token and user profile from backend response
      const { token, user } = data;
      dispatch(set_auth_token(token));
      dispatch(set_current_user(user));
      dispatch(set_is_authenticated(true));
      navigate("/dashboard");
    } catch (error) {
      console.error("Login error:", error);
      setErrorMessage("An unexpected error occurred. Please try again later.");
    }
  };

  // If already authenticated, redirect immediately
  if (isAuthenticated) {
    navigate("/dashboard");
    return null;
  }

  return (
    <>
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="w-full max-w-md bg-white p-8 rounded shadow">
          <h1 className="text-2xl font-bold mb-6 text-center">Login</h1>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
            {error_message && (
              <div className="text-red-500 text-sm">
                {error_message}
              </div>
            )}
            <div>
              <button
                type="submit"
                className="w-full py-2 px-4 bg-blue-600 text-white rounded hover:bg-blue-700 focus:outline-none"
              >
                Login
              </button>
            </div>
          </form>
          <div className="mt-4 text-center">
            <a href="#" className="text-blue-600 hover:underline">
              Forgot Password?
            </a>
          </div>
          <div className="mt-2 text-center">
            <span className="text-gray-600 text-sm">Don't have an account? </span>
            <Link to="/register" className="text-blue-600 hover:underline text-sm">
              Sign Up
            </Link>
          </div>
        </div>
      </div>
    </>
  );
};

export default UV_Login;