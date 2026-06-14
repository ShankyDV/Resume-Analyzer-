import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Edit3, 
  BookOpen, 
  Sparkles, 
  Check, 
  X, 
  AlertTriangle, 
  TrendingUp, 
  ArrowRight,
  Filter
} from 'lucide-react';
import { ResumeAnnotation } from '../types';

interface ResumeWorkspaceProps {
  resumeText: string;
  onChangeResumeText: (text: string) => void;
  annotations: ResumeAnnotation[];
  onApplyFix: (annotation: ResumeAnnotation) => void;
  isAudited: boolean;
}

interface HighlightSegment {
  start: number;
  end: number;
  annotation: ResumeAnnotation;
}

export default function ResumeWorkspace({
  resumeText,
  onChangeResumeText,
  annotations,
  onApplyFix,
  isAudited
}: ResumeWorkspaceProps) {
  const [activeTab, setActiveTab] = useState<'read' | 'edit'>(isAudited ? 'read' : 'edit');
  const [selectedSeverity, setSelectedSeverity] = useState<string>('all');
  const [selectedAnnotation, setSelectedAnnotation] = useState<ResumeAnnotation | null>(null);

  // Sync active tab when audit happens
  React.useEffect(() => {
    if (isAudited) {
      setActiveTab('read');
    }
  }, [isAudited]);

  // Filter annotations based on selection
  const filteredAnnotations = useMemo(() => {
    if (selectedSeverity === 'all') return annotations;
    return annotations.filter(ann => ann.severity === selectedSeverity);
  }, [annotations, selectedSeverity]);

  // Compute non-overlapping highlight segments
  const highlightSegments = useMemo(() => {
    if (!isAudited || filteredAnnotations.length === 0) return [];
    
    const segments: HighlightSegment[] = [];
    filteredAnnotations.forEach(ann => {
      // Find the substring index
      const lookup = ann.resume_text.trim();
      if (!lookup) return;
      
      let index = resumeText.indexOf(lookup);
      if (index !== -1) {
        segments.push({
          start: index,
          end: index + lookup.length,
          annotation: ann
        });
      } else {
        // Try case-insensitive fallback or fuzzy spacing
        const cleanedLookup = lookup.replace(/\s+/g, ' ');
        const cleanedResume = resumeText.replace(/\s+/g, ' ');
        const fuzzyIndex = cleanedResume.indexOf(cleanedLookup);
        if (fuzzyIndex !== -1) {
          // Map index back roughly or use relative matching (best effort)
          // For now, if exact match is missing, map it inside experience/projects specifically
        }
      }
    });

    // Sort by start position ascending, then end descending
    segments.sort((a, b) => a.start - b.start || b.end - a.end);

    // Filter overlapping or nested items
    const nonOverlapping: HighlightSegment[] = [];
    let lastEnd = 0;
    segments.forEach(seg => {
      // Avoid nesting inside an already highlighted block
      if (seg.start >= lastEnd) {
        nonOverlapping.push(seg);
        lastEnd = seg.end;
      }
    });

    return nonOverlapping;
  }, [resumeText, filteredAnnotations, isAudited]);

  // Render text with highlight spans
  const renderedDocument = useMemo(() => {
    if (!isAudited || highlightSegments.length === 0) {
      return <pre className="whitespace-pre-wrap font-mono text-sm leading-relaxed text-slate-800 break-words">{resumeText}</pre>;
    }

    const elements: React.ReactNode[] = [];
    let cursor = 0;
    
    highlightSegments.forEach((seg, index) => {
      // Slice plain text block before highlight
      if (seg.start > cursor) {
        elements.push(
          <span key={`plain-${index}`} className="whitespace-pre-wrap">
            {resumeText.substring(cursor, seg.start)}
          </span>
        );
      }
      
      // Inject highlighted component
      const severityStyles = 
        seg.annotation.severity === 'critical' 
          ? 'bg-red-500/15 border-red-500 font-semibold text-red-950 dark:text-red-200 hover:bg-red-500/25'
          : seg.annotation.severity === 'high'
          ? 'bg-orange-500/15 border-orange-500 font-semibold text-orange-950 dark:text-orange-200 hover:bg-orange-500/25'
          : seg.annotation.severity === 'medium'
          ? 'bg-amber-500/15 border-amber-500 font-medium text-amber-950 dark:text-amber-200 hover:bg-amber-500/25'
          : 'bg-blue-500/15 border-blue-500 text-blue-950 dark:text-blue-200 hover:bg-blue-500/25';

      const isActive = selectedAnnotation && selectedAnnotation.id === seg.annotation.id;

      elements.push(
        <span
          id={`annot-anchor-${seg.annotation.id}`}
          key={`highlight-${seg.annotation.id}-${index}`}
          className={`cursor-pointer inline border-b-2 border-dashed transition-all duration-250 cursor-zoom-in group select-all rounded-xs px-1 ${severityStyles} ${
            isActive ? 'ring-2 ring-indigo-500 bg-indigo-50 ring-offset-1' : ''
          }`}
          onClick={(e) => {
            e.stopPropagation();
            setSelectedAnnotation(seg.annotation);
          }}
          title={`Click to view ${seg.annotation.severity} issue`}
        >
          {resumeText.substring(seg.start, seg.end)}
        </span>
      );
      
      cursor = seg.end;
    });

    // Remainder text
    if (cursor < resumeText.length) {
      elements.push(
        <span key="plain-end" className="whitespace-pre-wrap">
          {resumeText.substring(cursor)}
        </span>
      );
    }

    return (
      <div className="font-sans text-sm leading-relaxed text-slate-800 select-text overflow-x-hidden break-words">
        {elements}
      </div>
    );
  }, [resumeText, highlightSegments, isAudited, selectedAnnotation]);

  const stats = useMemo(() => {
    return {
      total: annotations.length,
      critical: annotations.filter(a => a.severity === 'critical').length,
      high: annotations.filter(a => a.severity === 'high').length,
      medium: annotations.filter(a => a.severity === 'medium').length,
      low: annotations.filter(a => a.severity === 'low').length,
    };
  }, [annotations]);

  return (
    <div className="flex flex-col h-full bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
      {/* Tabs / Header */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center sm:justify-between px-6 py-4 bg-slate-900/90 border-b border-slate-800 gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setActiveTab('read')}
            className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold uppercase tracking-wider rounded-lg transition-all ${
              activeTab === 'read'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/25'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <BookOpen size={14} />
            Recruiter Lens
          </button>
          <button
            onClick={() => setActiveTab('edit')}
            className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold uppercase tracking-wider rounded-lg transition-all ${
              activeTab === 'edit'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/25'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Edit3 size={14} />
            Editor Slate
          </button>
        </div>

        {isAudited && activeTab === 'read' && (
          <div className="flex items-center flex-wrap gap-2 text-xs">
            <span className="text-slate-500 flex items-center gap-1">
              <Filter size={12} />
              Filter:
            </span>
            <button
              onClick={() => setSelectedSeverity('all')}
              className={`px-2 py-1 rounded transition ${
                selectedSeverity === 'all' 
                  ? 'bg-slate-800 text-indigo-400 font-medium' 
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              All ({stats.total})
            </button>
            {stats.critical > 0 && (
              <button
                onClick={() => setSelectedSeverity('critical')}
                className={`px-2 py-1 rounded transition flex items-center gap-1 ${
                  selectedSeverity === 'critical' 
                    ? 'bg-red-950/40 text-red-400 font-medium ring-1 ring-red-500/30' 
                    : 'text-slate-400 hover:text-red-400'
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
                Critical ({stats.critical})
              </button>
            )}
            {stats.high > 0 && (
              <button
                onClick={() => setSelectedSeverity('high')}
                className={`px-2 py-1 rounded transition flex items-center gap-1 ${
                  selectedSeverity === 'high' 
                    ? 'bg-orange-950/40 text-orange-400 font-medium ring-1 ring-orange-500/30' 
                    : 'text-slate-400 hover:text-orange-400'
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-orange-500"></span>
                High ({stats.high})
              </button>
            )}
            {(stats.medium > 0 || stats.low > 0) && (
              <button
                onClick={() => setSelectedSeverity('medium')}
                className={`px-2 py-1 rounded transition flex items-center gap-1 ${
                  selectedSeverity === 'medium' || selectedSeverity === 'low'
                    ? 'bg-amber-950/40 text-amber-400 font-medium ring-1 ring-amber-500/30' 
                    : 'text-slate-400 hover:text-amber-400'
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                Other ({stats.medium + stats.low})
              </button>
            )}
          </div>
        )}
      </div>

      {/* Editor or Reader Space */}
      <div className="flex-1 overflow-hidden relative flex">
        {activeTab === 'edit' ? (
          <div className="flex-1 flex flex-col p-6 bg-slate-950">
            <label className="text-xs text-slate-500 uppercase tracking-widest font-mono mb-2 block">
              Draft Plaintext Resume Context (Scrollable Markdown)
            </label>
            <textarea
              className="flex-1 w-full bg-slate-900 border border-slate-800 rounded-xl p-4 text-sm font-mono text-slate-300 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition resize-none leading-relaxed"
              value={resumeText}
              onChange={(e) => onChangeResumeText(e.target.value)}
              placeholder="Paste or draft your plaintext resume here..."
            />
          </div>
        ) : (
          <div className="flex-1 flex overflow-hidden relative">
            {/* The Document View */}
            <div className="flex-1 overflow-y-auto p-8 bg-white selection:bg-indigo-100 select-text relative">
              <div className="max-w-3xl mx-auto shadow-sm p-4 rounded-xl border border-slate-100 bg-white">
                {/* Visual Watermark just for style */}
                <div className="absolute top-2 right-4 text-[10px] font-mono font-semibold tracking-widest uppercase select-none text-slate-300">
                  {isAudited ? '⚙️ Recruiter Analyzed Overlay' : '⚠️ Draft Workspace'}
                </div>
                {renderedDocument}
              </div>
            </div>

            {/* Flying Audit popover on active selection */}
            <AnimatePresence>
              {selectedAnnotation && (
                <motion.div
                  initial={{ opacity: 0, x: 50, scale: 0.95 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  exit={{ opacity: 0, x: 50, scale: 0.95 }}
                  transition={{ type: 'spring', damping: 25, stiffness: 220 }}
                  className="w-full md:w-80 border-l border-slate-800 bg-slate-900 shadow-2xl z-20 flex flex-col absolute right-0 top-0 bottom-0 overflow-y-auto"
                >
                  {/* Flyout Header */}
                  <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-900/80 sticky top-0">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider ${
                        selectedAnnotation.severity === 'critical'
                          ? 'bg-red-500/20 text-red-400'
                          : selectedAnnotation.severity === 'high'
                          ? 'bg-orange-500/20 text-orange-400'
                          : selectedAnnotation.severity === 'medium'
                          ? 'bg-amber-500/20 text-amber-400'
                          : 'bg-blue-500/20 text-blue-400'
                      }`}>
                        {selectedAnnotation.severity}
                      </span>
                      <span className="text-[10px] font-mono text-slate-500 uppercase">
                        {selectedAnnotation.issue_type}
                      </span>
                    </div>
                    <button
                      onClick={() => setSelectedAnnotation(null)}
                      className="text-slate-400 hover:text-white transition p-1 rounded-md hover:bg-slate-800"
                    >
                      <X size={16} />
                    </button>
                  </div>

                  {/* Flyout Content */}
                  <div className="p-5 flex-1 space-y-5">
                    <div>
                      <h4 className="text-xs text-slate-500 uppercase tracking-widest font-mono mb-1.5">
                        Triggering Segment
                      </h4>
                      <div className="bg-slate-950 rounded-xl p-3 border border-slate-800 text-xs italic text-slate-300 leading-relaxed font-mono">
                        "{selectedAnnotation.resume_text}"
                      </div>
                    </div>

                    <div>
                      <h4 className="text-xs text-slate-400 uppercase tracking-widest font-mono mb-2 flex items-center gap-1.5">
                        <AlertTriangle size={13} className="text-amber-500" />
                        Recruiter Audit
                      </h4>
                      <p className="text-slate-300 text-xs leading-relaxed font-sans bg-slate-800/50 p-3 rounded-lg border border-slate-800">
                        {selectedAnnotation.reason}
                      </p>
                    </div>

                    <div className="border-t border-slate-800 pt-4">
                      <h4 className="text-xs text-indigo-400 uppercase tracking-widest font-mono mb-2 flex items-center gap-1.5">
                        <Sparkles size={13} className="text-indigo-400" />
                        Interactive Magic Fix
                      </h4>
                      <div className="bg-slate-950 rounded-xl p-3 border border-indigo-950 text-indigo-200 text-xs leading-relaxed mb-3 font-mono">
                        {selectedAnnotation.improved_text}
                      </div>

                      <button
                        onClick={() => {
                          onApplyFix(selectedAnnotation);
                          setSelectedAnnotation(null);
                        }}
                        className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-lg transition-all shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-1.5 active:scale-95 cursor-pointer"
                      >
                        <TrendingUp size={14} />
                        Apply Quick Fix
                        <ArrowRight size={12} />
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Workspace Footer status line */}
      <div className="px-6 py-2 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-[11px] font-mono text-slate-500">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></span>
          <span>Workspace Operational</span>
        </div>
        <div>
          {isAudited ? (
            <span className="text-slate-400 font-semibold text-indigo-400">
              Audit loaded - {annotations.length} improvements flagged
            </span>
          ) : (
            <span>Ready to review</span>
          )}
        </div>
      </div>
    </div>
  );
}
