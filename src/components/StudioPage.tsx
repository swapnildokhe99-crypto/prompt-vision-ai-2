import React, { useState, useRef, useEffect } from 'react';
import { 
  Scissors, 
  Plus, 
  Trash2, 
  Play, 
  Pause, 
  Save, 
  Layers, 
  ChevronLeft, 
  ChevronRight,
  Clock,
  Download,
  History as HistoryIcon,
  Film,
  Split,
  Crop,
  Type,
  Maximize2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface TextOverlay {
  id: string;
  text: string;
  startTime: number;
  endTime: number;
  position: { x: number; y: number };
  fontSize: number;
  color: string;
}

interface Clip {
  id: string;
  videoId: string;
  url: string;
  prompt: string;
  startTime: number; // in seconds
  endTime: number;   // in seconds
  duration: number;  // total duration of the original video
  crop?: { x: number; y: number; width: number; height: number }; // percentages
  overlays?: TextOverlay[];
}

export const StudioPage = () => {
  const [timeline, setTimeline] = useState<Clip[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [selectedClipIndex, setSelectedClipIndex] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [projects, setProjects] = useState<any[]>([]);
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [projectName, setProjectName] = useState('Untitled Masterpiece');
  const [isExporting, setIsExporting] = useState(false);
  const [editMode, setEditMode] = useState<'none' | 'crop' | 'text'>('none');
  const [newText, setNewText] = useState('');
  const videoRef = useRef<HTMLVideoElement>(null);
  const [totalDuration, setTotalDuration] = useState(0);

  useEffect(() => {
    fetchHistory();
    fetchProjects();

    const handleAddToStudio = (e: any) => {
      addToTimeline(e.detail);
    };
    window.addEventListener('addToStudio', handleAddToStudio);
    return () => window.removeEventListener('addToStudio', handleAddToStudio);
  }, []);

  const fetchProjects = async () => {
    try {
      const response = await fetch('/api/studio/projects');
      if (response.ok) {
        const data = await response.json();
        setProjects(data);
      }
    } catch (error) {
      console.error('Failed to fetch projects', error);
    }
  };

  const loadProject = (project: any) => {
    setTimeline(JSON.parse(project.timeline));
    setActiveProjectId(project.id);
    setProjectName(project.name);
  };

  const createNewProject = () => {
    setTimeline([]);
    setActiveProjectId(null);
    setProjectName('Untitled Masterpiece');
  };

  const deleteProject = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this project?')) return;
    
    try {
      const response = await fetch(`/api/studio/projects/${id}`, { method: 'DELETE' });
      if (response.ok) {
        if (activeProjectId === id) createNewProject();
        fetchProjects();
      }
    } catch (error) {
      console.error('Failed to delete project', error);
    }
  };

  useEffect(() => {
    const duration = timeline.reduce((acc, clip) => acc + (clip.endTime - clip.startTime), 0);
    setTotalDuration(duration);
  }, [timeline]);

  const fetchHistory = async () => {
    try {
      const response = await fetch('/api/videos');
      if (response.ok) {
        const data = await response.json();
        setHistory(data);
      }
    } catch (error) {
      console.error('Failed to fetch history', error);
    } finally {
      setIsLoading(false);
    }
  };

  const addToTimeline = (video: any) => {
    // Parse duration string like '10s' to number
    const durationNum = video.duration ? parseFloat(video.duration.replace('s', '')) : 10;
    
    const newClip: Clip = {
      id: Math.random().toString(36).substr(2, 9),
      videoId: video.id,
      url: video.video_url,
      prompt: video.prompt,
      startTime: 0,
      endTime: durationNum,
      duration: durationNum
    };
    setTimeline([...timeline, newClip]);
  };

  const removeFromTimeline = (index: number) => {
    const newTimeline = [...timeline];
    newTimeline.splice(index, 1);
    setTimeline(newTimeline);
    if (selectedClipIndex === index) setSelectedClipIndex(null);
  };

  const handleTrim = (index: number, start: number, end: number) => {
    const newTimeline = [...timeline];
    newTimeline[index] = { ...newTimeline[index], startTime: start, endTime: end };
    setTimeline(newTimeline);
  };

  const handleCrop = (index: number, crop: { x: number; y: number; width: number; height: number }) => {
    const newTimeline = [...timeline];
    newTimeline[index] = { ...newTimeline[index], crop };
    setTimeline(newTimeline);
  };

  const handleAddText = (index: number) => {
    if (!newText) return;
    const newTimeline = [...timeline];
    const clip = newTimeline[index];
    const newOverlay: TextOverlay = {
      id: Math.random().toString(36).substr(2, 9),
      text: newText,
      startTime: 0,
      endTime: clip.endTime - clip.startTime,
      position: { x: 50, y: 50 },
      fontSize: 24,
      color: '#ffffff'
    };
    newTimeline[index] = { 
      ...clip, 
      overlays: [...(clip.overlays || []), newOverlay] 
    };
    setTimeline(newTimeline);
    setNewText('');
    setEditMode('none');
  };

  const removeOverlay = (clipIndex: number, overlayId: string) => {
    const newTimeline = [...timeline];
    newTimeline[clipIndex] = {
      ...newTimeline[clipIndex],
      overlays: newTimeline[clipIndex].overlays?.filter(o => o.id !== overlayId)
    };
    setTimeline(newTimeline);
  };

  const handleSplit = () => {
    if (selectedClipIndex === null) return;
    
    const clip = timeline[selectedClipIndex];
    // Calculate split point relative to the clip's start
    // We need to know where the playhead is relative to the start of this clip in the timeline
    let accumulatedTime = 0;
    for (let i = 0; i < selectedClipIndex; i++) {
      accumulatedTime += (timeline[i].endTime - timeline[i].startTime);
    }
    
    const splitPointInTimeline = currentTime - accumulatedTime;
    const splitPointInClip = clip.startTime + splitPointInTimeline;
    
    if (splitPointInClip <= clip.startTime || splitPointInClip >= clip.endTime) {
      alert('Playhead must be inside the selected clip to split.');
      return;
    }
    
    const clip1 = { ...clip, id: Math.random().toString(36).substr(2, 9), endTime: splitPointInClip };
    const clip2 = { ...clip, id: Math.random().toString(36).substr(2, 9), startTime: splitPointInClip };
    
    const newTimeline = [...timeline];
    newTimeline.splice(selectedClipIndex, 1, clip1, clip2);
    setTimeline(newTimeline);
    setSelectedClipIndex(selectedClipIndex + 1);
  };

  const handleSave = async () => {
    try {
      const id = activeProjectId || Math.random().toString(36).substr(2, 9);
      const response = await fetch('/api/studio/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id,
          name: projectName,
          timeline: timeline
        })
      });
      if (response.ok) {
        alert('Project saved successfully!');
        setActiveProjectId(id);
        fetchProjects();
      }
    } catch (error) {
      console.error('Failed to save project', error);
    }
  };

  const handleExport = () => {
    if (timeline.length === 0) {
      alert('Add some clips to the timeline first!');
      return;
    }
    
    setIsExporting(true);
    // Simulate rendering process
    setTimeout(() => {
      setIsExporting(false);
      
      // In a real app, we'd send the timeline to a backend that uses FFmpeg
      // For this demo, we'll "export" the project as a JSON file which represents the "master"
      const projectData = {
        name: projectName,
        clips: timeline,
        totalDuration,
        exportedAt: new Date().toISOString()
      };
      
      const blob = new Blob([JSON.stringify(projectData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${projectName.replace(/\s+/g, '_')}_export.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      alert('Export complete! Your project timeline, including crops and text overlays, has been exported as a JSON manifest. In a full production environment, this would trigger a high-quality video render using FFmpeg.');
    }, 2500);
  };

  // Helper to find which clip is currently playing based on timeline time
  const getCurrentClipInfo = (time: number) => {
    let accumulatedTime = 0;
    for (let i = 0; i < timeline.length; i++) {
      const clip = timeline[i];
      const clipDuration = clip.endTime - clip.startTime;
      if (time >= accumulatedTime && time < accumulatedTime + clipDuration) {
        return {
          clip,
          index: i,
          clipTime: clip.startTime + (time - accumulatedTime)
        };
      }
      accumulatedTime += clipDuration;
    }
    return null;
  };

  const currentClipInfo = getCurrentClipInfo(currentTime);

  useEffect(() => {
    if (isPlaying && videoRef.current && currentClipInfo) {
      const vid = videoRef.current;
      
      // If the video is not at the correct clip time, seek to it
      if (Math.abs(vid.currentTime - currentClipInfo.clipTime) > 0.5) {
        vid.currentTime = currentClipInfo.clipTime;
      }

      const interval = setInterval(() => {
        setCurrentTime(prev => {
          const next = prev + 0.1;
          if (next >= totalDuration) {
            setIsPlaying(false);
            return 0;
          }
          return next;
        });
      }, 100);
      return () => clearInterval(interval);
    }
  }, [isPlaying, totalDuration, currentClipInfo?.clip.id]);

  return (
    <div className="h-full flex flex-col gap-6">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-6">
          <div className="space-y-1">
            <h2 className="text-3xl font-display font-bold flex items-center gap-3">
              <Film className="text-neon-blue" />
              Video Studio
            </h2>
            <p className="text-white/60">Trim, split, and merge your AI creations into masterpieces.</p>
          </div>
          <div className="h-12 w-px bg-white/10 hidden md:block" />
          <div className="hidden md:flex flex-col gap-1">
            <label className="text-[10px] uppercase font-bold text-white/40 tracking-widest">Project Name</label>
            <input 
              type="text" 
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              className="bg-transparent border-none p-0 text-xl font-bold focus:ring-0 text-neon-blue placeholder:text-white/10"
              placeholder="Enter name..."
            />
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={handleSave}
            className="flex items-center gap-2 px-6 py-3 bg-white/5 border border-white/10 rounded-xl font-bold hover:bg-white/10 transition-all"
          >
            <Save size={18} />
            Save Project
          </button>
          <button 
            onClick={handleExport}
            disabled={isExporting || timeline.length === 0}
            className="flex items-center gap-2 px-6 py-3 bg-neon-blue text-dark-bg rounded-xl font-bold hover:scale-105 transition-all shadow-lg shadow-neon-blue/20 disabled:opacity-50 disabled:scale-100"
          >
            {isExporting ? (
              <>
                <div className="w-4 h-4 border-2 border-dark-bg border-t-transparent rounded-full animate-spin" />
                Exporting...
              </>
            ) : (
              <>
                <Download size={18} />
                Export Final
              </>
            )}
          </button>
        </div>
      </header>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-4 gap-6 min-h-0">
        {/* Assets Library */}
        <div className="lg:col-span-1 flex flex-col gap-6 min-h-0">
          {/* Projects List */}
          <div className="glass-card flex flex-col h-1/3 min-h-0">
            <div className="p-4 border-b border-white/10 flex items-center justify-between">
              <h3 className="font-bold flex items-center gap-2">
                <Layers size={16} className="text-neon-purple" />
                Projects
              </h3>
              <button 
                onClick={createNewProject}
                className="p-1.5 hover:bg-white/10 rounded-lg transition-all text-white/60"
                title="New Project"
              >
                <Plus size={16} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-2 space-y-1 no-scrollbar">
              {projects.length === 0 ? (
                <p className="text-[10px] text-white/20 text-center py-4 italic">No saved projects</p>
              ) : (
                projects.map((p) => (
                  <div 
                    key={p.id}
                    onClick={() => loadProject(p)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-xs transition-all flex items-center justify-between group cursor-pointer ${
                      activeProjectId === p.id ? 'bg-neon-purple/20 text-neon-purple font-bold' : 'hover:bg-white/5 text-white/60'
                    }`}
                  >
                    <span className="truncate">{p.name}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-[8px] opacity-0 group-hover:opacity-100 transition-opacity">
                        {new Date(p.updated_at).toLocaleDateString()}
                      </span>
                      <button 
                        onClick={(e) => deleteProject(p.id, e)}
                        className="p-1 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Assets List */}
          <div className="glass-card flex flex-col flex-1 min-h-0">
            <div className="p-4 border-b border-white/10 flex items-center justify-between">
              <h3 className="font-bold flex items-center gap-2">
                <HistoryIcon size={16} className="text-neon-blue" />
                Assets
              </h3>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="w-8 h-8 border-4 border-neon-blue border-t-transparent rounded-full animate-spin" />
              </div>
            ) : history.length === 0 ? (
              <div className="text-center py-12 space-y-4">
                <p className="text-sm text-white/40">No videos generated yet.</p>
                <button className="text-xs text-neon-blue font-bold hover:underline">Go Generate</button>
              </div>
            ) : (
              history.map((video) => (
                <div key={video.id} className="group relative rounded-xl overflow-hidden border border-white/5 hover:border-neon-blue/50 transition-all">
                  <video src={video.video_url} className="w-full aspect-video object-cover opacity-60 group-hover:opacity-100 transition-opacity" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent p-3 flex flex-col justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                    <p className="text-[10px] text-white/80 line-clamp-2 mb-2 italic">"{video.prompt}"</p>
                    <button 
                      onClick={() => addToTimeline(video)}
                      className="w-full py-1.5 bg-neon-blue text-dark-bg rounded-lg text-[10px] font-bold flex items-center justify-center gap-1"
                    >
                      <Plus size={12} /> Add to Timeline
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Preview & Timeline */}
      <div className="lg:col-span-3 flex flex-col gap-6 min-h-0">
          {/* Preview Area */}
          <div className="flex-1 glass-card relative overflow-hidden flex flex-col">
            <div className="flex-1 bg-black flex items-center justify-center relative group">
              {currentClipInfo ? (
                <div className="relative max-h-full max-w-full overflow-hidden">
                  <video 
                    ref={videoRef}
                    src={currentClipInfo.clip.url}
                    className="max-h-full max-w-full"
                    style={currentClipInfo.clip.crop ? {
                      clipPath: `inset(${currentClipInfo.clip.crop.y}% ${100 - (currentClipInfo.clip.crop.x + currentClipInfo.clip.crop.width)}% ${100 - (currentClipInfo.clip.crop.y + currentClipInfo.clip.crop.height)}% ${currentClipInfo.clip.crop.x}%)`,
                      transform: `scale(${100 / currentClipInfo.clip.crop.width})`,
                      transformOrigin: `${currentClipInfo.clip.crop.x}% ${currentClipInfo.clip.crop.y}%`
                    } : {}}
                    onLoadedMetadata={(e) => {
                      // Update duration if it's the first time we see this clip
                      const vid = e.currentTarget;
                      if (currentClipInfo.clip.duration === 10) {
                        const newTimeline = [...timeline];
                        newTimeline[currentClipInfo.index].duration = vid.duration;
                        newTimeline[currentClipInfo.index].endTime = vid.duration;
                        setTimeline(newTimeline);
                      }
                    }}
                    autoPlay={isPlaying}
                    muted
                  />
                  
                  {/* Text Overlays */}
                  {currentClipInfo.clip.overlays?.map(overlay => {
                    const relativeTime = currentClipInfo.clipTime - currentClipInfo.clip.startTime;
                    if (relativeTime >= overlay.startTime && relativeTime <= overlay.endTime) {
                      return (
                        <div 
                          key={overlay.id}
                          className="absolute pointer-events-none font-bold drop-shadow-lg text-center"
                          style={{
                            left: `${overlay.position.x}%`,
                            top: `${overlay.position.y}%`,
                            fontSize: `${overlay.fontSize}px`,
                            color: overlay.color,
                            transform: 'translate(-50%, -50%)'
                          }}
                        >
                          {overlay.text}
                        </div>
                      );
                    }
                    return null;
                  })}
                </div>
              ) : (
                <div className="text-center space-y-4 text-white/20">
                  <Film size={64} strokeWidth={1} />
                  <p className="text-sm">Add clips to the timeline to preview</p>
                </div>
              )}
              
              {/* Overlay Controls */}
              <div className="absolute bottom-0 left-0 w-full p-6 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-6">
                <button 
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="w-12 h-12 rounded-full bg-neon-blue text-dark-bg flex items-center justify-center hover:scale-110 transition-all"
                >
                  {isPlaying ? <Pause size={24} /> : <Play size={24} fill="currentColor" />}
                </button>
              </div>
            </div>
            
            {/* Edit Mode Overlays */}
            <AnimatePresence>
              {editMode === 'text' && selectedClipIndex !== null && (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 20 }}
                  className="absolute bottom-20 left-1/2 -translate-x-1/2 w-full max-w-md p-4 glass-card z-30"
                >
                  <div className="flex gap-2">
                    <input 
                      type="text"
                      value={newText}
                      onChange={(e) => setNewText(e.target.value)}
                      placeholder="Enter overlay text..."
                      className="flex-1 bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-sm focus:border-neon-blue outline-none"
                      autoFocus
                    />
                    <button 
                      onClick={() => handleAddText(selectedClipIndex)}
                      className="px-4 py-2 bg-neon-blue text-dark-bg rounded-xl font-bold text-xs"
                    >
                      Add
                    </button>
                  </div>
                </motion.div>
              )}

              {editMode === 'crop' && selectedClipIndex !== null && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 z-30 pointer-events-none border-4 border-neon-blue/50"
                >
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="p-4 bg-black/80 backdrop-blur-md rounded-xl border border-white/10 pointer-events-auto text-center space-y-4">
                      <p className="text-xs font-bold uppercase tracking-widest text-white/60">Select Crop Preset</p>
                      <div className="flex gap-2">
                        <button 
                          onClick={() => handleCrop(selectedClipIndex, { x: 0, y: 0, width: 100, height: 100 })}
                          className="px-3 py-1.5 bg-white/5 rounded-lg text-[10px] hover:bg-white/10"
                        >
                          Original
                        </button>
                        <button 
                          onClick={() => handleCrop(selectedClipIndex, { x: 25, y: 0, width: 50, height: 100 })}
                          className="px-3 py-1.5 bg-white/5 rounded-lg text-[10px] hover:bg-white/10"
                        >
                          9:16 Center
                        </button>
                        <button 
                          onClick={() => handleCrop(selectedClipIndex, { x: 0, y: 25, width: 100, height: 50 })}
                          className="px-3 py-1.5 bg-white/5 rounded-lg text-[10px] hover:bg-white/10"
                        >
                          21:9 Center
                        </button>
                      </div>
                      <button 
                        onClick={() => setEditMode('none')}
                        className="w-full py-2 bg-neon-blue text-dark-bg rounded-lg text-[10px] font-bold"
                      >
                        Done
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="p-4 bg-white/5 flex items-center justify-between border-t border-white/10">
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2 text-white/60 text-sm font-mono">
                  <Clock size={14} />
                  <span>{currentTime.toFixed(2)}s / {totalDuration.toFixed(2)}s</span>
                </div>
                
                {selectedClipIndex !== null && (
                  <div className="flex items-center gap-4 px-4 border-l border-white/10">
                    <span className="text-[10px] font-bold uppercase text-white/40">Trim Clip:</span>
                    <div className="flex items-center gap-2">
                      <input 
                        type="number" 
                        step="0.1"
                        min="0"
                        max={timeline[selectedClipIndex].endTime - 0.1}
                        value={timeline[selectedClipIndex].startTime.toFixed(1)}
                        onChange={(e) => handleTrim(selectedClipIndex, parseFloat(e.target.value), timeline[selectedClipIndex].endTime)}
                        className="w-16 bg-black/40 border border-white/10 rounded px-2 py-1 text-xs text-neon-blue"
                      />
                      <span className="text-white/20">to</span>
                      <input 
                        type="number" 
                        step="0.1"
                        min={timeline[selectedClipIndex].startTime + 0.1}
                        max={timeline[selectedClipIndex].duration}
                        value={timeline[selectedClipIndex].endTime.toFixed(1)}
                        onChange={(e) => handleTrim(selectedClipIndex, timeline[selectedClipIndex].startTime, parseFloat(e.target.value))}
                        className="w-16 bg-black/40 border border-white/10 rounded px-2 py-1 text-xs text-neon-blue"
                      />
                    </div>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2">
                {selectedClipIndex !== null && (
                  <div className="flex items-center gap-2 mr-4 pr-4 border-r border-white/10">
                    <button 
                      onClick={() => setEditMode(editMode === 'crop' ? 'none' : 'crop')}
                      className={`p-2 rounded-lg transition-all ${editMode === 'crop' ? 'bg-neon-blue text-dark-bg' : 'bg-white/5 text-white/60 hover:text-white hover:bg-white/10'}`}
                      title="Crop Clip"
                    >
                      <Crop size={18} />
                    </button>
                    <button 
                      onClick={() => setEditMode(editMode === 'text' ? 'none' : 'text')}
                      className={`p-2 rounded-lg transition-all ${editMode === 'text' ? 'bg-neon-blue text-dark-bg' : 'bg-white/5 text-white/60 hover:text-white hover:bg-white/10'}`}
                      title="Add Text Overlay"
                    >
                      <Type size={18} />
                    </button>
                  </div>
                )}
                <button 
                  disabled={selectedClipIndex === null}
                  onClick={handleSplit}
                  className="p-2 bg-white/5 rounded-lg text-white/60 hover:text-white hover:bg-white/10 disabled:opacity-30 transition-all"
                  title="Split Clip"
                >
                  <Split size={18} />
                </button>
                <button 
                  disabled={selectedClipIndex === null}
                  onClick={() => selectedClipIndex !== null && removeFromTimeline(selectedClipIndex)}
                  className="p-2 bg-red-500/10 rounded-lg text-red-500 hover:bg-red-500 hover:text-white disabled:opacity-30 transition-all"
                  title="Delete Clip"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          </div>

          {/* Timeline Area */}
          <div className="h-64 glass-card flex flex-col overflow-hidden">
            <div className="p-3 border-b border-white/10 flex items-center gap-4">
              <Layers size={16} className="text-neon-blue" />
              <span className="text-xs font-bold uppercase tracking-widest text-white/40">Timeline</span>
            </div>
            
            <div className="flex-1 overflow-x-auto overflow-y-hidden p-6 relative no-scrollbar bg-black/20">
              {/* Playhead */}
              <div 
                className="absolute top-0 bottom-0 w-0.5 bg-neon-blue z-20 pointer-events-none"
                style={{ left: `${(currentTime / Math.max(totalDuration, 10)) * 100}%`, marginLeft: '24px' }}
              >
                <div className="absolute -top-1 -left-1.5 w-3 h-3 bg-neon-blue rounded-full shadow-lg shadow-neon-blue/50" />
              </div>

              <div className="flex gap-1 h-full items-center min-w-max">
                {timeline.length === 0 ? (
                  <div className="w-full flex items-center justify-center text-white/10 italic text-sm">
                    Drag assets here or click "Add to Timeline"
                  </div>
                ) : (
                  timeline.map((clip, idx) => (
                    <motion.div
                      key={clip.id}
                      layout
                      onClick={() => setSelectedClipIndex(idx)}
                      className={`relative h-32 rounded-xl border-2 transition-all cursor-pointer group ${
                        selectedClipIndex === idx ? 'border-neon-blue bg-neon-blue/10' : 'border-white/10 bg-white/5 hover:border-white/30'
                      }`}
                      style={{ width: `${(clip.endTime - clip.startTime) * 20}px`, minWidth: '100px' }}
                    >
                      <div className="absolute inset-0 overflow-hidden rounded-lg">
                        <video src={clip.url} className="w-full h-full object-cover opacity-40" />
                      </div>
                      
                      <div className="absolute top-2 left-2 right-2 flex justify-between items-start">
                        <span className="text-[10px] font-bold bg-black/60 px-1.5 py-0.5 rounded text-white/80 truncate max-w-[80%]">
                          {clip.prompt}
                        </span>
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button className="p-1 bg-black/60 rounded hover:bg-neon-blue hover:text-dark-bg">
                            <Scissors size={10} />
                          </button>
                        </div>
                      </div>

                      <div className="absolute bottom-2 left-2 text-[10px] font-mono text-white/40">
                        {(clip.endTime - clip.startTime).toFixed(1)}s
                      </div>

                      {/* Trim Handles */}
                      {selectedClipIndex === idx && (
                        <>
                          <div className="absolute top-0 bottom-0 left-0 w-2 bg-neon-blue cursor-ew-resize rounded-l-lg" />
                          <div className="absolute top-0 bottom-0 right-0 w-2 bg-neon-blue cursor-ew-resize rounded-r-lg" />
                        </>
                      )}
                    </motion.div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
