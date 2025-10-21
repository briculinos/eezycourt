import express, { Request, Response } from 'express';
import multer from 'multer';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
import { DisputeOrchestrator } from './agents/DisputeOrchestrator';

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 3000;

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  },
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['.pdf', '.txt'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedTypes.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF and TXT files are allowed'));
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

// Store case data (in production, use a database)
const cases = new Map<string, any>();

// Health check endpoints
app.get('/api/health', (req: Request, res: Response) => {
  res.json({ status: 'healthy', service: 'EezyCourt API' });
});

app.get('/healthz', (req: Request, res: Response) => {
  res.json({ status: 'healthy', service: 'EezyCourt API' });
});

// Upload documents endpoint
app.post(
  '/api/upload',
  upload.array('documents', 10),
  async (req: Request, res: Response) => {
    try {
      const files = req.files as Express.Multer.File[];
      if (!files || files.length === 0) {
        return res.status(400).json({ error: 'No files uploaded' });
      }

      const caseId = Date.now().toString();
      const uploadedDocs = files.map((file, index) => ({
        name: file.originalname,
        path: file.path,
        party: req.body[`party_${index}`] || 'Unknown',
        size: file.size,
        uploadedAt: new Date().toISOString(),
      }));

      cases.set(caseId, {
        caseId,
        documents: uploadedDocs,
        status: 'uploaded',
        createdAt: new Date().toISOString(),
      });

      res.json({
        success: true,
        caseId,
        documents: uploadedDocs,
        message: `Successfully uploaded ${files.length} document(s)`,
      });
    } catch (error) {
      console.error('Upload error:', error);
      res.status(500).json({
        error: 'Failed to upload documents',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
);

// Analyze case and get verdict
app.post('/api/analyze/:caseId', async (req: Request, res: Response) => {
  try {
    const { caseId } = req.params;
    const caseData = cases.get(caseId);

    if (!caseData) {
      return res.status(404).json({ error: 'Case not found' });
    }

    // Check if API key is configured
    const apiKey = process.env.OPENAI_API_KEY || process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return res.status(500).json({
        error: 'API key not configured',
        message: 'Please set OPENAI_API_KEY or ANTHROPIC_API_KEY in your .env file',
      });
    }

    // Update case status
    caseData.status = 'analyzing';
    cases.set(caseId, caseData);

    // Initialize the dispute orchestrator
    const provider = process.env.OPENAI_API_KEY ? 'openai' : 'anthropic';
    const orchestrator = new DisputeOrchestrator(apiKey, provider);

    // Analyze the dispute
    const verdict = await orchestrator.analyzeDispute({
      caseId,
      documents: caseData.documents,
    });

    // Update case with verdict
    caseData.status = 'completed';
    caseData.verdict = verdict;
    caseData.completedAt = new Date().toISOString();
    cases.set(caseId, caseData);

    res.json({
      success: true,
      caseId,
      verdict,
    });
  } catch (error) {
    console.error('Analysis error:', error);
    res.status(500).json({
      error: 'Failed to analyze case',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Get case status
app.get('/api/case/:caseId', (req: Request, res: Response) => {
  const { caseId } = req.params;
  const caseData = cases.get(caseId);

  if (!caseData) {
    return res.status(404).json({ error: 'Case not found' });
  }

  res.json(caseData);
});

// Get all cases
app.get('/api/cases', (req: Request, res: Response) => {
  const allCases = Array.from(cases.values());
  res.json({ cases: allCases });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🏛️  EezyCourt Server running on http://0.0.0.0:${PORT}`);
  console.log(`📁 Uploads directory: ${uploadsDir}`);
  console.log(`🤖 Agent orchestration: Ready`);
});

export default app;
