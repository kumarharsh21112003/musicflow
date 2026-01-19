import { Song } from "@/types";
import { Button } from "@/components/ui/button";
import { Play, Pause } from "lucide-react";
import { usePlayerStore } from "@/stores/usePlayerStore";

type SectionGridProps = {
	title: string;
	songs: Song[];
	isLoading: boolean;
};

// Loading skeleton component
const LoadingSkeleton = () => (
	<div className='grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4'>
		{[1, 2, 3, 4, 5].map(i => (
			<div key={i} className='bg-zinc-800/40 p-4 rounded-lg animate-pulse'>
				<div className='aspect-square rounded-lg bg-zinc-700 mb-4' />
				<div className='h-4 bg-zinc-700 rounded mb-2 w-3/4' />
				<div className='h-3 bg-zinc-700 rounded w-1/2' />
			</div>
		))}
	</div>
);

const SectionGrid = ({ songs, title, isLoading }: SectionGridProps) => {
	const { currentSong, isPlaying, setCurrentSong, setQueue, setIsPlaying } = usePlayerStore();

	if (isLoading) {
		return (
			<div className='mb-8'>
				<div className='flex items-center justify-between mb-4'>
					<div className='h-7 bg-zinc-700 rounded w-48 animate-pulse' />
				</div>
				<LoadingSkeleton />
			</div>
		);
	}

	if (!songs || songs.length === 0) return null;

	const handleClick = (song: Song) => {
		const isCurrentSong = currentSong?._id === song._id;
		if (isCurrentSong) {
			setIsPlaying(!isPlaying);
		} else {
			setQueue(songs);
			setCurrentSong(song);
		}
	};

	return (
		<div className='mb-8'>
			<div className='flex items-center justify-between mb-4'>
				<h2 className='text-xl sm:text-2xl font-bold'>{title}</h2>
				<Button variant='link' className='text-sm text-zinc-400 hover:text-white'>
					Show all
				</Button>
			</div>

			<div className='grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4'>
				{songs.map((song) => {
					const isCurrentSong = currentSong?._id === song._id;
					const showPause = isCurrentSong && isPlaying;
					
					return (
						<div
							key={song._id}
							onClick={() => handleClick(song)}
							className='bg-zinc-800/40 p-4 rounded-lg hover:bg-zinc-700/40 transition-all group cursor-pointer'
						>
							<div className='relative mb-4'>
								<div className='aspect-square rounded-lg shadow-lg overflow-hidden bg-zinc-900'>
									<img
										src={song.imageUrl || `https://i.ytimg.com/vi/${song.videoId}/mqdefault.jpg`}
										alt={song.title}
										className='w-full h-full object-cover transition-transform duration-300 group-hover:scale-105'
										onError={(e) => {
											(e.target as HTMLImageElement).src = `https://i.ytimg.com/vi/${song.videoId}/default.jpg`;
										}}
									/>
								</div>
								<Button
									size="icon"
									className={`absolute bottom-2 right-2 bg-emerald-500 hover:bg-emerald-400 hover:scale-105 transition-all 
										shadow-xl ${isCurrentSong ? 'opacity-100' : 'opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0'}`}
								>
									{showPause ? <Pause className='h-5 w-5 text-black' /> : <Play className='h-5 w-5 text-black' />}
								</Button>
							</div>
							<h3 className={`font-semibold mb-1 truncate ${isCurrentSong ? 'text-emerald-400' : 'text-white'}`}>
								{song.title}
							</h3>
							<p className='text-sm text-zinc-400 truncate'>{song.artist}</p>
						</div>
					);
				})}
			</div>
		</div>
	);
};

export default SectionGrid;
