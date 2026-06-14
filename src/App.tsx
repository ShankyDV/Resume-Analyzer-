import React, { useState, useEffect, useRef } from 'react';
import { 
  FileText, 
  Sparkles, 
  Terminal, 
  TrendingUp, 
  UserCheck, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle, 
  MessageSquare, 
  Send, 
  RefreshCw, 
  Sliders, 
  ShieldAlert, 
  Check, 
  ArrowRight,
  ChevronRight,
  ChevronLeft,
  X,
  Plus,
  Info,
  Layers,
  Award,
  BookOpen,
  Play,
  Download,
  DownloadCloud
} from 'lucide-react';
import { SAMPLE_RESUMES, SampleResumePreset } from './components/SampleResumes';
import { 
  ResumeTarget, 
  RecruiterAuditResponse, 
  ResumeAnnotation, 
  ChatMessage 
} from './types';

// Import our beautifully modularized components
import ResumePdfViewer from './components/ResumePdfViewer';
import ReviewTabs from './components/ReviewTabs';
import SidebarChat from './components/SidebarChat';

export default function App() {
  // Input workspace state
  const [resumeText, setResumeText] = useState<string>('');
  const [targetRole, setTargetRole] = useState<string>('Senior Software Engineer');
  const [companyType, setCompanyType] = useState<ResumeTarget['companyType']>('faang');
  const [companyName, setCompanyName] = useState<string>('Google');
  const [yearsOfExp, setYearsOfExp] = useState<string>('5');
  
  // Resizable layout split percentage state (Left Pane width %)
  const [splitPercent, setSplitPercent] = useState<number>(() => {
    const saved = localStorage.getItem('resume_split_percentage');
    return saved ? parseFloat(saved) : 50;
  });
  
  // Chat console open/close state
  const [isChatExpanded, setIsChatExpanded] = useState<boolean>(() => {
    const saved = localStorage.getItem('chat_panel_expanded');
    return saved !== 'false';
  });

  // Analysis status indicators
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [progressPercent, setProgressPercent] = useState<number>(0);
  const [progressStage, setProgressStage] = useState<string>('Initializing analysis sequence...');
  const [auditResult, setAuditResult] = useState<RecruiterAuditResponse | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [optimizingId, setOptimizingId] = useState<string | null>(null);
  
  // Selected warning zone highlighter ID anchor
  const [selectedAnnotationId, setSelectedAnnotationId] = useState<string | null>(null);

  // Chat message thread histories
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [isTypingChat, setIsTypingChat] = useState<boolean>(false);

  // Auto save chat expansion states
  useEffect(() => {
    localStorage.setItem('chat_panel_expanded', String(isChatExpanded));
  }, [isChatExpanded]);

  // Load preset helper
  const handleLoadPreset = (preset: SampleResumePreset) => {
    setResumeText(preset.text.trim());
    setTargetRole(preset.role);
    setCompanyType(preset.companyType);
    setYearsOfExp(preset.experience);
    if (preset.companyType === 'faang') {
      setCompanyName('Google');
    } else if (preset.companyType === 'startup') {
      setCompanyName('Hypergrowth AI');
    } else {
      setCompanyName('');
    }
    // Clean out previous audit results when moving to next preset
    setAuditResult(null);
    setSelectedAnnotationId(null);
  };

  // On first mount, boot with the initial sample profile template so the editor isn't blank
  useEffect(() => {
    handleLoadPreset(SAMPLE_RESUMES[0]);
  }, []);

  // Drag resizing handlers for split design
  const handleDividerMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    const handleMouseMove = (moveEvent: MouseEvent) => {
      const selectionPercent = (moveEvent.clientX / window.innerWidth) * 100;
      if (selectionPercent > 20 && selectionPercent < 80) {
        setSplitPercent(selectionPercent);
      }
    };
    const handleMouseUp = () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  // Persists split size percentage configuration
  useEffect(() => {
    localStorage.setItem('resume_split_percentage', String(splitPercent));
  }, [splitPercent]);

  // Extract text from drag-dropped files
  const handleUploadedText = (text: string, fileName: string, type: 'pdf' | 'docx') => {
    setResumeText(text);
    setErrorMsg(null);
    // Auto initiate auditing once file finishes loading successfully!
    setTimeout(() => {
      triggerAudit(text);
    }, 400);
  };

  // Execute resume audit API call
  const triggerAudit = async (customText?: string) => {
    const rawContent = customText || resumeText;
    if (!rawContent.trim()) {
      setErrorMsg('Please enter, paste, or upload your resume before launching the recruiter audit.');
      return;
    }

    setIsAnalyzing(true);
    setProgressPercent(0);
    setProgressStage('Initializing elite analysis sequence...');
    setErrorMsg(null);

    // Active client-side high-fidelity loading timer
    const progressInterval = setInterval(() => {
      setProgressPercent((prev) => {
        if (prev >= 95) {
          clearInterval(progressInterval);
          return 95;
        }
        
        // Define stages based on percentage values
        const next = prev + Math.floor(Math.random() * 8) + 2;
        if (next < 15) {
          setProgressStage('Parsing uploaded resume payload structure...');
        } else if (next < 35) {
          setProgressStage('Extracting layout modules & section blocks...');
        } else if (next < 55) {
          setProgressStage('Cross-referencing ATS target keyword densities...');
        } else if (next < 75) {
          setProgressStage('Triggering harsh recruitment evaluation roasts...');
        } else if (next < 92) {
          setProgressStage('Evaluating project appeal vs. simple boilerplate CRUD templates...');
        } else {
          setProgressStage('Synthesizing actionable bullet-fix checklist reports...');
        }
        return next;
      });
    }, 180);

    try {
      const response = await fetch('/api/audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resume: { rawText: rawContent },
          targets: {
            role: targetRole,
            companyType,
            companyName,
            yearsOfExperience: yearsOfExp
          }
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to audit resume. Server responded: ${response.statusText}`);
      }

      const data: RecruiterAuditResponse = await response.json();
      
      // Stop timer, quickly finish progress bar
      clearInterval(progressInterval);
      setProgressPercent(100);
      setProgressStage('Analysis complete! Injecting report logs...');
      
      setTimeout(() => {
        setAuditResult(data);
        setIsAnalyzing(false);

        // Select first critical or high annotation if present
        if (data.annotations && data.annotations.length > 0) {
          const primary = data.annotations.find(a => a.severity === 'critical' || a.severity === 'high') || data.annotations[0];
          setSelectedAnnotationId(primary.id);
        } else {
          setSelectedAnnotationId(null);
        }

        // Welcome introduction greeting inside recruiter chat panel
        setChatHistory([
          {
            id: 'system-initial',
            role: 'assistant',
            content: `🚨 **AUDIT COMPLETE** 🚨\n\nI indexed your file against parameters for **${targetRole}** at **${companyName || companyType.toUpperCase()}**.\n\nMy decision: **${data.hiringDecision}**.\n\nI flagged **${data.annotations?.length || 0} issues** on your resume. Inspect them in the highlighting overlay, click to repair, or direct me to write Staff-level rewrites below!`,
            timestamp: new Date().toLocaleTimeString()
          }
        ]);
      }, 300);

    } catch (err: any) {
      clearInterval(progressInterval);
      console.error(err);
      setErrorMsg(err.message || 'Server connection timed out or failed to parse.');
      setIsAnalyzing(false);
    }
  };

  // Apply quick action bullet replacement inside resumeText
  const handleApplyFix = (annotation: ResumeAnnotation) => {
    if (!annotation.improved_text) return;

    const index = resumeText.indexOf(annotation.resume_text);
    if (index !== -1) {
      const updated = resumeText.slice(0, index) + annotation.improved_text + resumeText.slice(index + annotation.resume_text.length);
      setResumeText(updated);

      // Filter out the corrected item from our active local highlights
      if (auditResult) {
        const remaining = auditResult.annotations.filter(a => a.id !== annotation.id);
        const updatedAudit = { ...auditResult, annotations: remaining };
        setAuditResult(updatedAudit);

        if (remaining.length > 0) {
          setSelectedAnnotationId(remaining[0].id);
        } else {
          setSelectedAnnotationId(null);
        }
      }

      // Append log message confirmation to chat
      const logMsg: ChatMessage = {
        id: `fix-${Date.now()}`,
        role: 'assistant',
        content: `✅ **Applied interactive rewrite fix for [${annotation.issue_type.toUpperCase()}]** alert:\n\n*Applied replacement text:* "${annotation.improved_text}"\n\n*(Recalculate your final grade scores by launching an audit again!)*`,
        timestamp: new Date().toLocaleTimeString()
      };
      setChatHistory(prev => [...prev, logMsg]);
    } else {
      alert('The original phrase was edited manually in the draft sheet. Modify it inside the text editor slate directly.');
    }
  };

  // Call the interactive multi-style optimizer API
  const handleOptimizeBullet = async (annotation: ResumeAnnotation, style: 'technical' | 'impact' | 'ats' | 'alternative') => {
    setOptimizingId(annotation.id);
    try {
      const response = await fetch('/api/bullet-rewrite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          original: annotation.resume_text,
          style,
          role: targetRole,
          companyType
        })
      });

      if (!response.ok) throw new Error('Could not optimize bullet on server.');
      
      const data = await response.json();
      
      // Update the corrected text locally inside our audit result annotations schema so they can click apply
      if (auditResult) {
        const updated = auditResult.annotations.map(a => {
          if (a.id === annotation.id) {
            return { ...a, improved_text: data.rewrote };
          }
          return a;
        });
        setAuditResult({ ...auditResult, annotations: updated });
      }
    } catch (e: any) {
      alert(`Bulleted optimizer error: ${e.message}`);
    } finally {
      setOptimizingId(null);
    }
  };

  // Send messaging text inside chatbot connector
  const handleSendChat = async (messageText: string) => {
    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      role: 'user',
      content: messageText,
      timestamp: new Date().toLocaleTimeString()
    };
    
    setChatHistory(prev => [...prev, userMsg]);
    setIsTypingChat(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...chatHistory, userMsg].map(m => ({ role: m.role, content: m.content })),
          resume: resumeText,
          targets: {
            role: targetRole,
            companyType,
            companyName,
            yearsOfExperience: yearsOfExp
          },
          auditContext: auditResult ? {
            hiringDecision: auditResult.hiringDecision,
            scores: auditResult.scores,
            roast: auditResult.roast
          } : null
        })
      });

      if (!response.ok) throw new Error('Server issues delivering chat feedback.');
      
      const data = await response.json();
      const recruiterMsg: ChatMessage = {
        id: `r-${Date.now()}`,
        role: 'assistant',
        content: data.content,
        timestamp: new Date().toLocaleTimeString()
      };
      setChatHistory(prev => [...prev, recruiterMsg]);
    } catch (err: any) {
      setChatHistory(prev => [...prev, {
        id: `err-${Date.now()}`,
        role: 'assistant',
        content: `⚠️ Chat interrupted: ${err.message || 'Internal connection fault'}`,
        timestamp: new Date().toLocaleTimeString()
      }]);
    } finally {
      setIsTypingChat(false);
    }
  };

  // Export report modules in direct JSON / HTML formats
  const handleExportFeatures = (type: 'json-full' | 'json-annot' | 'markdown' | 'report') => {
    if (!auditResult) return;
    
    let contents = '';
    let isName = 'export';
    let mimeType = 'text/plain';

    if (type === 'json-full') {
      contents = JSON.stringify(auditResult, null, 2);
      isName = 'recruiter_audit_report.json';
      mimeType = 'application/json';
    } else if (type === 'json-annot') {
      contents = JSON.stringify(auditResult.annotations, null, 2);
      isName = 'resume_annotations.json';
      mimeType = 'application/json';
    } else if (type === 'markdown') {
      contents = auditResult.improvedResumeSuggestion;
      isName = 'improved_resume_draft.md';
      mimeType = 'text/markdown';
    } else if (type === 'report') {
      contents = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Accredited Recruiter Analysis Report</title>
  <style>
    body { font-family: system-ui, -apple-system, sans-serif; padding: 40px; color: #1e293b; background: #faf9f6; line-height: 1.5; }
    .card { background: white; border: 1px solid #e2e8f0; border-radius: 12px; padding: 30px; margin-bottom: 24px; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.05); }
    h1 { color: #cc0f0f; margin-top: 0; border-bottom: 2px solid #e2e8f0; padding-bottom: 12px; }
    .score { font-size: 28px; font-weight: 900; color: #10b981; }
    .roast { background: #fef2f2; border-left: 4px solid #ef4444; color: #991b1b; padding: 16px; font-family: monospace; border-radius: 4px; }
    .annotation { border-left: 3px dashed #f59e0b; padding-left: 14px; margin: 16px 0; }
  </style>
</head>
<body>
  <div class="card">
    <h1>ELITE TECHNICAL RECRUITER ACCREDITATION REPORT</h1>
    <p><strong>Proposed Target Profile:</strong> ${targetRole} (${yearsOfExp} Years experience)</p>
    <p><strong>Hiring Verdict:</strong> ${auditResult.hiringDecision}</p>
    <p class="score">Calculated overall Hireability: ${auditResult.scores.overallHireability * 10}/100</p>
    <div class="roast">
      <strong>BRUTAL ROAST STREAM LOG:</strong>
      <p style="white-space: pre-wrap; margin-top: 8px;">${auditResult.roast}</p>
    </div>
  </div>
  
  <div class="card">
    <h2>EXPERIENCE AUDIT LOGS</h2>
    ${auditResult.annotations.map(a => `
      <div class="annotation">
        <p><strong>[${a.severity.toUpperCase()}] ${a.issue_type.toUpperCase()} alert</strong></p>
        <p><em>Segment:</em> "${a.resume_text}"</p>
        <p><em>Reason:</em> ${a.reason}</p>
        <p><em>Suggested Rewrite:</em> ${a.improved_text}</p>
      </div>
    `).join('')}
  </div>
</body>
</html>
      `;
      isName = 'recruiter_evaluation_report.html';
      mimeType = 'text/html';
    }

    const blob = new Blob([contents], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = isName;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-[#050505] text-[#EDEDED] font-sans flex flex-col antialiased">
      
      {/* Top Header Panel Status */}
      <header className="border-b border-[#222] bg-[#0c0c0c] px-6 py-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shrink-0 shadow-md">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#00FF41] animate-pulse"></span>
            <span className="text-[10px] font-mono tracking-widest text-[#666] uppercase">SYS_ACTIVE_NODE // RES_AUDITOR_ELITE_PRO v6</span>
          </div>
          <h1 className="text-xl md:text-2xl font-black tracking-tight text-white uppercase flex items-center gap-1">
            RECRUITER <span className="text-[#00FF41]">RESUME_AUDITOR</span>
          </h1>
        </div>

        {/* Quick presets selectors */}
        <div className="flex flex-wrap items-center gap-2.5">
          <span className="text-[10px] font-mono text-[#666] uppercase">Presets loading:</span>
          <div className="flex gap-1.5">
            {SAMPLE_RESUMES.map((preset) => (
              <button
                key={preset.id}
                onClick={() => handleLoadPreset(preset)}
                className="text-[10px] font-mono bg-[#111] hover:bg-[#222] border border-[#333] hover:border-white/20 text-[#aaa] hover:text-white px-2.5 py-1 rounded transition-all active:scale-95 cursor-pointer"
              >
                {preset.name.split(' (')[0]}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Main split-screen container workspace */}
      <div className="flex-1 w-full max-w-7xl mx-auto p-4 md:p-6 flex flex-col gap-5 overflow-hidden">
        
        {/* Objectives setup */}
        <section className="bg-[#111] border border-[#222] rounded-lg p-4 grid grid-cols-2 md:grid-cols-4 gap-4 shadow-lg shrink-0">
          <div className="flex flex-col gap-1">
            <label className="text-[10px] uppercase font-mono text-[#666]">Proposed Job Title</label>
            <input
              type="text"
              value={targetRole}
              onChange={(e) => setTargetRole(e.target.value)}
              placeholder="e.g. Lead Devops Architect"
              className="bg-[#181818] border border-[#333] hover:border-[#444] rounded px-3 py-1.5 text-xs text-white focus:outline-none focus:border-[#00FF41] font-mono transition-all"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[10px] uppercase font-mono text-[#666]">Hiring Company profile</label>
            <select
              value={companyType}
              onChange={(e) => setCompanyType(e.target.value as ResumeTarget['companyType'])}
              className="bg-[#181818] border border-[#333] hover:border-[#444] rounded px-3 py-1.5 text-xs text-white focus:outline-none focus:border-[#00FF41] font-mono transition-all"
            >
              <option value="general">General Enterprise</option>
              <option value="faang">FAANG Enterprise</option>
              <option value="tier2">Tier-2 Scaleup</option>
              <option value="startup">Hypergrowth VC Startup</option>
              <option value="finance">Quant Trading Firm</option>
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[10px] uppercase font-mono text-[#666]">Target Company name</label>
            <input
              type="text"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder="Google, Stripe"
              className="bg-[#181818] border border-[#333] hover:border-[#444] rounded px-3 py-1.5 text-xs text-white focus:outline-none focus:border-[#00FF41] font-mono transition-all"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[10px] uppercase font-mono text-[#666]">Experience node years</label>
            <input
              type="number"
              value={yearsOfExp}
              onChange={(e) => setYearsOfExp(e.target.value)}
              placeholder="e.g. 6"
              className="bg-[#181818] border border-[#333] hover:border-[#444] rounded px-3 py-1.5 text-xs text-white focus:outline-none focus:border-[#00FF41] font-mono transition-all"
            />
          </div>
        </section>

        {/* Global body and split workspace pane */}
        <div className="flex-1 flex flex-col lg:flex-row items-stretch overflow-hidden relative gap-4">
          
          {isAnalyzing ? (
            /* High-fidelity full analytical loading terminal percentages stage */
            <div className="flex-1 bg-black border border-[#222] rounded-lg p-8 flex flex-col justify-center items-center min-h-[480px]">
              <div className="w-20 h-20 relative flex items-center justify-center mb-6 select-none">
                <div className="absolute inset-0 rounded-full border-4 border-[#111] animate-pulse"></div>
                <div className="absolute inset-0 border-4 border-t-[#00FF41] border-r-transparent border-l-transparent rounded-full animate-spin"></div>
                <Sparkles className="w-8 h-8 text-[#00FF41]" />
              </div>

              <div className="text-center max-w-md w-full space-y-4">
                <h3 className="text-xs font-bold tracking-widest text-[#00FF41] font-mono uppercase">RUNNING STRICT COMPLIANCE EVALUATION...</h3>
                
                {/* Real-time Percentage layout */}
                <div className="space-y-1">
                  <div className="flex justify-between items-baseline font-mono text-xs text-[#888]">
                    <span>STAGE: {progressStage}</span>
                    <span className="text-white font-extrabold text-sm">{progressPercent}%</span>
                  </div>
                  <div className="w-full bg-[#111] border border-[#333] h-3 rounded overflow-hidden">
                    <div className="bg-[#00FF41] h-full transition-all duration-300" style={{ width: `${progressPercent}%` }}></div>
                  </div>
                </div>

                <p className="text-[10px] font-mono text-[#555] uppercase leading-relaxed bg-black/40 border border-[#222] p-3 rounded">
                  Checking for unmeasured bullets, tutoring project templates, and generic vocabulary fluff...
                </p>
              </div>
            </div>
          ) : (
            /* Dual-pane responsive resizable workspace */
            <div className="flex-1 flex flex-col lg:flex-row items-stretch overflow-hidden relative select-none">
              
              {/* Left Pane: Interactive Document File workspace */}
              <div 
                style={{ width: window.innerWidth >= 1024 ? `${splitPercent}%` : '100%' }} 
                className="flex flex-col shrink-0 min-h-[380px] lg:h-full overflow-hidden"
              >
                <ResumePdfViewer 
                  resumeText={resumeText}
                  onTextExtracted={handleUploadedText}
                  annotations={auditResult?.annotations || []}
                  selectedAnnotationId={selectedAnnotationId}
                  onSelectAnnotation={setSelectedAnnotationId}
                  isAnalyzing={isAnalyzing}
                  onApplyFix={handleApplyFix}
                />
              </div>

              {/* Desktop Drag-resizing bar divider */}
              <div 
                className="hidden lg:flex w-1.5 hover:bg-[#00FF41] bg-[#111] active:bg-[#00E53B] transition-colors cursor-col-resize shrink-0 h-full relative items-center justify-center border-x border-[#222]"
                onMouseDown={handleDividerMouseDown}
                title="Drag split layout (Use 30:70 / 50:50 / 70:30 splits below)"
              >
                {/* Floating resize indicator lines */}
                <div className="h-6 w-0.5 bg-neutral-600" />
              </div>

              {/* Right Pane: Bento evaluation tabs and charts */}
              <div 
                style={{ width: window.innerWidth >= 1024 ? `${100 - splitPercent}%` : '100%' }}
                className="flex-1 flex flex-col overflow-hidden"
              >
                {auditResult ? (
                  <div className="flex-1 flex flex-col overflow-hidden">
                    {/* Exporters and Layout Splits triggers bar header */}
                    <header className="flex flex-wrap gap-2 items-center justify-between px-3 py-2 bg-[#0c0c0c] border border-b-0 border-[#222] rounded-t-lg shrink-0 text-[10px] font-mono">
                      
                      {/* Split quick presets selectors */}
                      <div className="flex items-center gap-1.5 select-none">
                        <span className="text-[#666] uppercase">Splits:</span>
                        <div className="flex gap-1">
                          {[30, 50, 70].map(s => (
                            <button
                              key={s}
                              onClick={() => setSplitPercent(s)}
                              className={`px-1.5 py-0.5 rounded transition ${
                                splitPercent === s 
                                  ? 'bg-[#222] text-[#00FF41] font-bold border border-[#00FF41]/20' 
                                  : 'text-[#555] hover:text-[#bbb] border border-transparent'
                              }`}
                            >
                              {s === 30 ? '30:70' : s === 50 ? '50:50' : '70:30'}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Exporters trigger menu dropdown list */}
                      <div className="flex items-center gap-1.5">
                        <span className="text-[#666] uppercase">Export:</span>
                        <button
                          onClick={() => handleExportFeatures('report')}
                          className="px-2 py-0.5 bg-black hover:bg-[#1E1E1E] text-white border border-[#2d2d2d] hover:border-white/25 rounded transition hover:text-[#00FF41]"
                          title="Print/Download high format HTML report page"
                        >
                          Visual PDF Report
                        </button>
                        <button
                          onClick={() => handleExportFeatures('markdown')}
                          className="px-2 py-0.5 bg-black hover:bg-[#1E1E1E] text-white border border-[#2d2d2d] hover:border-white/25 rounded transition"
                          title="Download sugered rewritten version"
                        >
                          Revised Resume
                        </button>
                        <button
                          onClick={() => handleExportFeatures('json-full')}
                          className="px-2 py-0.5 bg-black hover:bg-[#1E1E1E] text-white border border-[#2d2d2d] hover:border-white/25 rounded transition"
                          title="Save complete metrics audit schema"
                        >
                          JSON Report
                        </button>
                      </div>

                    </header>

                    {/* Left view modules tabs panel */}
                    <div className="flex-1 overflow-hidden">
                      <ReviewTabs 
                        auditResult={auditResult}
                        selectedAnnotationId={selectedAnnotationId}
                        onSelectAnnotation={setSelectedAnnotationId}
                        onApplyFix={handleApplyFix}
                        onOptimizeBullet={handleOptimizeBullet}
                        optimizingId={optimizingId}
                      />
                    </div>
                  </div>
                ) : (
                  /* Initial landing panel description guides */
                  <div className="flex-1 bg-[#111] border border-[#222] rounded-lg p-6 flex flex-col justify-center items-center text-center shadow-inner select-none min-h-[350px]">
                    <div className="w-14 h-14 bg-gradient-to-br from-[#00FF41]/10 to-transparent border border-[#00FF41]/20 rounded-2xl flex items-center justify-center text-[#00FF41] mb-5">
                      <Sliders className="w-7 h-7 animate-pulse" />
                    </div>

                    <div className="max-w-md">
                      <h2 className="text-sm font-bold text-white uppercase tracking-wider mb-2">Configure target directives & click run audit</h2>
                      <p className="text-xs text-[#666] leading-relaxed mb-6 font-mono">
                        Upload your candidate formatting block. The elite recruiter auditor analyzes gaps, calculates risk percentage densities, and produces step action plans instantly.
                      </p>

                      <div className="grid grid-cols-2 gap-3 text-left leading-tight">
                        <div className="bg-[#0c0c0c] border border-[#222] p-3 rounded">
                          <span className="text-[#00FF41] font-bold font-mono text-[10px] block mb-1">15S FAST REVIEW</span>
                          <span className="text-[10px] text-[#666]">Read blunt hiring decisions and competitive market roasts.</span>
                        </div>
                        <div className="bg-[#0c0c0c] border border-[#222] p-3 rounded">
                          <span className="text-red-500 font-bold font-mono text-[10px] block mb-1">INTERACTIVE FIXER</span>
                          <span className="text-[10px] text-[#666]">Apply structural optimizations immediately to the workspace.</span>
                        </div>
                      </div>
                      
                      {/* Text fallback manual typing audit button */}
                      {resumeText.trim() && (
                        <button
                          onClick={() => triggerAudit()}
                          className="w-full mt-6 py-2.5 bg-[#00FF41] hover:bg-[#00E53B] text-black font-mono font-bold text-xs uppercase rounded transition active:scale-95 cursor-pointer"
                        >
                          Audit Existing Text Draft ({resumeText.length} characters)
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>

            </div>
          )}

          {/* Interactive help recruitment chat sidebar (Collapsible console) */}
          <div className="shrink-0 h-full flex flex-col overflow-hidden">
            <SidebarChat 
              chatHistory={chatHistory}
              isExpanded={isChatExpanded}
              onToggleExpand={() => setIsChatExpanded(!isChatExpanded)}
              onSendMessage={handleSendChat}
              isTyping={isTypingChat}
            />
          </div>

        </div>

      </div>

      {/* Floating chat help toggle triggers inside desktop when sidebar is hidden */}
      {!isChatExpanded && !isAnalyzing && (
        <button
          onClick={() => setIsChatExpanded(true)}
          className="hidden lg:flex fixed bottom-6 right-6 z-40 bg-[#111] hover:bg-[#1E1E1E] border border-[#333] hover:border-[#00FF41] text-[#fff] shadow-2xl p-4.5 rounded-full items-center justify-center transition-all animate-bounce cursor-pointer group"
          title="Open Recruiter Chat Console (Ctrl+B / Cmd+B)"
        >
          <MessageSquare className="w-5 h-5 text-[#00FF41] group-hover:scale-105" />
        </button>
      )}

      {errorMsg && (
        <div className="fixed bottom-6 left-6 z-50 max-w-sm bg-red-950/90 border-2 border-[#FF4444] text-red-200 p-4 rounded-lg shadow-2xl flex gap-3 items-start font-mono text-xs">
          <AlertTriangle className="w-5 h-5 text-[#FF4444] shrink-0" />
          <div className="space-y-1">
            <span className="font-extrabold uppercase text-[#FF4444] block">AUDIT_CRITICAL_ERROR</span>
            <p>{errorMsg}</p>
          </div>
          <button onClick={() => setErrorMsg(null)} className="text-red-400 hover:text-white shrink-0 p-0.5 ml-auto">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Bottom Footer indicator system details */}
      <footer className="border-t border-[#222] bg-[#0c0c0c] px-6 py-3.5 flex flex-col md:flex-row justify-between items-center text-[10px] font-mono text-[#444] uppercase tracking-wider shrink-0 gap-3 select-none">
        <div>[ System: SHA-256 ] [ Mode: STRICT_EVALUE ] [ Connection: SECURE ]</div>
        <div className="text-white">© 2026 RECRUITER AI AUDITOR // POWERED BY GEMINI 3.5</div>
      </footer>

    </div>
  );
}
