/**
 * AI-Powered "For You" Recommendations Component
 * Shows personalized song recommendations based on listening history
 */

import { useEffect, useState } from "react";
import { usePlayerStore } from "@/stores/usePlayerStore";
import { useMusicStore } from "@/stores/useMusicStore";
import { Sparkles, Brain, Clock, TrendingUp, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Recommendation {
  query: string;
  reason: string;
  icon: React.ReactNode;
}

const ForYouSection = () => {
  const { listeningHistory, getTopArtists, setQueue } = usePlayerStore();
  const { searchSongs, searchResults, isLoading } = useMusicStore();
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [greeting, setGreeting] = useState("");
  const [loadingRecs, setLoadingRecs] = useState(false);

  // Get personalized greeting based on time
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return "Good morning! ☀️";
    if (hour >= 12 && hour < 17) return "Good afternoon! 🌤️";
    if (hour >= 17 && hour < 21) return "Good evening! 🌆";
    return "Hello night owl! 🌙";
  };

  // Get mood-based recommendations
  const getMoodBasedQueries = () => {
    const hour = new Date().getHours();
    
    if (hour >= 5 && hour < 9) {
      return [
        { query: "morning motivational songs 2024", reason: "Perfect for your morning energy", icon: <Sparkles className="h-4 w-4" /> },
        { query: "upbeat workout music hindi", reason: "Start your day active", icon: <TrendingUp className="h-4 w-4" /> }
      ];
    } else if (hour >= 9 && hour < 12) {
      return [
        { query: "focus music instrumental", reason: "Boost your productivity", icon: <Brain className="h-4 w-4" /> },
        { query: "lofi hip hop beats", reason: "Concentrate better", icon: <Clock className="h-4 w-4" /> }
      ];
    } else if (hour >= 12 && hour < 17) {
      return [
        { query: "chill bollywood songs", reason: "Afternoon relaxation", icon: <Sparkles className="h-4 w-4" /> },
        { query: "indie pop music 2024", reason: "Discover new vibes", icon: <TrendingUp className="h-4 w-4" /> }
      ];
    } else if (hour >= 17 && hour < 21) {
      return [
        { query: "evening chill songs hindi", reason: "Wind down your day", icon: <Clock className="h-4 w-4" /> },
        { query: "romantic songs bollywood", reason: "Evening mood", icon: <Sparkles className="h-4 w-4" /> }
      ];
    } else {
      return [
        { query: "late night hindi songs", reason: "Night owl vibes", icon: <Clock className="h-4 w-4" /> },
        { query: "lofi chill night music", reason: "Relax before sleep", icon: <Brain className="h-4 w-4" /> }
      ];
    }
  };

  // Generate recommendations based on history and time
  useEffect(() => {
    setGreeting(getGreeting());
    
    const topArtists = getTopArtists();
    const moodRecs = getMoodBasedQueries();
    const allRecs: Recommendation[] = [...moodRecs];
    
    // Add artist-based recommendations
    if (topArtists.length > 0) {
      allRecs.unshift({
        query: `${topArtists[0]} latest songs`,
        reason: `Because you love ${topArtists[0]}`,
        icon: <Sparkles className="h-4 w-4 text-emerald-400" />
      });
      
      if (topArtists.length > 1) {
        allRecs.push({
          query: `songs like ${topArtists[0]} ${topArtists[1]}`,
          reason: "Based on your favorites",
          icon: <Brain className="h-4 w-4 text-purple-400" />
        });
      }
    }
    
    // Add trending recommendation
    allRecs.push({
      query: "trending songs india 2024",
      reason: "What's hot right now",
      icon: <TrendingUp className="h-4 w-4 text-orange-400" />
    });
    
    setRecommendations(allRecs.slice(0, 6));
  }, [listeningHistory]);

  // Play a recommendation
  const playRecommendation = async (query: string) => {
    setLoadingRecs(true);
    try {
      await searchSongs(query);
      // searchResults will be updated in the store, we'll use effect to handle it
    } catch (error) {
      console.error("Failed to load recommendation:", error);
    }
    setLoadingRecs(false);
  };

  // Set queue when search results change
  useEffect(() => {
    if (searchResults.length > 0 && loadingRecs === false) {
      setQueue(searchResults);
    }
  }, [searchResults]);

  // Refresh recommendations
  const refreshRecommendations = () => {
    setGreeting(getGreeting());
    const moodRecs = getMoodBasedQueries();
    const topArtists = getTopArtists();
    const shuffled = [...moodRecs].sort(() => Math.random() - 0.5);
    
    if (topArtists.length > 0) {
      shuffled.unshift({
        query: `${topArtists[Math.floor(Math.random() * topArtists.length)]} top songs`,
        reason: "Your favorite artist",
        icon: <Sparkles className="h-4 w-4 text-emerald-400" />
      });
    }
    
    setRecommendations(shuffled.slice(0, 6));
  };

  return (
    <div className="mb-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-br from-emerald-500 to-cyan-500 rounded-lg">
            <Brain className="h-5 w-5 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold">{greeting} Made For You</h2>
            <p className="text-sm text-zinc-400">AI-powered recommendations based on your taste</p>
          </div>
        </div>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={refreshRecommendations}
          className="text-zinc-400 hover:text-white"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${loadingRecs ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Recommendation Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {recommendations.map((rec, index) => (
          <button
            key={index}
            onClick={() => playRecommendation(rec.query)}
            disabled={loadingRecs || isLoading}
            className="group p-4 bg-zinc-800/50 hover:bg-zinc-700/50 rounded-xl transition-all duration-300 
                       border border-transparent hover:border-emerald-500/30 text-left
                       hover:shadow-lg hover:shadow-emerald-500/10"
          >
            <div className="flex items-center gap-2 mb-2">
              {rec.icon}
              <span className="text-xs text-zinc-500 group-hover:text-emerald-400 transition-colors">
                AI Pick
              </span>
            </div>
            <p className="text-sm font-medium text-white mb-1 line-clamp-2">
              {rec.query.split(' ').slice(0, 4).join(' ')}...
            </p>
            <p className="text-xs text-zinc-500 line-clamp-1">
              {rec.reason}
            </p>
          </button>
        ))}
      </div>

      {/* History Stats */}
      {listeningHistory.length > 0 && (
        <div className="mt-4 flex items-center gap-4 text-xs text-zinc-500">
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
