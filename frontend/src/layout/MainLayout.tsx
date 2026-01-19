import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { Outlet } from "react-router-dom";
import LeftSidebar from "./components/LeftSidebar";
import { PlaybackControls } from "./components/PlaybackControls";
import RightSidebar from "./components/RightSidebar";
import Topbar from "@/components/Topbar";
import LyricsPanel from "@/components/LyricsPanel";
import { useEffect, useState } from "react";
import { usePlayerStore } from "@/stores/usePlayerStore";

const MainLayout = () => {
	const [isMobile, setIsMobile] = useState(false);
	const [showLyrics, setShowLyrics] = useState(false);
	const { currentSong } = usePlayerStore();

	useEffect(() => {
		const checkMobile = () => {
			setIsMobile(window.innerWidth < 768);
		};

		checkMobile();
		window.addEventListener("resize", checkMobile);
		return () => window.removeEventListener("resize", checkMobile);
	}, []);

	const showRightSidebar = !isMobile && currentSong;

	return (
		<div className='h-screen bg-black text-white flex flex-col'>
			{/* Topbar - Always visible */}
			<Topbar />
			
			<ResizablePanelGroup direction='horizontal' className='flex-1 flex h-full overflow-hidden p-2'>
				{/* Left sidebar */}
				<ResizablePanel defaultSize={20} minSize={isMobile ? 0 : 10} maxSize={25}>
					<LeftSidebar />
				</ResizablePanel>

				<ResizableHandle className='w-2 bg-black rounded-lg transition-colors' />

				{/* Main content */}
				<ResizablePanel defaultSize={showRightSidebar ? 55 : 80}>
					<Outlet />
				</ResizablePanel>

				{showRightSidebar && (
					<>
						<ResizableHandle className='w-2 bg-black rounded-lg transition-colors' />
						
						{/* Right sidebar - Now Playing or Lyrics */}
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

			<PlaybackControls />
		</div>
	);
};
export default MainLayout;
