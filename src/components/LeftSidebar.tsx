import { Link, useLocation } from "react-router-dom";
import { Home, Users, TrendingUp, AlignJustify, Compass, Globe } from "lucide-react";

type LeftSidebarProps = {
  onClose?: () => void;
};

const LeftSidebar = ({ onClose }: LeftSidebarProps) => {
  const location = useLocation();

  return (
    <aside className="hidden md:flex flex-col w-56 pt-0 pr-4 border-r">
      <button onClick={onClose} className="self-start mb-4 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
        <AlignJustify className="h-4 w-4" />
        Your Path 
      </button>
      <nav className="flex flex-col gap-2">
        <Link
          to="/"
          className={`inline-flex items-center gap-3 px-3 py-2 rounded-md transition-colors ${
            location.pathname === "/" ? "bg-primary/10 text-primary" : "hover:bg-muted"
          }`}
        >
          <Home className="h-4 w-4" />
          Home
        </Link>
        <Link
          to="/home"
          className={`inline-flex items-center gap-3 px-3 py-2 rounded-md transition-colors ${
            location.pathname === "/home" ? "bg-primary/10 text-primary" : "hover:bg-muted"
          }`}
        >
          <Globe className="h-4 w-4" />
          Global Feed
        </Link>
        <Link
          to="/communities"
          className={`inline-flex items-center gap-3 px-3 py-2 rounded-md transition-colors ${
            location.pathname === "/communities" ? "bg-primary/10 text-primary" : "hover:bg-muted"
          }`}
        >
          <Users className="h-4 w-4" />
          Communities
        </Link>
        <Link
          to="/explore"
          className={`inline-flex items-center gap-3 px-3 py-2 rounded-md transition-colors ${
            location.pathname === "/explore" ? "bg-primary/10 text-primary" : "hover:bg-muted"
          }`}
        >
          <Compass className="h-4 w-4" />
          Explore
        </Link>
      </nav>
    </aside>
  );
};

export default LeftSidebar;
