import { useMusicStore } from "@/stores/useMusicStore";
import { usePlayerStore } from "@/stores/usePlayerStore";
import { Play, Pause } from "lucide-react";

// Loading skeleton
const LoadingSkeleton = () => (
	<div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-8'>
		{[1, 2, 3, 4, 5, 6].map(i => (
			<div key={i} className='flex items-center rounded-md bg-zinc-800/60 h-16 animate-pulse'>
				<div className='w-16 h-16 bg-zinc-700 flex-shrink-0' />
				<div className='flex-1 px-4'>
					<div className='h-4 bg-zinc-700 rounded w-2/3' />
				</div>
			</div>
		))}
	</div>
);

const FeaturedSection = () => {
	const { isLoading, featuredSongs, error } = useMusicStore();
	const { currentSong, isPlaying, setCurrentSong, setQueue, togglePlay } = usePlayerStore();

	if (isLoading) return <LoadingSkeleton />;
	if (error) return <p className='text-red-500 mb-4 text-lg'>{error}</p>;
	if (!featuredSongs || featuredSongs.length === 0) return <LoadingSkeleton />;

	const handleClick = (song: any) => {
		const isCurrentSong = currentSong?._id === song._id;
		if (isCurrentSong) {
			togglePlay();
		} else {
			setQueue(featuredSongs);
			setCurrentSong(song);
		}
	};

	return (
		<div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-8'>
			{featuredSongs.map((song) => {
				const isCurrentSong = currentSong?._id === song._id;
				const showPause = isCurrentSong && isPlaying;
				
				return (
					<div
						key={song._id}
						onClick={() => handleClick(song)}
						className={`flex items-center rounded-md overflow-hidden transition-all group cursor-pointer relative h-16
							${isCurrentSong ? 'bg-zinc-700/70' : 'bg-zinc-800/60 hover:bg-zinc-700/60'}`}
					>
						<img
							src={song.imageUrl || `https://i.ytimg.com/vi/${song.videoId}/mqdefault.jpg`}
							alt={song.title}
							className='w-16 h-16 object-cover flex-shrink-0'
							onError={(e) => {
								(e.target as HTMLImageElement).src = `https://i.ytimg.com/vi/${song.videoId}/default.jpg`;
							}}
						/>
						<div className='flex-1 px-4 min-w-0'>
							<p className={`font-semibold truncate text-sm ${isCurrentSong ? 'text-emerald-400' : 'text-white'}`}>
								{song.title}
							</p>
						</div>
						<div className={`absolute right-2 w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center
							shadow-lg transition-all hover:scale-105 hover:bg-emerald-400
							${isCurrentSong ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
							{showPause ? <Pause className='h-4 w-4 text-black' /> : <Play className='h-4 w-4 text-black ml-0.5' />}
						</div>
					</div>
				);
			})}
		</div>
	);
};

export default FeaturedSection;
