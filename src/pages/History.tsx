import React, { useEffect, useState, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { HistoryItem } from '../types';
import { Loader2, Calendar, Clipboard, ChevronRight, Play, X, Download } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import GeoGebraApplet, { GeoGebraHandle } from '../components/GeoGebraApplet';

export default function HistoryPage() {
  const { token } = useAuth();
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<HistoryItem | null>(null);
  const ggbRef = useRef<GeoGebraHandle>(null);

  useEffect(() => {
    fetchHistory();
  }, [token]);

  const fetchHistory = async () => {
    try {
      const response = await fetch('/api/history', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to fetch history');
      setHistory(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRunCommands = (item: HistoryItem) => {
    setSelectedItem(item);
  };

  // When selectedItem changes and modal is opening, we need to wait for ggb to load
  // Actually the modal will mount the ggb component
  const onGgbLoad = () => {
    if (selectedItem) {
      for (const cmd of selectedItem.generated_commands) {
        ggbRef.current?.evalCommand(cmd);
      }
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-slate-500">
        <Loader2 className="animate-spin mb-4" size={32} />
        <p className="font-medium">Loading your history...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-4xl font-bold text-white tracking-tight uppercase">Archive</h1>
        <p className="text-slate-500 mt-2 text-lg">Historical records of generated constructions.</p>
      </header>

      {error ? (
        <div className="bg-red-500/10 border border-red-500/20 p-6 rounded-2xl text-red-400 font-medium">
          {error}
        </div>
      ) : history.length === 0 ? (
        <div className="bg-bg-panel border border-white/10 p-12 rounded-2xl text-center space-y-4 shadow-xl">
          <div className="bg-white/5 w-16 h-16 rounded-xl flex items-center justify-center text-slate-500 mx-auto">
            <Clipboard size={32} />
          </div>
          <h3 className="text-xl font-bold text-white tracking-tight">No history yet</h3>
          <p className="text-slate-500 max-w-sm mx-auto">Generated figures will be preserved in this high-fidelity archive.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {history.map((item, index) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="bg-bg-panel border border-white/10 rounded-2xl p-6 shadow-xl hover:border-brand/40 transition-all group flex flex-col"
            >
              <div className="flex items-center gap-2 text-[10px] font-bold text-brand uppercase tracking-widest mb-4">
                <Calendar size={14} />
                {new Date(item.timestamp).toLocaleDateString()}
              </div>
              
              <div className="flex-1 space-y-4">
                <p className="text-slate-200 font-medium line-clamp-3 leading-relaxed">
                  "{item.problem_text}"
                </p>
                <div className="bg-black/40 p-4 rounded-xl border border-white/5">
                  <p className="text-slate-500 text-[10px] uppercase font-bold tracking-widest mb-2 italic">Observation</p>
                  <p className="text-slate-400 text-xs italic line-clamp-2">{item.description}</p>
                </div>
              </div>

              <button
                onClick={() => handleRunCommands(item)}
                className="mt-6 w-full flex items-center justify-center gap-2 bg-slate-100 text-slate-900 font-bold py-3 rounded-xl hover:bg-white transition-all active:scale-95 group-hover:bg-brand group-hover:text-white"
              >
                <Play size={16} />
                VIEW FIGURE
                <ChevronRight size={16} className="ml-auto" />
              </button>
            </motion.div>
          ))}
        </div>
      )}

      {/* View Modal */}
      <AnimatePresence>
        {selectedItem && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedItem(null)}
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-5xl bg-bg-panel rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh] border border-white/10"
            >
              <div className="p-6 border-b border-white/10 flex justify-between items-center bg-bg-panel z-10 shrink-0">
                <div>
                  <h3 className="text-xl font-bold text-white tracking-tight">Archived Figure</h3>
                  <p className="text-slate-500 text-xs truncate max-w-md font-mono mt-1 uppercase tracking-widest">ID: ARCH_0{selectedItem.id}</p>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => ggbRef.current?.exportPNG()}
                    className="p-2.5 rounded-xl text-slate-400 hover:bg-white/5 transition-colors"
                  >
                    <Download size={24} />
                  </button>
                  <button 
                    onClick={() => setSelectedItem(null)}
                    className="p-2.5 rounded-xl text-slate-400 hover:bg-white/5 transition-colors"
                  >
                    <X size={24} />
                  </button>
                </div>
              </div>
              
              <div className="flex-1 bg-white flex items-center justify-center overflow-auto p-8">
                <div className="w-[800px] h-[600px] shrink-0 border border-slate-200 rounded-lg overflow-hidden shadow-2xl">
                  <GeoGebraApplet ref={ggbRef} width={800} height={600} onLoad={onGgbLoad} />
                </div>
              </div>

              <div className="p-6 bg-black/20 border-t border-white/10 text-xs text-slate-500 italic text-center shrink-0 font-mono">
                "{selectedItem.description}"
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
