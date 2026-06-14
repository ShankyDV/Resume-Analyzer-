import React, { useRef, useState, useEffect } from 'react';
import { 
  Upload, 
  ZoomIn, 
  ZoomOut, 
  Maximize2, 
  FileText, 
  ChevronLeft, 
  ChevronRight, 
  RefreshCw,
  AlertTriangle,
  Sparkles,
  Search,
  Check
} from 'lucide-react';
import { ResumeAnnotation } from '../types';

interface ResumePdfViewerProps {
  resumeText: string;
  onTextExtracted: (text: string, fileName: string, fileType: 'pdf' | 'docx') => void;
  annotations: ResumeAnnotation[];
  selectedAnnotationId: string | null;
  onSelectAnnotation: (id: string) => void;
  isAnalyzing: boolean;
  onApplyFix: (annotation: ResumeAnnotation) => void;
}

interface HighlightBox {
  id: string;
  left: number;
  top: number;
  width: number;
  height: number;
  severity: string;
  annotation: ResumeAnnotation;
}

export default function ResumePdfViewer({
  resumeText,
  onTextExtracted,
  annotations,
  selectedAnnotationId,
  onSelectAnnotation,
  isAnalyzing,
  onApplyFix
}: ResumePdfViewerProps) {
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string>('');
  const [fileType, setFileType] = useState<'pdf' | 'docx' | null>(null);
  
  const [zoom, setZoom] = useState<number>(1.1);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [pdfDoc, setPdfDoc] = useState<any>(null);
  
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [parseProgress, setParseProgress] = useState<string>('');
  const [parsedPagesText, setParsedPagesText] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<'native' | 'interactive'>('interactive');
  
  const [highlightBoxes, setHighlightBoxes] = useState<Record<number, HighlightBox[]>>({});
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const pagesContainerRef = useRef<HTMLDivElement>(null);

  // Clear file URL on unmount
  useEffect(() => {
    return () => {
      if (fileUrl) {
        URL.revokeObjectURL(fileUrl);
      }
    };
  }, [fileUrl]);

  // Handle file select (PDF/DOCX)
  const handleFileChange = async (file: File) => {
    if (!file) return;
    const name = file.name;
    const ext = name.split('.').pop()?.toLowerCase();
    
    if (ext !== 'pdf' && ext !== 'docx') {
      alert('Only .pdf and .docx files are permitted for strict recruiter evaluation.');
      return;
    }
    
    setFileName(name);
    setFileType(ext as 'pdf' | 'docx');
    setParseProgress('Extracting payload content...');
    
    const objectUrl = URL.createObjectURL(file);
    setFileUrl(objectUrl);
    
    if (ext === 'pdf') {
      try {
        const arrayBuffer = await file.arrayBuffer();
        const pdfjsLib = (window as any).pdfjsLib;
        if (!pdfjsLib) {
          throw new Error('PDFJS rendering engine is not ready. Please wait a second.');
        }
        
        pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.worker.min.js';
        
        const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
        const pdf = await loadingTask.promise;
        setPdfDoc(pdf);
        setTotalPages(pdf.numPages);
        setCurrentPage(1);
        
        // Extract text page by page
        let fullText = '';
        const pageTexts: string[] = [];
        for (let i = 1; i <= pdf.numPages; i++) {
          setParseProgress(`Parsing Document Node Page ${i}/${pdf.numPages}...`);
          const page = await pdf.getPage(i);
          const textContent = await page.getTextContent();
          const pageText = textContent.items.map((item: any) => item.str).join(' ');
          fullText += `--- PAGE ${i} ---\n` + pageText + '\n';
          pageTexts.push(pageText);
        }
        
        setParsedPagesText(pageTexts);
        setParseProgress('');
        onTextExtracted(fullText, name, 'pdf');
      } catch (err: any) {
        console.error('PDF parsing error', err);
        setParseProgress(`Error: ${err.message || 'Check logs'}`);
      }
    } else {
      // DOCX parsing via server
      try {
        setParseProgress('Encoding DOCX to Base64 cluster...');
        const base64 = await toBase64(file);
        setParseProgress('Sending payload to Mammoth text parser...');
        
        const response = await fetch('/api/parse-docx', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ base64Data: base64 })
        });
        
        if (!response.ok) {
          throw new Error('Mammoth parser error on backend.');
        }
        
        const data = await response.json();
        setParseProgress('');
        onTextExtracted(data.text, name, 'docx');
      } catch (err: any) {
        console.error(err);
        setParseProgress(`Error: ${err.message || 'Check logs'}`);
      }
    }
  };

  const toBase64 = (file: File): Promise<string> => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const b64 = (reader.result as string).split(',')[1];
      resolve(b64);
    };
    reader.onerror = error => reject(error);
  });

  // Calculate annotation highlight coordinates on Canvas when PDF view rendered
  useEffect(() => {
    if (!pdfDoc || annotations.length === 0 || viewMode !== 'native') {
      setHighlightBoxes({});
      return;
    }

    const calculateBoxes = async () => {
      const boxesMap: Record<number, HighlightBox[]> = {};
      
      for (let pNum = 1; pNum <= totalPages; pNum++) {
        try {
          const page = await pdfDoc.getPage(pNum);
          const textContent = await page.getTextContent();
          
          // Render scaling configuration
          const viewport = page.getViewport({ scale: zoom });
          const pageBoxes: HighlightBox[] = [];
          
          annotations.forEach(ann => {
            const lookFor = ann.resume_text.toLowerCase().trim();
            if (!lookFor) return;
            
            // Search logic inside page's elements
            textContent.items.forEach((item: any) => {
              const str = item.str.toLowerCase().trim();
              if (str && (lookFor.includes(str) || str.includes(lookFor))) {
                // Exact transformation coordinates
                const tx = item.transform[4];
                const ty = item.transform[5];
                const height = item.height || 10;
                const width = item.width || 40;
                
                // Convert PDF space to viewport pixel coordinates
                const [left, top, right, bottom] = viewport.convertToViewportRectangle([
                  tx, 
                  ty, 
                  tx + width, 
                  ty + height
                ]);
                
                pageBoxes.push({
                  id: `${ann.id}-${item.str.slice(0, 5)}`,
                  left: Math.min(left, right),
                  top: Math.min(top, bottom),
                  width: Math.abs(right - left) + 4,
                  height: Math.abs(bottom - top) + 4,
                  severity: ann.severity,
                  annotation: ann
                });
              }
            });
          });
          
          boxesMap[pNum] = pageBoxes;
        } catch (e) {
          console.error('Error matching page coordinates', e);
        }
      }
      
      setHighlightBoxes(boxesMap);
    };
    
    calculateBoxes();
  }, [pdfDoc, annotations, zoom, viewMode, totalPages]);

  // Render PDF to canvas dynamically when parameters change
  useEffect(() => {
    if (!pdfDoc || viewMode !== 'native') return;
    
    const renderPage = async () => {
      try {
        const page = await pdfDoc.getPage(currentPage);
        const canvas = document.getElementById(`pdf-render-canvas-${currentPage}`) as HTMLCanvasElement;
        if (!canvas) return;
        
        const context = canvas.getContext('2d');
        if (!context) return;
        
        const viewport = page.getViewport({ scale: zoom });
        canvas.height = viewport.height;
        canvas.width = viewport.width;
        
        const renderContext = {
          canvasContext: context,
          viewport: viewport
        };
        
        await page.render(renderContext).promise;
      } catch (err) {
        console.error('Error rendering page to canvas', err);
      }
    };
    
    renderPage();
  }, [pdfDoc, currentPage, zoom, viewMode]);

  // Split raw text into simulated sheets for rich interactive text overlay view
  const simulatedPages = React.useMemo(() => {
    if (!resumeText) return [];
    
    // Split text by standard marker or approximate bounds
    const pageSplits = resumeText.split(/--- PAGE \d+ ---/i);
    if (pageSplits.length > 1) {
      return pageSplits.filter(p => p.trim());
    }
    
    // Fallback: Split by character chunks (~1600 characters per letter-size sheet)
    const chunks: string[] = [];
    let remaining = resumeText;
    while (remaining.length > 0) {
      const index = remaining.lastIndexOf('\n', 1700);
      const splitIdx = index !== -1 && index > 300 ? index : 1700;
      chunks.push(remaining.slice(0, splitIdx));
      remaining = remaining.slice(splitIdx);
    }
    return chunks;
  }, [resumeText]);

  // Auto update simulated total pages
  useEffect(() => {
    if (fileType === 'docx' || (fileType === 'pdf' && viewMode === 'interactive')) {
      setTotalPages(simulatedPages.length || 1);
      setCurrentPage(prev => Math.min(prev, simulatedPages.length || 1));
    }
  }, [simulatedPages, fileType, viewMode]);

  // Sorting annotations into interactive offsets to highlight text
  const renderedInteractivePage = () => {
    const pageRawText = simulatedPages[currentPage - 1] || '';
    if (!pageRawText) {
      return <pre className="font-mono text-sm leading-relaxed text-[#EDEDED] whitespace-pre-wrap">Empty page layout.</pre>;
    }

    if (annotations.length === 0) {
      return <pre className="font-mono text-sm leading-relaxed text-slate-800 whitespace-pre-wrap">{pageRawText}</pre>;
    }

    // Match and highlight annotations inside this specific page layout
    const pageAnnotations = annotations
      .map(ann => ({
        ...ann,
        startIndex: pageRawText.indexOf(ann.resume_text),
      }))
      .filter(ann => ann.startIndex !== -1)
      .sort((a, b) => a.startIndex - b.startIndex);

    if (pageAnnotations.length === 0) {
      return <pre className="font-mono text-sm leading-relaxed text-slate-800 whitespace-pre-wrap">{pageRawText}</pre>;
    }

    const segments: React.ReactNode[] = [];
    let cursor = 0;

    pageAnnotations.forEach((ann, idx) => {
      // Avoid overlap nested anomalies
      if (ann.startIndex < cursor) return;

      if (ann.startIndex > cursor) {
        segments.push(
          <span key={`txt-${idx}`} className="whitespace-pre-wrap">
            {pageRawText.slice(cursor, ann.startIndex)}
          </span>
        );
      }

      // Severity visuals
      let borderStyle = 'border-b-2 border-dashed ';
      let bgStyle = '';
      
      if (ann.severity === 'critical') {
        borderStyle += 'border-red-500';
        bgStyle = 'bg-red-500/15 text-red-950 hover:bg-red-500/30 font-semibold rounded-xs';
      } else if (ann.severity === 'high') {
        borderStyle += 'border-orange-500';
        bgStyle = 'bg-orange-500/15 text-orange-950 hover:bg-orange-500/30 font-medium rounded-xs';
      } else if (ann.severity === 'medium') {
        borderStyle += 'border-yellow-500';
        bgStyle = 'bg-yellow-500/15 text-yellow-950 hover:bg-yellow-500/30 rounded-xs';
      } else {
        borderStyle += 'border-green-500';
        bgStyle = 'bg-green-500/15 text-green-950 hover:bg-green-500/30 rounded-xs';
      }

      const isSelected = selectedAnnotationId === ann.id;
      const finalClass = `${borderStyle} ${bgStyle} cursor-pointer px-1 py-0.5 transition-all focus:outline-none select-text ${
        isSelected ? 'ring-2 ring-indigo-500 ring-offset-1 bg-indigo-50 font-bold' : ''
      }`;

      segments.push(
        <span
          key={`ann-${ann.id}`}
          onClick={() => onSelectAnnotation(ann.id)}
          className={finalClass}
          title={`${ann.severity.toUpperCase()} alert: ${ann.reason}`}
        >
          {pageRawText.slice(ann.startIndex, ann.startIndex + ann.resume_text.length)}
        </span>
      );

      cursor = ann.startIndex + ann.resume_text.length;
    });

    if (cursor < pageRawText.length) {
      segments.push(
        <span key="txt-end" className="whitespace-pre-wrap">
          {pageRawText.slice(cursor)}
        </span>
      );
    }

    return (
      <div className="font-sans text-sm leading-relaxed text-slate-800 break-words select-text">
        {segments}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full bg-[#0d0d0d] border border-[#222] rounded-lg overflow-hidden shadow-2xl relative">
      {/* Viewer Action Controls toolbar */}
      <div className="flex flex-wrap items-center justify-between px-4 py-3 bg-[#111] border-b border-[#222] gap-3">
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-[#00FF41]" />
          <span className="text-xs font-mono font-bold text-white shrink-0 truncate max-w-[120px] md:max-w-xs">
            {fileName || 'NO_FILE_LOADED'}
          </span>
          {fileType === 'pdf' && (
            <div className="flex bg-black/40 border border-[#333] rounded px-1.5 py-0.5 gap-1 shrink-0">
              <button
                onClick={() => setViewMode('interactive')}
                className={`text-[9px] font-mono px-2 py-0.5 rounded transition ${
                  viewMode === 'interactive' ? 'bg-[#222] text-white font-bold' : 'text-[#666] hover:text-[#999]'
                }`}
              >
                Interactive
              </button>
              <button
                onClick={() => setViewMode('native')}
                className={`text-[9px] font-mono px-2 py-0.5 rounded transition ${
                  viewMode === 'native' ? 'bg-[#222] text-white font-bold' : 'text-[#666] hover:text-[#999]'
                }`}
              >
                Native PDF
              </button>
            </div>
          )}
        </div>

        {/* Zoom & Page Controllers */}
        {fileUrl && (
          <div className="flex items-center gap-3">
            {/* Zooming */}
            <div className="flex items-center bg-black/40 border border-[#333] rounded">
              <button
                onClick={() => setZoom(prev => Math.max(0.6, prev - 0.1))}
                className="p-1 hover:text-white text-[#888] transition"
                title="Zoom Out"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <span className="text-[10px] font-mono select-none px-2 text-[#aaa]">
                {Math.round(zoom * 100)}%
              </span>
              <button
                onClick={() => setZoom(prev => Math.min(2.0, prev + 0.1))}
                className="p-1 hover:text-white text-[#888] transition"
                title="Zoom In"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Pagination */}
            <div className="flex items-center bg-black/40 border border-[#333] rounded">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-1 hover:text-white text-[#888] disabled:opacity-30 disabled:hover:text-[#888] transition"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <span className="text-[10px] font-mono select-none px-2 text-[#aaa]">
                {currentPage}/{totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-1 hover:text-white text-[#888] disabled:opacity-30 disabled:hover:text-[#888] transition"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Main Drag-Drag Uploader or Canvas Viewport */}
      <div 
        ref={containerRef}
        className={`flex-1 overflow-auto p-4 md:p-8 relative flex flex-col items-center min-h-[420px] transition-colors ${
          isDragging ? 'bg-[#00FF41]/5 border-2 border-dashed border-[#00FF41]' : 'bg-black/80'
        }`}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragging(false);
          if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFileChange(e.dataTransfer.files[0]);
          }
        }}
      >
        {parseProgress && (
          <div className="absolute inset-0 z-50 bg-[#0d0d0dc0] flex flex-col justify-center items-center text-center p-6 backdrop-blur-xs select-none">
            <RefreshCw className="w-8 h-8 text-[#00FF41] animate-spin mb-4" />
            <span className="text-xs font-mono text-white tracking-widest uppercase">{parseProgress}</span>
          </div>
        )}

        {!fileUrl ? (
          /* High-fidelity empty-state file dropzone */
          <div className="my-auto flex flex-col items-center justify-center p-8 text-center max-w-sm">
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="w-16 h-16 bg-gradient-to-br from-[#00FF41]/10 to-transparent border border-[#00FF41]/20 rounded-2xl flex items-center justify-center text-[#00FF41] mb-6 cursor-pointer hover:border-[#00FF41]/50 hover:bg-[#00FF41]/20 transition-all group scale-100 hover:scale-105"
            >
              <Upload className="w-8 h-8 group-hover:animate-bounce" />
            </div>

            <h3 className="text-sm font-bold text-white mb-2">Upload Candidate File Resume</h3>
            <p className="text-xs text-[#666] leading-relaxed mb-6 font-mono">
              Drag and drop .pdf or .docx formatting file. Interactive analysis is calculated instantly.
            </p>

            <button 
              onClick={() => fileInputRef.current?.click()}
              className="py-2.5 px-6 rounded bg-[#111] border border-[#333] hover:border-[#00FF41] text-[#aaa] hover:text-white font-mono text-xs uppercase tracking-wider transition-all cursor-pointer active:scale-95"
            >
              Select File Node
            </button>
            
            <input 
              type="file"
              ref={fileInputRef}
              onChange={(e) => e.target.files && handleFileChange(e.target.files[0])}
              accept=".pdf,.docx"
              className="hidden"
            />
          </div>
        ) : (
          /* Actual Sheet Document Display (Letter proportions, elegant offset layout) */
          <div ref={pagesContainerRef} className="my-auto relative max-w-full">
            {viewMode === 'native' && fileType === 'pdf' ? (
              /* PDF rendering layered with custom coordinate overlay matches */
              <div 
                className="relative bg-white shadow-2xl rounded-xs border border-slate-200 overflow-hidden"
                style={{ width: 'fit-content', height: 'fit-content' }}
              >
                {/* PDF rendering Canvas node */}
                <canvas id={`pdf-render-canvas-${currentPage}`} className="mx-auto block" />
                
                {/* Smart highlight annotation coordinate overlay triggers */}
                <div className="absolute inset-0 pointer-events-none select-none overflow-hidden">
                  {(highlightBoxes[currentPage] || []).map((box) => {
                    const isSelected = selectedAnnotationId === box.annotation.id;
                    const styleColors = 
                      box.severity === 'critical' ? 'bg-red-500/25 border-red-500 hover:bg-red-500/40' :
                      box.severity === 'high' ? 'bg-orange-500/25 border-orange-500 hover:bg-orange-500/40' :
                      box.severity === 'medium' ? 'bg-amber-400/25 border-amber-400 hover:bg-amber-400/40' :
                      'bg-green-500/25 border-green-500 hover:bg-green-500/40';

                    return (
                      <div
                        key={box.id}
                        onClick={() => onSelectAnnotation(box.annotation.id)}
                        className={`absolute border border-dashed cursor-pointer pointer-events-auto transition rounded-xs ${styleColors} ${
                          isSelected ? 'ring-2 ring-indigo-500 ring-offset-2 scale-102' : ''
                        }`}
                        style={{
                          left: `${box.left}px`,
                          top: `${box.top}px`,
                          width: `${box.width}px`,
                          height: `${box.height}px`,
                        }}
                        title={`Feedback: ${box.annotation.reason}`}
                      />
                    );
                  })}
                </div>
              </div>
            ) : (
              /* Paper design visual simulator (Interactive rewrite mode) with direct text highlight actions */
              <div 
                className="bg-white text-slate-900 shadow-2xl p-10 md:p-14 border border-slate-300 rounded-sm leading-relaxed tracking-wide aspect-[1/1.414]"
                style={{ 
                  width: '100%', 
                  maxWidth: `${680 * zoom}px`, 
                  minHeight: `${850 * zoom}px`,
                  fontSize: `${14 * zoom}px` 
                }}
              >
                <div className="flex flex-col h-full justify-between">
                  <div className="flex-1">
                    {renderedInteractivePage()}
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono tracking-widest text-center mt-12 pt-6 border-t border-slate-100 select-none flex justify-between items-center">
                    <span>{fileName.toUpperCase()} // SYS_PAGINATE</span>
                    <span>PAGE {currentPage} OF {totalPages}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Workspace Footer status indicators */}
      <div className="px-4 py-2 bg-[#0c0c0c] border-t border-[#222] flex items-center justify-between text-[10px] font-mono text-[#555]">
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-[#00FF41]"></span>
          <span>DISP_NODE_ONLINE</span>
        </div>
        {fileUrl && (
          <button 
            onClick={() => {
              setFileUrl(null);
              setFileName('');
              setFileType(null);
              setPdfDoc(null);
              setParsedPagesText([]);
            }}
            className="text-red-500 hover:text-red-400 transition"
          >
            DISCONNECT_FILE
          </button>
        )}
      </div>
    </div>
  );
}
