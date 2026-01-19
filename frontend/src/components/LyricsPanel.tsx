import { useState, useEffect, useRef } from 'react';
import { usePlayerStore } from '@/stores/usePlayerStore';
import { X, Mic2, Loader2 } from 'lucide-react';
import { Button } from './ui/button';

interface LyricsPanelProps {
  onClose: () => void;
}

const LyricsPanel = ({ onClose }: LyricsPanelProps) => {
  const { currentSong } = usePlayerStore();
  const [lyrics, setLyrics] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchLyrics = async () => {
      if (!currentSong) {
        setLyrics('');
        return;
      }

      setIsLoading(true);
      setError('');
      
      try {
        // Clean up artist and title for better matching
        const artist = currentSong.artist
          .split(',')[0]
          .replace(/official|vevo|music|channel|topic/gi, '')
          .trim();
        const title = currentSong.title
          .replace(/\(.*?\)/g, '') // Remove parentheses content
          .replace(/\[.*?\]/g, '') // Remove brackets content
          .replace(/official|video|audio|lyrics|hd|4k|full|song|-|feat\.|ft\./gi, '')
          .replace(/\|.*/g, '') // Remove everything after |
          .trim();

        // Try primary API
        let lyricsFound = false;
        
        // API 1: lyrics.ovh
        try {
          const response = await fetch(
            `https://api.lyrics.ovh/v1/${encodeURIComponent(artist)}/${encodeURIComponent(title)}`
          );
          if (response.ok) {
            const data = await response.json();
            if (data.lyrics && data.lyrics.trim().length > 50) {
              setLyrics(data.lyrics);
              lyricsFound = true;
            }
          }
        } catch (e) {}

        // API 2: Try with just song title if artist search fails
        if (!lyricsFound) {
          try {
            const response = await fetch(
              `https://api.lyrics.ovh/v1/${encodeURIComponent(title.split(' ').slice(0, 3).join(' '))}/${encodeURIComponent(title)}`
            );
            if (response.ok) {
              const data = await response.json();
              if (data.lyrics && data.lyrics.trim().length > 50) {
                setLyrics(data.lyrics);
                lyricsFound = true;
              }
            }
          } catch (e) {}
        }

        if (!lyricsFound) {
          setError('Lyrics not found for this song');
        }
      } catch (err) {
        setError('Could not load lyrics');
      } finally {
        setIsLoading(false);
      }
    };

    fetchLyrics();
  }, [currentSong?.title, currentSong?.artist]);

  // Auto-scroll effect placeholder
  useEffect(() => {
    if (!lyrics || !containerRef.current) return;
    // Future: implement auto-scroll based on song progress
  }, [lyrics]);

  return (
    <div className='h-full flex flex-col bg-gradient-to-b from-zinc-900 to-black'>
      {/* Header */}
      <div className='flex items-center justify-between p-4 border-b border-zinc-800'>
        <div className='flex items-center gap-2'>
          <Mic2 className='w-5 h-5 text-emerald-400' />
          <span className='font-semibold'>Lyrics</span>
        </div>
        <Button size='icon' variant='ghost' onClick={onClose} className='h-8 w-8'>
          <X className='w-4 h-4' />
        </Button>
      </div>

      {/* Song Info */}
      {currentSong && (
        <div className='p-4 bg-zinc-900/50'>
          <h3 className='font-bold text-lg truncate'>{currentSong.title}</h3>
          <p className='text-sm text-zinc-400'>{currentSong.artist}</p>
        </div>
      )}

      {/* Lyrics Content */}
      <div 
        ref={containerRef}
        className='flex-1 overflow-y-auto p-4 scrollbar-thin scrollbar-thumb-zinc-700'
      >
        {isLoading ? (
          <div className='flex flex-col items-center justify-center h-full gap-3'>
            <Loader2 className='w-8 h-8 animate-spin text-emerald-400' />
            <p className='text-zinc-400'>Loading lyrics...</p>
          </div>
        ) : error ? (
          <div className='flex flex-col items-center justify-center h-full gap-3 text-center'>
            <Mic2 className='w-12 h-12 text-zinc-600' />
            <p className='text-zinc-400'>{error}</p>
            <p className='text-xs text-zinc-600'>Lyrics available for most English songs</p>
          </div>
        ) : lyrics ? (
          <div className='space-y-4'>
            {lyrics.split('\n\n').map((paragraph, idx) => (
              <p 
                key={idx} 
                className='text-lg leading-relaxed text-zinc-200 hover:text-white transition-colors'
              >
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
            <Mic2 className='w-12 h-12 text-zinc-600' />
            <p className='text-zinc-400'>Play a song to see lyrics</p>
          </div>
        ) : null}
      </div>

      {/* Footer */}
      <div className='p-3 border-t border-zinc-800 text-center'>
        <p className='text-xs text-zinc-600'>Lyrics provided by lyrics.ovh</p>
      </div>
    </div>
  );
};

export default LyricsPanel;
