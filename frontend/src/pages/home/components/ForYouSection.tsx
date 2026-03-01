/**
 * Smart AI Recommendations - Spotify/YouTube Music style
 * Generates personalized mixes, discover sections, and mood-based playlists
 */

import { useEffect, useState, useCallback } from "react";
import { usePlayerStore } from "@/stores/usePlayerStore";
import { useMusicStore } from "@/stores/useMusicStore";
import { Sparkles, Brain, Clock, TrendingUp, RefreshCw, Play, Loader2, Radio, Disc3, Headphones, Music2, Zap, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import toast from "react-hot-toast";

// Related artists map - when user listens to one, suggest similar
const RELATED_ARTISTS: Record<string, string[]> = {
  "Arijit Singh": ["Atif Aslam", "Jubin Nautiyal", "B Praak", "Darshan Raval", "Vishal Mishra"],
  "Atif Aslam": ["Arijit Singh", "Rahat Fateh Ali Khan", "Ali Zafar", "Mustafa Zahid"],
  "Diljit Dosanjh": ["AP Dhillon", "Karan Aujla", "Sidhu Moose Wala", "Guru Randhawa"],
  "AP Dhillon": ["Diljit Dosanjh", "Karan Aujla", "Shubh", "Imran Khan"],
  "Karan Aujla": ["AP Dhillon", "Diljit Dosanjh", "Sidhu Moose Wala", "Ammy Virk"],
  "Badshah": ["Honey Singh", "Raftaar", "Divine", "King"],
  "Honey Singh": ["Badshah", "Raftaar", "Ikka", "Bohemia"],
  "The Weeknd": ["Post Malone", "Drake", "Travis Scott", "Dua Lipa"],
  "Drake": ["The Weeknd", "Travis Scott", "Future", "21 Savage"],
  "Taylor Swift": ["Olivia Rodrigo", "Billie Eilish", "Dua Lipa", "Ariana Grande"],
  "Ed Sheeran": ["Charlie Puth", "Shawn Mendes", "Sam Smith", "Lewis Capaldi"],
  "Billie Eilish": ["Olivia Rodrigo", "Lorde", "Aurora", "Halsey"],
  "BTS": ["Blackpink", "Stray Kids", "Seventeen", "NewJeans"],
  "Eminem": ["50 Cent", "Dr. Dre", "Kendrick Lamar", "NF"],
  "Coldplay": ["Imagine Dragons", "OneRepublic", "Maroon 5", "The Chainsmokers"],
  "Alan Walker": ["Marshmello", "Avicii", "Martin Garrix", "Kygo"],
  "Shreya Ghoshal": ["Sunidhi Chauhan", "Neha Kakkar", "Palak Muchhal", "Tulsi Kumar"],
  "Neha Kakkar": ["Shreya Ghoshal", "Dhvani Bhanushali", "Asees Kaur", "Tulsi Kumar"],
  "Nav Haryanvi": ["Masoom Sharma", "Raju Punjabi", "Sapna Choudhary", "Gulzaar Chhaniwala"],
};

// Genre categories for discovery
const GENRE_MIXES = [
  { name: "Bollywood Hits", query: "bollywood hits 2025 latest", gradient: "from-pink-600 to-rose-500", icon: Heart },
  { name: "Punjabi Fire", query: "latest punjabi songs 2025", gradient: "from-orange-500 to-amber-500", icon: Zap },
  { name: "Chill Vibes", query: "chill lofi hindi songs", gradient: "from-cyan-600 to-teal-500", icon: Headphones },
  { name: "Hip Hop", query: "indian hip hop rap 2025", gradient: "from-purple-600 to-violet-500", icon: Disc3 },
  { name: "Party Mix", query: "party songs hindi 2025 dance", gradient: "from-red-600 to-pink-500", icon: Music2 },
  { name: "Workout", query: "workout motivation songs hindi", gradient: "from-green-600 to-emerald-500", icon: TrendingUp },
  { name: "Sad Songs", query: "sad heartbreak songs hindi 2025", gradient: "from-blue-600 to-indigo-500", icon: Heart },
  { name: "English Pop", query: "top english pop songs 2025", gradient: "from-yellow-500 to-orange-500", icon: Radio },
  { name: "Romantic", query: "romantic love songs hindi latest", gradient: "from-rose-500 to-pink-400", icon: Heart },
  { name: "Old Gold", query: "90s bollywood hits best songs", gradient: "from-amber-600 to-yellow-500", icon: Sparkles },
  { name: "Haryanvi", query: "latest haryanvi songs 2025 hits", gradient: "from-lime-600 to-green-500", icon: Music2 },
  { name: "K-Pop", query: "kpop trending songs 2025", gradient: "from-fuchsia-500 to-pink-500", icon: Sparkles },
];

interface SmartRec {
  title: string;
  subtitle: string;
  query: string;
  type: "artist-mix" | "mood" | "discover" | "genre";
  gradient: string;
  icon: any;
}

const ForYouSection = () => {
  const { listeningHistory, getTopArtists, setQueue, setCurrentSong, setIsPlaying } = usePlayerStore();
  const { searchSongs, searchResults, isLoading } = useMusicStore();
  const [smartRecs, setSmartRecs] = useState<SmartRec[]>([]);
  const [activeQuery, setActiveQuery] = useState<string | null>(null);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return "Good morning";
    if (hour >= 12 && hour < 17) return "Good afternoon";
    if (hour >= 17 && hour < 21) return "Good evening";
    return "Good night";
  };

  // build smart recommendations
  const buildRecommendations = useCallback(() => {
    const topArtists = getTopArtists();
    const hour = new Date().getHours();
    const recs: SmartRec[] = [];

    // 1. Artist-based Daily Mixes (like Spotify)
    topArtists.slice(0, 3).forEach((artist, i) => {
      const related = RELATED_ARTISTS[artist] || [];
      const mixArtists = related.slice(0, 2).join(", ");
      recs.push({
        title: `Daily Mix ${i + 1}`,
        subtitle: `${artist}, ${mixArtists}`,
        query: `${artist} ${related[0] || ""} songs mix`,
        type: "artist-mix",
        gradient: i === 0 ? "from-orange-600 to-red-500" : i === 1 ? "from-blue-600 to-purple-500" : "from-teal-500 to-cyan-500",
        icon: Disc3,
      });
    });

    // 2. "Because you listened to X" recommendation
    if (listeningHistory.length > 0) {
      const lastArtist = listeningHistory[0]?.artist;
      if (lastArtist) {
        const related = RELATED_ARTISTS[lastArtist];
        if (related && related.length > 0) {
          const suggestion = related[Math.floor(Math.random() * related.length)];
          recs.push({
            title: `Because you listened to ${lastArtist}`,
            subtitle: `Try ${suggestion}`,
            query: `${suggestion} best songs`,
            type: "discover",
            gradient: "from-purple-600 to-pink-500",
            icon: Brain,
          });
        }
      }
    }

    // 3. Time-based mood mix
    let moodMix: SmartRec;
    if (hour >= 5 && hour < 9) {
      moodMix = { title: "Morning Boost", subtitle: "Start your day right", query: "morning motivational hindi songs 2025", type: "mood", gradient: "from-yellow-500 to-orange-400", icon: Sparkles };
    } else if (hour >= 9 && hour < 12) {
      moodMix = { title: "Focus Flow", subtitle: "Deep work mode", query: "focus study music lofi beats", type: "mood", gradient: "from-blue-500 to-indigo-500", icon: Brain };
    } else if (hour >= 12 && hour < 17) {
      moodMix = { title: "Afternoon Chill", subtitle: "Relax and unwind", query: "chill afternoon bollywood songs", type: "mood", gradient: "from-green-500 to-teal-500", icon: Clock };
    } else if (hour >= 17 && hour < 21) {
      moodMix = { title: "Evening Vibes", subtitle: "Wind down", query: "evening romantic hindi songs", type: "mood", gradient: "from-orange-500 to-rose-500", icon: Headphones };
    } else {
      moodMix = { title: "Late Night", subtitle: "Night owl mode", query: "late night lofi chill songs", type: "mood", gradient: "from-indigo-600 to-purple-600", icon: Clock };
    }
    recs.push(moodMix);

    // 4. Trending mix
    recs.push({
      title: "Trending Now",
      subtitle: "What everyone's listening to",
      query: "trending songs india 2025 viral",
      type: "genre",
      gradient: "from-red-500 to-orange-500",
      icon: TrendingUp,
    });

    // 5. Discover Weekly (random genre the user hasn't explored)
    const randomGenre = GENRE_MIXES[Math.floor(Math.random() * GENRE_MIXES.length)];
    recs.push({
      title: `Discover: ${randomGenre.name}`,
      subtitle: "Something new for you",
      query: randomGenre.query,
      type: "discover",
      gradient: randomGenre.gradient,
      icon: Radio,
    });

    setSmartRecs(recs.slice(0, 6));
  }, [listeningHistory, getTopArtists]);

  useEffect(() => {
    buildRecommendations();
  }, [buildRecommendations]);

  // play when results arrive
  useEffect(() => {
    if (activeQuery && searchResults.length > 0 && !isLoading) {
      setQueue(searchResults);
      setCurrentSong(searchResults[0]);
      setIsPlaying(true);
      toast.success(`Playing: ${searchResults[0].title}`, { icon: "🎵", duration: 2000 });
      setActiveQuery(null);
    }
  }, [searchResults, isLoading, activeQuery]);

  const playRec = async (query: string) => {
    if (isLoading) return;
    setActiveQuery(query);
    toast.loading("Finding songs...", { id: "loading-rec" });
    try {
      await searchSongs(query);
      toast.dismiss("loading-rec");
    } catch {
      toast.error("Failed to load", { id: "loading-rec" });
      setActiveQuery(null);
    }
  };

  const playGenre = async (mix: typeof GENRE_MIXES[0]) => {
    if (isLoading) return;
    setActiveQuery(mix.query);
    toast.loading(`Loading ${mix.name}...`, { id: "loading-rec" });
    try {
      await searchSongs(mix.query);
      toast.dismiss("loading-rec");
    } catch {
      toast.error("Failed to load", { id: "loading-rec" });
      setActiveQuery(null);
    }
  };

  return (
    <div className="mb-10 space-y-8">
      {/* Smart Mixes Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-orange-500 to-pink-500 rounded-lg">
              <Brain className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold">{getGreeting()} 👋 Made For You</h2>
              <p className="text-sm text-neutral-500">AI-powered recommendations based on your taste</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={buildRecommendations}
            disabled={isLoading}
            className="text-neutral-400 hover:text-white"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>

        {/* Recommendation Cards - Spotify style horizontal scroll */}
        <div className="flex gap-4 overflow-x-auto pb-2 no-scrollbar">
          {smartRecs.map((rec, i) => {
            const Icon = rec.icon;
            return (
              <button
                key={i}
                onClick={() => playRec(rec.query)}
                disabled={isLoading}
                className="flex-shrink-0 w-44 group relative overflow-hidden rounded-xl transition-all duration-300 hover:scale-105 disabled:opacity-50"
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${rec.gradient} opacity-90`} />
                <div className="relative p-4 h-48 flex flex-col justify-between text-left">
                  <div className="flex items-center justify-between">
                    <div className="p-1.5 bg-white/20 rounded-lg backdrop-blur-sm">
                      <Icon className="h-4 w-4 text-white" />
                    </div>
                    {activeQuery === rec.query ? (
                      <Loader2 className="h-5 w-5 text-white animate-spin" />
                    ) : (
                      <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm">
                        <Play className="h-4 w-4 text-white fill-white" />
                      </div>
                    )}
                  </div>
                  <div>
                    <p className="text-white font-bold text-sm leading-tight mb-1">{rec.title}</p>
                    <p className="text-white/70 text-xs line-clamp-2">{rec.subtitle}</p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Browse Genres - like Spotify/YouTube Music */}
      <div>
        <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
          <Radio className="h-5 w-5 text-orange-400" />
          Quick Picks
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {GENRE_MIXES.slice(0, 8).map((mix) => {
            const Icon = mix.icon;
            return (
              <button
                key={mix.name}
                onClick={() => playGenre(mix)}
                disabled={isLoading}
                className={`group flex items-center gap-3 p-3 rounded-xl bg-gradient-to-r ${mix.gradient} 
									hover:scale-[1.02] transition-all duration-200 disabled:opacity-50 text-left`}
              >
                <Icon className="h-5 w-5 text-white/80 flex-shrink-0" />
                <span className="text-white font-semibold text-sm truncate">{mix.name}</span>
                {activeQuery === mix.query ? (
                  <Loader2 className="h-4 w-4 text-white animate-spin ml-auto flex-shrink-0" />
                ) : (
                  <Play className="h-4 w-4 text-white/60 ml-auto opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Listening Stats */}
      {listeningHistory.length > 0 && (
        <div className="flex items-center gap-4 text-xs text-neutral-500">
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {listeningHistory.length} songs in history
          </span>
          <span className="flex items-center gap-1">
            <TrendingUp className="h-3 w-3" />
            {getTopArtists().length} favorite artists
          </span>
        </div>
      )}
    </div>
  );
};

export default ForYouSection;
