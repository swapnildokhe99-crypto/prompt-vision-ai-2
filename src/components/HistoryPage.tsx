import React, { useState, useEffect } from 'react';
import { 
  Trash2, 
  Download, 
  ExternalLink, 
  Clock, 
  Search,
  Filter,
  Video,
  Film,
  Zap,
  Share2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { getVideosHistory, deleteVideoFromHistory } from '../services/videoService';
import { VideoPlayer } from './VideoPlayer';
import { ShareModal } from './ShareModal';

export const HistoryPage = ({ onUsePrompt }: { onUsePrompt: (p: string) => void }) => {
  const [videos, setVideos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedVideo, setSelectedVideo] = useState<any>(null);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      const data = await getVideosHistory();
      setVideos(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Are you sure you want to delete this video?")) return;
    
    try {
      await deleteVideoFromHistory(id);
      setVideos(videos.filter(v => v.id !== id));
      if (selectedVideo?.id === id) setSelectedVideo(null);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDownload = async (url: string, filename: string) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error('Download failed:', error);
      window.open(url, '_blank');
    }
  };

  const filteredVideos = videos.filter(v => 
    v.prompt.toLowerCase().includes(search.toLowerCase()) ||
    v.style.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-8">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-display font-bold mb-2">My Videos</h2>
          <p className="text-white/60">Manage and view your generated masterpieces.</p>
        </div>
        <div className="flex gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" size={18} />
            <input 
              type="text" 
              placeholder="Search videos..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-neon-blue/50 transition-all"
            />
          </div>
          <button className="p-2 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-all">
            <Filter size={20} />
          </button>
        </div>
      </header>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <div key={i} className="aspect-video glass-card animate-pulse" />
          ))}
        </div>
      ) : filteredVideos.length === 0 ? (
        <div className="glass-card p-20 text-center space-y-6">
          <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mx-auto">
            <Video size={40} className="text-white/20" />
          </div>
          <div className="space-y-2">
            <h3 className="text-xl font-bold">No videos found</h3>
            <p className="text-white/60">Start generating to see your videos here.</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence>
            {filteredVideos.map((video) => (
              <motion.div
                key={video.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                onClick={() => setSelectedVideo(video)}
                className="group relative glass-card overflow-hidden cursor-pointer hover:border-neon-blue/30 transition-all"
              >
                <div className="aspect-video relative">
                  <img 
                    src={`https://picsum.photos/seed/${video.id}/400/225`} 
                    alt={video.prompt} 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <div className="w-12 h-12 rounded-full bg-neon-blue flex items-center justify-center shadow-lg shadow-neon-blue/40">
                      <ExternalLink size={20} className="text-dark-bg" />
                    </div>
                  </div>
                  <div className="absolute top-2 right-2 flex gap-2">
                    <button 
                      onClick={(e) => handleDelete(video.id, e)}
                      className="p-2 bg-black/60 backdrop-blur-md rounded-lg text-red-400 hover:text-red-500 hover:bg-black/80 transition-all"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                  <div className="absolute bottom-2 left-2 px-2 py-1 bg-black/60 backdrop-blur-md rounded text-[10px] font-bold uppercase tracking-wider">
                    {video.style}
                  </div>
                </div>
                <div className="p-4 space-y-2">
                  <p className="text-sm font-medium line-clamp-2 text-white/90">{video.prompt}</p>
                  <div className="flex items-center justify-between text-[10px] text-white/40 font-bold uppercase">
                    <div className="flex items-center gap-1">
                      <Clock size={10} />
                      {new Date(video.created_at).toLocaleDateString()}
                    </div>
                    <span>{video.resolution}</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Video Modal */}
      <AnimatePresence>
        {selectedVideo && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-8">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedVideo(null)}
              className="absolute inset-0 bg-black/90 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-5xl glass-card overflow-hidden bg-dark-card"
            >
              <div className="grid grid-cols-1 lg:grid-cols-3">
                <div className="lg:col-span-2 p-4">
                  <VideoPlayer src={selectedVideo.video_url} />
                </div>
                <div className="p-6 space-y-6 border-l border-white/10">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-bold">Video Details</h3>
                    <button onClick={() => setSelectedVideo(null)} className="text-white/40 hover:text-white">
                      <Trash2 size={20} className="rotate-45" />
                    </button>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="space-y-1">
                      <label className="text-[10px] text-white/40 uppercase font-bold">Prompt</label>
                      <p className="text-sm text-white/80 italic">"{selectedVideo.prompt}"</p>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] text-white/40 uppercase font-bold">Style</label>
                        <p className="text-sm font-bold text-neon-blue">{selectedVideo.style}</p>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] text-white/40 uppercase font-bold">Resolution</label>
                        <p className="text-sm font-bold">{selectedVideo.resolution}</p>
                      </div>
                    </div>
                  </div>

                  <div className="pt-6 border-t border-white/10 space-y-3">
                    <button 
                      onClick={() => {
                        window.dispatchEvent(new CustomEvent('addToStudio', { detail: selectedVideo }));
                        window.dispatchEvent(new CustomEvent('changeTab', { detail: 'studio' }));
                        setSelectedVideo(null);
                      }}
                      className="w-full py-3 bg-white/5 border border-white/10 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-white/10 transition-all"
                    >
                      <Film size={18} className="text-neon-purple" />
                      Send to Studio
                    </button>
                    <button 
                      onClick={() => {
                        onUsePrompt(selectedVideo.prompt);
                        setSelectedVideo(null);
                      }}
                      className="w-full py-3 bg-white/5 border border-white/10 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-white/10 transition-all"
                    >
                      <Zap size={18} className="text-neon-blue" />
                      Reuse Prompt
                    </button>
                    <button 
                      onClick={() => handleDownload(selectedVideo.video_url, `video_${selectedVideo.id}.mp4`)}
                      className="w-full py-3 bg-neon-blue text-dark-bg rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-neon-blue/90 transition-all"
                    >
                      <Download size={18} />
                      Download Master
                    </button>
                    <button 
                      onClick={() => setIsShareModalOpen(true)}
                      className="w-full py-3 bg-white/5 border border-white/10 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-white/10 transition-all"
                    >
                      <Share2 size={18} className="text-neon-blue" />
                      Share Creation
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {selectedVideo && (
        <ShareModal 
          isOpen={isShareModalOpen}
          onClose={() => setIsShareModalOpen(false)}
          videoUrl={selectedVideo.video_url}
          title={`AI Video: ${selectedVideo.prompt}`}
        />
      )}
    </div>
  );
};
