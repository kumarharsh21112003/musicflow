import { Router } from "express";
import ytdl from "@distube/ytdl-core";

const router = Router();

// Stream audio from YouTube video
router.get("/:videoId", async (req, res) => {
    try {
        const { videoId } = req.params;
        
        if (!videoId) {
            return res.status(400).json({ error: "Video ID required" });
        }

        const url = `https://www.youtube.com/watch?v=${videoId}`;
        
        // Check if video is valid
        if (!ytdl.validateID(videoId)) {
            return res.status(400).json({ error: "Invalid video ID" });
        }

        // Get video info to extract duration
        const info = await ytdl.getInfo(url);
        const format = ytdl.chooseFormat(info.formats, { 
            quality: 'highestaudio',
            filter: 'audioonly'
        });

        // Set headers for streaming
        res.setHeader('Content-Type', 'audio/mpeg');
        res.setHeader('Accept-Ranges', 'bytes');
        
        if (format.contentLength) {
            res.setHeader('Content-Length', format.contentLength);
        }

        // Stream the audio
        const stream = ytdl(url, {
            quality: 'highestaudio',
            filter: 'audioonly',
        });

        stream.on('error', (err) => {
            console.error('Stream error:', err);
            if (!res.headersSent) {
                res.status(500).json({ error: 'Streaming failed' });
            }
        });

        stream.pipe(res);

    } catch (error) {
        console.error('Stream error:', error);
        if (!res.headersSent) {
            res.status(500).json({ error: 'Failed to stream audio' });
        }
    }
});

export default router;
