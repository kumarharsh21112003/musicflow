/**
 * AI-Powered Music Recommendation Engine
 * Uses smart algorithms for recommendations based on:
 * - Listening history
 * - Artist preferences
 * - Time of day
 * - Mood detection
 */

interface ListeningData {
  artist: string;
  title: string;
  playedAt: number;
  genre?: string;
}

class AIRecommendationEngine {
  private artistWeights: Map<string, number> = new Map();
  private timePreferences: Map<number, string[]> = new Map();

  // Analyze listening history and build preferences
  analyzeHistory(history: ListeningData[]) {
    this.artistWeights.clear();
    
    history.forEach((item, index) => {
      const recencyBoost = 1 + (history.length - index) / history.length;
      const currentWeight = this.artistWeights.get(item.artist) || 0;
      this.artistWeights.set(item.artist, currentWeight + recencyBoost);
      
      const hour = new Date(item.playedAt).getHours();
      const timeSlot = Math.floor(hour / 4);
      if (!this.timePreferences.has(timeSlot)) {
        this.timePreferences.set(timeSlot, []);
      }
      this.timePreferences.get(timeSlot)?.push(item.artist);
    });
    
    console.log('📊 Analyzed history:', {
      uniqueArtists: this.artistWeights.size,
      totalPlays: history.length
    });
  }

  // Get top preferred artists
  getTopArtists(limit: number = 5): string[] {
    const sorted = [...this.artistWeights.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit);
    return sorted.map(([artist]) => artist);
  }

  // Get current mood based on time of day
  getCurrentMood(): { mood: string; genres: string[] } {
    const hour = new Date().getHours();
    
    if (hour >= 5 && hour < 9) {
      return { mood: 'morning_energy', genres: ['pop', 'upbeat', 'motivational'] };
    } else if (hour >= 9 && hour < 12) {
      return { mood: 'focus', genres: ['lofi', 'instrumental', 'ambient'] };
    } else if (hour >= 12 && hour < 17) {
      return { mood: 'afternoon_chill', genres: ['pop', 'indie', 'acoustic'] };
    } else if (hour >= 17 && hour < 21) {
      return { mood: 'evening_vibes', genres: ['rnb', 'soul', 'jazz'] };
    } else if (hour >= 21 || hour < 2) {
      return { mood: 'night_owl', genres: ['lofi', 'chill', 'electronic'] };
    } else {
      return { mood: 'late_night', genres: ['ambient', 'sleep', 'relaxing'] };
    }
  }

  // Generate smart search queries based on preferences
  generateSearchQueries(): string[] {
    const queries: string[] = [];
    const topArtists = this.getTopArtists(3);
    const { genres } = this.getCurrentMood();
    
    topArtists.forEach(artist => {
      queries.push(`${artist} top songs`);
      queries.push(`songs like ${artist}`);
    });
    
    genres.forEach(genre => {
      queries.push(`${genre} music ${new Date().getFullYear()}`);
    });
    
    return queries.slice(0, 8);
  }

  // Get personalized greeting based on time and listening habits
  getPersonalizedGreeting(): { greeting: string; suggestions: string[] } {
    const hour = new Date().getHours();
    const topArtists = this.getTopArtists(2);
    const { mood } = this.getCurrentMood();
    
    let greeting = '';
    if (hour >= 5 && hour < 12) {
      greeting = 'Good morning! ☀️';
    } else if (hour >= 12 && hour < 17) {
      greeting = 'Good afternoon! 🌤️';
    } else if (hour >= 17 && hour < 21) {
      greeting = 'Good evening! 🌆';
    } else {
      greeting = 'Hello night owl! 🌙';
    }
    
    const suggestions: string[] = [];
    if (topArtists.length > 0) {
      suggestions.push(`Continue with ${topArtists[0]}`);
    }
    
    switch (mood) {
      case 'morning_energy':
        suggestions.push('Energetic morning playlist');
        break;
      case 'focus':
        suggestions.push('Focus & productivity mix');
        break;
      case 'afternoon_chill':
        suggestions.push('Chill afternoon vibes');
        break;
      case 'evening_vibes':
        suggestions.push('Evening wind-down');
        break;
      case 'night_owl':
        suggestions.push('Late night lo-fi');
        break;
      default:
        suggestions.push('Relaxing ambient sounds');
    }
    
    return { greeting, suggestions };
  }
}

export const aiRecommendationEngine = new AIRecommendationEngine();
