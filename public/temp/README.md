# Temporary Images Storage

This folder stores uploaded images temporarily.

## Auto Cleanup
- Images older than 7 days are automatically deleted
- See `/api/cleanup-images` endpoint for cleanup logic
- Configure auto-cleanup in `vercel.json` or use cron jobs

## Usage
- Images uploaded via `/api/upload-image`
- Public URL: `https://your-domain.com/temp/filename.jpg`
- Max file size: 5MB per image
