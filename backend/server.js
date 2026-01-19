import express from 'express';
import cors from 'cors';
import ytsr from 'ytsr';
import ytdl from '@distube/ytdl-core';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());

// 🚀 In-memory cache with longer duration
const cache = new Map();
const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes

const getFromCache = (key) => {
    const cached = cache.get(key);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
        return cached.data;
    }
    return null;
};

const setCache = (key, data) => {
    cache.set(key, { data, timestamp: Date.now() });
};

const parseDuration = (duration) => {
    if (!duration) return 240;
    const parts = duration.split(':').map(Number);
    if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
    if (parts.length === 2) return parts[0] * 60 + parts[1];
    return 240;
};

// Health check - fast response
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', uptime: process.uptime(), cache: cache.size });
});

// Search songs
app.get('/api/search', async (req, res) => {
    try {
        const query = req.query.q;
        if (!query) return res.json([]);

        const cacheKey = `search:${query.toLowerCase()}`;
        const cached = getFromCache(cacheKey);
        if (cached) {
            console.log(`⚡ Cache: ${query}`);
            return res.json(cached);
        }

        console.log(`🔍 Search: ${query}`);
        const results = await ytsr(query + ' song', { limit: 12 });
        const songs = results.items
            .filter(item => item.type === 'video')
            .slice(0, 10)
            .map(item => ({
                _id: item.id,
                id: item.id,
                title: item.title,
                artist: item.author?.name || 'Unknown',
                videoId: item.id,
                imageUrl: item.bestThumbnail?.url || `https://i.ytimg.com/vi/${item.id}/mqdefault.jpg`,
                duration: parseDuration(item.duration),
            }));
        
        setCache(cacheKey, songs);
        console.log(`✅ Found ${songs.length}`);
        res.json(songs);
    } catch (error) {
        console.error('❌ Search error:', error.message);
        res.json([]);
    }
});

// Artists songs - optimized with parallel + limit
app.post('/api/artists-songs', async (req, res) => {
    try {
        const { artists } = req.body;
        if (!artists || !artists.length) return res.json([]);

        const cacheKey = `artists:${artists.slice(0,5).sort().join(',')}`;
        const cached = getFromCache(cacheKey);
        if (cached) {
            console.log(`⚡ Cache: artists`);
            return res.json(cached);
        }

        console.log(`🎤 Artists: ${artists.slice(0,3).join(', ')}...`);
        
        // Only fetch 3 artists max for speed
        const promises = artists.slice(0, 3).map(async (artist) => {
            try {
                const results = await ytsr(artist + ' songs', { limit: 4 });
                return results.items
                    .filter(item => item.type === 'video')
                    .slice(0, 3)
                    .map(item => ({
                        _id: item.id,
                        id: item.id,
                        title: item.title,
                        artist: item.author?.name || artist,
                        videoId: item.id,
                        imageUrl: item.bestThumbnail?.url || `https://i.ytimg.com/vi/${item.id}/mqdefault.jpg`,
                        duration: parseDuration(item.duration),
                    }));
            } catch (e) {
                return [];
            }
        });

        const results = await Promise.all(promises);
        const allSongs = results.flat();
        
        setCache(cacheKey, allSongs);
        console.log(`✅ Total: ${allSongs.length}`);
        res.json(allSongs);
    } catch (error) {
        console.error('❌ Artists error:', error.message);
        res.json([]);
    }
});

// Trending - with fallback
app.get('/api/trending', async (req, res) => {
    try {
        const cached = getFromCache('trending');
        if (cached) {
            console.log('⚡ Cache: trending');
            return res.json(cached);
        }

        console.log('🔥 Fetching Trending...');
        const results = await ytsr('trending songs 2024', { limit: 12 });
        const songs = results.items
            .filter(item => item.type === 'video')
            .slice(0, 10)
            .map(item => ({
                _id: item.id,
                id: item.id,
                title: item.title,
                artist: item.author?.name || 'Unknown',
                videoId: item.id,
                imageUrl: item.bestThumbnail?.url || `https://i.ytimg.com/vi/${item.id}/mqdefault.jpg`,
                duration: parseDuration(item.duration),
            }));
        
        setCache('trending', songs);
        console.log(`✅ Trending: ${songs.length} songs`);
        res.json(songs);
    } catch (error) {
        console.error('❌ Trending error:', error.message);
        // Return empty but don't crash
        res.json([]);
    }
});

// Stream audio with optimization and Range support
app.get('/api/stream/:videoId', async (req, res) => {
    try {
        const { videoId } = req.params;
        const range = req.headers.range;
        
        const info = await ytdl.getInfo(videoId);
        const format = ytdl.chooseFormat(info.formats, { 
            filter: 'audioonly', 
            quality: 'highestaudio' 
        });

        if (!format) throw new Error('No audio format found');
        
        const totalSize = parseInt(format.contentLength);

        if (range) {
            const parts = range.replace(/bytes=/, "").split("-");
            const start = parseInt(parts[0], 10);
            const end = parts[1] ? parseInt(parts[1], 10) : totalSize - 1;
            const chunksize = (end - start) + 1;

            res.writeHead(206, {
                'Content-Range': `bytes ${start}-${end}/${totalSize}`,
                'Accept-Ranges': 'bytes',
                'Content-Length': chunksize,
                'Content-Type': 'audio/mpeg',
                'Cache-Control': 'public, max-age=3600',
            });

            const stream = ytdl(videoId, { 
                format: format,
                range: { start, end },
                highWaterMark: 1 << 25,
                dlChunkSize: 0
            });
            stream.pipe(res);
        } else {
            res.writeHead(200, {
                'Content-Length': totalSize,
                'Content-Type': 'audio/mpeg',
                'Accept-Ranges': 'bytes',
                'Cache-Control': 'public, max-age=3600',
            });

            const stream = ytdl(videoId, { 
                format: format,
                highWaterMark: 1 << 25,
                dlChunkSize: 0
            });
            stream.pipe(res);
        }
    } catch (error) {
        console.error('❌ Stream error:', error.message);
        if (!res.headersSent) res.status(500).send('Streaming failed: ' + error.message);
    }
});

// Global error handler
app.use((err, req, res, next) => {
    console.error('💥 Server error:', err.message);
    res.status(500).json({ error: 'Server error' });
});

// Prevent crashes
process.on('uncaughtException', (err) => {
    console.error('💥 Uncaught:', err.message);
});

process.on('unhandledRejection', (err) => {
    console.error('💥 Unhandled:', err?.message || err);
});

const PORT = parseInt(process.env.PORT) || 3002;

app.listen(PORT, '0.0.0.0', () => {
    console.log(`\n🎵 MusicFlow Backend Ready!`);
    console.log(`   URL: http://localhost:${PORT}`);
    console.log(`   Mode: ${process.env.NODE_ENV || 'development'}`);
});
