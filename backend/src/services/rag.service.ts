import mongoose from 'mongoose';
import { GuidelineChunk, IGuidelineChunk } from '../models/GuidelineChunk.js';
import { ApprovedFact, IApprovedFact } from '../models/ApprovedFact.js';
import { EmbeddingService } from './embedding.service.js';
import { cosineSimilarity } from '../utils/cosine.js';

export interface RetrievedEvidenceItem {
  id: string;
  sourceType: 'document_chunk' | 'approved_fact' | 'terminology' | 'tone_rule';
  title: string;
  content: string;
  similarityScore: number;
}

export interface RAGRetrievalResult {
  evidenceList: RetrievedEvidenceItem[];
  guidelineChunkIds: mongoose.Types.ObjectId[];
  factsSummary: string;
  hasSufficientEvidence: boolean;
}

export class RAGService {
  /**
   * Retrieve the top-K relevant guideline chunks and manual facts for an organization
   * based on semantic similarity to the submitted content.
   */
  public static async retrieveRelevantKnowledge(
    organizationId: mongoose.Types.ObjectId,
    content: string,
    topK = 6
  ): Promise<RAGRetrievalResult> {
    // 1. Generate query embedding
    const queryEmbedding = await EmbeddingService.generateEmbedding(content);

    // 2. Fetch active guideline chunks strictly scoped to the organization
    const activeChunks = await GuidelineChunk.find({
      organizationId,
      isActive: true,
    }).lean();

    // 3. Compute cosine similarity for each chunk
    const scoredChunks: Array<{
      chunk: any;
      score: number;
    }> = [];

    for (const chunk of activeChunks) {
      if (chunk.embedding && chunk.embedding.length > 0) {
        const sim = cosineSimilarity(queryEmbedding, chunk.embedding);
        scoredChunks.push({ chunk, score: sim });
      }
    }

    // Sort descending by similarity
    scoredChunks.sort((a, b) => b.score - a.score);
    const topChunks = scoredChunks.slice(0, topK);

    // 4. Fetch all active ApprovedFacts for this organization (facts, terminology, tone rules)
    const activeFacts = await ApprovedFact.find({
      organizationId,
      isActive: true,
    }).lean();

    // 5. Build evidence items
    const evidenceList: RetrievedEvidenceItem[] = [];
    const guidelineChunkIds: mongoose.Types.ObjectId[] = [];

    for (const item of topChunks) {
      evidenceList.push({
        id: item.chunk._id.toString(),
        sourceType: 'document_chunk',
        title: item.chunk.metadata?.title || 'Brand Guideline Section',
        content: item.chunk.content,
        similarityScore: Math.round(item.score * 100) / 100,
      });
      guidelineChunkIds.push(item.chunk._id);
    }

    // Format approved facts into clear reference sections
    let factsSummary = '';
    if (activeFacts.length > 0) {
      const prohibitedTerms = activeFacts
        .filter((f) => f.type === 'prohibited_terminology')
        .map((f) => `• Prohibited: "${f.key}" -> Reason / Preferred: "${f.value}" (Context: ${f.context || 'Global'})`);

      const approvedTerms = activeFacts
        .filter((f) => f.type === 'approved_terminology')
        .map((f) => `• Approved Term: "${f.key}" -> Usage: "${f.value}" (Context: ${f.context || 'Global'})`);

      const verifiedFacts = activeFacts
        .filter((f) => f.type === 'fact')
        .map((f) => `• Verified Product Fact: "${f.key}" -> Verified Claim: "${f.value}"`);

      const toneRules = activeFacts
        .filter((f) => f.type === 'tone_rule')
        .map((f) => `• Tone & Voice Rule: "${f.key}" -> Rule: "${f.value}"`);

      factsSummary = [
        prohibitedTerms.length > 0 ? `=== PROHIBITED TERMINOLOGY ===\n${prohibitedTerms.join('\n')}` : '',
        approvedTerms.length > 0 ? `=== APPROVED TERMINOLOGY ===\n${approvedTerms.join('\n')}` : '',
        verifiedFacts.length > 0 ? `=== VERIFIED FACTS & SPECS ===\n${verifiedFacts.join('\n')}` : '',
        toneRules.length > 0 ? `=== MANDATORY TONE RULES ===\n${toneRules.join('\n')}` : '',
      ]
        .filter(Boolean)
        .join('\n\n');

      // Also add matching facts to evidence list if they appear in text
      const lowerContent = content.toLowerCase();
      for (const fact of activeFacts) {
        if (lowerContent.includes(fact.key.toLowerCase())) {
          evidenceList.push({
            id: fact._id.toString(),
            sourceType: fact.type === 'fact' ? 'approved_fact' : fact.type === 'tone_rule' ? 'tone_rule' : 'terminology',
            title: `Official Rule: ${fact.key}`,
            content: `${fact.key}: ${fact.value} (Note: ${fact.context || 'Standard'})`,
            similarityScore: 1.0,
          });
        }
      }
    }

    const hasSufficientEvidence = evidenceList.length > 0 || factsSummary.length > 0;

    return {
      evidenceList,
      guidelineChunkIds,
      factsSummary,
      hasSufficientEvidence,
    };
  }
}
