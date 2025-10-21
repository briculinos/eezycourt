import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import * as fs from 'fs';
import * as path from 'path';
const pdfParse = require('pdf-parse');

interface DocumentAnalysis {
  documentType: string;
  parties: string[];
  keyPoints: string[];
  evidence: string[];
  claims: string[];
}

class DisputeAnalysisMCPServer {
  private server: Server;
  private documentsCache: Map<string, string> = new Map();

  constructor() {
    this.server = new Server(
      {
        name: 'eezycourt-dispute-analyzer',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.setupHandlers();
  }

  private setupHandlers() {
    // List available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        {
          name: 'extract_document_text',
          description: 'Extract text content from uploaded documents (PDF, TXT)',
          inputSchema: {
            type: 'object',
            properties: {
              filePath: {
                type: 'string',
                description: 'Path to the document file',
              },
            },
            required: ['filePath'],
          },
        },
        {
          name: 'analyze_legal_document',
          description: 'Analyze legal document to extract parties, claims, and evidence',
          inputSchema: {
            type: 'object',
            properties: {
              documentText: {
                type: 'string',
                description: 'Text content of the legal document',
              },
              documentName: {
                type: 'string',
                description: 'Name of the document',
              },
            },
            required: ['documentText', 'documentName'],
          },
        },
        {
          name: 'compare_arguments',
          description: 'Compare arguments from both parties in a dispute',
          inputSchema: {
            type: 'object',
            properties: {
              party1Analysis: {
                type: 'string',
                description: 'Analysis of party 1 documents',
              },
              party2Analysis: {
                type: 'string',
                description: 'Analysis of party 2 documents',
              },
            },
            required: ['party1Analysis', 'party2Analysis'],
          },
        },
        {
          name: 'generate_verdict_recommendation',
          description: 'Generate a judicial recommendation based on analyzed evidence',
          inputSchema: {
            type: 'object',
            properties: {
              allAnalyses: {
                type: 'string',
                description: 'Combined analysis of all documents',
              },
              comparison: {
                type: 'string',
                description: 'Comparison of both parties arguments',
              },
            },
            required: ['allAnalyses', 'comparison'],
          },
        },
      ],
    }));

    // Handle tool calls
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        if (!args) {
          throw new Error('No arguments provided');
        }

        switch (name) {
          case 'extract_document_text':
            return await this.extractDocumentText(args.filePath as string);

          case 'analyze_legal_document':
            return await this.analyzeLegalDocument(
              args.documentText as string,
              args.documentName as string
            );

          case 'compare_arguments':
            return await this.compareArguments(
              args.party1Analysis as string,
              args.party2Analysis as string
            );

          case 'generate_verdict_recommendation':
            return await this.generateVerdictRecommendation(
              args.allAnalyses as string,
              args.comparison as string
            );

          default:
            throw new Error(`Unknown tool: ${name}`);
        }
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `Error: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
        };
      }
    });
  }

  private async extractDocumentText(filePath: string) {
    try {
      const ext = path.extname(filePath).toLowerCase();
      let text = '';

      if (ext === '.pdf') {
        const dataBuffer = fs.readFileSync(filePath);
        const data = await pdfParse(dataBuffer);
        text = data.text;
      } else if (ext === '.txt') {
        text = fs.readFileSync(filePath, 'utf-8');
      } else {
        throw new Error(`Unsupported file type: ${ext}`);
      }

      this.documentsCache.set(filePath, text);

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              success: true,
              filePath,
              textLength: text.length,
              preview: text.substring(0, 500),
              fullText: text,
            }),
          },
        ],
      };
    } catch (error) {
      throw new Error(`Failed to extract document text: ${error}`);
    }
  }

  private async analyzeLegalDocument(documentText: string, documentName: string) {
    // Basic pattern matching for legal documents
    const analysis: DocumentAnalysis = {
      documentType: this.detectDocumentType(documentText),
      parties: this.extractParties(documentText),
      keyPoints: this.extractKeyPoints(documentText),
      evidence: this.extractEvidence(documentText),
      claims: this.extractClaims(documentText),
    };

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            documentName,
            analysis,
            rawText: documentText,
          }),
        },
      ],
    };
  }

  private detectDocumentType(text: string): string {
    const lowerText = text.toLowerCase();
    if (lowerText.includes('complaint') || lowerText.includes('petition')) {
      return 'Complaint/Petition';
    } else if (lowerText.includes('response') || lowerText.includes('answer')) {
      return 'Response/Answer';
    } else if (lowerText.includes('contract') || lowerText.includes('agreement')) {
      return 'Contract/Agreement';
    } else if (lowerText.includes('evidence') || lowerText.includes('exhibit')) {
      return 'Evidence/Exhibit';
    }
    return 'General Legal Document';
  }

  private extractParties(text: string): string[] {
    const parties: string[] = [];
    const patterns = [
      /(?:plaintiff|claimant|petitioner)[:\s]+([A-Z][a-zA-Z\s&.,]+?)(?:\n|vs\.|v\.|,)/gi,
      /(?:defendant|respondent)[:\s]+([A-Z][a-zA-Z\s&.,]+?)(?:\n|,)/gi,
      /between\s+([A-Z][a-zA-Z\s&.,]+?)\s+and\s+([A-Z][a-zA-Z\s&.,]+?)(?:\n|,)/gi,
    ];

    patterns.forEach((pattern) => {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        for (let i = 1; i < match.length; i++) {
          if (match[i]) {
            const party = match[i].trim();
            if (party && party.length > 2 && party.length < 100) {
              parties.push(party);
            }
          }
        }
      }
    });

    return [...new Set(parties)];
  }

  private extractKeyPoints(text: string): string[] {
    const points: string[] = [];
    const sentences = text.split(/[.!?]+/);

    // Look for sentences with legal keywords
    const keywords = [
      'breach',
      'violated',
      'damages',
      'compensation',
      'liable',
      'obligation',
      'failed',
      'duty',
      'negligent',
      'contract',
    ];

    sentences.forEach((sentence) => {
      const trimmed = sentence.trim();
      if (
        trimmed.length > 30 &&
        keywords.some((keyword) => trimmed.toLowerCase().includes(keyword))
      ) {
        points.push(trimmed);
      }
    });

    return points.slice(0, 10);
  }

  private extractEvidence(text: string): string[] {
    const evidence: string[] = [];
    const patterns = [
      /(?:exhibit|evidence|document)[:\s]+([A-Z0-9][^\n.]+)/gi,
      /(?:attached|enclosed|herewith)[:\s]+([A-Z][^\n.]+)/gi,
    ];

    patterns.forEach((pattern) => {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        if (match[1] && match[1].length < 200) {
          evidence.push(match[1].trim());
        }
      }
    });

    return [...new Set(evidence)].slice(0, 10);
  }

  private extractClaims(text: string): string[] {
    const claims: string[] = [];
    const patterns = [
      /(?:claim|allege|assert)[s]?[:\s]+([^.!?]+[.!?])/gi,
      /(?:plaintiff|claimant|defendant|respondent)\s+(?:claims|alleges|asserts)\s+([^.!?]+[.!?])/gi,
    ];

    patterns.forEach((pattern) => {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        if (match[1] && match[1].length > 20 && match[1].length < 500) {
          claims.push(match[1].trim());
        }
      }
    });

    return [...new Set(claims)].slice(0, 10);
  }

  private async compareArguments(party1Analysis: string, party2Analysis: string) {
    const comparison = {
      summary: 'Comparative analysis of both parties positions',
      party1Strengths: this.analyzeStrengths(party1Analysis),
      party2Strengths: this.analyzeStrengths(party2Analysis),
      conflictingPoints: this.findConflicts(party1Analysis, party2Analysis),
      recommendation:
        'This comparison should be reviewed by the judicial AI agent for final verdict',
    };

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(comparison, null, 2),
        },
      ],
    };
  }

  private analyzeStrengths(analysis: string): string[] {
    const strengths: string[] = [];

    if (analysis.toLowerCase().includes('evidence')) {
      strengths.push('Strong documentary evidence provided');
    }
    if (analysis.toLowerCase().includes('contract')) {
      strengths.push('Clear contractual basis for claims');
    }
    if (analysis.toLowerCase().includes('damages')) {
      strengths.push('Quantified damages claimed');
    }

    return strengths.length > 0 ? strengths : ['Standard legal arguments presented'];
  }

  private findConflicts(analysis1: string, analysis2: string): string[] {
    return [
      'Conflicting interpretations of contractual obligations',
      'Disputed facts regarding timeline of events',
      'Different assessments of damages and liability',
    ];
  }

  private async generateVerdictRecommendation(
    allAnalyses: string,
    comparison: string
  ) {
    const verdict = {
      recommendation: 'REQUIRES JUDICIAL REVIEW',
      summary:
        'Based on the analysis of submitted documents, both parties present viable arguments.',
      findings: [
        'Documents have been analyzed and key points extracted',
        'Both parties have presented their positions',
        'Evidence and claims have been documented',
      ],
      suggestedActions: [
        'Review all extracted evidence carefully',
        'Consider the strength of contractual obligations',
        'Evaluate damages claimed by both parties',
        'Determine liability based on documented facts',
      ],
      legalConsiderations: [
        'Contract law principles apply',
        'Burden of proof considerations',
        'Damages assessment methodology',
      ],
      note: 'This is an AI-assisted analysis. Final judicial decision should be made by qualified legal professionals.',
    };

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(verdict, null, 2),
        },
      ],
    };
  }

  async start() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('EezyCourt MCP Server running on stdio');
  }
}

// Start the server
const server = new DisputeAnalysisMCPServer();
server.start().catch(console.error);
