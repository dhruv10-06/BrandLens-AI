import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { connectDB, disconnectDB } from '../src/config/db.js';
import { User } from '../src/models/User.js';
import { Organisation } from '../src/models/Organisation.js';
import { ContentSubmission } from '../src/models/ContentSubmission.js';

const app = createApp();

describe('RBAC, Security & Human Review Workflow API Integration', () => {
  let creatorToken = '';
  let reviewerToken = '';
  let creatorUser: any;
  let reviewerUser: any;
  let org: any;
  let submissionId = '';

  beforeAll(async () => {
    await connectDB();

    // Clean test collection
    await Organisation.deleteMany({ slug: 'test-enterprise' });
    await User.deleteMany({ email: { $in: ['testcreator@brandlens.io', 'testreviewer@brandlens.io'] } });

    org = await Organisation.create({
      name: 'Test Enterprise Corp',
      slug: 'test-enterprise',
      brandVoiceSummary: 'Clear, modern, precise.',
    });

    // Register creator
    const creatorRes = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Creator Alice',
        email: 'testcreator@brandlens.io',
        password: 'Password123!',
        role: 'creator',
        orgSlug: 'test-enterprise',
      });

    expect(creatorRes.status).toBe(201);
    creatorToken = creatorRes.body.token;
    creatorUser = creatorRes.body.user;

    // Register reviewer
    const reviewerRes = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Reviewer Bob',
        email: 'testreviewer@brandlens.io',
        password: 'Password123!',
        role: 'reviewer',
        orgSlug: 'test-enterprise',
      });

    expect(reviewerRes.status).toBe(201);
    reviewerToken = reviewerRes.body.token;
    reviewerUser = reviewerRes.body.user;
  });

  afterAll(async () => {
    await disconnectDB();
  });

  it('creator submits content successfully for brand governance analysis', async () => {
    const res = await request(app)
      .post('/api/submissions')
      .set('Authorization', `Bearer ${creatorToken}`)
      .send({
        title: 'Launch Post',
        contentType: 'social_media',
        content: 'Check out the new release of our enterprise platform today with verified 99.99% uptime.',
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.submission).toBeDefined();
    expect(res.body.analysis).toBeDefined();
    submissionId = res.body.submission._id;
  });

  it('creator is strictly forbidden from accessing the reviewer queue (RBAC check)', async () => {
    const res = await request(app)
      .get('/api/review/queue')
      .set('Authorization', `Bearer ${creatorToken}`);

    expect(res.status).toBe(403);
    expect(res.body.error).toContain('Access denied');
  });

  it('reviewer can access review queue', async () => {
    const res = await request(app)
      .get('/api/review/queue')
      .set('Authorization', `Bearer ${reviewerToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.queue)).toBe(true);
  });

  it('creator is blocked from approving their own submission (Separation of Duties)', async () => {
    const res = await request(app)
      .post(`/api/review/decision/${submissionId}`)
      .set('Authorization', `Bearer ${creatorToken}`)
      .send({
        decision: 'approved',
        comments: 'Self-approval attempt by creator',
      });

    // Should be rejected by RBAC middleware
    expect(res.status).toBe(403);
  });

  it('reviewer can successfully review and approve content with mandatory comments', async () => {
    const res = await request(app)
      .post(`/api/review/decision/${submissionId}`)
      .set('Authorization', `Bearer ${reviewerToken}`)
      .send({
        decision: 'approved',
        comments: 'Content meets all brand tone and verified uptime claims.',
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.submission.status).toBe('approved');
  });

  it('review history records the audit decision and reviewer identity', async () => {
    const res = await request(app)
      .get(`/api/review/history?submissionId=${submissionId}`)
      .set('Authorization', `Bearer ${creatorToken}`);

    expect(res.status).toBe(200);
    expect(res.body.history.length).toBeGreaterThan(0);
    expect(res.body.history[0].decision).toBe('approved');
    expect(res.body.history[0].comments).toContain('Content meets all brand tone');
    expect(res.body.history[0].reviewerId.email).toBe('testreviewer@brandlens.io');
  });
});
