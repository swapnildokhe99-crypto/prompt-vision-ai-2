import React, { useState } from 'react';
import { 
  X, 
  Link as LinkIcon, 
  Twitter, 
  Facebook, 
  Linkedin, 
  Mail, 
  Check,
  Share2,
  Copy,
  ExternalLink
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  videoUrl: string;
  title: string;
}

export const ShareModal: React.FC<ShareModalProps> = ({ isOpen, onClose, videoUrl, title }) => {
  const [copied, setCopied] = useState(false);

  const shareLinks = [
    { 
      name: 'Twitter', 
      icon: <Twitter size={20} />, 
      color: 'bg-[#1DA1F2]', 
      url: `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(videoUrl)}` 
    },
    { 
      name: 'Facebook', 
      icon: <Facebook size={20} />, 
      color: 'bg-[#4267B2]', 
      url: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(videoUrl)}` 
    },
    { 
      name: 'LinkedIn', 
      icon: <Linkedin size={20} />, 
      color: 'bg-[#0077B5]', 
      url: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(videoUrl)}` 
    },
    { 
      name: 'Email', 
      icon: <Mail size={20} />, 
      color: 'bg-white/10', 
      url: `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(`Check out this video I generated with PromptVision: ${videoUrl}`)}` 
    },
  ];

  const copyToClipboard = () => {
    navigator.clipboard.writeText(videoUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-md glass-card p-8 space-y-8 overflow-hidden"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-2xl font-display font-bold flex items-center gap-3">
                <Share2 className="text-neon-blue" />
                Share Creation
              </h3>
              <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-all">
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <p className="text-sm text-white/60">Share your masterpiece with the world:</p>
              <div className="grid grid-cols-4 gap-4">
                {shareLinks.map((link) => (
                  <a
                    key={link.name}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`flex flex-col items-center gap-2 group`}
                  >
                    <div className={`w-12 h-12 rounded-2xl ${link.color} flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-all`}>
                      {link.icon}
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-white/40 group-hover:text-white transition-colors">
                      {link.name}
                    </span>
                  </a>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <label className="text-[10px] uppercase font-bold text-white/40 tracking-widest">Shareable Link</label>
              <div className="flex gap-2">
                <div className="flex-1 bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-xs text-white/60 truncate font-mono">
                  {videoUrl}
                </div>
                <button
                  onClick={copyToClipboard}
                  className="px-4 bg-neon-blue text-dark-bg rounded-xl font-bold flex items-center gap-2 hover:bg-neon-blue/90 transition-all active:scale-95"
                >
                  {copied ? <Check size={16} /> : <Copy size={16} />}
                  {copied ? 'Copied' : 'Copy'}
                </button>
              </div>
            </div>

            <div className="pt-4 border-t border-white/10">
              <button 
                onClick={() => window.open(videoUrl, '_blank')}
                className="w-full py-3 bg-white/5 border border-white/10 rounded-xl text-xs font-bold flex items-center justify-center gap-2 hover:bg-white/10 transition-all"
              >
                <ExternalLink size={16} />
                Open in New Tab
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
