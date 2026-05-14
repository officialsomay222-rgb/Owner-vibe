import yt_dlp
import json
import os

def extract_info(video_id, preferred_format='bestaudio[ext=m4a]/bestaudio/best'):
    ydl_opts = {
        'format': preferred_format,
        'quiet': True,
        'no_warnings': True,
        'simulate': True,
        'skip_download': True,
    }

    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(f"https://www.youtube.com/watch?v={video_id}", download=False)
            return json.dumps({
                'url': info.get('url'),
                'title': info.get('title')
            })
    except Exception as e:
        return json.dumps({'error': str(e)})

def search(query, limit=15):
    ydl_opts = {
        'quiet': True,
        'no_warnings': True,
        'extract_flat': True,
    }

    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(f"ytsearch{limit}:{query}", download=False)
            entries = info.get('entries', [])

            results = []
            for entry in entries:
                if not entry.get('id') or not entry.get('title'):
                    continue

                thumbnails = entry.get('thumbnails', [])
                thumbnail_url = thumbnails[-1].get('url', '') if thumbnails else ''

                duration = entry.get('duration')
                duration_str = ''
                if duration:
                    m, s = divmod(int(duration), 60)
                    h, m = divmod(m, 60)
                    if h > 0:
                        duration_str = f"{h}:{m:02d}:{s:02d}"
                    else:
                        duration_str = f"{m}:{s:02d}"

                results.append({
                    'id': entry.get('id'),
                    'title': entry.get('title'),
                    'artist': entry.get('channel') or entry.get('uploader') or 'Unknown Artist',
                    'type': 'song',
                    'thumbnailUrl': thumbnail_url,
                    'duration': duration_str
                })

            return json.dumps(results)
    except Exception as e:
        return json.dumps({'error': str(e)})

def download_audio(video_id, download_dir, preferred_format='bestaudio[ext=m4a]/bestaudio/best'):
    ydl_opts = {
        'format': preferred_format,
        'quiet': True,
        'no_warnings': True,
        'outtmpl': os.path.join(download_dir, '%(id)s.%(ext)s'),
    }

    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(f"https://www.youtube.com/watch?v={video_id}", download=True)
            file_path = ydl.prepare_filename(info)
            return json.dumps({
                'filePath': file_path
            })
    except Exception as e:
        return json.dumps({'error': str(e)})
