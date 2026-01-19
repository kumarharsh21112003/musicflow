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
	const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
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
			<Topbar />
			
			<div className="flex-1 overflow-hidden relative">
				{isMobile ? (
					// Mobile Layout - No Resizable Panels
					<div className="h-full overflow-y-auto pb-32">
						<Outlet />
						{/* Mobile Lyrics Overlay */}
						{showLyrics && (
							<div className="fixed inset-0 z-50 bg-black">
								<LyricsPanel onClose={() => setShowLyrics(false)} />
							</div>
						)}
					</div>
				) : (
					// Desktop Layout
					<ResizablePanelGroup direction='horizontal' className='flex h-full p-2'>
						<ResizablePanel defaultSize={20} minSize={10} maxSize={25}>
							<LeftSidebar />
						</ResizablePanel>

						<ResizableHandle className='w-2 bg-black rounded-lg transition-colors' />

						<ResizablePanel defaultSize={showRightSidebar ? 55 : 80}>
							<Outlet />
						</ResizablePanel>

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
				)}
			</div>

			<PlaybackControls />
			{isMobile && <BottomNav />}
		</div>
	);
};
export default MainLayout;
