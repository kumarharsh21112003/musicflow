import { useState, useEffect, useRef, useCallback } from 'react';
import { usePlayerStore } from '@/stores/usePlayerStore';
import { X, Mic2, Loader2, Music } from 'lucide-react';
import { Button } from './ui/button';

interface LyricsPanelProps {
  onClose: () => void;
}

interface SyncedLine {
  time: number; // seconds
  text: string;
}

// Parse LRC format "[mm:ss.xx] text" into structured data
const parseLRC = (lrc: string): SyncedLine[] => {
  const lines: SyncedLine[] = [];
  const regex = /\[(\d{2}):(\d{2})\.(\d{2,3})\]\s*(.*)/;

  lrc.split('\n').forEach(line => {
    const match = line.match(regex);
    if (match) {
      const minutes = parseInt(match[1]);
      const seconds = parseInt(match[2]);
      const ms = parseInt(match[3]);
      const time = minutes * 60 + seconds + ms / (match[3].length === 3 ? 1000 : 100);
      const text = match[4].trim();
      if (text) lines.push({ time, text });
    }
  });

  return lines.sort((a, b) => a.time - b.time);
};

const LyricsPanel = ({ onClose }: LyricsPanelProps) => {
  const { currentSong, currentTime } = usePlayerStore();
  const [syncedLyrics, setSyncedLyrics] = useState<SyncedLine[]>([]);
  const [plainLyrics, setPlainLyrics] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isSynced, setIsSynced] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const activeLineRef = useRef<HTMLDivElement>(null);

  // Find current active line based on playback time
  const getActiveLine = useCallback((): number => {
    if (!syncedLyrics.length) return -1;

    for (let i = syncedLyrics.length - 1; i >= 0; i--) {
      if (currentTime >= syncedLyrics[i].time) return i;
    }
    return -1;
  }, [syncedLyrics, currentTime]);

  const activeLine = getActiveLine();

  // Clean song info for API search
  const cleanTitle = (title: string) => {
    return title
      .replace(/\(.*?\)/g, '')
      .replace(/\[.*?\]/g, '')
      .replace(/official|video|audio|lyrics|hd|4k|full|song|feat\.|ft\./gi, '')
      .replace(/\|.*/g, '')
      .replace(/:/g, '')
      .trim()
      .split(' ').slice(0, 5).join(' ');
  };

  const cleanArtist = (artist: string) => {
    return artist
      .split(',')[0]
      .replace(/official|vevo|music|channel|topic/gi, '')
      .trim();
  };

  // Fetch lyrics from LRCLIB (free synced lyrics API)
  useEffect(() => {
    const fetchLyrics = async () => {
      if (!currentSong) {
        setSyncedLyrics([]);
        setPlainLyrics('');
        return;
      }

      setIsLoading(true);
      setError('');
      setSyncedLyrics([]);
      setPlainLyrics('');
      setIsSynced(false);

      const title = cleanTitle(currentSong.title);
      const artist = cleanArtist(currentSong.artist);

      try {
        // Try LRCLIB API for synced lyrics
        const lrclibRes = await fetch(
          `https://lrclib.net/api/search?track_name=${encodeURIComponent(title)}&artist_name=${encodeURIComponent(artist)}`,
          { signal: AbortSignal.timeout(8000) }
        );

        if (lrclibRes.ok) {
          const results = await lrclibRes.json();
          if (results.length > 0) {
            const best = results[0];

            // Prefer synced lyrics
            if (best.syncedLyrics) {
              const parsed = parseLRC(best.syncedLyrics);
              if (parsed.length > 0) {
                setSyncedLyrics(parsed);
                setIsSynced(true);
                setIsLoading(false);
                return;
              }
            }

            // Fallback to plain lyrics
            if (best.plainLyrics) {
              setPlainLyrics(best.plainLyrics);
              setIsLoading(false);
              return;
            }
          }
        }

        // Fallback: Try lyrics.ovh
        try {
          const ovhRes = await fetch(
            `https://api.lyrics.ovh/v1/${encodeURIComponent(artist)}/${encodeURIComponent(title)}`,
            { signal: AbortSignal.timeout(8000) }
          );
          if (ovhRes.ok) {
            const data = await ovhRes.json();
            if (data.lyrics && data.lyrics.trim().length > 50) {
              setPlainLyrics(data.lyrics);
              setIsLoading(false);
              return;
            }
          }
        } catch { }

        setError('Lyrics not found for this song');
      } catch (err) {
        setError('Could not load lyrics');
      } finally {
        setIsLoading(false);
      }
    };

    fetchLyrics();
  }, [currentSong?.title, currentSong?.artist]);

  // Auto-scroll to active line (smooth)
  useEffect(() => {
    if (activeLineRef.current && containerRef.current) {
      activeLineRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }
  }, [activeLine]);

  return (
    <div className='h-full flex flex-col bg-gradient-to-b from-neutral-900 to-black'>
      {/* Header */}
      <div className='flex items-center justify-between p-4 border-b border-neutral-800/50'>
        <div className='flex items-center gap-2'>
          <Mic2 className='w-5 h-5 text-orange-400' />
          <span className='font-semibold'>Lyrics</span>
          {isSynced && (
            <span className='text-[10px] uppercase tracking-wider bg-orange-500/20 text-orange-400 px-2 py-0.5 rounded-full font-bold'>
              Synced
            </span>
          )}
        </div>
        <Button size='icon' variant='ghost' onClick={onClose} className='h-8 w-8 text-neutral-400 hover:text-white'>
          <X className='w-4 h-4' />
        </Button>
      </div>

      {/* Song Info */}
      {currentSong && (
        <div className='p-4 flex items-center gap-3 border-b border-neutral-800/30'>
          <img
            src={currentSong.imageUrl || `https://i.ytimg.com/vi/${currentSong.videoId}/default.jpg`}
            alt=''
            className='w-10 h-10 rounded-lg object-cover'
          />
          <div className='min-w-0'>
            <h3 className='font-bold text-sm truncate text-white'>{currentSong.title}</h3>
            <p className='text-xs text-neutral-500'>{currentSong.artist}</p>
          </div>
        </div>
      )}

      {/* Lyrics Content */}
      <div
        ref={containerRef}
        className='flex-1 overflow-y-auto px-5 py-6'
        style={{ scrollbarWidth: 'none' }}
      >
        {isLoading ? (
          <div className='flex flex-col items-center justify-center h-full gap-3'>
            <Loader2 className='w-8 h-8 animate-spin text-orange-400' />
            <p className='text-neutral-500 text-sm'>Finding lyrics...</p>
          </div>
        ) : error ? (
          <div className='flex flex-col items-center justify-center h-full gap-3 text-center'>
            <Music className='w-12 h-12 text-neutral-700' />
            <p className='text-neutral-400 font-medium'>{error}</p>
            <p className='text-xs text-neutral-600'>Try playing a popular song</p>
          </div>
        ) : isSynced && syncedLyrics.length > 0 ? (
          /* Synced Lyrics - Apple Music style */
          <div className='space-y-1 py-8'>
            {syncedLyrics.map((line, idx) => {
              const isActive = idx === activeLine;
              const isPast = idx < activeLine;

              return (
                <div
                  key={idx}
                  ref={isActive ? activeLineRef : undefined}
                  className={`py-2 px-3 rounded-xl transition-all duration-500 cursor-pointer
                    ${isActive
                      ? 'text-white text-xl font-bold scale-[1.02] bg-orange-500/10'
                      : isPast
                        ? 'text-neutral-600 text-lg font-medium'
                        : 'text-neutral-500 text-lg font-medium hover:text-neutral-300'
                    }`}
                >
                  {line.text}
                </div>
              );
            })}
            <div className='h-40' /> {/* Bottom spacing */}
          </div>
        ) : plainLyrics ? (
          /* Plain Lyrics */
          <div className='space-y-4 py-4'>
            {plainLyrics.split('\n\n').map((paragraph, idx) => (
              <p key={idx} className='text-lg leading-relaxed text-neutral-300'>
                {paragraph.split('\n').map((line, lineIdx) => (
                  <span key={lineIdx} className='block py-1'>
                    {line || <span className='h-4 block' />}
                  </span>
                ))}
              </p>
            ))}
          </div>
        ) : !currentSong ? (
          <div className='flex flex-col items-center justify-center h-full gap-3'>
            <Mic2 className='w-12 h-12 text-neutral-700' />
            <p className='text-neutral-500'>Play a song to see lyrics</p>
          </div>
        ) : null}
      </div>

      {/* Footer */}
      <div className='p-3 border-t border-neutral-800/30 text-center'>
        <p className='text-[10px] text-neutral-600'>
          {isSynced ? 'Synced lyrics by LRCLIB' : 'Lyrics by LRCLIB & lyrics.ovh'}
        </p>
      </div>
    </div>
  );
};

export default LyricsPanel;
