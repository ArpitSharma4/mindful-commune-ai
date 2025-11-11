import { Link, useLocation, useNavigate } from "react-router-dom";
import { Home, Users, TrendingUp, AlignJustify, Compass, Globe, BookOpen } from "lucide-react";
type LeftSidebarProps = {
  onClose?: () => void;
};
const LeftSidebar = ({ onClose }: LeftSidebarProps) => {
  const location = useLocation();
  const navigate = useNavigate();
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
          to="/global-feed"
          className={`inline-flex items-center gap-3 px-3 py-2 rounded-md transition-colors ${
            location.pathname === "/global-feed" ? "bg-primary/10 text-primary" : "hover:bg-muted"
          }`}
        >
          <Globe className="h-4 w-4" />
          Global Feed
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
        <Link
          to="/journaling"
          className={`inline-flex items-center gap-3 px-3 py-2 rounded-md transition-colors ${
            location.pathname === "/journaling" ? "bg-primary/10 text-primary" : "hover:bg-muted"
          }`}
        >
          <BookOpen className="h-4 w-4" />
          Journal
        </Link>
      </nav>

      {/* Make whole card a real link so clicking anywhere opens profile */}
      <Link to="/profile" className="mt-4 rounded-md hover:bg-muted p-3 inline-flex items-center gap-3">
        <div className="profile-info flex-1">
          {/* avatar, username, level, etc. */}
        </div>

        {/* If you have a dropdown/toggle icon here, prevent it from causing the Link navigation */}
        {/* Example dropdown toggle — ensure it stops propagation so it doesn't trigger the parent Link */}
        <button
          type="button"
          className="ml-2 p-1 rounded"
          onClick={(e) => {
            e.stopPropagation(); // IMPORTANT: prevent Link navigation when clicking the dropdown
            // open dropdown logic here (e.g., setDropdownOpen(true))
          }}
          aria-label="Profile options"
        >
          {/* small icon (existing dropdown icon component) */}
        </button>
      </Link>
    </aside>
  );
};
export default LeftSidebar;
