import { Home, Search, Library, PlusSquare } from "lucide-react";
import { Link, useLocation } from "react-router-dom";

export const BottomNav = () => {
    const location = useLocation();

    const isActive = (path: string) => location.pathname === path;

    return (
        <div className="md:hidden fixed bottom-0 left-0 right-0 bg-zinc-900/95 backdrop-blur-md border-t border-zinc-800 flex justify-around items-center h-16 z-50 pb-safe">
            <Link to="/" className={`flex flex-col items-center gap-1 w-full h-full justify-center ${isActive('/') ? 'text-white' : 'text-zinc-400'}`}>
                <Home size={24} fill={isActive('/') ? "currentColor" : "none"} />
                <span className="text-[10px] font-medium">Home</span>
            </Link>
            
            <Link to="/search" className={`flex flex-col items-center gap-1 w-full h-full justify-center ${isActive('/search') || isActive('/search/') ? 'text-white' : 'text-zinc-400'}`}>
                <Search size={24} strokeWidth={isActive('/search') ? 3 : 2} />
                <span className="text-[10px] font-medium">Search</span>
            </Link>

            <Link to="#" className={`flex flex-col items-center gap-1 w-full h-full justify-center ${isActive('/library') ? 'text-white' : 'text-zinc-400'}`}>
                <Library size={24} />
                <span className="text-[10px] font-medium">Your Library</span>
            </Link>

             <Link to="#" className="flex flex-col items-center gap-1 w-full h-full justify-center text-zinc-400">
                <PlusSquare size={24} />
                <span className="text-[10px] font-medium">Create</span>
            </Link>
        </div>
    )
}
