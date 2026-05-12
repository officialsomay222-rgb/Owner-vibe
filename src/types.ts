export interface Song {
  videoId: string;
  title: string;
  artist: string;
  thumbnailUrl: string;
  duration?: string;
  streamUrl?: string;
}

export interface SearchResultItem {
  type: 'song' | 'album' | 'artist' | 'playlist' | 'video';
  id: string; // videoId, browseId, or playlistId
  title: string;
  artist: string;
  thumbnailUrl: string;
  duration?: string;
}
