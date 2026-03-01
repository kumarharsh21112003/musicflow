/**
 * Smart AI Recommendations - Premium
 * Personalized mixes with cover images, genre Quick Picks
 */

import { useEffect, useState, useCallback } from "react";
import { usePlayerStore } from "@/stores/usePlayerStore";
import { useMusicStore } from "@/stores/useMusicStore";
import { Brain, RefreshCw, Play, Loader2, Radio, Disc3, Headphones, Music2, Zap, Heart, TrendingUp, Clock, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import toast from "react-hot-toast";

// Related artists map
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

// Cover images for mixes
const MIX_COVERS = [
  "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=300",
  "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=300",
  "https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=300",
  "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=300",
  "https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=300",
  "https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=300",
];

// Genre categories with images
const GENRE_MIXES = [
  { name: "Bollywood Hits", query: "bollywood hits 2025 latest", gradient: "from-pink-600 to-rose-500", icon: Heart, img: "https://images.unsplash.com/photo-1598387846148-47e82ee120cc?w=200" },
  { name: "Punjabi Fire", query: "latest punjabi songs 2025", gradient: "from-orange-500 to-amber-500", icon: Zap, img: "https://images.unsplash.com/photo-1504898770365-14faca6a7320?w=200" },
  { name: "Chill Vibes", query: "chill lofi hindi songs", gradient: "from-cyan-600 to-teal-500", icon: Headphones, img: "https://images.unsplash.com/photo-1487180144351-b8472da7d491?w=200" },
  { name: "Hip Hop", query: "indian hip hop rap 2025", gradient: "from-purple-600 to-violet-500", icon: Disc3, img: "https://images.unsplash.com/photo-1571330735066-03aaa9429d89?w=200" },
  { name: "Party Mix", query: "party songs hindi 2025 dance", gradient: "from-red-600 to-pink-500", icon: Music2, img: "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=200" },
  { name: "Workout", query: "workout motivation songs hindi", gradient: "from-green-600 to-emerald-500", icon: TrendingUp, img: "https://images.unsplash.com/photo-1534258936925-c58bed479fcb?w=200" },
  { name: "Sad Songs", query: "sad heartbreak songs hindi 2025", gradient: "from-blue-600 to-indigo-500", icon: Heart, img: "https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=200" },
  { name: "English Pop", query: "top english pop songs 2025", gradient: "from-yellow-500 to-orange-500", icon: Radio, img: "https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=200" },
];

interface SmartRec {
  title: string;
  subtitle: string;
  query: string;
  coverImg: string;
  gradient: string;
}

// Daily rotation algorithm — seeded shuffle based on date
const getDaySeed = (): number => {
  const today = new Date();
  const dateStr = `${today.getFullYear()}-${today.getMonth()}-${today.getDate()}`;
  let hash = 0;
  for (let i = 0; i < dateStr.length; i++) {
    hash = ((hash << 5) - hash) + dateStr.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
};

// Seeded random number generator
const seededRandom = (seed: number, index: number): number => {
  const x = Math.sin(seed + index) * 10000;
  return x - Math.floor(x);
};

// Shuffle array with seed (same seed = same order, different day = different order)
const seededShuffle = <T,>(arr: T[], seed: number): T[] => {
  const shuffled = [...arr];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(seededRandom(seed, i) * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

// Daily variation keywords to make search results fresh
const DAILY_KEYWORDS = ['new', 'best', 'top', 'latest', 'trending', 'popular', 'hit'];
const getDailyKeyword = (): string => {
  const seed = getDaySeed();
  return DAILY_KEYWORDS[seed % DAILY_KEYWORDS.length];
};

const ForYouSection = () => {
  const { listeningHistory, getTopArtists, setQueue, setCurrentSong, setIsPlaying } = usePlayerStore();
  const { searchSongs, searchResults, isLoading } = useMusicStore();
  const [smartRecs, setSmartRecs] = useState<SmartRec[]>([]);
  const [activeQuery, setActiveQuery] = useState<string | null>(null);

  const buildRecommendations = useCallback(() => {
    const topArtists = getTopArtists();
    const hour = new Date().getHours();
    const recs: SmartRec[] = [];

    // 1. Artist Daily Mixes
    topArtists.slice(0, 3).forEach((artist, i) => {
      const related = RELATED_ARTISTS[artist] || [];
      const mixArtists = related.slice(0, 2).join(", ");
      recs.push({
        title: `Daily Mix ${i + 1}`,
        subtitle: `${artist}, ${mixArtists}`,
        query: `${artist} ${related[0] || ""} songs mix`,
        coverImg: MIX_COVERS[i],
        gradient: i === 0 ? "from-orange-600/80 to-red-600/80" : i === 1 ? "from-blue-600/80 to-purple-600/80" : "from-teal-500/80 to-cyan-600/80",
      });
    });

    // 2. "Because you listened to X"
    if (listeningHistory.length > 0) {
      const lastArtist = listeningHistory[0]?.artist;
      if (lastArtist) {
        const related = RELATED_ARTISTS[lastArtist];
        if (related && related.length > 0) {
          const suggestion = related[Math.floor(Math.random() * related.length)];
          recs.push({
            title: `Because you like ${lastArtist}`,
            subtitle: `Try ${suggestion} and more`,
            query: `${suggestion} best songs`,
            coverImg: MIX_COVERS[3],
            gradient: "from-purple-600/80 to-pink-600/80",
          });
        }
      }
    }

    // 3. Time-based mood
    if (hour >= 5 && hour < 12) {
      recs.push({ title: "Morning Boost", subtitle: "Start your day right", query: "morning motivational hindi songs 2025", coverImg: MIX_COVERS[4], gradient: "from-yellow-500/80 to-orange-500/80" });
    } else if (hour >= 12 && hour < 17) {
      recs.push({ title: "Afternoon Chill", subtitle: "Relax & unwind", query: "chill afternoon bollywood songs", coverImg: MIX_COVERS[4], gradient: "from-green-500/80 to-teal-500/80" });
    } else if (hour >= 17 && hour < 21) {
      recs.push({ title: "Evening Vibes", subtitle: "Wind down with music", query: "evening romantic hindi songs", coverImg: MIX_COVERS[4], gradient: "from-orange-500/80 to-rose-500/80" });
    } else {
      recs.push({ title: "Late Night", subtitle: "Night owl mode", query: "late night lofi chill songs", coverImg: MIX_COVERS[4], gradient: "from-indigo-600/80 to-purple-600/80" });
    }

    // 4. Trending
    recs.push({ title: "Trending Now 🔥", subtitle: "What India is playing", query: "trending songs india 2025 viral", coverImg: MIX_COVERS[5], gradient: "from-red-500/80 to-orange-500/80" });

    setSmartRecs(recs.slice(0, 8));
  }, [listeningHistory, getTopArtists]);

  useEffect(() => { buildRecommendations(); }, [buildRecommendations]);

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

  // Apply daily rotation to all sections
  const daySeed = getDaySeed();
  const dailyWord = getDailyKeyword();

  // Extra recommendation sections data — shuffled daily
  const DISCOVER_WEEKLY = seededShuffle([
    { title: "Discover Weekly", subtitle: "New music, just for you", query: `new indie songs 2025 ${dailyWord}`, img: "https://images.unsplash.com/photo-1506157786151-b8491531f063?w=300", gradient: "from-green-600/80 to-emerald-500/80" },
    { title: "Release Radar", subtitle: "Catch the latest drops", query: `new releases hindi songs 2025 ${dailyWord}`, img: "https://images.unsplash.com/photo-1526142684086-16ce9e5c9bd3?w=300", gradient: "from-blue-600/80 to-cyan-500/80" },
    { title: "On Repeat", subtitle: "Songs you can't stop playing", query: `most played hindi songs 2025 ${dailyWord}`, img: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300", gradient: "from-violet-600/80 to-purple-500/80" },
    { title: "Repeat Rewind", subtitle: "Past favorites comeback", query: `old hindi songs remix 2024 ${dailyWord}`, img: "https://images.unsplash.com/photo-1483412033650-1015ddeb83d1?w=300", gradient: "from-amber-600/80 to-orange-500/80" },
    { title: "Blend Mix", subtitle: "Music that brings people together", query: `popular party songs india 2025 ${dailyWord}`, img: "https://images.unsplash.com/photo-1429962714451-bb934ecdc4ec?w=300", gradient: "from-pink-600/80 to-rose-500/80" },
    { title: "Fresh Finds", subtitle: "Emerging artists you'll love", query: `new artists hindi indie 2025 ${dailyWord}`, img: "https://images.unsplash.com/photo-1460723237483-7a6dc9d0b212?w=300", gradient: "from-teal-600/80 to-green-500/80" },
    { title: "Acoustic Session", subtitle: "Unplugged & raw", query: `acoustic unplugged hindi songs ${dailyWord}`, img: "https://images.unsplash.com/photo-1510915361894-db8b60106cb1?w=300", gradient: "from-yellow-600/80 to-amber-500/80" },
    { title: "Retro Classics", subtitle: "Golden era vibes", query: `90s hindi songs classic retro ${dailyWord}`, img: "https://images.unsplash.com/photo-1415201364774-f6f0bb35f28f?w=300", gradient: "from-rose-700/80 to-red-500/80" },
  ], daySeed);

  const MOOD_PLAYLISTS = seededShuffle([
    { name: "💆 Relax", query: `relaxing calm hindi songs ${dailyWord}`, img: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200", gradient: "from-teal-600 to-cyan-500" },
    { name: "🔥 Energy", query: `high energy workout gym songs ${dailyWord}`, img: "https://images.unsplash.com/photo-1534258936925-c58bed479fcb?w=200", gradient: "from-red-600 to-orange-500" },
    { name: "💜 Romance", query: `romantic love songs hindi 2025 ${dailyWord}`, img: "https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=200", gradient: "from-pink-600 to-rose-500" },
    { name: "🎉 Party", query: `party dance songs bollywood ${dailyWord}`, img: "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=200", gradient: "from-purple-600 to-violet-500" },
    { name: "😔 Sad", query: `sad emotional songs hindi ${dailyWord}`, img: "https://images.unsplash.com/photo-1499084732479-de2c02d45fcc?w=200", gradient: "from-blue-700 to-indigo-600" },
    { name: "🌙 Sleep", query: `sleep lofi instrumental calm ${dailyWord}`, img: "https://images.unsplash.com/photo-1489549132488-d00b7eee80f1?w=200", gradient: "from-indigo-700 to-slate-700" },
    { name: "☀️ Happy", query: `happy upbeat bollywood feel good ${dailyWord}`, img: "https://images.unsplash.com/photo-1506157786151-b8491531f063?w=200", gradient: "from-yellow-500 to-amber-500" },
    { name: "🎸 Rock", query: `rock songs hindi english ${dailyWord}`, img: "https://images.unsplash.com/photo-1498038432885-c6f3f1b912ee?w=200", gradient: "from-gray-700 to-zinc-600" },
    { name: "🎵 Sufi", query: `sufi songs best qawwali ${dailyWord}`, img: "https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=200", gradient: "from-emerald-700 to-teal-600" },
    { name: "🎤 Karaoke", query: `karaoke songs hindi popular sing along ${dailyWord}`, img: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=200", gradient: "from-fuchsia-600 to-pink-500" },
  ], daySeed + 1);

  const NEW_RELEASES = seededShuffle([
    { title: "Today's Hits", subtitle: "Updated daily", query: `today new hindi songs 2025 ${dailyWord}`, img: "https://images.unsplash.com/photo-1614680376593-902f74cf0d41?w=300", gradient: "from-emerald-600/80 to-green-500/80" },
    { title: "New In Bollywood", subtitle: "Fresh from the studios", query: `latest bollywood songs 2025 ${dailyWord}`, img: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=300", gradient: "from-rose-600/80 to-pink-500/80" },
    { title: "Punjabi New", subtitle: "Latest Punjabi drops", query: `new punjabi songs 2025 ${dailyWord}`, img: "https://images.unsplash.com/photo-1504898770365-14faca6a7320?w=300", gradient: "from-amber-600/80 to-yellow-500/80" },
    { title: "Global Top 50", subtitle: "World's most played", query: `global top 50 songs 2025 ${dailyWord}`, img: "https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=300", gradient: "from-sky-600/80 to-blue-500/80" },
    { title: "Viral Hits", subtitle: "Trending on social media", query: `viral reels songs 2025 ${dailyWord}`, img: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=300", gradient: "from-fuchsia-600/80 to-pink-500/80" },
    { title: "Throwback Hits", subtitle: "Nostalgic gems", query: `best old hindi songs evergreen ${dailyWord}`, img: "https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=300", gradient: "from-orange-600/80 to-red-500/80" },
    { title: "Indie Spotlight", subtitle: "Independent artists shine", query: `indie music india 2025 ${dailyWord}`, img: "https://images.unsplash.com/photo-1460723237483-7a6dc9d0b212?w=300", gradient: "from-lime-600/80 to-green-500/80" },
    { title: "Devotional", subtitle: "Spiritual peace", query: `devotional songs hindi bhajan ${dailyWord}`, img: "https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=300", gradient: "from-orange-700/80 to-amber-600/80" },
  ], daySeed + 2);

  return (
    <div className="mb-10 space-y-10">
      {/* 1. Made For You - AI Personalized */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-orange-500 to-pink-500 rounded-lg">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Made For You</h2>
              <p className="text-sm text-neutral-500">Based on your recent listening</p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={buildRecommendations} disabled={isLoading} className="text-neutral-400 hover:text-white">
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
        <div className="flex gap-4 overflow-x-auto pb-2 no-scrollbar">
          {smartRecs.map((rec, i) => (
            <button key={i} onClick={() => playRec(rec.query)} disabled={isLoading} className="flex-shrink-0 w-44 group relative overflow-hidden rounded-xl transition-all duration-300 hover:scale-105 disabled:opacity-50">
              <div className="relative h-44 w-full">
                <img src={rec.coverImg} alt={rec.title} className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                <div className={`absolute inset-0 bg-gradient-to-t ${rec.gradient} via-transparent to-transparent`} />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                <div className="absolute bottom-3 right-3 w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center text-white shadow-lg opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300">
                  {activeQuery === rec.query ? <Loader2 className="h-5 w-5 animate-spin" /> : <Play className="h-5 w-5 fill-white" />}
                </div>
              </div>
              <div className="p-3 text-left bg-neutral-900/50">
                <p className="text-sm font-bold text-white truncate">{rec.title}</p>
                <p className="text-xs text-neutral-400 truncate mt-0.5">{rec.subtitle}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* 2. Quick Picks - Genre */}
      <div>
        <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
          <Radio className="h-5 w-5 text-orange-400" />
          Quick Picks
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {GENRE_MIXES.map((mix) => {
            const Icon = mix.icon;
            return (
              <button key={mix.name} onClick={() => playRec(mix.query)} disabled={isLoading} className="group relative h-16 rounded-xl overflow-hidden hover:scale-[1.02] transition-all disabled:opacity-50">
                <img src={mix.img} alt={mix.name} className="absolute inset-0 w-full h-full object-cover" />
                <div className={`absolute inset-0 bg-gradient-to-r ${mix.gradient} opacity-85`} />
                <div className="relative flex items-center gap-3 h-full px-4">
                  <Icon className="h-5 w-5 text-white/90 flex-shrink-0" />
                  <span className="text-white font-bold text-sm truncate">{mix.name}</span>
                  {activeQuery === mix.query ? (
                    <Loader2 className="h-4 w-4 text-white animate-spin ml-auto flex-shrink-0" />
                  ) : (
                    <Play className="h-4 w-4 text-white/60 ml-auto opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Discover Weekly */}
      <div>
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-gradient-to-br from-green-500 to-teal-500 rounded-lg">
            <Brain className="h-5 w-5 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold">Discover Weekly</h2>
            <p className="text-sm text-neutral-500">Fresh picks every Monday</p>
          </div>
        </div>
        <div className="flex gap-4 overflow-x-auto pb-2 no-scrollbar">
          {DISCOVER_WEEKLY.map((item, i) => (
            <button key={i} onClick={() => playRec(item.query)} disabled={isLoading} className="flex-shrink-0 w-44 group relative overflow-hidden rounded-xl transition-all duration-300 hover:scale-105 disabled:opacity-50">
              <div className="relative h-44 w-full">
                <img src={item.img} alt={item.title} className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                <div className={`absolute inset-0 bg-gradient-to-t ${item.gradient} via-transparent to-transparent`} />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                <div className="absolute bottom-3 right-3 w-10 h-10 bg-green-500 rounded-full flex items-center justify-center text-white shadow-lg opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300">
                  {activeQuery === item.query ? <Loader2 className="h-5 w-5 animate-spin" /> : <Play className="h-5 w-5 fill-white" />}
                </div>
              </div>
              <div className="p-3 text-left bg-neutral-900/50">
                <p className="text-sm font-bold text-white truncate">{item.title}</p>
                <p className="text-xs text-neutral-400 truncate mt-0.5">{item.subtitle}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* 4. Mood Radio */}
      <div>
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg">
            <Headphones className="h-5 w-5 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold">Mood Radio</h2>
            <p className="text-sm text-neutral-500">Music for every feeling</p>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {MOOD_PLAYLISTS.map((mood) => (
            <button key={mood.name} onClick={() => playRec(mood.query)} disabled={isLoading} className="group relative h-20 rounded-xl overflow-hidden hover:scale-[1.02] transition-all disabled:opacity-50">
              <img src={mood.img} alt={mood.name} className="absolute inset-0 w-full h-full object-cover" />
              <div className={`absolute inset-0 bg-gradient-to-r ${mood.gradient} opacity-80`} />
              <div className="relative flex items-center justify-center h-full px-4">
                <span className="text-white font-bold text-base">{mood.name}</span>
                {activeQuery === mood.query && <Loader2 className="h-4 w-4 text-white animate-spin ml-2" />}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* 5. New Releases */}
      <div>
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg">
            <Clock className="h-5 w-5 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold">New Releases</h2>
            <p className="text-sm text-neutral-500">Latest drops for you</p>
          </div>
        </div>
        <div className="flex gap-4 overflow-x-auto pb-2 no-scrollbar">
          {NEW_RELEASES.map((item, i) => (
            <button key={i} onClick={() => playRec(item.query)} disabled={isLoading} className="flex-shrink-0 w-44 group relative overflow-hidden rounded-xl transition-all duration-300 hover:scale-105 disabled:opacity-50">
              <div className="relative h-44 w-full">
                <img src={item.img} alt={item.title} className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                <div className={`absolute inset-0 bg-gradient-to-t ${item.gradient} via-transparent to-transparent`} />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                <div className="absolute bottom-3 right-3 w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white shadow-lg opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300">
                  {activeQuery === item.query ? <Loader2 className="h-5 w-5 animate-spin" /> : <Play className="h-5 w-5 fill-white" />}
                </div>
              </div>
              <div className="p-3 text-left bg-neutral-900/50">
                <p className="text-sm font-bold text-white truncate">{item.title}</p>
                <p className="text-xs text-neutral-400 truncate mt-0.5">{item.subtitle}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* 6. Charts */}
      <div>
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-gradient-to-br from-red-500 to-orange-500 rounded-lg">
            <TrendingUp className="h-5 w-5 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold">Charts</h2>
            <p className="text-sm text-neutral-500">What's trending right now</p>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {[
            { name: "Top India", query: "top songs india 2025 charts", gradient: "from-orange-600 to-red-500", emoji: "🇮🇳" },
            { name: "Top Global", query: "top global songs 2025 worldwide hits", gradient: "from-blue-600 to-purple-500", emoji: "🌍" },
            { name: "Top Bollywood", query: "top bollywood songs 2025 charts", gradient: "from-pink-600 to-rose-500", emoji: "🎬" },
            { name: "Top Punjabi", query: "top punjabi songs 2025 charts bhangra", gradient: "from-amber-600 to-yellow-500", emoji: "🎤" },
            { name: "Top Hip Hop", query: "top hip hop rap songs 2025 india", gradient: "from-gray-700 to-zinc-600", emoji: "🎤" },
            { name: "Top EDM", query: "top edm electronic dance songs 2025", gradient: "from-cyan-600 to-teal-500", emoji: "🎧" },
          ].map((chart) => (
            <button key={chart.name} onClick={() => playRec(chart.query)} disabled={isLoading} className={`group relative h-24 rounded-xl overflow-hidden hover:scale-[1.02] transition-all disabled:opacity-50 bg-gradient-to-br ${chart.gradient}`}>
              <div className="relative flex flex-col items-start justify-end h-full p-4">
                <span className="text-2xl mb-1">{chart.emoji}</span>
                <span className="text-white font-bold text-sm">{chart.name}</span>
              </div>
              <div className="absolute top-3 right-3 w-8 h-8 bg-white/20 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                {activeQuery === chart.query ? <Loader2 className="h-4 w-4 text-white animate-spin" /> : <Play className="h-4 w-4 text-white fill-white" />}
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ForYouSection;
