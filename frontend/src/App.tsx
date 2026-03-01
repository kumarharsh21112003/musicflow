import { Route, Routes } from "react-router-dom";
import MainLayout from "./layout/MainLayout";
import { Toaster } from "react-hot-toast";
import HomePage from "./pages/home/HomePage";
import SearchPage from "./pages/search/SearchPage";
import NotFoundPage from "./pages/404/NotFoundPage";
import LikedSongsPage from "./pages/liked/LikedSongsPage";
import PlaylistPage from "./pages/playlist/PlaylistPage";
import AuthPage from "./pages/auth/AuthPage";
import { useAuthStore } from "./stores/useAuthStore";
import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";

function App() {
	const { user, isInitialized } = useAuthStore();
	const [forceShow, setForceShow] = useState(false);

	// Force show after 2 seconds if Firebase is slow
	useEffect(() => {
		const timer = setTimeout(() => {
			setForceShow(true);
		}, 2000);
		return () => clearTimeout(timer);
	}, []);

	// Show loading while checking auth state (max 2 seconds)
	if (!isInitialized && !forceShow) {
		return (
			<div className='min-h-screen bg-black flex items-center justify-center'>
				<Loader2 className='w-8 h-8 text-orange-500 animate-spin' />
			</div>
		);
	}

	// Show auth page if not logged in
	if (!user) {
		return (
			<>
				<AuthPage />
				<Toaster
					position='bottom-center'
					toastOptions={{
						style: {
							background: 'rgba(23, 23, 23, 0.95)',
							color: '#fff',
							borderRadius: '12px',
							border: '1px solid rgba(255,255,255,0.1)',
							backdropFilter: 'blur(12px)',
							padding: '12px 16px',
							fontSize: '14px',
							fontWeight: '500',
							boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
						},
						success: {
							iconTheme: { primary: '#ec5b13', secondary: '#fff' },
							duration: 2000,
						},
						error: {
							iconTheme: { primary: '#ef4444', secondary: '#fff' },
							duration: 3000,
						},
						loading: {
							iconTheme: { primary: '#ec5b13', secondary: '#333' },
						},
					}}
				/>
			</>
		);
	}

	return (
		<>
			<Routes>
				<Route element={<MainLayout />}>
					<Route path="/" element={<HomePage />} />
					<Route path="/search" element={<SearchPage />} />
					<Route path="/liked" element={<LikedSongsPage />} />
					<Route path="/playlist/:playlistId" element={<PlaylistPage />} />
					<Route path="*" element={<NotFoundPage />} />
				</Route>
			</Routes>
			<Toaster
				position='bottom-center'
				toastOptions={{
					style: {
						background: 'rgba(23, 23, 23, 0.95)',
						color: '#fff',
						borderRadius: '12px',
						border: '1px solid rgba(255,255,255,0.1)',
						backdropFilter: 'blur(12px)',
						padding: '12px 16px',
						fontSize: '14px',
						fontWeight: '500',
						boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
					},
					success: {
						iconTheme: { primary: '#ec5b13', secondary: '#fff' },
						duration: 2000,
					},
					error: {
						iconTheme: { primary: '#ef4444', secondary: '#fff' },
						duration: 3000,
					},
					loading: {
						iconTheme: { primary: '#ec5b13', secondary: '#333' },
					},
				}}
			/>
		</>
	);
}

export default App;
