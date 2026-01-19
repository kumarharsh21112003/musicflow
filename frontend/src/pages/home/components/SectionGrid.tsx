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
			<div className='flex items-center justify-between mb-4 px-1'>
				<h2 className='text-xl sm:text-2xl font-black tracking-tight'>{title}</h2>
				<button className='text-xs font-bold text-zinc-400 hover:text-white uppercase tracking-wider'>
					See all
				</button>
			</div>

			<div className='flex md:grid md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 overflow-x-auto no-scrollbar -mx-2 px-2 pb-4 snap-x snap-mandatory'>
				{songs.map((song) => {
					const isCurrentSong = currentSong?._id === song._id;
					const showPause = isCurrentSong && isPlaying;
					
					return (
						<div
							key={song._id}
							onClick={() => handleClick(song)}
							className='min-w-[160px] md:min-w-0 bg-zinc-900/40 p-3 rounded-md hover:bg-zinc-800/40 transition-all group cursor-pointer snap-start border border-white/5'
						>
							<div className='relative mb-3'>
								<div className='aspect-square rounded shadow-2xl overflow-hidden bg-zinc-800'>
									<img
										src={song.imageUrl || `https://i.ytimg.com/vi/${song.videoId}/mqdefault.jpg`}
										alt={song.title}
										className='w-full h-full object-cover'
										onError={(e) => {
											(e.target as HTMLImageElement).src = `https://i.ytimg.com/vi/${song.videoId}/default.jpg`;
										}}
									/>
								</div>
								<Button
									size="icon"
									className={`absolute bottom-2 right-2 w-10 h-10 bg-emerald-500 hover:bg-emerald-400 hover:scale-105 transition-all rounded-full
										shadow-xl ${isCurrentSong ? 'opacity-100' : 'opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0'}`}
								>
									{showPause ? <Pause className='h-5 w-5 text-black fill-black' /> : <Play className='h-5 w-5 text-black fill-black ml-0.5' />}
								</Button>
							</div>
							<h3 className={`font-bold text-sm mb-0.5 truncate ${isCurrentSong ? 'text-emerald-400' : 'text-white'}`}>
								{song.title}
							</h3>
							<p className='text-[12px] text-zinc-400 font-medium truncate opacity-80'>{song.artist}</p>
						</div>
					);
				})}
			</div>
		</div>
	);
};

export default SectionGrid;
