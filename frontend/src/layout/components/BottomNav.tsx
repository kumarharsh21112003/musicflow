import { Home, Search, Library } from "lucide-react";
import { Link, useLocation } from "react-router-dom";

export const BottomNav = () => {
    const location = useLocation();

    const isActive = (path: string) => location.pathname === path;

    return (
        <div className="md:hidden fixed bottom-0 left-0 right-0 bg-black/95 backdrop-blur-lg border-t border-white/5 flex justify-around items-center h-[72px] z-50 pb-safe px-6">
            <Link to="/" className={`flex flex-col items-center gap-1 transition-all duration-300 ${isActive('/') ? 'text-white scale-110' : 'text-zinc-400'}`}>
                <Home size={26} strokeWidth={isActive('/') ? 2.5 : 2} fill={isActive('/') ? "currentColor" : "none"} />
                <span className={`text-[10px] ${isActive('/') ? 'font-bold' : 'font-medium'}`}>Home</span>
            </Link>
            
            <Link to="/search" className={`flex flex-col items-center gap-1 transition-all duration-300 ${isActive('/search') ? 'text-white scale-110' : 'text-zinc-400'}`}>
                <Search size={26} strokeWidth={isActive('/search') ? 3 : 2} />
                <span className={`text-[10px] ${isActive('/search') ? 'font-bold' : 'font-medium'}`}>Search</span>
            </Link>

            <Link to="#" className={`flex flex-col items-center gap-1 transition-all duration-300 ${isActive('/library') ? 'text-white scale-110' : 'text-zinc-400'}`}>
                <Library size={26} strokeWidth={isActive('/library') ? 2.5 : 2} />
                <span className={`text-[10px] ${isActive('/library') ? 'font-bold' : 'font-medium'}`}>Your Library</span>
            </Link>
        </div>
    )
}
