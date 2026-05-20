import React, { useState, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import GeoGebraApplet, { GeoGebraHandle } from '../components/GeoGebraApplet';
import { Sparkles, Download, Play, Loader2, AlertCircle } from 'lucide-react';
import { motion } from 'motion/react';

export default function Home() {
  const { token } = useAuth();
  const [problem, setProblem] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [description, setDescription] = useState<string | null>(null);
  const ggbRef = useRef<GeoGebraHandle>(null);

  const handleGenerate = async () => {
    if (!problem.trim()) return;
    
    if (!ggbRef.current?.isReady()) {
      setError('Geometric engine is still initializing. Please wait a few seconds.');
      return;
    }

    setIsGenerating(true);
    setError(null);
    setDescription(null);
    ggbRef.current?.reset();

    try {
      const response = await fetch('/api/generate-figure', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ problem })
      });

      const data = await response.json();

      if (!response.ok) {
        console.error("Generation error:", data);
        throw new Error(data.error || `Server error (${response.status})`);
      }

      setDescription(data.description);
      
      // Execute commands with a tiny delay to ensure GeoGebra processes them correctly
      // Some commands might depend on previous points being created
      for (const cmd of data.commands) {
        ggbRef.current?.evalCommand(cmd);
        await new Promise(resolve => setTimeout(resolve, 50));
      }

    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = () => {
    ggbRef.current?.exportPNG();
  };


  return (
    <div className="h-full flex flex-col md:flex-row gap-8">
      {/* Left Column: Input and Info */}
      <div className="w-full md:w-[380px] shrink-0 space-y-6">
        <section className="bg-bg-panel border border-white/10 rounded-xl p-6 space-y-6 shadow-xl">
          <div className="space-y-2">
            <label className="text-[11px] uppercase tracking-widest text-slate-500 font-semibold mb-2 block">
              Input Geometry Problem
            </label>
            <textarea
              value={problem}
              onChange={(e) => setProblem(e.target.value)}
              placeholder="Paste your problem here..."
              className="w-full h-48 bg-black/50 border border-white/10 rounded-lg p-4 text-sm text-slate-300 focus:outline-none focus:border-brand resize-none leading-relaxed transition-colors"
            />
          </div>


          <button
            onClick={handleGenerate}
            disabled={isGenerating || !problem.trim()}
            className="w-full bg-brand hover:bg-brand-hover text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2 shadow-lg shadow-brand/20 transition-all disabled:opacity-50 active:scale-[0.98]"
          >
            {isGenerating ? (
              <>
                <Loader2 className="animate-spin" size={18} />
                PROCESSING...
              </>
            ) : (
              <>
                <Sparkles size={18} />
                GENERATE FIGURE
              </>
            )}
          </button>
        </section>

        {error && (
          <motion.div 
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className="p-4 bg-red-900/20 border border-red-500/20 rounded-xl text-red-400 text-xs flex gap-3"
          >
            <AlertCircle className="shrink-0" size={16} />
            <p>{error}</p>
          </motion.div>
        )}

        {description && (
          <section className="space-y-2">
            <label className="text-[11px] uppercase tracking-widest text-slate-500 font-semibold mb-2 block">
              Gemini Construction Notes
            </label>
            <div className="p-4 bg-black/40 border border-white/5 rounded-xl text-slate-400 text-[11px] font-mono leading-relaxed max-h-40 overflow-auto whitespace-pre-wrap">
              {description}
            </div>
          </section>
        )}
      </div>

      {/* Right Column: Canvas */}
      <div className="flex-1 flex flex-col space-y-4">
        <div className="bg-bg-panel border border-white/10 rounded-xl p-4 shadow-2xl flex-1 flex flex-col min-h-[500px]">
          <div className="flex items-center justify-between mb-4">
            <div className="flex gap-4">
            </div>
            <div className="flex gap-2">
              <button 
                onClick={handleDownload}
                className="flex items-center gap-2 px-4 py-2 bg-white text-black font-bold text-[11px] rounded hover:bg-slate-200 transition-colors shadow-lg active:scale-95"
                title="Download as Image"
              >
                <Download size={14} />
                PNG
              </button>
              <button 
                onClick={() => ggbRef.current?.exportGGB()}
                className="flex items-center gap-2 px-4 py-2 bg-brand text-white font-bold text-[11px] rounded hover:bg-brand-hover transition-colors shadow-lg active:scale-95 border border-brand-hover/20"
                title="Download GeoGebra File"
              >
                <Download size={14} />
                GGB
              </button>
            </div>
          </div>
          
          <div className="flex-1 border border-white/10 rounded-lg overflow-hidden relative bg-white shadow-inner flex items-center justify-center group">
            <div className="w-full h-full">
               <GeoGebraApplet ref={ggbRef} width={1200} height={800} />
            </div>
            <div className="absolute bottom-4 left-4 bg-black/80 backdrop-blur-md px-3 py-1.5 rounded text-[10px] text-white/60 font-mono flex items-center gap-4 border border-white/10">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-brand animate-pulse" />
                Live Engine
              </span>
              <span className="opacity-40">|</span>
              <span>Status: {isGenerating ? 'Computing...' : 'Ready'}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
