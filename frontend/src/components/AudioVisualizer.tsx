/**
 * Audio Visualizer Component - Canvas Frequency Visualizer
 * Real-time audio frequency bars that react to music
 */

import { useEffect, useRef, useState } from "react";
import { usePlayerStore } from "@/stores/usePlayerStore";
import { Button } from "@/components/ui/button";
import { Activity, X, Maximize2, Minimize2 } from "lucide-react";

interface VisualizerProps {
  isOpen: boolean;
  onClose: () => void;
}

const AudioVisualizer = ({ isOpen, onClose }: VisualizerProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const analyserRef = useRef<AnalyserNode | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  
  const { isPlaying, currentSong } = usePlayerStore();
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [visualStyle, setVisualStyle] = useState<'bars' | 'wave' | 'circle'>('bars');
  
  // Color themes
  const themes = {
    neon: ['#00ff88', '#00ffcc', '#00ccff', '#0088ff', '#8800ff'],
    sunset: ['#ff6b6b', '#ffa500', '#ffcc00', '#ff8c00', '#ff4500'],
    ocean: ['#0077be', '#00a8cc', '#00d4ff', '#00ffff', '#00ffc8'],
    purple: ['#9b59b6', '#8e44ad', '#a855f7', '#c084fc', '#e879f9'],
  };
  const [currentTheme, setCurrentTheme] = useState<keyof typeof themes>('neon');

  useEffect(() => {
    if (!isOpen) return;

    const initAudio = async () => {
      try {
        // Find the YouTube iframe or audio element
        const iframe = document.querySelector('iframe[src*="youtube"]') as HTMLIFrameElement;
        const audio = document.querySelector('audio') as HTMLAudioElement;
        
        if (!audioContextRef.current) {
          audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        }
        
        const ctx = audioContextRef.current;
        
        if (ctx.state === 'suspended') {
          await ctx.resume();
        }
        
        // Create analyser
        if (!analyserRef.current) {
          analyserRef.current = ctx.createAnalyser();
          analyserRef.current.fftSize = 256;
          analyserRef.current.smoothingTimeConstant = 0.8;
        }
        
        // Try to connect audio source
        if (audio && !sourceRef.current) {
          sourceRef.current = ctx.createMediaElementSource(audio);
          sourceRef.current.connect(analyserRef.current);
          analyserRef.current.connect(ctx.destination);
        }
        
        // If no audio source, use fake data for demo
        startVisualization();
        
      } catch (error) {
        console.log("Audio context init error, using demo mode:", error);
        startVisualization();
      }
    };

    initAudio();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isOpen]);

  const startVisualization = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const analyser = analyserRef.current;
    const bufferLength = analyser ? analyser.frequencyBinCount : 64;
    const dataArray = new Uint8Array(bufferLength);

    const draw = () => {
      animationRef.current = requestAnimationFrame(draw);

      // Get frequency data or generate fake data
      if (analyser) {
        analyser.getByteFrequencyData(dataArray);
      } else {
        // Generate fake visualizer data based on playing state
        for (let i = 0; i < dataArray.length; i++) {
          if (isPlaying) {
            dataArray[i] = Math.random() * 200 + 55;
          } else {
            dataArray[i] = Math.max(0, dataArray[i] - 5);
          }
        }
      }

      // Clear canvas
      ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const colors = themes[currentTheme];

      if (visualStyle === 'bars') {
        drawBars(ctx, canvas, dataArray, colors);
      } else if (visualStyle === 'wave') {
        drawWave(ctx, canvas, dataArray, colors);
      } else {
        drawCircle(ctx, canvas, dataArray, colors);
      }
    };

    draw();
  };

  const drawBars = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, dataArray: Uint8Array, colors: string[]) => {
    const barCount = 64;
    const barWidth = canvas.width / barCount - 2;
    const step = Math.floor(dataArray.length / barCount);

    for (let i = 0; i < barCount; i++) {
      const value = dataArray[i * step];
      const barHeight = (value / 255) * canvas.height * 0.8;
      const x = i * (barWidth + 2);
      const y = canvas.height - barHeight;

      // Gradient bar
      const gradient = ctx.createLinearGradient(x, canvas.height, x, y);
      gradient.addColorStop(0, colors[0]);
      gradient.addColorStop(0.5, colors[2]);
      gradient.addColorStop(1, colors[4]);

      ctx.fillStyle = gradient;
      ctx.fillRect(x, y, barWidth, barHeight);

      // Glow effect
      ctx.shadowBlur = 15;
      ctx.shadowColor = colors[2];
    }
  };

  const drawWave = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, dataArray: Uint8Array, colors: string[]) => {
    ctx.lineWidth = 3;
    ctx.strokeStyle = colors[2];
    ctx.shadowBlur = 20;
    ctx.shadowColor = colors[0];

    ctx.beginPath();
    const sliceWidth = canvas.width / dataArray.length;
    let x = 0;

    for (let i = 0; i < dataArray.length; i++) {
      const v = dataArray[i] / 128.0;
      const y = (v * canvas.height) / 2;

      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
      x += sliceWidth;
    }

    ctx.lineTo(canvas.width, canvas.height / 2);
    ctx.stroke();

    // Mirror wave
    ctx.strokeStyle = colors[4];
    ctx.beginPath();
    x = 0;
    for (let i = 0; i < dataArray.length; i++) {
      const v = dataArray[i] / 128.0;
      const y = canvas.height - (v * canvas.height) / 2;

      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
      x += sliceWidth;
    }
    ctx.stroke();
  };

  const drawCircle = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, dataArray: Uint8Array, colors: string[]) => {
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = Math.min(centerX, centerY) * 0.4;

    for (let i = 0; i < dataArray.length; i++) {
      const value = dataArray[i];
      const barHeight = (value / 255) * radius;
      const angle = (i / dataArray.length) * Math.PI * 2;

      const x1 = centerX + Math.cos(angle) * radius;
      const y1 = centerY + Math.sin(angle) * radius;
      const x2 = centerX + Math.cos(angle) * (radius + barHeight);
      const y2 = centerY + Math.sin(angle) * (radius + barHeight);

      const gradient = ctx.createLinearGradient(x1, y1, x2, y2);
      gradient.addColorStop(0, colors[0]);
      gradient.addColorStop(1, colors[4]);

      ctx.strokeStyle = gradient;
      ctx.lineWidth = 3;
      ctx.shadowBlur = 10;
      ctx.shadowColor = colors[2];

      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    }

    // Center circle
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius * 0.3, 0, Math.PI * 2);
    ctx.fillStyle = `${colors[0]}40`;
    ctx.fill();
    ctx.strokeStyle = colors[0];
    ctx.lineWidth = 2;
    ctx.stroke();
  };

  if (!isOpen) return null;

  return (
    <div className={`fixed ${isFullscreen ? 'inset-0' : 'bottom-24 right-4 w-96 h-64'} bg-black/95 backdrop-blur-xl z-40 rounded-2xl overflow-hidden border border-zinc-800 shadow-2xl transition-all duration-300`}>
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 p-3 flex items-center justify-between bg-gradient-to-b from-black/80 to-transparent z-10">
        <div className="flex items-center gap-2">
          <Activity className="h-4 w-4 text-emerald-400 animate-pulse" />
          <span className="text-sm font-medium text-white">Audio Visualizer</span>
          {currentSong && (
            <span className="text-xs text-zinc-400 truncate max-w-[150px]">
              • {currentSong.title}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          <Button 
            size="icon" 
            variant="ghost" 
            className="h-7 w-7 text-zinc-400 hover:text-white"
            onClick={() => setIsFullscreen(!isFullscreen)}
          >
            {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </Button>
          <Button 
            size="icon" 
            variant="ghost" 
            className="h-7 w-7 text-zinc-400 hover:text-white"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Canvas */}
      <canvas
        ref={canvasRef}
        width={isFullscreen ? window.innerWidth : 384}
        height={isFullscreen ? window.innerHeight : 256}
        className="w-full h-full"
      />

      {/* Controls */}
      <div className="absolute bottom-0 left-0 right-0 p-3 flex items-center justify-between bg-gradient-to-t from-black/80 to-transparent">
        <div className="flex gap-2">
          {(['bars', 'wave', 'circle'] as const).map((style) => (
            <button
              key={style}
              onClick={() => setVisualStyle(style)}
              className={`px-3 py-1 text-xs rounded-full transition-all ${
                visualStyle === style 
                  ? 'bg-emerald-500 text-black font-bold' 
                  : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
              }`}
            >
              {style.charAt(0).toUpperCase() + style.slice(1)}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          {(Object.keys(themes) as (keyof typeof themes)[]).map((theme) => (
            <button
              key={theme}
              onClick={() => setCurrentTheme(theme)}
              className={`w-6 h-6 rounded-full border-2 transition-all ${
                currentTheme === theme ? 'border-white scale-110' : 'border-transparent'
              }`}
              style={{ background: `linear-gradient(135deg, ${themes[theme][0]}, ${themes[theme][4]})` }}
              title={theme}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default AudioVisualizer;
