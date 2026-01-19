import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { Outlet } from "react-router-dom";
import LeftSidebar from "./components/LeftSidebar";
import { PlaybackControls } from "./components/PlaybackControls";
import RightSidebar from "./components/RightSidebar";
import Topbar from "@/components/Topbar";
import LyricsPanel from "@/components/LyricsPanel";
import { useEffect, useState } from "react";
import { usePlayerStore } from "@/stores/usePlayerStore";
import { BottomNav } from "./components/BottomNav";

const MainLayout = () => {
	// Proper SSR-safe mobile detection
	const [isMobile, setIsMobile] = useState(false);
	const [showLyrics, setShowLyrics] = useState(false);
	const { currentSong } = usePlayerStore();

	useEffect(() => {
		const checkMobile = () => {
			setIsMobile(window.innerWidth < 768);
		};

		// Initial check
		checkMobile();
		
		// Listen for resize
		window.addEventListener("resize", checkMobile);
		return () => window.removeEventListener("resize", checkMobile);
	}, []);

	const showRightSidebar = !isMobile && currentSong;

	// ========================================
	// MOBILE LAYOUT (Phone)
	// ========================================
	if (isMobile) {
		return (
			<div className='h-screen bg-black text-white flex flex-col overflow-hidden'>
				{/* Mobile: No Topbar, Full screen content */}
				<div className="flex-1 overflow-y-auto pb-40">
					<Outlet />
					
					{/* Mobile Lyrics Overlay */}
					{showLyrics && (
						<div className="fixed inset-0 z-50 bg-black">
							<LyricsPanel onClose={() => setShowLyrics(false)} />
						</div>
					)}
				</div>

				{/* Mobile Floating Player + Bottom Nav */}
				<PlaybackControls />
				<BottomNav />
			</div>
		);
	}

	// ========================================
	// DESKTOP LAYOUT (PC)
	// ========================================
	return (
		<div className='h-screen bg-black text-white flex flex-col overflow-hidden'>
			{/* Desktop Topbar with Search */}
			<Topbar />
			
			<div className="flex-1 overflow-hidden relative">
				<ResizablePanelGroup direction='horizontal' className='flex h-full p-2'>
					{/* Left Sidebar */}
					<ResizablePanel defaultSize={20} minSize={10} maxSize={25}>
						<LeftSidebar />
					</ResizablePanel>

					<ResizableHandle className='w-2 bg-black rounded-lg transition-colors' />

					{/* Main Content */}
					<ResizablePanel defaultSize={showRightSidebar ? 55 : 80}>
						<Outlet />
					</ResizablePanel>

					{/* Right Sidebar (Now Playing) */}
					{showRightSidebar && (
						<>
							<ResizableHandle className='w-2 bg-black rounded-lg transition-colors' />
							<ResizablePanel defaultSize={25} minSize={20} maxSize={35}>
								{showLyrics ? (
									<LyricsPanel onClose={() => setShowLyrics(false)} />
								) : (
									<RightSidebar onShowLyrics={() => setShowLyrics(true)} />
								)}
							</ResizablePanel>
						</>
					)}
				</ResizablePanelGroup>
			</div>

			{/* Desktop Footer Player */}
			<PlaybackControls />
		</div>
	);
};

export default MainLayout;
