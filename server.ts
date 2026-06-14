import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';
import mammoth from 'mammoth';

// Load environment variables
dotenv.config();

const app = express();
const PORT = 3000;

// Enable JSON body parsing with a 10MB limit (higher limit to support PDF/DOCX base64 uploads)
app.use(express.json({ limit: '10mb' }));

// Lazy initializer for Gemini client to prevent crash on startup if key is missing
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      throw new Error('GEMINI_API_KEY environment variable is required. Please add it to your Secrets in Google AI Studio.');
    }
    aiClient = new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiClient;
}

// -------------------------------------------------------------
// DOCX PARSLING ENDPOINT
// -------------------------------------------------------------
app.post('/api/parse-docx', async (req, res) => {
  try {
    const { base64Data } = req.body;
    if (!base64Data) {
      return res.status(400).json({ error: 'base64Data is required.' });
    }
    const buffer = Buffer.from(base64Data, 'base64');
    const result = await mammoth.extractRawText({ buffer });
    res.json({ text: result.value, warnings: result.messages });
  } catch (err: any) {
    console.error('DOCX parsing error:', err);
    res.status(500).json({ error: err.message || 'Error occurred while parsing DOCX.' });
  }
});

// -------------------------------------------------------------
// INTERACTIVE BULLET REWRITE/ENHANCER ENDPOINT
// -------------------------------------------------------------
app.post('/api/bullet-rewrite', async (req, res) => {
  try {
    const { original, style, role, companyType } = req.body;
    
    if (!original) {
      return res.status(400).json({ error: 'Original bullet text is required.' });
    }

    const ai = getGeminiClient();
    
    const styleDescriptions = {
      technical: 'unashamedly elite technical phrasing, focusing on architectural patterns, framework mechanisms, systems bottlenecks. Show Deep Engineering maturity.',
      impact: 'extremely hyper-focused on quantified business metrics, dollar-amounts, scale factors, conversion increases, and top-line impacts.',
      ats: 'dense with critical industry, tooling, and technical keywords matching typical applicant tracking systems for the target role.',
      alternative: 'an elegant, high-impact direct improvement following the professional Action + Scope + Impact + Result standard.'
    };

    const styleDesc = styleDescriptions[style as keyof typeof styleDescriptions] || styleDescriptions.alternative;

    const rewritePrompt = `You are an elite Tech Recruiter, Career Coach, and Hiring Partner. 
Rewrite the following specific resume bullet point or sentence:
"${original}"

STYLING GUIDELINE: ${styleDesc}
TARGET ROLE: ${role || 'Software Engineer'}
TARGET COMPANY PROFILE: ${companyType || 'FAANG/Tier-1 Hypergrowth Starups'}

REQUIREMENTS:
1. Return ONLY the rewritten bullet point / sentence text itself.
2. DO NOT include introductory text (e.g. "Here is the rewrite:"), explaining, or packaging tags.
3. DO NOT wrap the output in quotes.
4. Keep it highly legible, professional, and matching our high recruiting standards. No fake numbers if not requested, but do represent potential scales beautifully or use placeholders like "[X]%" or "[Y]" if necessary to highlight where a metric belongs.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: rewritePrompt,
      config: {
        temperature: 0.75,
      }
    });

    const rewroteText = response.text || '';
    res.json({ rewrote: rewroteText.trim() });
  } catch (err: any) {
    console.error('Bullet rewrite error:', err);
    res.status(500).json({ error: err.message || 'Error executing bullet rewrite.' });
  }
});

// -------------------------------------------------------------
// ANALYZE/AUDIT ENDPOINT
// -------------------------------------------------------------
app.post('/api/audit', async (req, res) => {
  try {
    const { resume, targets } = req.body;
    
    if (!resume || !resume.rawText) {
      return res.status(400).json({ error: 'Resume content (rawText) is required.' });
    }
    
    const ai = getGeminiClient();
    
    const targetDetails = `
- Target Role: ${targets.role || 'Not specified'}
- Target Company Profile: ${targets.companyType || 'General'} ${targets.companyName ? `(${targets.companyName})` : ''}
- Years of Experience: ${targets.yearsOfExperience || 'Not specified'}
`;

    const systemInstruction = `You are an elite Senior Technical Recruiter, Engineering Hiring Manager, Resume Auditor, and Career Coach with 15+ years of experience hiring for top tech firms (FAANG, Tier-1 Startups). 
Evaluate the candidate's resume content with extreme rigor. Be direct, direct-to-the-point, and honest—simulate a real recruiter under intense pressure (re-evaluating in 15 seconds).
Maximize the candidate's interview conversion rate. Choose a definitive Hiring Decision, calculate specific metrics, and construct a brutal recruiter roast referencing specific areas of their resume.

Identify and audit exact problematic segments of text (critical/high/medium/low severity impacts, missing metrics, weak verbs, generic filler, ChatGPT jargon) and define annotations with EXACT, literal substrings of their resume in "resume_text", along with a strong technical "improved_text" replacement option.
Ensure every annotation's "resume_text", "start_text", and "end_text" contains a valid, literal case-sensitive substring present inside the provided resume text so the client can search and highlight it perfectly.

Return the result strictly as a JSON object matching this JSON structure:
{
  "hiringDecision": "STRONG REJECT" | "REJECT" | "BORDERLINE" | "INTERVIEW" | "STRONG INTERVIEW",
  "firstImpression": {
    "decisionReason": "string - why this decision was made",
    "strongestSignal": "string",
    "weakestSignal": "string",
    "confusingAspect": "string",
    "missingDetails": "string"
  },
  "scores": {
    "recruiterScore": value (0-10),
    "atsScore": value (0-10),
    "technicalCredibility": value (0-10),
    "impactScore": value (0-10),
    "leadershipScore": value (0-10),
    "projectStrengthScore": value (0-10),
    "overallHireability": value (0-10)
  },
  "roast": "string - direct, brutal recruiter roast. Be witty, spicy, no-holds-barred. Call out bullet points, fake scale, generic ChatGPT slop, tutorial apps.",
  "sectionReviews": {
    "Header": { "status": "GOOD ✅" | "BAD ❌" | "MISSING ⚠️", "feedback": "string" },
    "Summary": { "status": "GOOD ✅" | "BAD ❌" | "MISSING ⚠️", "feedback": "string" },
    "Experience": { "status": "GOOD ✅" | "BAD ❌" | "MISSING ⚠️", "feedback": "string" },
    "Projects": { "status": "GOOD ✅" | "BAD ❌" | "MISSING ⚠️", "feedback": "string" },
    "Skills": { "status": "GOOD ✅" | "BAD ❌" | "MISSING ⚠️", "feedback": "string" },
    "Education": { "status": "GOOD ✅" | "BAD ❌" | "MISSING ⚠️", "feedback": "string" }
  },
  "lineByLineReview": [
    {
      "original": "original bullet point",
      "problem": "problem",
      "recruiterReaction": "direct quote",
      "whyItHurts": "explanation",
      "improvedVersion": "Action + Scope + Impact version",
      "strongerVersion": "Even better",
      "interviewWinningVersion": "Max impact version"
    }
  ],
  "atsAnalysis": {
    "currentMatchPercentage": 55,
    "estimatedAtsRanking": "Top 30% / Mid-Tier / Bottom 10% etc",
    "topMissingKeywords": ["keyword1", "keyword2"],
    "suggestedKeywords": ["keyword3"],
    "atsRisks": ["formatting/complex tables risk", "buzzword stuffing"],
    "atsImprovements": ["bullet formatting"]
  },
  "technicalRecruiterReview": {
    "technicalDepth": "string",
    "engineeringMaturity": "string",
    "ownership": "string",
    "architectureUnderstanding": "string",
    "scalabilityUnderstanding": "string",
    "problemSolving": "string",
    "leadershipSignals": "string",
    "productionExperience": "string",
    "concerns": ["concern1", "concern2"]
  },
  "projectEvaluations": [
    {
      "name": "project name",
      "originality": value (0-10),
      "complexity": value (0-10),
      "businessValue": value (0-10),
      "technicalDepth": value (0-10),
      "resumeValue": value (0-10),
      "recruiterAppeal": value (0-10),
      "projectType": "Tutorial project" | "Clone project" | "Generic CRUD project" | "Low-value project" | "High-value project",
      "framingSuggestions": ["suggestion1"]
    }
  ],
  "missingOpportunities": ["detailed opportunity 1", "metric suggestion"],
  "improvedResumeSuggestion": "A fully rewritten block or overview suggesting how the sections should look.",
  "actionPlan": {
    "highPriority": ["fix 1", "fix 2"],
    "mediumPriority": ["fix 3"],
    "niceToHave": ["fix 4"]
  },
  "interviewProbability": {
    "passAts": value (0-100),
    "recruiterShortlist": value (0-100),
    "technicalInterview": value (0-100),
    "finalRound": value (0-100),
    "offer": value (0-100),
    "reasoning": "string"
  },
  "annotations": [
    {
      "id": "annot_1",
      "severity": "critical" | "high" | "medium" | "low",
      "issue_type": "metric" | "ownership" | "generic" | "formatting" | "wordslip",
      "resume_text": "EXACT LITERAL CASE-SENSITIVE SUBSTRING FROM RESUME",
      "reason": "why it triggers rejection",
      "improved_text": "replacement phrase with metric/scope placeholders",
      "section": "experience" | "projects" | "skills" | "summary",
      "start_text": "first 5-10 words of the resume_text",
      "end_text": "last 5-10 words of the resume_text"
    }
  ]
}
`;

    // Prompt content
    const userPrompt = `
RESUME CONTENT TO AUDIT:
-----------------------------------------
${resume.rawText}
-----------------------------------------

CANDIDATE'S INTENDED CAREER DIRECTION:
${targetDetails}

Please perform the complete, detailed Elite Tech Recruiter and Resume Audit.
Ensure that inside the "annotations" array, every item's "resume_text" is a direct, case-sensitive literal substring present inside the RESUME CONTENT above.
`;

    console.log('Sending request to Gemini model: gemini-3.5-flash');

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: userPrompt,
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
        temperature: 0.15, // lower temp for strict adherence and structured parsing
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            hiringDecision: { type: Type.STRING },
            firstImpression: {
              type: Type.OBJECT,
              properties: {
                decisionReason: { type: Type.STRING },
                strongestSignal: { type: Type.STRING },
                weakestSignal: { type: Type.STRING },
                confusingAspect: { type: Type.STRING },
                missingDetails: { type: Type.STRING },
              },
              required: ['decisionReason', 'strongestSignal', 'weakestSignal', 'confusingAspect', 'missingDetails'],
            },
            scores: {
              type: Type.OBJECT,
              properties: {
                recruiterScore: { type: Type.INTEGER },
                atsScore: { type: Type.INTEGER },
                technicalCredibility: { type: Type.INTEGER },
                impactScore: { type: Type.INTEGER },
                leadershipScore: { type: Type.INTEGER },
                projectStrengthScore: { type: Type.INTEGER },
                overallHireability: { type: Type.INTEGER },
              },
              required: [
                'recruiterScore',
                'atsScore',
                'technicalCredibility',
                'impactScore',
                'leadershipScore',
                'projectStrengthScore',
                'overallHireability',
              ],
            },
            roast: { type: Type.STRING },
            sectionReviews: {
              type: Type.OBJECT,
              properties: {
                Header: {
                  type: Type.OBJECT,
                  properties: { status: { type: Type.STRING }, feedback: { type: Type.STRING } },
                  required: ['status', 'feedback'],
                },
                Summary: {
                  type: Type.OBJECT,
                  properties: { status: { type: Type.STRING }, feedback: { type: Type.STRING } },
                  required: ['status', 'feedback'],
                },
                Experience: {
                  type: Type.OBJECT,
                  properties: { status: { type: Type.STRING }, feedback: { type: Type.STRING } },
                  required: ['status', 'feedback'],
                },
                Projects: {
                  type: Type.OBJECT,
                  properties: { status: { type: Type.STRING }, feedback: { type: Type.STRING } },
                  required: ['status', 'feedback'],
                },
                Skills: {
                  type: Type.OBJECT,
                  properties: { status: { type: Type.STRING }, feedback: { type: Type.STRING } },
                  required: ['status', 'feedback'],
                },
                Education: {
                  type: Type.OBJECT,
                  properties: { status: { type: Type.STRING }, feedback: { type: Type.STRING } },
                  required: ['status', 'feedback'],
                },
              },
              required: ['Header', 'Summary', 'Experience', 'Projects', 'Skills', 'Education'],
            },
            lineByLineReview: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  original: { type: Type.STRING },
                  problem: { type: Type.STRING },
                  recruiterReaction: { type: Type.STRING },
                  whyItHurts: { type: Type.STRING },
                  improvedVersion: { type: Type.STRING },
                  strongerVersion: { type: Type.STRING },
                  interviewWinningVersion: { type: Type.STRING },
                },
                required: ['original', 'problem', 'recruiterReaction', 'whyItHurts', 'improvedVersion', 'strongerVersion', 'interviewWinningVersion'],
              },
            },
            atsAnalysis: {
              type: Type.OBJECT,
              properties: {
                currentMatchPercentage: { type: Type.INTEGER },
                estimatedAtsRanking: { type: Type.STRING },
                topMissingKeywords: { type: Type.ARRAY, items: { type: Type.STRING } },
                suggestedKeywords: { type: Type.ARRAY, items: { type: Type.STRING } },
                atsRisks: { type: Type.ARRAY, items: { type: Type.STRING } },
                atsImprovements: { type: Type.ARRAY, items: { type: Type.STRING } },
              },
              required: ['currentMatchPercentage', 'estimatedAtsRanking', 'topMissingKeywords', 'suggestedKeywords', 'atsRisks', 'atsImprovements'],
            },
            technicalRecruiterReview: {
              type: Type.OBJECT,
              properties: {
                technicalDepth: { type: Type.STRING },
                engineeringMaturity: { type: Type.STRING },
                ownership: { type: Type.STRING },
                architectureUnderstanding: { type: Type.STRING },
                scalabilityUnderstanding: { type: Type.STRING },
                problemSolving: { type: Type.STRING },
                leadershipSignals: { type: Type.STRING },
                productionExperience: { type: Type.STRING },
                concerns: { type: Type.ARRAY, items: { type: Type.STRING } },
              },
              required: [
                'technicalDepth',
                'engineeringMaturity',
                'ownership',
                'architectureUnderstanding',
                'scalabilityUnderstanding',
                'problemSolving',
                'leadershipSignals',
                'productionExperience',
                'concerns',
              ],
            },
            projectEvaluations: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  originality: { type: Type.INTEGER },
                  complexity: { type: Type.INTEGER },
                  businessValue: { type: Type.INTEGER },
                  technicalDepth: { type: Type.INTEGER },
                  resumeValue: { type: Type.INTEGER },
                  recruiterAppeal: { type: Type.INTEGER },
                  projectType: { type: Type.STRING },
                  framingSuggestions: { type: Type.ARRAY, items: { type: Type.STRING } },
                },
                required: [
                  'name',
                  'originality',
                  'complexity',
                  'businessValue',
                  'technicalDepth',
                  'resumeValue',
                  'recruiterAppeal',
                  'projectType',
                  'framingSuggestions',
                ],
              },
            },
            missingOpportunities: { type: Type.ARRAY, items: { type: Type.STRING } },
            improvedResumeSuggestion: { type: Type.STRING },
            actionPlan: {
              type: Type.OBJECT,
              properties: {
                highPriority: { type: Type.ARRAY, items: { type: Type.STRING } },
                mediumPriority: { type: Type.ARRAY, items: { type: Type.STRING } },
                niceToHave: { type: Type.ARRAY, items: { type: Type.STRING } },
              },
              required: ['highPriority', 'mediumPriority', 'niceToHave'],
            },
            interviewProbability: {
              type: Type.OBJECT,
              properties: {
                passAts: { type: Type.INTEGER },
                recruiterShortlist: { type: Type.INTEGER },
                technicalInterview: { type: Type.INTEGER },
                finalRound: { type: Type.INTEGER },
                offer: { type: Type.INTEGER },
                reasoning: { type: Type.STRING },
              },
              required: ['passAts', 'recruiterShortlist', 'technicalInterview', 'finalRound', 'offer', 'reasoning'],
            },
            annotations: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  severity: { type: Type.STRING },
                  issue_type: { type: Type.STRING },
                  resume_text: { type: Type.STRING },
                  reason: { type: Type.STRING },
                  improved_text: { type: Type.STRING },
                  section: { type: Type.STRING },
                  start_text: { type: Type.STRING },
                  end_text: { type: Type.STRING },
                },
                required: ['id', 'severity', 'issue_type', 'resume_text', 'reason', 'improved_text', 'section'],
              },
            },
          },
          required: [
            'hiringDecision',
            'firstImpression',
            'scores',
            'roast',
            'sectionReviews',
            'lineByLineReview',
            'atsAnalysis',
            'technicalRecruiterReview',
            'projectEvaluations',
            'missingOpportunities',
            'improvedResumeSuggestion',
            'actionPlan',
            'interviewProbability',
            'annotations',
          ],
        },
      },
    });

    const resultsText = response.text;
    if (!resultsText) {
      throw new Error('Gemini returned an empty response.');
    }

    const auditData = JSON.parse(resultsText);
    res.json(auditData);
  } catch (err: any) {
    console.error('Audit handler error:', err);
    res.status(500).json({ error: err.message || 'Error occurred during resume analysis.' });
  }
});

// -------------------------------------------------------------
// CHAT ENDPOINT
// -------------------------------------------------------------
app.post('/api/chat', async (req, res) => {
  try {
    const { messages, resume, targets, auditContext } = req.body;
    
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'Chat messages history required.' });
    }
    
    const ai = getGeminiClient();
    
    // Setup target details
    const targetDetails = targets ? `
Candidate Targets:
- Role: ${targets.role || 'Not specified'}
- Company type: ${targets.companyType || 'General'}
- Years of experience: ${targets.yearsOfExperience || 'Not specified'}
` : '';

    // Last message
    const lastUserMsg = messages[messages.length - 1]?.content || '';
    
    // Chat context system prompt
    const systemPrompt = `You are simulated as an ELITE TECH RECRUITER & RESUME AUDITOR in interactive mode. 
Keep the exact recruiter persona described below:
- 15+ years experience building engineering orgs at FAANG + tier-1 hypergrowth startups.
- Direct, brutally honest, practical, evidence-based, specific, and clear.
- Do NOT protect the user's feelings—but do not invent fake resume text. Only critique or improve based on the resume.
- Avoid boring motivational phrases ("looks good!", "keep trying!"). Every response must reflect high recruiting criteria.
- Under time pressure, so speak concisely, authoritatively, and write ready-to-use resume bullet points when asked.
- Provide direct templates in "Action + Scope + Impact + Result" outline. State "Metric required here" when numbers are unknown.

The candidate's resume:
------------------
${resume || 'Not pasted yet.'}
------------------
${targetDetails}

${auditContext ? `Previous audit scores and roasts Context:\n- Decisions: ${auditContext.hiringDecision}\n- Overall Health Score: ${auditContext.scores?.overallHireability || 'N/A'}/10\n- Roast Summary: ${auditContext.roast}\n` : ''}

You must maintain this recruiter persona completely. Engage directly, answer questions such as "Roast my resume harder", "What would Google think of my experience?", "Help me rewrite this boring bullet point", "Make this Staff-level ready". Avoid generic assistant boilerplate.`;

    // Process chat using GenerateContent
    const formattedChatHistory = messages.slice(0, -1).map((msg: any) => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.content }],
    }));

    // Add user message to contents
    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: [
        ...formattedChatHistory.map(item => ({
          role: item.role,
          parts: item.parts,
        })),
        { role: 'user', parts: [{ text: lastUserMsg }] }
      ],
      config: {
        systemInstruction: systemPrompt,
        temperature: 0.7,
        topP: 0.95,
      }
    });

    const reply = response.text || 'Sorry, I couldn\'t process that request.';
    res.json({ content: reply });
  } catch (err: any) {
    console.error('Chat endpoint error:', err);
    res.status(500).json({ error: err.message || 'Error communicating with AI Recruiter.' });
  }
});

// -------------------------------------------------------------
// VITE OR STATIC FILE MIDDLEWARE
// -------------------------------------------------------------
async function setupServer() {
  if (process.env.NODE_ENV !== 'production') {
    // Integrate Vite in development mode
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Serve static files in production
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Elite Team Recruiter Server] Running at http://0.0.0.0:${PORT}`);
  });
}

setupServer();
