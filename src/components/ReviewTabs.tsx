import React, { useState, useMemo } from 'react';
import { 
  FileText, 
  Terminal, 
  TrendingUp, 
  ShieldAlert, 
  Map, 
  Target, 
  Award,
  BookOpen, 
  Sliders, 
  SlidersHorizontal,
  FolderLock,
  MessageSquare,
  Sparkles,
  Search,
  ChevronLeft,
  ChevronRight,
  Filter,
  Check
} from 'lucide-react';
import { RecruiterAuditResponse, ResumeAnnotation } from '../types';

interface ReviewTabsProps {
  auditResult: RecruiterAuditResponse;
  selectedAnnotationId: string | null;
  onSelectAnnotation: (id: string | null) => void;
  onApplyFix: (annotation: ResumeAnnotation) => void;
  onOptimizeBullet: (annotation: ResumeAnnotation, style: 'technical' | 'impact' | 'ats' | 'alternative') => Promise<void>;
  optimizingId: string | null;
}

interface TabItem {
  id: 'overview' | 'roast' | 'ats' | 'projects' | 'annotations' | 'rewrite';
  title: string;
  icon: any;
  alert?: boolean;
  badge?: number;
}

export default function ReviewTabs({
  auditResult,
  selectedAnnotationId,
  onSelectAnnotation,
  onApplyFix,
  onOptimizeBullet,
  optimizingId
}: ReviewTabsProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'roast' | 'ats' | 'projects' | 'annotations' | 'rewrite'>('overview');
  
  // Filtering for annotations tab
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const [sectionFilter, setSectionFilter] = useState<string>('all');
  
  // List of tabs
  const tabs: TabItem[] = [
    { id: 'overview', title: 'Executive Overview', icon: Sliders },
    { id: 'roast', title: 'Brutal Roast', icon: Terminal, alert: true },
    { id: 'ats', title: 'ATS Parser', icon: SlidersHorizontal },
    { id: 'projects', title: 'Portfolio Projects', icon: FolderLock },
    { id: 'annotations', title: 'Alarms Zone', icon: ShieldAlert, badge: auditResult.annotations?.length || 0 },
    { id: 'rewrite', title: 'Resume Rewrite', icon: BookOpen },
  ];

  // Formatting colors
  const getScoreColor = (score: number) => {
    if (score >= 8) return 'text-[#00FF41] border-[#00FF41]/20';
    if (score >= 5) return 'text-amber-400 border-amber-400/20';
    return 'text-[#FF4444] border-[#FF4444]/20';
  };

  const getScoreBg = (score: number) => {
    if (score >= 8) return 'bg-[#00FF41]/10 text-[#00FF41]';
    if (score >= 5) return 'bg-amber-400/10 text-amber-400';
    return 'bg-[#FF4444]/15 text-[#FF4444]';
  };

  // Derived filtered annotations lists
  const filteredAnnotations = useMemo(() => {
    let list = auditResult.annotations || [];
    if (severityFilter !== 'all') {
      list = list.filter(a => a.severity === severityFilter);
    }
    if (sectionFilter !== 'all') {
      list = list.filter(a => a.section?.toLowerCase() === sectionFilter.toLowerCase());
    }
    return list;
  }, [auditResult.annotations, severityFilter, sectionFilter]);

  // Next & Pres alert navigation
  const currentIndex = useMemo(() => {
    if (!selectedAnnotationId) return -1;
    return filteredAnnotations.findIndex(a => a.id === selectedAnnotationId);
  }, [selectedAnnotationId, filteredAnnotations]);

  const handleNextIssue = () => {
    if (filteredAnnotations.length === 0) return;
    const nextIdx = (currentIndex + 1) % filteredAnnotations.length;
    onSelectAnnotation(filteredAnnotations[nextIdx].id);
  };

  const handlePrevIssue = () => {
    if (filteredAnnotations.length === 0) return;
    const prevIdx = (currentIndex - 1 + filteredAnnotations.length) % filteredAnnotations.length;
    onSelectAnnotation(filteredAnnotations[prevIdx].id);
  };

  // Get active selected warning
  const selectedAnnotation = useMemo(() => {
    return auditResult.annotations?.find(a => a.id === selectedAnnotationId) || null;
  }, [auditResult.annotations, selectedAnnotationId]);

  return (
    <div className="flex flex-col h-full bg-[#111] border border-[#222] rounded-lg overflow-hidden shadow-2xl">
      {/* Tab Select Header list */}
      <div className="flex border-b border-[#222] bg-[#0d0d0d] overflow-x-auto shrink-0 scrollbar-none">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-5 py-3.5 text-xs font-mono tracking-wider transition-all whitespace-nowrap border-b-2 hover:bg-white/5 relative cursor-pointer ${
                isActive 
                  ? 'border-[#00FF41] text-white bg-white/[0.02] font-black' 
                  : 'border-transparent text-[#666] hover:text-[#999]'
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-[#00FF41]' : 'text-current'}`} />
              <span>{tab.title}</span>
              {tab.badge && tab.badge > 0 ? (
                <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-red-500 text-white font-bold animate-pulse">
                  {tab.badge}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>

      {/* Main Tab Viewports scrolling contents */}
      <div className="flex-1 overflow-y-auto p-5 md:p-6 space-y-6">
        
        {/* TAB 1: EXECUTIVE OVERVIEW */}
        {activeTab === 'overview' && (
          <div className="space-y-6 animate-fadeIn">
            
            {/* Decision Bento Card Header */}
            <div className="bg-black/40 border border-[#222] rounded-lg p-5 flex flex-col justify-between relative overflow-hidden group hover:border-[#333] transition-all">
              <div className="absolute top-2 right-2 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[#00FF41]"></span>
                <span className="text-[8px] font-mono text-[#444] tracking-widest uppercase">SYS_INDEX_DECISION</span>
              </div>
              
              <div className="space-y-1">
                <span className="text-[10px] font-mono text-[#888] uppercase tracking-wider flex items-center gap-1">
                  <ShieldAlert className="w-3.5 h-3.5 text-red-500" />
                  Hiring Verdict Signal
                </span>
                
                <h2 className={`text-3xl md:text-4xl font-black tracking-tight uppercase leading-none ${
                  auditResult.hiringDecision.includes('REJECT') 
                    ? 'text-[#FF4444]' 
                    : 'text-[#00FF41]'
                }`}>
                  {auditResult.hiringDecision}
                </h2>
              </div>
              
              <p className="text-xs text-[#aaa] italic leading-relaxed pt-4 border-t border-[#1d1d1d] mt-4">
                &ldquo;{auditResult.firstImpression.decisionReason}&rdquo;
              </p>
            </div>

            {/* Performance Circular Gauge Score */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-black/40 border border-[#222] rounded-lg p-5 flex flex-col items-center justify-center text-center shadow">
                <span className="text-[10px] font-mono text-[#666] uppercase tracking-wider mb-3">Overall Hireability Grade</span>
                <div className="relative w-28 h-28 flex items-center justify-center select-none">
                  <svg className="w-full h-full transform -rotate-90">
                    <circle cx="56" cy="56" r="46" stroke="#1c1c1c" strokeWidth="8" fill="transparent" />
                    <circle 
                      cx="56" 
                      cy="56" 
                      r="46" 
                      stroke={auditResult.scores.overallHireability >= 8 ? '#00FF41' : auditResult.scores.overallHireability >= 5 ? '#facc15' : '#FF4444'} 
                      strokeWidth="8" 
                      fill="transparent" 
                      strokeDasharray={289.02} 
                      strokeDashoffset={289.02 - (289.02 * (auditResult.scores.overallHireability * 10)) / 100}
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-4xl font-black tracking-tight text-white">{auditResult.scores.overallHireability * 10}</span>
                    <span className="text-[9px] font-mono text-[#444]">/100</span>
                  </div>
                </div>
              </div>

              {/* Recruitment detailed metrics list */}
              <div className="bg-black/40 border border-[#222] rounded-lg p-5 flex flex-col justify-center space-y-3.5">
                {[
                  { label: 'Recruiter Index', score: auditResult.scores.recruiterScore },
                  { label: 'ATS Readability', score: auditResult.scores.atsScore },
                  { label: 'Technical depth', score: auditResult.scores.technicalCredibility },
                  { label: 'Impact metrics', score: auditResult.scores.impactScore },
                ].map((m, idx) => (
                  <div key={idx} className="space-y-1 bg-black/30 p-2 rounded">
                    <div className="flex justify-between items-center text-[10px] font-mono">
                      <span className="text-[#888]">{m.label.toUpperCase()}</span>
                      <span className={`font-bold ${getScoreColor(m.score)}`}>{m.score}/10</span>
                    </div>
                    <div className="w-full bg-[#1e1e1e] h-1.5 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${m.score >= 8 ? 'bg-[#00FF41]' : m.score >= 5 ? 'bg-amber-400' : 'bg-[#FF4444]'}`} style={{ width: `${m.score * 10}%` }}></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Impressed signals metrics list */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="bg-[#181818] border border-l-4 border-[#222] border-l-[#00FF41] p-4.5 rounded-lg flex flex-col gap-1.5">
                <span className="text-[#00FF41] font-mono tracking-tight font-bold uppercase">Strongest Signal Detected</span>
                <span className="text-[#ccc] leading-relaxed">{auditResult.firstImpression.strongestSignal}</span>
              </div>
              <div className="bg-[#181818] border border-l-4 border-[#222] border-l-[#FF4444] p-4.5 rounded-lg flex flex-col gap-1.5">
                <span className="text-[#FF4444] font-mono tracking-tight font-bold uppercase">Weakest Weak Signal</span>
                <span className="text-[#ccc] leading-relaxed">{auditResult.firstImpression.weakestSignal}</span>
              </div>
            </div>

            {/* Corporate action evaluation probabilities chart */}
            <div className="bg-black/40 border border-[#222] rounded-lg p-5">
              <span className="text-[10px] font-mono text-[#888] uppercase tracking-widest block mb-4 border-b border-[#222] pb-2">Hiring Loop Probabilities Progression</span>
              <div className="space-y-4">
                {[
                  { title: 'Pass ATS Filter', val: auditResult.interviewProbability.passAts, color: 'from-[#00FF41]' },
                  { title: 'Recruiter Shortlist', val: auditResult.interviewProbability.recruiterShortlist, color: 'from-[#00FF41]' },
                  { title: 'Technical Screen Match', val: auditResult.interviewProbability.technicalInterview, color: 'from-[#00FF41]' },
                  { title: 'Final Assessment Loop', val: auditResult.interviewProbability.finalRound, color: 'from-[#00FF41]' },
                  { title: 'Job Offer secured', val: auditResult.interviewProbability.offer, color: 'from-amber-400' },
                ].map((item, idx) => (
                  <div key={idx} className="space-y-1">
                    <div className="flex justify-between items-center text-[10px] font-mono">
                      <span>{item.title}</span>
                      <span className="text-white font-bold">{item.val}%</span>
                    </div>
                    <div className="w-full bg-[#1A1A1A] h-2 rounded overflow-hidden">
                      <div className={`h-full bg-gradient-to-r ${item.color} to-transparent rounded`} style={{ width: `${item.val}%` }}></div>
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-[10px] text-[#666] font-mono leading-relaxed mt-4 bg-black/40 p-3 rounded border border-[#222]">{auditResult.interviewProbability.reasoning}</p>
            </div>

          </div>
        )}

        {/* TAB 2: BRUTAL ROAST */}
        {activeTab === 'roast' && (
          <div className="space-y-4 animate-fadeIn">
            <div className="bg-[#1A1A1A] border-2 border-[#FF4444] rounded-lg p-6 relative overflow-hidden shadow-2xl">
              <div className="absolute top-0 right-0 bg-[#FF4444] text-black text-[10px] font-black px-4 py-1.5 uppercase tracking-widest font-mono select-none">
                Recruiter Unfiltered Verdict
              </div>
              
              <h3 className="text-sm font-black mb-4 flex items-center text-[#FF4444] font-mono tracking-wider">
                <Terminal className="w-5 h-5 mr-2 animate-bounce" />
                ⚠ EXEC_ROAST_STREAM
              </h3>
              
              <div className="font-mono text-xs bg-black/60 border border-red-950 p-5 rounded-md text-red-100 leading-relaxed whitespace-pre-wrap">
                {auditResult.roast}
              </div>
            </div>

            <div className="bg-black/30 p-4 border border-[#222] rounded-lg text-xs leading-relaxed text-[#888] font-mono">
              <span className="text-[#FF4444] font-black uppercase font-mono block mb-1">Recruiter Strategy Advice:</span>
              Remember: hiring managers reject resumes that show tutorial apps, unquantified impact verbs, or generic AI structures. Take action by using the click-to-fix system inside the resume highlights tab!
            </div>
          </div>
        )}

        {/* TAB 3: ATS ANALYSIS */}
        {activeTab === 'ats' && (
          <div className="space-y-6 animate-fadeIn">
            
            <div className="bg-gradient-to-br from-[#00FF41]/15 to-transparent border border-[#00FF41]/30 p-5 rounded-lg">
              <div className="flex justify-between items-center mb-4 border-b border-[#00FF41]/20 pb-3">
                <span className="text-xs font-mono text-[#00FF41] uppercase tracking-wider font-extrabold flex items-center gap-1.5">
                  <SlidersHorizontal className="w-4 h-4" /> ATS Readability Rank
                </span>
                <span className="text-[10px] text-white bg-black/60 font-mono px-2.5 py-0.5 rounded border border-[#222]">
                  RANKING: {auditResult.atsAnalysis.estimatedAtsRanking}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Score gauge text in box */}
                <div className="bg-black/40 p-4.5 rounded-lg flex flex-col justify-center items-center text-center">
                  <span className="text-[9px] font-mono text-[#aa] uppercase mb-1">ATS Parser Integrity Score</span>
                  <span className="text-4xl font-black text-[#00FF41] tracking-tight">{auditResult.atsAnalysis.currentMatchPercentage}%</span>
                  <div className="w-full bg-[#111] h-2 rounded mt-3.5">
                    <div className="bg-[#00FF41] h-2 rounded animate-pulse" style={{ width: `${auditResult.atsAnalysis.currentMatchPercentage}%` }}></div>
                  </div>
                </div>

                {/* Risks / Layout check */}
                <div className="bg-black/40 p-4 rounded-lg space-y-2.5 text-xs font-mono">
                  <span className="text-[#FF4444] text-[10px] uppercase font-bold tracking-wider block">Layout Parser Rejection Red-Flags</span>
                  <ul className="list-disc list-inside space-y-1 text-[#aaa]">
                    {auditResult.atsAnalysis.atsRisks.map((risk, idx) => (
                      <li key={idx} className="leading-tight">{risk}</li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Suggestions */}
              <div className="space-y-3.5 mt-5 border-t border-[#00FF41]/20 pt-4">
                <div className="text-xs space-y-2 bg-black/30 p-3 rounded">
                  <span className="text-[#FF4444] font-mono font-black uppercase tracking-wider block">Severe Keyword Gaps identified:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {auditResult.atsAnalysis.topMissingKeywords.map((tag, idx) => (
                      <span key={idx} className="bg-red-950/20 text-red-400 border border-red-900/40 rounded px-2.5 py-0.5 text-xs font-mono font-medium">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="text-xs space-y-2 bg-black/30 p-3 rounded">
                  <span className="text-[#00FF41] font-mono font-black uppercase tracking-wider block">Recommended high-value replacements:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {auditResult.atsAnalysis.suggestedKeywords.map((tag, idx) => (
                      <span key={idx} className="bg-[#00FF41]/10 text-[#00FF41] border border-[#00FF41]/20 rounded px-2.5 py-0.5 text-xs font-mono font-semibold">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Optimizations */}
              <div className="bg-black/40 p-4.5 rounded-lg text-xs mt-4">
                <span className="text-[#00FF41] font-mono font-extrabold uppercase tracking-wider block mb-2">Technical Layout Modifications recommended:</span>
                <ul className="list-disc list-inside space-y-1 text-[#aaa] font-mono text-[11px]">
                  {auditResult.atsAnalysis.atsImprovements.map((imp, idx) => (
                    <li key={idx}>{imp}</li>
                  ))}
                </ul>
              </div>
            </div>

          </div>
        )}

        {/* TAB 4: PORTFOLIO PROJECTS */}
        {activeTab === 'projects' && (
          <div className="space-y-5 animate-fadeIn">
            {auditResult.projectEvaluations && auditResult.projectEvaluations.length > 0 ? (
              <div className="grid grid-cols-1 gap-4">
                {auditResult.projectEvaluations.map((proj, idx) => {
                  const isLowValue = proj.projectType === 'Tutorial project' || proj.projectType === 'Clone project' || proj.projectType === 'Generic CRUD';
                  return (
                    <div 
                      key={idx} 
                      className={`p-5 rounded-lg flex flex-col justify-between transition-all border ${
                        isLowValue 
                          ? 'bg-[#1a1111] hover:bg-[#201515] border-red-800/20' 
                          : 'bg-[#111a11] hover:bg-[#152015] border-[#00FF41]/10'
                      }`}
                    >
                      <div className="space-y-3">
                        <div className="flex justify-between items-start gap-2">
                          <span className="text-sm font-bold text-white uppercase font-sans tracking-wide">
                            {proj.name}
                          </span>
                          <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
                            isLowValue ? 'bg-red-500/10 text-red-400' : 'bg-[#00FF41]/10 text-[#00FF41]'
                          }`}>
                            {proj.projectType.toUpperCase()}
                          </span>
                        </div>

                        {/* Ratings */}
                        <div className="grid grid-cols-3 gap-2 text-center select-none">
                          {[
                            { label: 'Complexity', val: proj.complexity },
                            { label: 'Tech Depth', val: proj.technicalDepth },
                            { label: 'Recruiter Appeal', val: proj.recruiterAppeal },
                          ].map((r, i) => (
                            <div key={i} className="bg-black/40 p-2 rounded border border-[#222]">
                              <span className="text-[8px] uppercase font-mono text-[#555] block font-semibold">{r.label}</span>
                              <span className="text-sm font-mono font-bold text-white">{r.val}/10</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Reposition strategy */}
                      <div className="bg-black/40 p-3 rounded text-xs mt-4 border border-[#222]">
                        <span className="text-[10px] font-mono uppercase text-[#00FF41] font-bold block mb-1">Framing Strategy Strategy Change:</span>
                        <ul className="list-disc list-inside space-y-1 text-[#999] font-mono">
                          {proj.framingSuggestions.map((s, i) => (
                            <li key={i}>{s}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center text-[#555] py-12 font-mono">
                No custom projects identified for analysis. Make sure they are labeled structured in your resume text content!
              </div>
            )}
          </div>
        )}

        {/* TAB 5: ALARMS ZONE (ANNOTATIONS LIST) */}
        {activeTab === 'annotations' && (
          <div className="space-y-5 animate-fadeIn">
            
            {/* Filters panel */}
            <div className="flex flex-wrap items-center justify-between gap-3 bg-black/40 border border-[#222] p-3 rounded-lg text-xs font-mono">
              <div className="flex items-center gap-1">
                <Filter className="w-3.5 h-3.5 text-[#00FF41]" />
                <span className="text-[#888]">Filters:</span>
              </div>
              
              <div className="flex gap-2">
                <select 
                  value={severityFilter} 
                  onChange={(e) => setSeverityFilter(e.target.value)}
                  className="bg-black border border-[#333] text-[10px] rounded px-2 py-1 text-white focus:outline-none"
                >
                  <option value="all">Severity: All</option>
                  <option value="critical">Critical Only</option>
                  <option value="high">High Only</option>
                  <option value="medium">Medium Only</option>
                </select>

                <select 
                  value={sectionFilter} 
                  onChange={(e) => setSectionFilter(e.target.value)}
                  className="bg-black border border-[#333] text-[10px] rounded px-2 py-1 text-white focus:outline-none"
                >
                  <option value="all">Section: All</option>
                  <option value="experience">Experience</option>
                  <option value="projects">Projects</option>
                  <option value="skills">Skills</option>
                  <option value="summary">Summary</option>
                </select>
              </div>
            </div>

            {/* Pagination / Next Pre navigation */}
            {filteredAnnotations.length > 0 && selectedAnnotationId && (
              <div className="flex items-center justify-between p-3 bg-black/30 border border-[#222] rounded-lg">
                <span className="text-xs font-mono text-[#aaa]">
                  Current Focus: <span className="text-white font-bold">{currentIndex + 1}</span> of <span className="text-[#00FF41]">{filteredAnnotations.length}</span> issues
                </span>
                
                <div className="flex gap-2 shrink-0">
                  <button
                    onClick={handlePrevIssue}
                    className="p-1 px-2.5 bg-black hover:bg-[#222] border border-[#333] hover:border-white/20 hover:text-white transition rounded flex items-center justify-center cursor-pointer text-xs"
                    title="Previous Issue"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" /> Prev
                  </button>
                  <button
                    onClick={handleNextIssue}
                    className="p-1 px-2.5 bg-black hover:bg-[#222] border border-[#333] hover:border-white/20 hover:text-white transition rounded flex items-center justify-center cursor-pointer text-xs"
                    title="Next Issue"
                  >
                    Next <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}

            {/* List of annotations */}
            <div className="space-y-4 max-h-[480px] overflow-y-auto pr-1">
              {filteredAnnotations.length === 0 ? (
                <div className="text-center text-[#555] py-12 font-mono text-xs border border-[#222] rounded-lg">
                  No matching issue flags found under current filter options. See Overview.
                </div>
              ) : (
                filteredAnnotations.map((ann) => {
                  const isSelected = selectedAnnotationId === ann.id;
                  const severityStyle = 
                    ann.severity === 'critical' ? 'border-[#FF4444] text-[#FF5D5D] bg-red-950/20' :
                    ann.severity === 'high' ? 'border-orange-500 text-orange-400 bg-orange-950/25' :
                    ann.severity === 'medium' ? 'border-amber-400 text-amber-300 bg-amber-950/25' :
                    'border-green-500 text-green-400 bg-green-950/25';

                  return (
                    <div
                      key={ann.id}
                      onClick={() => onSelectAnnotation(ann.id)}
                      className={`p-4 rounded-lg border transition-all cursor-pointer ${severityStyle} ${
                        isSelected ? 'ring-2 ring-indigo-500 ring-offset-2 ring-offset-black scale-98 shadow-lg' : 'opacity-80 hover:opacity-100'
                      }`}
                    >
                      <div className="flex justify-between items-center mb-2.5 border-b border-[#2d2d2d] pb-2 text-[10px] font-mono">
                        <span className="font-extrabold uppercase">ALERT: {ann.issue_type}</span>
                        <span className="uppercase tracking-widest bg-black px-2 py-0.5 rounded border border-[#222]">
                          LEVEL: {ann.severity}
                        </span>
                      </div>

                      <span className="text-[9px] uppercase font-mono text-[#666] block">Original Snippet Trigger:</span>
                      <blockquote className="bg-black/45 p-2 rounded text-xs font-mono italic text-[#ddd] mt-1 mb-2.5 break-words">
                        "{ann.resume_text}"
                      </blockquote>

                      <div className="text-xs text-[#ccc] font-mono leading-relaxed mt-2 p-2.5 bg-black/25 rounded">
                        <span className="text-amber-500 font-extrabold block uppercase text-[9px] mb-1">Recruiter Review feedback:</span>
                        {ann.reason}
                      </div>

                      {ann.improved_text && isSelected && (
                        <div className="mt-4 p-3 bg-black/60 border border-[#333] rounded-lg space-y-2.5">
                          <span className="text-[10px] font-mono text-[#00FF41] font-bold block uppercase border-b border-[#222] pb-1.5">Interactive Multi-Style Fixer Workspace</span>
                          
                          <div className="bg-black border border-indigo-950 p-2.5 rounded font-mono text-xs text-indigo-200">
                            {ann.improved_text}
                          </div>

                          <div className="grid grid-cols-2 gap-2 text-[10px] pt-1">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onOptimizeBullet(ann, 'alternative');
                              }}
                              disabled={optimizingId === ann.id}
                              className="text-left bg-black hover:bg-[#1E1E1E] border border-[#2d2d2d] p-2 rounded transition cursor-pointer text-[#ccc] hover:text-white"
                            >
                              ✨ Alternative Suggestion
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onOptimizeBullet(ann, 'technical');
                              }}
                              disabled={optimizingId === ann.id}
                              className="text-left bg-black hover:bg-[#1E1E1E] border border-[#2d2d2d] p-2 rounded transition cursor-pointer text-[#ccc] hover:text-white"
                            >
                              🛠️ Make More Technical
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onOptimizeBullet(ann, 'impact');
                              }}
                              disabled={optimizingId === ann.id}
                              className="text-left bg-black hover:bg-[#1E1E1E] border border-[#2d2d2d] p-2 rounded transition cursor-pointer text-[#ccc] hover:text-white"
                            >
                              📈 Make More Impactful
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onOptimizeBullet(ann, 'ats');
                              }}
                              disabled={optimizingId === ann.id}
                              className="text-left bg-black hover:bg-[#1E1E1E] border border-[#2d2d2d] p-2 rounded transition cursor-pointer text-[#ccc] hover:text-white"
                            >
                              🤖 Make ATS Optimized
                            </button>
                          </div>

                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onApplyFix(ann);
                            }}
                            className="w-full mt-3 py-2 bg-[#00FF41] text-black hover:bg-[#00E53B] rounded text-xs font-mono font-black uppercase transition-all flex items-center justify-center gap-1 active:scale-95 shadow cursor-pointer"
                          >
                            <Check className="w-3.5 h-3.5 shrink-0" /> APPLY MODIFIED BULLET TO WORKSPACE
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* TAB 6: RESUME REWRITE */}
        {activeTab === 'rewrite' && (
          <div className="space-y-4 animate-fadeIn">
            <header className="flex justify-between items-center border-b border-[#222] pb-3 mb-2">
              <span className="text-xs font-mono text-[#888] uppercase">Complete Rewritten Template Draft</span>
              <button
                onClick={() => {
                  const blob = new Blob([auditResult.improvedResumeSuggestion], { type: 'text/markdown' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = 'improved_resume_draft.md';
                  a.click();
                  URL.revokeObjectURL(url);
                }}
                className="text-[10px] font-mono bg-[#00FF41]/10 text-[#00FF41] border border-[#00FF41]/30 hover:bg-[#00FF41]/20 rounded px-2.5 py-1 text-white transition active:scale-95 cursor-pointer"
              >
                Download Markdown (.md)
              </button>
            </header>

            <div className="bg-black/60 border border-[#222] p-5 rounded-lg text-xs font-mono text-[#ccc] whitespace-pre-wrap leading-relaxed max-h-[500px] overflow-y-auto select-text break-words">
              {auditResult.improvedResumeSuggestion}
            </div>

            <div className="bg-[#1a1111] border border-red-500/10 rounded-lg p-4 font-mono text-[11px] leading-relaxed text-[#a5a5a5] space-y-2">
              <span className="text-red-500 font-extrabold block uppercase text-xs">Section Improvement Tips:</span>
              <p>Header: Limit formatting clutter, keep email and technical links clean.</p>
              <p>Experience: Start statements with assertive action verbs; avoid passive statements or ChatGPT fluff.</p>
              <p>Education & Skills: Cluster by technical stacks logically to prevent parser keyword fragmentation.</p>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
