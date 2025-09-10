import { Link, useLocation } from "react-router-dom";
import { Home, Users, TrendingUp, Menu } from "lucide-react";

type LeftSidebarProps = {
  onClose?: () => void;
};

const LeftSidebar = ({ onClose }: LeftSidebarProps) => {
  const location = useLocation();
  return (
    <aside className="hidden md:flex flex-col w-56 pt-6 pr-4 border-r">
      <button onClick={onClose} className="self-start mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
        <Menu className="h-4 w-4" />
        Your Path 
      </button>
      <nav className="flex flex-col gap-2">
        <Link
          to="/"
          className={`inline-flex items-center gap-3 px-3 py-2 rounded-md transition-colors ${
            location.pathname === "/" ? "bg-muted text-primary" : "hover:bg-muted"
          }`}
        >
          <Home className="h-4 w-4" />
          Home
        </Link>
        <Link
          to="/communities"
          className={`inline-flex items-center gap-3 px-3 py-2 rounded-md transition-colors ${
            location.pathname === "/communities" ? "bg-muted text-primary" : "hover:bg-muted"
          }`}
        >
          <Users className="h-4 w-4" />
          Communities
        </Link>
        <a
          href="#trending"
          className="inline-flex items-center gap-3 px-3 py-2 rounded-md hover:bg-muted"
        >
          <TrendingUp className="h-4 w-4" />
          Trending
        </a>
      </nav>
    </aside>
  );
};

export default LeftSidebar;


