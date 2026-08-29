import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export default function Navbar() {
  const { user, admin, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  return (
    <header className="sticky top-0 z-40 backdrop-blur bg-paper/80 border-b border-ink/10">
      <nav className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link to="/" className="font-display text-xl tracking-tight">
          portfolio<span className="text-signal">.builder</span>
        </Link>
        <div className="flex items-center gap-6 text-sm font-medium">
          <Link to="/articles" className="hover:text-signal transition-colors">
            Articles &amp; Roadmaps
          </Link>
          {user ? (
            <>
              <Link to="/dashboard" className="hover:text-signal transition-colors">
                My Portfolio
              </Link>
              <button onClick={handleLogout} className="text-ink/60 hover:text-ink transition-colors">
                Log out
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="hover:text-signal transition-colors">
                Log in
              </Link>
              <Link
                to="/register"
                className="px-4 py-2 rounded-full bg-ink text-paper hover:bg-signal transition-colors"
              >
                Build my portfolio
              </Link>
            </>
          )}
          {admin && (
            <Link to="/admin" className="text-spark hover:text-signal transition-colors">
              Admin
            </Link>
          )}
        </div>
      </nav>
    </header>
  );
}
