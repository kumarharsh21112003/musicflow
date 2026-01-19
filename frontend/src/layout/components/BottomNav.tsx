import { Home, Search, Library } from "lucide-react";
import { Link, useLocation } from "react-router-dom";

export const BottomNav = () => {
    const location = useLocation();

    const isActive = (path: string) => location.pathname === path;

    return (
        <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-t from-black via-black/95 to-black/80 backdrop-blur-lg flex justify-around items-center h-[64px] z-[1000] safe-area-bottom">
            <Link to="/" className={`flex flex-col items-center gap-0.5 py-2 px-6 transition-all duration-200 ${isActive('/') ? 'text-white' : 'text-zinc-500'}`}>
                <Home size={24} strokeWidth={isActive('/') ? 2.5 : 2} fill={isActive('/') ? "currentColor" : "none"} />
                <span className={`text-[10px] ${isActive('/') ? 'font-bold' : 'font-medium'}`}>Home</span>
            </Link>
            
            <Link to="/search" className={`flex flex-col items-center gap-0.5 py-2 px-6 transition-all duration-200 ${isActive('/search') ? 'text-white' : 'text-zinc-500'}`}>
                <Search size={24} strokeWidth={isActive('/search') ? 2.5 : 2} />
                <span className={`text-[10px] ${isActive('/search') ? 'font-bold' : 'font-medium'}`}>Search</span>
            </Link>

            <Link to="/liked" className={`flex flex-col items-center gap-0.5 py-2 px-6 transition-all duration-200 ${isActive('/liked') ? 'text-white' : 'text-zinc-500'}`}>
                <Library size={24} strokeWidth={isActive('/liked') ? 2.5 : 2} />
                <span className={`text-[10px] ${isActive('/liked') ? 'font-bold' : 'font-medium'}`}>Your Library</span>
            </Link>
        </div>
    )
}
