import { Agent, AgentForge, LLM, Workflow } from 'agent-forge';

interface DisputeCase {
  documents: Array<{
    name: string;
    path: string;
    party: string;
  }>;
  caseId: string;
}

interface VerdictResult {
  verdict: string;
  reasoning: string;
  recommendations: string[];
  confidence: string;
}

export class DisputeOrchestrator {
  private forge: AgentForge;
  private llmProvider: LLM;
  private documentAnalyzer: Agent;
  private evidenceEvaluator: Agent;
  private legalAdvisor: Agent;
  private judicialRecommender: Agent;

  constructor(apiKey: string, provider: 'openai' | 'anthropic' = 'openai') {
    // Create LLM provider
    this.llmProvider = new LLM(provider, { apiKey });

    // Create AgentForge instance
    this.forge = new AgentForge(this.llmProvider);

    // Create specialized agents
    this.documentAnalyzer = new Agent(
      {
        name: 'DocumentAnalyzer',
        role: 'Legal Document Analyst',
        description:
          'Extracts and analyzes key information from legal documents including parties, claims, evidence, and legal arguments',
        objective: 'Analyze legal documents and extract key information',
        model: 'gpt-4o-mini',
        temperature: 0.3,
      },
      [],
      this.llmProvider
    );

    this.evidenceEvaluator = new Agent(
      {
        name: 'EvidenceEvaluator',
        role: 'Evidence Assessment Specialist',
        description:
          'Evaluates the strength and validity of evidence presented by both parties, identifies supporting and contradicting evidence',
        objective: 'Assess evidence quality and credibility',
        model: 'gpt-4o-mini',
        temperature: 0.3,
      },
      [],
      this.llmProvider
    );

    this.legalAdvisor = new Agent(
      {
        name: 'LegalAdvisor',
        role: 'Legal Precedent and Law Specialist',
        description:
          'Provides legal context, relevant laws, precedents, and contractual interpretation for the dispute',
        objective: 'Provide legal context and applicable laws',
        model: 'gpt-4o-mini',
        temperature: 0.3,
      },
      [],
      this.llmProvider
    );

    this.judicialRecommender = new Agent(
      {
        name: 'JudicialRecommender',
        role: 'Judicial Decision Maker',
        description:
          'Synthesizes all analyses to render a definitive judicial conclusion with specific rulings, orders, and remedies that the court should implement',
        objective: 'Generate a definitive judicial conclusion with specific court orders and rulings',
        model: 'gpt-4o-mini',
        temperature: 0.4,
      },
      [],
      this.llmProvider
    );

    // Register agents with forge
    this.forge.registerAgent(this.documentAnalyzer);
    this.forge.registerAgent(this.evidenceEvaluator);
    this.forge.registerAgent(this.legalAdvisor);
    this.forge.registerAgent(this.judicialRecommender);
  }

  async analyzeDispute(disputeCase: DisputeCase): Promise<VerdictResult> {
    try {
      console.log(`Starting analysis for case: ${disputeCase.caseId}`);

      // Create a workflow for the dispute analysis
      const workflow = new Workflow('DisputeAnalysisWorkflow');

      // Step 1: Document Analysis
      workflow.addStep(this.documentAnalyzer);

      // Step 2: Evidence Evaluation
      workflow.addStep(this.evidenceEvaluator);

      // Step 3: Legal Advisory
      workflow.addStep(this.legalAdvisor);

      // Step 4: Judicial Recommendation
      workflow.addStep(this.judicialRecommender);

      // Prepare initial context
      const initialPrompt = this.buildInitialPrompt(disputeCase);

      // Run the workflow
      console.log('Running agent workflow...');
      const result = await workflow.run(initialPrompt);

      // Parse the final result into a structured verdict
      const verdict = this.parseVerdictFromResult(result.output || result.toString());

      return verdict;
    } catch (error) {
      console.error('Error in dispute analysis:', error);
      throw error;
    }
  }

  private buildInitialPrompt(disputeCase: DisputeCase): string {
    const docList = disputeCase.documents
      .map(
        (doc, idx) =>
          `${idx + 1}. Document: ${doc.name} (Party: ${doc.party}, Path: ${doc.path})`
      )
      .join('\n');

    return `
Analyze the following legal dispute case between companies:

Case ID: ${disputeCase.caseId}

Documents submitted:
${docList}

Your task is to:
1. Analyze all documents thoroughly and extract key claims, evidence, and legal arguments
2. Evaluate the strength and validity of evidence from both parties
3. Identify relevant legal principles, laws, and precedents that apply
4. Render a DEFINITIVE JUDICIAL CONCLUSION with specific orders and rulings

IMPORTANT FOR THE FINAL AGENT (JudicialRecommender):
You must provide a CONCLUSION that states what the court/judge SHOULD DO, not just recommendations.
Your response should include:
- A clear RULING (e.g., "The court should rule in favor of [Party]", "The court should dismiss the claim", "The court should order...")
- Specific ORDERS the judge must issue (e.g., "The defendant shall pay...", "The plaintiff's claim is denied...", "Both parties must...")
- Concrete REMEDIES and actions to be taken
- FINAL DECISION on each claim

Format your conclusion using markdown with these sections:
### Judicial Conclusion
### Ruling
[State which party prevails and why]
### Court Orders
[Specific orders the court shall issue]
### Remedies
[Concrete actions and remedies]
### Final Decision
[Definitive conclusion on the dispute]

Please provide a thorough analysis considering:
- Contractual obligations and their interpretation
- Quality and credibility of evidence
- Legal precedents and applicable laws
- Fairness and equity considerations
- Specific remedies and concrete resolutions

Note: This is an AI-assisted analysis for demonstration purposes. In a real scenario, you would have access to the actual document contents through MCP tools.
    `;
  }

  private parseVerdictFromResult(result: string): VerdictResult {
    // Parse the AI's analysis to extract a proper verdict
    const hasAnalysis = result.length > 100;

    if (!hasAnalysis) {
      // Fallback verdict
      return {
        verdict: 'Further Review Required',
        reasoning:
          'The AI analysis has been completed. The dispute involves complex legal issues that require detailed examination of the submitted documents. Both parties have presented their positions, and a thorough evaluation of evidence, contractual obligations, and applicable laws is needed.',
        recommendations: [
          'Conduct detailed review of all submitted evidence',
          'Verify authenticity of documents',
          'Consider mediation or settlement options',
          'Consult legal precedents for similar cases',
          'Ensure compliance with jurisdictional requirements',
        ],
        confidence: 'Requires Human Expert Review',
      };
    }

    // Extract verdict from the judicial recommendation
    let verdict = 'Judicial Recommendation Provided';
    let confidence = 'Medium - AI Analysis Complete';
    const recommendations: string[] = [];

    // Try to extract a clear verdict statement
    // Look for "the court finds", "the court orders", "the court rules"
    const courtFindsMatch = result.match(/(?:the court|this court|court)\s+(?:finds|rules|orders|concludes|determines)[^.!?]*[.!?]/i);

    // Look for final decision or conclusion section
    const finalDecisionMatch = result.match(/(?:FINAL DECISION|Final Decision|CONCLUSION|Conclusion)[:\s]+([\s\S]*?)(?=\n\n|$)/i);

    // Look for specific grant/deny language
    const claimGrantedMatch = result.match(
      /(claim|claims|relief|motion|request).{0,100}(GRANTED|granted|DENIED|denied|PARTIALLY GRANTED|partially granted|is granted|are granted|is denied|are denied)/i
    );

    // Look for "rule in favor" language
    const ruleInFavorMatch = result.match(/(?:rule|ruling|rules|ruled)\s+in\s+favor\s+of\s+([^.!?]+)[.!?]/i);

    // Try to determine the actual verdict with priority order
    if (courtFindsMatch) {
      verdict = courtFindsMatch[0].trim();
    } else if (ruleInFavorMatch) {
      verdict = ruleInFavorMatch[0].trim();
    } else if (claimGrantedMatch) {
      const claimText = claimGrantedMatch[0];
      if (/is granted|are granted|GRANTED/i.test(claimText) && !/denied/i.test(claimText)) {
        verdict = 'Claims GRANTED - ' + claimText.substring(0, 100).trim();
      } else if (/is denied|are denied|DENIED/i.test(claimText)) {
        verdict = 'Claims DENIED - ' + claimText.substring(0, 100).trim();
      } else if (/PARTIALLY GRANTED|partially granted/i.test(claimText)) {
        verdict = 'Claims PARTIALLY GRANTED - ' + claimText.substring(0, 100).trim();
      }
    } else if (finalDecisionMatch && finalDecisionMatch[1].trim().length > 20) {
      const decisionText = finalDecisionMatch[1].trim();
      const sentences = decisionText.split(/[.!?]+/).filter((s) => s.trim().length > 20);
      if (sentences.length > 0) {
        verdict = sentences[0].trim();
        if (sentences.length > 1 && sentences[1].length < 120) {
          verdict += '. ' + sentences[1].trim();
        }
      }
    } else {
      // Extract first substantive sentence from the result
      const sentences = result.split(/[.!?]+/).filter((s) => s.trim().length > 40);
      if (sentences.length > 0) {
        // Find the first sentence that sounds like a verdict
        const verdictSentence = sentences.find(s =>
          /court|ruling|decision|granted|denied|favor|dismiss|order|conclude|find/i.test(s)
        );
        if (verdictSentence) {
          verdict = verdictSentence.trim();
        } else {
          verdict = sentences[0].trim();
        }
      }
    }

    // Extract court orders and remedies as recommendations
    const ordersMatch = result.match(
      /(?:COURT ORDERS|Court Orders|ORDERS|Orders)[:\s]+([\s\S]*?)(?=\n\n###|REMEDIES|Remedies|FINAL|$)/i
    );
    if (ordersMatch) {
      const ordersText = ordersMatch[1];
      const bulletMatches = ordersText.match(/[-•✓\d]+\.?\s+([^\n]+)/g);
      if (bulletMatches) {
        bulletMatches.slice(0, 4).forEach((item) => {
          const cleaned = item.replace(/^[-•✓\d]+\.?\s+/, '').trim();
          if (cleaned.length > 10) {
            recommendations.push(cleaned);
          }
        });
      }
    }

    // Extract remedies if not enough recommendations
    if (recommendations.length < 3) {
      const remediesMatch = result.match(
        /(?:REMEDIES|Remedies)[:\s]+([\s\S]*?)(?=\n\n###|FINAL|$)/i
      );
      if (remediesMatch) {
        const remediesText = remediesMatch[1];
        const bulletMatches = remediesText.match(/[-•✓\d]+\.?\s+([^\n]+)/g);
        if (bulletMatches) {
          bulletMatches.slice(0, 3).forEach((item) => {
            const cleaned = item.replace(/^[-•✓\d]+\.?\s+/, '').trim();
            if (cleaned.length > 10 && !recommendations.includes(cleaned)) {
              recommendations.push(cleaned);
            }
          });
        }
      }
    }

    // If no specific recommendations found, extract key action items from the result
    if (recommendations.length === 0) {
      const actionMatches = result.match(/(?:shall|must|should|ordered to)[^.!?]*[.!?]/gi);
      if (actionMatches) {
        actionMatches.slice(0, 4).forEach((action) => {
          const cleaned = action.trim();
          if (cleaned.length > 15 && cleaned.length < 200) {
            recommendations.push(cleaned);
          }
        });
      }
    }

    // Default recommendations if none found
    if (recommendations.length === 0) {
      recommendations.push(
        'Review all submitted documents carefully',
        'Consider contractual obligations and evidence quality',
        'Consult with legal professionals for final decision',
        'Ensure all parties have been heard fairly'
      );
    }

    // Extract confidence level
    const confidenceMatch = result.match(/(?:CONFIDENCE|Confidence|CONFIDENCE LEVEL)[:\s]+(.*?)(?:\n|$)/i);
    if (confidenceMatch && confidenceMatch[1].trim()) {
      confidence = confidenceMatch[1].trim();
    } else if (/strong evidence|clear breach|unambiguous|definitive/i.test(result)) {
      confidence = 'High - Strong Evidence and Clear Legal Basis';
    } else if (/insufficient|unclear|requires further|disputed facts/i.test(result)) {
      confidence = 'Low - Requires Additional Evidence or Review';
    }

    // Use the full analysis as reasoning
    const reasoning = result;

    return {
      verdict,
      reasoning,
      recommendations: recommendations.slice(0, 6), // Limit to 6 recommendations
      confidence,
    };
  }
}
