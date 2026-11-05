import { describe, it, expect } from 'vitest';
import { cosineSimilarity } from '../src/utils/cosine.js';
import { EmbeddingService } from '../src/services/embedding.service.js';

describe('RAG and Vector Math', () => {
  it('should compute accurate cosine similarity between vectors', () => {
    const vecA = [1, 0, 0];
    const vecB = [1, 0, 0];
    const vecC = [0, 1, 0];

    expect(cosineSimilarity(vecA, vecB)).toBeCloseTo(1.0, 4);
    expect(cosineSimilarity(vecA, vecC)).toBeCloseTo(0.0, 4);
  });

  it('should generate embeddings with appropriate dimensions', async () => {
    const text = 'ApexFlow Platform provides enterprise security.';
    const emb = await EmbeddingService.generateEmbedding(text);

    expect(Array.isArray(emb)).toBe(true);
    expect(emb.length).toBe(768);
    // Non-zero values
    const hasValues = emb.some((v) => v !== 0);
    expect(hasValues).toBe(true);
  });

  it('should rank semantically related text higher than unrelated text', async () => {
    const query = 'ApexFlow pricing is cost-effective';
    const relatedDoc = 'ApexFlow pricing is affordable and cost-effective for enterprise ROI';
    const unrelatedDoc = 'Cooking pasta with fresh organic olive oil and basil';

    const [qEmb, relEmb, unrelEmb] = await Promise.all([
      EmbeddingService.generateEmbedding(query),
      EmbeddingService.generateEmbedding(relatedDoc),
      EmbeddingService.generateEmbedding(unrelatedDoc),
    ]);

    const relSim = cosineSimilarity(qEmb, relEmb);
    const unrelSim = cosineSimilarity(qEmb, unrelEmb);

    expect(relSim).toBeGreaterThan(unrelSim);
  });
});

