/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { useState, useEffect, useRef } from 'react';
import { 
    Home, Search, Library, Settings, MoreVertical, 
    Share2, CircleHelp, History, ArrowUpLeft, 
    Plus, Heart, Plane, Download, ArrowDown, ListFilter,
    Palette, ListVideo, Music, Download as DownloadIcon, HardDrive, LayoutGrid, Info, ChevronDown, X, Play
} from 'lucide-react';

// Mock Data
const discoverSongs = [
  { id: 1, title: 'KAMALI (Ultra Slowe...', artist: 'Akhmedov', img: 'https://images.unsplash.com/photo-1614624532983-4ce03382d63d?auto=format&fit=crop&q=80&w=150' },
  { id: 2, title: 'EL CONTROL (Ultra ...', artist: 'M4GN', img: 'https://images.unsplash.com/photo-1542281286-9e0a16bb7366?auto=format&fit=crop&q=80&w=150' },
  { id: 3, title: 'Sem Tempo (Super S...', artist: 'SCARIONIX', img: 'https://images.unsplash.com/photo-1518609878373-06d740f60d8b?auto=format&fit=crop&q=80&w=150' },
  { id: 4, title: 'Sem Tempo', artist: 'SCARIONIX', img: 'https://images.unsplash.com/photo-1493225457124-a1a2b534dda4?auto=format&fit=crop&q=80&w=150' },
  { id: 5, title: 'MONTAGEM - PR...', artist: 'SCARIONIX', img: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=150' },
];

const recommendedPlaylists = [
  { id: 1, title: 'Short', subtitle: 'Playlist • Oogway', img: 'https://images.unsplash.com/photo-1619983081563-430f63602796?auto=format&fit=crop&q=80&w=300' },
  { id: 2, title: 'no batidao 🤩 phonk', subtitle: 'Playlist • Gary', img: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&q=80&w=300' },
  { id: 3, title: 'New Music Malayalam', subtitle: 'Playlist • Y...', img: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&q=80&w=300' },
];

const scarionixAlbums = [
  { id: 1, img: 'https://images.unsplash.com/photo-1621360841013-c76831f1e35d?auto=format&fit=crop&q=80&w=200' },
  { id: 2, img: 'https://images.unsplash.com/photo-1557672172-298e090bd0f1?auto=format&fit=crop&q=80&w=200' },
  { id: 3, img: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&q=80&w=200' },
];

const searchHistory = [
    "South movie",
    "Pk movie",
    "dil pe zakham khate hain",
    "Indila",
    "sem tempo",
    "Ari ari punk",
    "Ari ari",
    "Aah aah porn",
    "montagem perigosa",
    "Iun na praca"
];

const Header = ({ isVisible }: { isVisible: boolean }) => (
  <header className={`fixed top-0 inset-x-0 z-50 flex items-center justify-between px-5 py-4 bg-black/60 backdrop-blur-[40px] transition-transform duration-500 ease-out border-b border-white/[0.05] light:bg-white/80 light:border-black/5 ${isVisible ? 'translate-y-0' : '-translate-y-full'}`}>
    <div className="flex items-center space-x-1 pl-1">
      <div className="flex items-baseline">
        <span className="text-[24px] font-bold tracking-widest text-[#f0f0f0] drop-shadow-sm font-serif light:text-gray-900 transition-colors">❍Ꮿꪀꫀ𝚁</span>
        <span className="text-[20px] ml-[2px] font-bold tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-[#f0f0f0] to-[#a0a0a0] light:from-gray-900 light:to-gray-500 drop-shadow-sm font-serif italic text-shadow-sm transition-colors">'s Vibe</span>
      </div>
      <div className="flex items-center justify-center relative translate-y-[1px] ml-1.5" id="verifiedOwnerTick">
        <div className="absolute inset-0 bg-yellow-500/25 blur-[5px] rounded-full scale-110"></div>
        <svg className="relative z-10 drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)] light:drop-shadow-[0_1px_2px_rgba(0,0,0,0.2)]" viewBox="0 0 24 24" width="22" height="22" fill="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
                <linearGradient id="goldGrad" x1="0" y1="0" x2="24" y2="24" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#FFF2B2" />
                <stop offset="25%" stopColor="#FFD35B" />
                <stop offset="50%" stopColor="#F6C343" />
                <stop offset="75%" stopColor="#E2A621" />
                <stop offset="100%" stopColor="#B37C11" />
                </linearGradient>
            </defs>
            <path d="M11.236 1.439a1.705 1.705 0 0 1 1.528 0l1.79.93a1.71 1.71 0 0 0 1.258.125l1.921-.611a1.705 1.705 0 0 1 2.115 1.155l.56 1.942a1.71 1.71 0 0 0 1.011 1.144l1.868.76a1.705 1.705 0 0 1 .917 2.235l-.837 1.841a1.71 1.71 0 0 0 0 1.265l.837 1.842a1.705 1.705 0 0 1-.917 2.234l-1.87.76a1.71 1.71 0 0 0-1.01 1.144l-.56 1.943a1.705 1.705 0 0 1-2.115 1.154l-1.921-.61a1.708 1.708 0 0 0-1.258.124l-1.79.932a1.705 1.705 0 0 1-1.528 0l-1.79-.932a1.708 1.708 0 0 0-1.258-.124l-1.921.61a1.705 1.705 0 0 1-2.115-1.154l-.56-1.943a1.71 1.71 0 0 0-1.01-1.144l-1.87-.76a1.705 1.705 0 0 1-.918-2.234l.838-1.842a1.71 1.71 0 0 0 0-1.265l-.838-1.841a1.705 1.705 0 0 1 .918-2.235l1.869-.76a1.71 1.71 0 0 0 1.012-1.144l.56-1.942a1.705 1.705 0 0 1 2.115-1.155l1.921.611c.412.13.86-.01 1.258-.125l1.79-.93Z" fill="url(#goldGrad)" stroke="#8A6104" strokeWidth="0.5"/>
            <path d="M10.25 15.5l-3.25-3.25 1.06-1.06 2.19 2.19 5.44-5.44 1.06 1.06-6.5 6.5z" fill="#0A0A0A" stroke="#0A0A0A" strokeWidth="0.5"/>
        </svg>
      </div>
    </div>
    
    <div className="flex items-center space-x-6 text-gray-300 light:text-gray-600">
      <CircleHelp className="w-6 h-6 hover:text-white light:hover:text-black hover:scale-110 transition-all cursor-pointer" />
      <Share2 className="w-[22px] h-[22px] hover:text-white light:hover:text-black hover:scale-110 transition-all cursor-pointer" />
    </div>
  </header>
);

const HomeTab = () => (
    <div className="flex flex-col pt-[84px] pb-32 px-5 space-y-12 animate-in fade-in duration-500">
        <section>
            <h2 className="text-[28px] font-extrabold text-white/95 light:text-gray-900 transition-colors mb-6 tracking-tight pl-1">Discover</h2>
            <div className="flex flex-col space-y-3">
                {discoverSongs.map((song) => (
                    <div key={song.id} className="flex items-center justify-between p-3 rounded-[20px] bg-white/[0.01] light:bg-black/[0.01] border border-white/[0.03] hover:border-white/[0.08] light:border-black/[0.03] light:hover:border-black/[0.08] hover:bg-white/[0.04] light:hover:bg-black/[0.03] group cursor-pointer active:scale-[0.98] transition-all duration-300 ease-out shadow-[0_4px_20px_rgba(0,0,0,0.2)] light:shadow-[0_2px_10px_rgba(0,0,0,0.02)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.4)] light:hover:shadow-[0_4px_15px_rgba(0,0,0,0.05)]">
                        <div className="flex items-center space-x-4">
                            <div className="relative overflow-hidden rounded-[16px] shadow-[0_8px_20px_rgba(0,0,0,0.5)] light:shadow-sm border border-white/[0.04] light:border-black/[0.04]">
                                <img src={song.img} alt={song.title} className="w-[60px] h-[60px] object-cover transition-transform duration-500 group-hover:scale-110" loading="lazy" />
                                <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                                    <Play className="w-6 h-6 text-white fill-white ml-0.5 drop-shadow-md" />
                                </div>
                            </div>
                            <div className="flex flex-col">
                                <span className="text-white/95 light:text-gray-900 transition-colors text-[16px] font-bold tracking-wide leading-tight line-clamp-1 mb-1">{song.title}</span>
                                <span className="text-[#888] light:text-gray-500 transition-colors text-[13px] font-medium tracking-wide line-clamp-1 group-hover:text-[#aaa] light:group-hover:text-gray-700">{song.artist}</span>
                            </div>
                        </div>
                        <button className="text-[#555] light:text-gray-400 transition-colors group-hover:text-white light:group-hover:text-black p-2 bg-white/[0.02] light:bg-black/[0.02] hover:bg-white/[0.08] light:hover:bg-black/[0.06] rounded-full active:scale-90">
                            <MoreVertical className="w-5 h-5" />
                        </button>
                    </div>
                ))}
            </div>
        </section>

        <section>
            <h2 className="text-[22px] font-bold text-white/95 light:text-gray-900 transition-colors mb-6 tracking-tight pl-1">Recommended playlists</h2>
            <div className="flex overflow-x-auto space-x-5 no-scrollbar pb-6 -mx-5 px-5 snap-x">
                {recommendedPlaylists.map(playlist => (
                     <div key={playlist.id} className="flex-none p-3.5 rounded-[24px] bg-gradient-to-b from-white/[0.04] to-white/[0.01] light:from-white light:to-gray-50 border border-white/[0.06] light:border-black/5 hover:border-white/[0.1] light:hover:border-black/10 w-[170px] snap-start cursor-pointer hover:-translate-y-1 active:scale-95 transition-all duration-300 shadow-[0_8px_30px_rgba(0,0,0,0.4)] light:shadow-[0_4px_20px_rgba(0,0,0,0.06)] hover:shadow-[0_12px_40px_rgba(0,0,0,0.5)] light:hover:shadow-[0_8px_25px_rgba(0,0,0,0.1)] group">
                         <div className="relative mb-4 rounded-[16px] overflow-hidden shadow-[0_8px_20px_rgba(0,0,0,0.6)] light:shadow-sm">
                            <img src={playlist.img} alt={playlist.title} className="w-full aspect-square object-cover transition-transform duration-700 group-hover:scale-105" loading="lazy" />
                            <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-2 justify-end">
                                <div className="w-10 h-10 bg-[#00d2ff] rounded-full flex items-center justify-center shadow-lg translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300 delay-100">
                                    <Play className="w-5 h-5 text-black fill-black ml-0.5" />
                                </div>
                            </div>
                         </div>
                         <h3 className="text-white/95 light:text-gray-900 transition-colors font-bold text-[15px] line-clamp-2 leading-snug tracking-wide px-1">{playlist.title}</h3>
                         <p className="text-[#777] light:text-gray-500 transition-colors font-medium text-[12px] mt-1.5 truncate px-1">{playlist.subtitle}</p>
                     </div>
                ))}
            </div>
        </section>

        <section>
            <h2 className="text-[17px] font-bold text-white/70 light:text-gray-500 transition-colors uppercase mb-5 tracking-[0.2em] pl-1">SCARIONIX</h2>
            <div className="flex overflow-x-auto space-x-6 no-scrollbar pb-4 -mx-5 px-5 snap-x">
                {scarionixAlbums.map(album => (
                    <div key={album.id} className="relative flex-none w-[150px] aspect-square rounded-[24px] overflow-hidden shadow-[0_8px_24px_rgba(0,0,0,0.6)] light:shadow-md snap-start cursor-pointer active:scale-95 hover:shadow-[0_16px_40px_rgba(255,255,255,0.06)] light:hover:shadow-lg border-2 border-white/[0.04] light:border-black/5 hover:border-white/[0.15] light:hover:border-black/15 transition-all duration-300 group">
                        <img src={album.img} alt="Album" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" loading="lazy" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 light:from-black/60 via-transparent to-transparent opacity-80 group-hover:opacity-100 transition-opacity flex items-end p-3">
                             <div className="w-full flex justify-between items-center opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300">
                                <span className="text-white text-xs font-bold tracking-wider">PLAY</span>
                                <Play className="w-4 h-4 text-white fill-white" />
                             </div>
                        </div>
                    </div>
                ))}
            </div>
        </section>
    </div>
);

const SearchTab = () => (
    <div className="flex flex-col pt-[84px] pb-32 px-5 animate-in fade-in duration-500">
        <h2 className="text-[28px] font-extrabold text-white/95 light:text-gray-900 transition-colors mb-8 tracking-tight pl-1">Search</h2>
        <div className="relative mb-8 group">
            <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none">
                <Search className="w-5 h-5 text-[#888] group-focus-within:text-[#00d2ff] light:text-gray-500 light:group-focus-within:text-blue-500 transition-colors duration-300" />
            </div>
            <input 
                type="text" 
                placeholder="Songs, Playlist, Album or Artist" 
                className="w-full bg-white/[0.02] light:bg-black/[0.02] border-2 border-white/[0.05] light:border-black/5 rounded-[20px] outline-none text-white light:text-gray-900 py-4 pl-[52px] pr-4 text-[16px] placeholder-[#666] light:placeholder-gray-400 focus:border-[#00d2ff]/50 light:focus:border-blue-500/50 focus:bg-white/[0.04] light:focus:bg-black/[0.04] shadow-inner light:shadow-sm focus:shadow-[0_0_20px_rgba(0,210,255,0.1)] light:focus:shadow-[0_0_20px_rgba(59,130,246,0.1)] transition-all duration-300 font-medium tracking-wide"
                autoFocus
            />
            <div className="absolute inset-y-0 right-4 flex items-center">
                <div className="bg-white/[0.05] light:bg-black/[0.05] p-1.5 rounded-lg border border-white/[0.05] light:border-black/[0.05]">
                    <ListFilter className="w-4 h-4 text-[#888] light:text-gray-500" />
                </div>
            </div>
        </div>
        
        <div className="flex items-center justify-between mb-4 pl-1">
            <h3 className="text-[14px] font-bold text-white/60 light:text-gray-500 uppercase tracking-widest">Recent Searches</h3>
            <button className="text-[12px] font-bold text-[#00d2ff] light:text-blue-500 hover:text-white light:hover:text-blue-700 transition-colors uppercase tracking-wider">Clear</button>
        </div>

        <div className="flex flex-col space-y-1">
            {searchHistory.map((item, i) => (
                <div key={i} className="flex items-center justify-between p-3.5 rounded-[16px] hover:bg-white/[0.03] light:hover:bg-black/[0.03] active:bg-white/[0.05] light:active:bg-black/[0.05] group cursor-pointer transition-all duration-300">
                    <div className="flex items-center space-x-4">
                        <History className="w-[18px] h-[18px] text-[#555] light:text-gray-400 group-hover:text-white light:group-hover:text-black transition-colors" />
                        <span className="text-[16px] text-[#ccc] light:text-gray-700 font-medium tracking-wide group-hover:text-white light:group-hover:text-black transition-colors">{item}</span>
                    </div>
                    <div className="flex items-center space-x-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <X className="w-5 h-5 text-[#555] light:text-gray-400 hover:text-red-400 light:hover:text-red-500 transition-colors cursor-pointer" />
                        <ArrowUpLeft className="w-[22px] h-[22px] text-[#555] light:text-gray-400 hover:text-[#00d2ff] light:hover:text-blue-500 transition-colors cursor-pointer" />
                    </div>
                </div>
            ))}
        </div>
    </div>
);

const LibraryTab = () => (
    <div className="flex flex-col pt-[84px] pb-32 px-5 animate-in fade-in duration-500">
        <div className="flex items-center justify-between mb-8 pl-1">
            <h2 className="text-[28px] font-extrabold text-white/95 light:text-gray-900 tracking-tight transition-colors">Library</h2>
            <button className="p-2.5 bg-white/[0.05] light:bg-black/[0.03] border border-white/[0.06] light:border-black/5 rounded-full text-white light:text-gray-900 hover:bg-white/[0.1] light:hover:bg-black/[0.06] active:scale-95 transition-all duration-300 shadow-[0_4px_16px_rgba(0,0,0,0.3)] light:shadow-sm mt-1">
                <Plus className="w-[22px] h-[22px]" />
            </button>
        </div>
        
        <div className="flex space-x-8 border-b border-white/[0.04] light:border-black/[0.06] pb-0 mb-8 overflow-x-auto no-scrollbar pl-1">
            <button className="text-white/95 light:text-gray-900 transition-colors text-[16px] font-bold border-b-[3px] border-[#00d2ff] light:border-blue-500 pb-3 whitespace-nowrap tracking-wide">Playlists</button>
            <button className="text-[#666] light:text-gray-500 text-[16px] font-medium pb-3 whitespace-nowrap hover:text-white light:hover:text-gray-900 transition-colors tracking-wide">Songs</button>
            <button className="text-[#666] light:text-gray-500 text-[16px] font-medium pb-3 whitespace-nowrap hover:text-white light:hover:text-gray-900 transition-colors tracking-wide">Albums</button>
            <button className="text-[#666] light:text-gray-500 text-[16px] font-medium pb-3 whitespace-nowrap hover:text-white light:hover:text-gray-900 transition-colors tracking-wide">Artists</button>
        </div>
        
        <div className="flex items-center justify-between mb-8 pl-1">
            <div className="flex items-center text-[#777] light:text-gray-500 transition-colors space-x-3 text-[13px] bg-white/[0.03] light:bg-black/[0.03] px-3.5 py-1.5 rounded-[12px] border border-white/[0.04] light:border-black/[0.06]">
               <span className="font-medium tracking-wide">11 items</span>
               <div className="w-1 h-1 rounded-full bg-[#555] light:bg-gray-400"></div>
               <span className="font-semibold tracking-wider text-[#aaa] light:text-gray-600">A-Z</span>
            </div>
            <div className="flex items-center space-x-5 text-[#666] light:text-gray-500 transition-colors">
                <ArrowDown className="w-5 h-5 cursor-pointer hover:text-white light:hover:text-black transition-colors" />
                <ListFilter className="w-5 h-5 cursor-pointer hover:text-white light:hover:text-black transition-colors" />
                <Search className="w-5 h-5 cursor-pointer hover:text-white light:hover:text-black transition-colors" />
            </div>
        </div>

        <div className="grid grid-cols-2 gap-5 mb-8">
           <div className="flex flex-col cursor-pointer group">
               <div className="w-full aspect-square bg-gradient-to-br from-orange-500/10 to-orange-500/5 light:from-orange-50 light:to-white rounded-[24px] flex items-center justify-center mb-3.5 border border-orange-500/20 light:border-orange-200/50 shadow-[0_8px_20px_rgba(0,0,0,0.2)] light:shadow-sm group-hover:border-orange-500/40 light:group-hover:border-orange-300 group-active:scale-[0.97] transition-all duration-300 relative overflow-hidden">
                   <div className="absolute inset-0 bg-gradient-to-t from-orange-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                   <History className="w-[42px] h-[42px] text-orange-500 light:text-orange-500 drop-shadow-[0_0_15px_rgba(249,115,22,0.4)] light:drop-shadow-none relative z-10 group-hover:scale-110 transition-transform duration-300" />
               </div>
               <span className="text-white/90 light:text-gray-800 transition-colors text-[14px] font-bold px-2 tracking-wide">Recently Played</span>
           </div>
           <div className="flex flex-col cursor-pointer group">
               <div className="w-full aspect-square bg-gradient-to-br from-rose-500/10 to-rose-500/5 light:from-rose-50 light:to-white rounded-[24px] flex items-center justify-center mb-3.5 border border-rose-500/20 light:border-rose-200/50 shadow-[0_8px_20px_rgba(0,0,0,0.2)] light:shadow-sm group-hover:border-rose-500/40 light:group-hover:border-rose-300 group-active:scale-[0.97] transition-all duration-300 relative overflow-hidden">
                   <div className="absolute inset-0 bg-gradient-to-t from-rose-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                   <Heart className="w-[42px] h-[42px] text-rose-500 light:text-rose-500 fill-rose-500/20 light:fill-rose-500/20 drop-shadow-[0_0_15px_rgba(244,63,94,0.4)] light:drop-shadow-none relative z-10 group-hover:scale-110 transition-transform duration-300" />
               </div>
               <span className="text-white/90 light:text-gray-800 transition-colors text-[14px] font-bold px-2 tracking-wide">Favorites</span>
           </div>
           <div className="flex flex-col cursor-pointer group">
               <div className="w-full aspect-square bg-gradient-to-br from-blue-500/10 to-blue-500/5 light:from-blue-50 light:to-white rounded-[24px] flex items-center justify-center mb-3.5 border border-blue-500/20 light:border-blue-200/50 shadow-[0_8px_20px_rgba(0,0,0,0.2)] light:shadow-sm group-hover:border-blue-500/40 light:group-hover:border-blue-300 group-active:scale-[0.97] transition-all duration-300 relative overflow-hidden">
                   <div className="absolute inset-0 bg-gradient-to-t from-blue-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                   <Plane className="w-[42px] h-[42px] text-blue-500 light:text-blue-500 drop-shadow-[0_0_15px_rgba(59,130,246,0.4)] light:drop-shadow-none relative z-10 group-hover:scale-110 transition-transform duration-300" />
               </div>
               <span className="text-white/90 light:text-gray-800 transition-colors text-[14px] font-bold px-2 tracking-wide">Cached/Offline</span>
           </div>
           <div className="flex flex-col cursor-pointer group">
               <div className="w-full aspect-square bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 light:from-emerald-50 light:to-white rounded-[24px] flex items-center justify-center mb-3.5 border border-emerald-500/20 light:border-emerald-200/50 shadow-[0_8px_20px_rgba(0,0,0,0.2)] light:shadow-sm group-hover:border-emerald-500/40 light:group-hover:border-emerald-300 group-active:scale-[0.97] transition-all duration-300 relative overflow-hidden">
                   <div className="absolute inset-0 bg-gradient-to-t from-emerald-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                   <Download className="w-[42px] h-[42px] text-emerald-500 light:text-emerald-500 drop-shadow-[0_0_15px_rgba(16,185,129,0.4)] light:drop-shadow-none relative z-10 group-hover:scale-110 transition-transform duration-300" />
               </div>
               <span className="text-white/90 light:text-gray-800 transition-colors text-[14px] font-bold px-2 tracking-wide">Downloads</span>
           </div>
        </div>

        <div className="grid grid-cols-2 gap-5">
            <div className="flex flex-col cursor-pointer group">
                <div className="relative w-full aspect-square rounded-[24px] overflow-hidden mb-2 group-active:scale-[0.97] shadow-[0_8px_24px_rgba(0,0,0,0.5)] light:shadow-md border border-white/[0.04] light:border-black/5 hover:border-white/[0.1] light:hover:border-black/10 transition-all duration-300">
                    <img src="https://images.unsplash.com/photo-1543794327-59a91fb815d1?auto=format&fit=crop&q=80&w=200" alt="Playlist" className="object-cover w-full h-full group-hover:scale-110 transition-transform duration-700" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/50 opacity-80 group-hover:opacity-60 transition-opacity"></div>
                    <div className="absolute top-0 left-0 bg-[#e50914] text-white px-3 py-1.5 rounded-br-2xl text-[11px] font-black leading-tight tracking-wider shadow-lg">
                        398<br/>MILLION<br/>VIEWS
                    </div>
                    <div className="absolute bottom-4 right-4 w-10 h-10 bg-[#00d2ff] rounded-full flex items-center justify-center shadow-[0_4px_15px_rgba(0,210,255,0.4)] opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-300">
                        <Play className="w-5 h-5 text-black fill-black ml-0.5" />
                    </div>
                </div>
                <span className="text-white/90 light:text-gray-800 font-bold px-1 text-[15px]">Gym Motivation</span>
            </div>
            <div className="flex flex-col cursor-pointer group">
                <div className="relative w-full aspect-square rounded-[24px] overflow-hidden mb-2 group-active:scale-[0.97] shadow-[0_8px_24px_rgba(0,0,0,0.5)] light:shadow-md border border-white/[0.04] light:border-black/5 hover:border-white/[0.1] light:hover:border-black/10 transition-all duration-300">
                    <img src="https://images.unsplash.com/photo-1598387993441-a364f854c3e1?auto=format&fit=crop&q=80&w=200" alt="Playlist" className="object-cover w-full h-full group-hover:scale-110 transition-transform duration-700" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60 group-hover:opacity-80 transition-opacity"></div>
                    <div className="absolute bottom-4 right-4 w-10 h-10 bg-[#00d2ff] rounded-full flex items-center justify-center shadow-[0_4px_15px_rgba(0,210,255,0.4)] opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-300">
                        <Play className="w-5 h-5 text-black fill-black ml-0.5" />
                    </div>
                </div>
                <span className="text-white/90 light:text-gray-800 font-bold px-1 text-[15px]">Late Night Vibes</span>
            </div>
        </div>
    </div>
);

const SettingsTab = ({ theme, setTheme }: { theme: 'system' | 'dark' | 'light', setTheme: (t: 'system' | 'dark' | 'light') => void }) => {
    const [expandedMenu, setExpandedMenu] = useState<string | null>(null);

    const settingsItems = [
        { id: 'personalisation', icon: Palette, label: 'Personalisation' },
        { id: 'content', icon: ListVideo, label: 'Content' },
        { id: 'music', icon: Music, label: 'Music & Playback' },
        { id: 'download', icon: DownloadIcon, label: 'Download' },
        { id: 'backup', icon: HardDrive, label: 'Backup & Restore' },
        { id: 'misc', icon: LayoutGrid, label: 'Misc' },
        { id: 'info', icon: Info, label: 'App Info' },
    ];

    return (
        <div className="flex flex-col pt-[84px] pb-32 px-5 animate-in fade-in duration-500">
            <h2 className="text-[28px] font-extrabold text-white/95 light:text-gray-900 transition-colors mb-8 tracking-tight pl-1">Settings</h2>
            
            <div className="flex flex-col bg-white/[0.01] border border-white/[0.05] light:bg-white/80 light:border-black/[0.06] rounded-[24px] shadow-lg transition-colors overflow-hidden">
                {settingsItems.map((item, index) => {
                    const Icon = item.icon;
                    const isExpanded = expandedMenu === item.id;
                    return (
                        <div key={item.id} className="flex flex-col">
                            <div 
                                onClick={() => setExpandedMenu(isExpanded ? null : item.id)}
                                className={`flex px-5 py-[20px] items-center justify-between cursor-pointer hover:bg-white/[0.04] active:bg-white/[0.06] light:hover:bg-black/[0.03] light:active:bg-black/[0.05] transition-all duration-300 group ${index !== settingsItems.length - 1 ? 'border-b border-white/[0.03] light:border-black/[0.04]' : ''}`}
                            >
                                <div className="flex items-center space-x-5">
                                    <div className={`p-2 rounded-xl transition-colors duration-300 ${isExpanded ? 'bg-white/[0.1] light:bg-black/[0.05]' : 'bg-transparent group-hover:bg-white/[0.05] light:group-hover:bg-black/[0.03]'}`}>
                                        <Icon className={`w-5 h-5 transition-colors ${isExpanded ? 'text-white light:text-black' : 'text-[#888] group-hover:text-white light:text-gray-500 light:group-hover:text-gray-900'}`} />
                                    </div>
                                    <span className={`text-[16px] font-bold tracking-wide transition-colors ${isExpanded ? 'text-white light:text-black' : 'text-[#eee] light:text-gray-800'}`}>{item.label}</span>
                                </div>
                                <ChevronDown className={`w-5 h-5 text-[#555] group-hover:text-[#888] light:text-gray-400 light:group-hover:text-gray-600 transition-all duration-300 ${isExpanded ? 'rotate-180' : ''}`} />
                            </div>
                            
                            {/* Expandable Theme Switcher inside Personalisation */}
                            <div className={`overflow-hidden transition-all duration-300 ${isExpanded && item.id === 'personalisation' ? 'max-h-[300px] opacity-100 border-b border-white/[0.03] light:border-black/[0.04] bg-white/[0.015] light:bg-black/[0.01]' : 'max-h-0 opacity-0'}`}>
                                <div className="p-6 flex flex-col space-y-5">
                                    <span className="text-[14px] font-bold text-[#888] light:text-gray-500 uppercase tracking-widest pl-1 transition-colors">Theme Appearance</span>
                                    <div className="grid grid-cols-3 gap-4">
                                        {[
                                            { id: 'system', label: 'System', gradients: 'from-gray-500 to-gray-400', shadow: 'shadow-gray-500/20' },
                                            { id: 'light', label: 'Light', gradients: 'from-blue-200 to-white text-gray-900', shadow: 'shadow-blue-200/20' },
                                            { id: 'dark', label: 'Dark', gradients: 'from-neutral-800 to-black text-white', shadow: 'shadow-black/20' }
                                        ].map(tOption => (
                                            <button 
                                                key={tOption.id}
                                                onClick={() => setTheme(tOption.id as any)}
                                                className={`relative flex flex-col items-center justify-center p-4 rounded-[20px] border-[2px] transition-all duration-300 group
                                                    ${theme === tOption.id ? 'border-[#00d2ff] light:border-blue-500 bg-white/[0.05] light:bg-blue-50/50 shadow-[0_4px_20px_rgba(0,210,255,0.2)] light:shadow-[0_4px_20px_rgba(59,130,246,0.15)] -translate-y-1' : 'border-transparent bg-white/[0.02] light:bg-black/[0.02] hover:bg-white/[0.04] light:hover:bg-black/[0.04]'}`}
                                            >
                                                <div className={`w-10 h-10 rounded-full mb-3 shadow-inner bg-gradient-to-tr ${tOption.gradients} border border-white/10 light:border-black/10 flex items-center justify-center ${theme === tOption.id ? `shadow-[0_0_15px_rgba(255,255,255,0.2)] ${tOption.shadow}` : ''}`}>
                                                    {theme === tOption.id && <div className="w-2.5 h-2.5 rounded-full bg-white light:bg-black shadow-[0_0_8px_rgba(255,255,255,0.8)]"></div>}
                                                </div>
                                                <span className={`text-[14px] font-bold tracking-wide transition-colors ${theme === tOption.id ? 'text-white light:text-black' : 'text-[#888] light:text-gray-500'}`}>
                                                    {tOption.label}
                                                </span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )
                })}
            </div>

            <div className="mt-8 bg-gradient-to-br from-[#2a2422]/80 to-[#151211]/80 light:from-amber-50/80 light:to-orange-50/50 rounded-[24px] p-6 border border-[#3e322f] light:border-amber-200/50 shadow-[0_8px_24px_rgba(0,0,0,0.5)] light:shadow-sm flex items-start space-x-5 cursor-pointer hover:border-white/[0.12] light:hover:border-amber-300 hover:shadow-[0_12px_32px_rgba(0,0,0,0.6)] light:hover:shadow-md active:scale-[0.98] transition-all duration-300">
                <div className="bg-[#050505] light:bg-white p-3 rounded-2xl shadow-inner border border-white/[0.04] light:border-black/5 transition-colors">
                    <CircleHelp className="w-6 h-6 text-[#d4af37] light:text-amber-500" />
                </div>
                <div className="flex flex-col">
                    <span className="text-[#f5f5f5] light:text-amber-950 font-bold text-[16px] mb-1.5 tracking-wide transition-colors">Helpful Tutorials</span>
                    <p className="text-[#aaa] light:text-amber-800/80 text-[14px] leading-relaxed transition-colors font-medium">
                        Watch tutorials and learn how to use the app, import playlists from Youtube, and more.
                    </p>
                </div>
            </div>
        </div>
    )
};

export default function App() {
  const [activeTab, setActiveTab] = useState('home');
  const [showHeader, setShowHeader] = useState(true);
  const [theme, setTheme] = useState<'system' | 'dark' | 'light'>('system');
  const lastScrollY = useRef(0);

  useEffect(() => {
    const root = document.documentElement;
    const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    if (theme === 'light' || (theme === 'system' && !isDark)) {
      root.classList.add('light');
    } else {
      root.classList.remove('light');
    }
  }, [theme]);

  // Keep observing system theme if set to 'system'
  useEffect(() => {
    const root = document.documentElement;
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handleChange = (e: MediaQueryListEvent) => {
      if (theme === 'system') {
        if (!e.matches) {
          root.classList.add('light');
        } else {
          root.classList.remove('light');
        }
      }
    };
    
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [theme]);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      if (currentScrollY > lastScrollY.current && currentScrollY > 60) {
        setShowHeader(false);
      } else {
        setShowHeader(true);
      }
      lastScrollY.current = currentScrollY;
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const tabs = [
    { id: 'home', icon: Home, label: 'Home' },
    { id: 'search', icon: Search, label: 'Search' },
    { id: 'custom_play', isCustom: true },
    { id: 'library', icon: Library, label: 'Library' },
    { id: 'settings', icon: Settings, label: 'Settings' }
  ];

  return (
    <div className="min-h-screen bg-[#020202] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-neutral-900/40 via-[#020202] to-[#000] text-[#eaeaea] selection:bg-cyan-500/30 font-sans light:bg-[#f8f9fa] light:from-[#ffffff] light:via-[#f8f9fa] light:to-[#e5e7eb] light:text-gray-900 transition-colors duration-500">
      <Header isVisible={showHeader} />
      
      <main className="w-full max-w-md mx-auto relative min-h-screen overflow-x-hidden pt-1">
        {activeTab === 'home' && <HomeTab />}
        {activeTab === 'search' && <SearchTab />}
        {activeTab === 'library' && <LibraryTab />}
        {activeTab === 'settings' && <SettingsTab theme={theme} setTheme={setTheme} />}
      </main>

      <nav className="fixed bottom-0 inset-x-0 z-50 bg-[#000000]/80 backdrop-blur-[48px] border-t border-white/[0.08] pb-safe pt-2 shadow-[0_-10px_50px_rgba(0,0,0,0.6)] light:bg-white/90 light:border-black/[0.08] light:shadow-[0_-5px_30px_rgba(0,0,0,0.08)] transition-colors duration-500">
        <div className="flex items-center justify-around h-[70px] pointer-events-auto max-w-md mx-auto px-2 relative">
          {tabs.map((tab) => {
            if (tab.isCustom) {
              return (
                <button key="center-play" className="flex flex-col items-center justify-center -mt-12 group focus:outline-none outline-none relative z-10 w-20">
                  <div className="relative flex items-center justify-center w-[68px] h-[68px] rounded-full bg-gradient-to-tr from-[#00d2ff] via-[#3a7bd5] to-[#8a2be2] shadow-[0_8px_32px_rgba(0,210,255,0.4)] group-hover:shadow-[0_12px_40px_rgba(138,43,226,0.6)] group-hover:scale-[1.05] group-active:scale-[0.95] transition-all duration-400 border-[4px] border-[#0a0a0a] light:border-white">
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="translate-x-[2px] drop-shadow-lg">
                      <path d="M22 2L11 13" />
                      <path d="M22 2L15 22L11 13L2 9L22 2Z" fill="white" fillOpacity="0.3" />
                    </svg>
                  </div>
                </button>
              )
            }

            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            
            return (
              <button 
                key={tab.id}
                onClick={() => setActiveTab(tab.id!)}
                className="flex flex-col items-center justify-center space-y-1.5 focus:outline-none w-16 group h-full"
              >
                <div className="relative">
                  <Icon className={`w-6 h-6 transition-all duration-400 ease-out ${isActive ? 'text-[#00d2ff] drop-shadow-[0_0_15px_rgba(0,210,255,0.6)] scale-110 light:text-blue-600 light:drop-shadow-[0_0_12px_rgba(37,99,235,0.4)]' : 'text-[#666] group-hover:text-[#aaa] light:text-gray-400 light:group-hover:text-gray-600'}`} />
                  {isActive && <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-[#00d2ff] light:bg-blue-600 shadow-[0_0_8px_rgba(0,210,255,0.8)] light:shadow-[0_0_8px_rgba(37,99,235,0.8)]"></div>}
                </div>
                <span className={`text-[10px] tracking-widest transition-all duration-400 ease-out uppercase mt-1 ${isActive ? 'text-white font-bold light:text-gray-900' : 'text-[#666] font-semibold group-hover:text-[#aaa] light:text-gray-500 light:group-hover:text-gray-700'}`}>
                  {tab.label}
                </span>
              </button>
            )
          })}
        </div>
      </nav>
    </div>
  );
}

