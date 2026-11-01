import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const Register = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "client", // Default
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await register(formData.name, formData.email, formData.password, formData.role);
      navigate("/"); // Success ke baad Home page pe bhejo
    } catch (err) {
      setError(err.response?.data?.message || "Kuch galat ho gaya. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center py-20 px-4">
      <div className="max-w-md w-full bg-surface p-8 rounded-xl border border-border-subtle shadow-sm">
        <h2 className="text-2xl font-bold text-primary mb-6 text-center">Create an account</h2>

        {error && (
          <div className="bg-error/10 text-error text-sm p-3 rounded-lg mb-4 text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          
          {/* Role Selection */}
          <div className="flex gap-4 mb-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="role"
                value="client"
                checked={formData.role === "client"}
                onChange={handleChange}
                className="accent-[#0F766E]"
              />
              <span className="text-sm text-primary">I want to Hire</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="role"
                value="freelancer"
                checked={formData.role === "freelancer"}
                onChange={handleChange}
                className="accent-[#0F766E]"
              />
              <span className="text-sm text-primary">I want to Work</span>
            </label>
          </div>

          <div>
            <label className="block text-sm font-medium text-secondary mb-1">Full Name</label>
            <input
              type="text"
              name="name"
              required
              className="w-full px-4 py-2 border border-border-strong rounded-lg focus:outline-none focus:border-accent"
              placeholder="Rahul Sharma"
              value={formData.name}
              onChange={handleChange}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-secondary mb-1">Email</label>
            <input
              type="email"
              name="email"
              required
              className="w-full px-4 py-2 border border-border-strong rounded-lg focus:outline-none focus:border-accent"
              placeholder="rahul@example.com"
              value={formData.email}
              onChange={handleChange}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-secondary mb-1">Password</label>
            <input
              type="password"
              name="password"
              required
              minLength={6}
              className="w-full px-4 py-2 border border-border-strong rounded-lg focus:outline-none focus:border-accent"
              placeholder="At least 6 characters"
              value={formData.password}
              onChange={handleChange}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#0F766E] text-white py-2.5 rounded-lg font-medium hover:bg-[#115E59] transition-colors mt-2 disabled:opacity-70"
          >
            {loading ? "Creating..." : "Sign up"}
          </button>
        </form>

        <p className="text-center text-sm text-secondary mt-6">
          Already have an account? <Link to="/login" className="text-[#0F766E] font-medium hover:underline">Log in</Link>
        </p>
      </div>
    </div>
  );
};

export default Register;