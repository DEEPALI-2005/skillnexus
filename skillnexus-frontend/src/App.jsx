import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import { Briefcase } from "lucide-react";
import { useAuth } from "./context/AuthContext";

// Pages import karo
import Login from "./pages/Login";
import Register from "./pages/Register";

const Home = () => {
  const { user } = useAuth();
  return (
    <div className="p-10 max-w-6xl mx-auto">
      <h1 className="text-4xl font-bold text-primary mb-4">
        Welcome to SkillNexus {user ? `, ${user.name}` : ""}
      </h1>
      <p className="text-secondary text-lg">Hyperlocal freelance ecosystem. Find work or hire talent in your city.</p>
    </div>
  );
};

function App() {
  const { user, loading, logout } = useAuth();

  // Jab tak token check ho raha hai, tab tak loading screen dikhao
  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-background text-secondary">Loading...</div>;
  }

  return (
    <Router>
      <div className="min-h-screen flex flex-col bg-background">
        
        {/* NAVBAR */}
        <nav className="border-b border-[#E8E6E0] bg-white/80 backdrop-blur-md sticky top-0 z-50">
          <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
            
            <Link to="/" className="flex items-center gap-2 text-[#0F766E]">
              <Briefcase size={24} strokeWidth={2.5} />
              <span className="text-xl font-bold tracking-tight text-primary">SkillNexus</span>
            </Link>

            <div className="flex items-center gap-6">
              <Link to="/gigs" className="text-sm font-medium text-secondary hover:text-primary transition-colors">
                Find Work
              </Link>
              
              {user ? (
                // Agar logged in hai
                <>
                  <span className="text-sm font-medium text-primary">Hi, {user.name.split(' ')[0]}</span>
                  <button 
                    onClick={logout}
                    className="text-sm font-medium text-error hover:text-red-700 transition-colors"
                  >
                    Log out
                  </button>
                </>
              ) : (
                // Agar logged out hai
                <>
                  <Link to="/login" className="text-sm font-medium text-secondary hover:text-primary transition-colors">
                    Log in
                  </Link>
                  <Link 
                    to="/register" 
                    className="text-sm font-medium bg-[#0F766E] text-white px-4 py-2 rounded-lg hover:bg-[#115E59] transition-colors"
                  >
                    Sign up
                  </Link>
                </>
              )}
            </div>
          </div>
        </nav>

        {/* MAIN CONTENT */}
        <main className="flex-1 flex flex-col">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
          </Routes>
        </main>

        {/* FOOTER */}
        <footer className="border-t border-border-subtle py-8 bg-white mt-auto">
          <div className="max-w-6xl mx-auto px-6 flex justify-between items-center text-sm text-secondary">
            <p>&copy; {new Date().getFullYear()} SkillNexus. All rights reserved.</p>
          </div>
        </footer>
      </div>
    </Router>
  );
}

export default App;