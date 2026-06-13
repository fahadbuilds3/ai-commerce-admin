import { useState, useContext } from "react";
import { loginUser } from "../../api/authApi";
import { AuthContext } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

const Login = () => {
  const navigate = useNavigate();
  const { setUser } = useContext(AuthContext);

  const [formData, setFormData] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = await loginUser(formData);
      localStorage.setItem("token", data.token);
      setUser(data.user);
      toast.success("Welcome back!", {
        iconTheme: { primary: "#6366f1", secondary: "#fff" }
      });
      navigate("/"); // Redirect to dashboard/home
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Login failed. Please check your credentials."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-zinc-950 to-zinc-900 flex items-center justify-center px-4">
      <section className="w-full max-w-md rounded-2xl shadow-2xl border border-zinc-800 bg-zinc-900/95 p-8 sm:p-10 flex flex-col items-center">
        <div className="w-full flex flex-col space-y-2 mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-white tracking-tight text-center">
            Admin Portal
          </h1>
          <p className="text-zinc-400 text-base text-center font-medium">
            Sign in to your dashboard
          </p>
        </div>
        <form className="w-full space-y-6" onSubmit={handleSubmit} autoComplete="off">
          <div className="flex flex-col space-y-2">
            <label
              htmlFor="email"
              className="text-sm font-medium text-zinc-300 pl-1"
            >
              Email
            </label>
            <input
              id="email"
              type="email"
              name="email"
              value={formData.email}
              autoComplete="username"
              required
              onChange={handleChange}
              disabled={loading}
              className="control-input h-12 px-4 font-medium"
              placeholder="your@email.com"
            />
          </div>
          <div className="flex flex-col space-y-2">
            <label
              htmlFor="password"
              className="text-sm font-medium text-zinc-300 pl-1"
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              name="password"
              value={formData.password}
              autoComplete="current-password"
              required
              minLength={6}
              onChange={handleChange}
              disabled={loading}
              className="control-input h-12 px-4 font-medium"
              placeholder="Password"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary mt-1 h-12 w-full text-base"
          >
            {loading ? (
              <span className="inline-flex items-center gap-2 justify-center">
                <svg className="animate-spin w-5 h-5 text-white" fill="none" viewBox="0 0 24 24">
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth={4}
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                  ></path>
                </svg>
                Signing in...
              </span>
            ) : (
              "Sign In"
            )}
          </button>
        </form>
        {/* Optionally add forgot password or company branding */}
      </section>
    </main>
  );
};

export default Login;
