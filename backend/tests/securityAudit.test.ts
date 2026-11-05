import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import { createApp } from '../src/app.js';
import { connectDB, disconnectDB } from '../src/config/db.js';
import { User } from '../src/models/User.js';
import { Organisation } from '../src/models/Organisation.js';
import { BrandDocument } from '../src/models/BrandDocument.js';
import { ContentSubmission } from '../src/models/ContentSubmission.js';
import { ENV } from '../src/config/env.js';

const app = createApp();

describe('Comprehensive Security & Authorization Audit', () => {
  let org1: any;
  let org2: any;
  let creatorTokenOrg1: string;
  let creatorUserOrg1: any;
  let reviewerTokenOrg1: string;
  let reviewerUserOrg1: any;
  let otherCreatorTokenOrg1: string;
  let creatorTokenOrg2: string;

  let submissionOrg1Id: string;
  let documentOrg1Id: string;

  beforeAll(async () => {
    await connectDB();

    // 1. Create Org 1
    await Organisation.deleteMany({ slug: { $in: ['sec-audit-org-1', 'sec-audit-org-2'] } });
    await User.deleteMany({ email: { $regex: /@sec-audit/ } });

    org1 = await Organisation.create({
      name: 'Security Audit Org 1',
      slug: 'sec-audit-org-1',
    });

    org2 = await Organisation.create({
      name: 'Security Audit Org 2',
      slug: 'sec-audit-org-2',
    });

    // Register Creator 1 in Org 1
    const cRes1 = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Creator One',
        email: 'creator1@sec-audit.com',
        password: 'Password123!',
        orgSlug: 'sec-audit-org-1',
      });
    creatorTokenOrg1 = cRes1.body.token;
    creatorUserOrg1 = cRes1.body.user;

    // Register Creator 2 in Org 1 (peer creator in same org)
    const cRes2 = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Creator Two',
        email: 'creator2@sec-audit.com',
        password: 'Password123!',
        orgSlug: 'sec-audit-org-1',
      });
    otherCreatorTokenOrg1 = cRes2.body.token;

    // Manually provision a verified Reviewer in Org 1 (simulating admin provisioning)
    reviewerUserOrg1 = await User.create({
      name: 'Elena Reviewer',
      email: 'reviewer@sec-audit.com',
      passwordHash: 'dummyhash',
      role: 'reviewer',
      organizationId: org1._id,
    });
    reviewerTokenOrg1 = jwt.sign(
      { id: reviewerUserOrg1._id.toString(), email: reviewerUserOrg1.email, role: 'reviewer', organizationId: org1._id.toString() },
      ENV.JWT_SECRET,
      { expiresIn: '1h' }
    );

    // Register Creator in Org 2 (different organization)
    const cResOrg2 = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Foreign Creator',
        email: 'foreign@sec-audit.com',
        password: 'Password123!',
        orgSlug: 'sec-audit-org-2',
      });
    creatorTokenOrg2 = cResOrg2.body.token;

    // Create baseline submission in Org 1 by Creator 1
    const subRes = await request(app)
      .post('/api/submissions')
      .set('Authorization', `Bearer ${creatorTokenOrg1}`)
      .send({
        title: 'Confidential Strategy Copy',
        contentType: 'blog',
        content: 'Exclusive preliminary release notes for verified customers.',
      });
    submissionOrg1Id = subRes.body.submission._id;

    // Create baseline document in Org 1
    const doc = await BrandDocument.create({
      organizationId: org1._id,
      uploadedBy: reviewerUserOrg1._id,
      filename: 'confidential_brand.txt',
      originalName: 'Confidential_Brand.txt',
      fileType: 'txt',
      fileSize: 100,
      extractedText: 'Confidential brand standards for Org 1.',
      status: 'processed',
      isActive: true,
    });
    documentOrg1Id = doc._id.toString();
  });

  afterAll(async () => {
    await disconnectDB();
  });

  // 1. Creator Attempting to Become Reviewer / Privilege Escalation
  describe('1. Privilege Escalation Defense', () => {
    it('should ignore/reject any elevated role specified during public registration', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Hacker User',
          email: 'hacker@sec-audit.com',
          password: 'Password123!',
          role: 'admin', // Attempted escalation
          orgSlug: 'sec-audit-org-1',
        });

      expect(res.status).toBe(201);
      expect(res.body.user.role).toBe('creator'); // Must remain creator!

      // Verify in DB directly
      const dbUser = await User.findById(res.body.user.id);
      expect(dbUser?.role).toBe('creator');
    });

    it('should block creator from uploading brand guidelines', async () => {
      const res = await request(app)
        .post('/api/documents/upload')
        .set('Authorization', `Bearer ${creatorTokenOrg1}`)
        .attach('file', Buffer.from('%PDF-1.4\nBrand Guidelines Content\n%%EOF'), 'guideline.pdf');

      expect(res.status).toBe(403);
      expect(res.body.error).toContain('Access denied');
    });

    it('should block creator from deleting brand guidelines', async () => {
      const res = await request(app)
        .delete(`/api/documents/${documentOrg1Id}`)
        .set('Authorization', `Bearer ${creatorTokenOrg1}`);

      expect(res.status).toBe(403);
      expect(res.body.error).toContain('Access denied');
    });

    it('should block creator from modifying brand terminology or facts', async () => {
      const res = await request(app)
        .post('/api/facts')
        .set('Authorization', `Bearer ${creatorTokenOrg1}`)
        .send({
          type: 'prohibited_terminology',
          key: 'disallowed',
          value: 'replacement',
        });

      expect(res.status).toBe(403);
    });

    it('should block creator from modifying organization brand voice', async () => {
      const res = await request(app)
        .patch('/api/org/brand-voice')
        .set('Authorization', `Bearer ${creatorTokenOrg1}`)
        .send({
          brandVoiceSummary: 'Hacked voice',
        });

      expect(res.status).toBe(403);
    });
  });

  // 2. Creator Attempting to Approve Submissions (Separation of Duties)
  describe('2. Separation of Duties & Approval Authorization', () => {
    it('should prevent creator from approving another creator submission', async () => {
      const res = await request(app)
        .post(`/api/review/decision/${submissionOrg1Id}`)
        .set('Authorization', `Bearer ${otherCreatorTokenOrg1}`)
        .send({
          decision: 'approved',
          comments: 'Attempting to self-approve or peer-approve without reviewer role.',
        });

      expect(res.status).toBe(403);
      expect(res.body.error).toContain('Access denied');
    });

    it('should prevent creator from editing another creator draft in same org (Ownership)', async () => {
      const res = await request(app)
        .patch(`/api/submissions/${submissionOrg1Id}/content`)
        .set('Authorization', `Bearer ${otherCreatorTokenOrg1}`)
        .send({
          content: 'Malicious modification of another creator draft.',
        });

      expect(res.status).toBe(403);
      expect(res.body.error).toContain('You can only edit your own content');
    });

    it('should prevent reviewer from approving a submission they created themselves', async () => {
      // Reviewer creates a submission
      const sub = await ContentSubmission.create({
        organizationId: org1._id,
        creatorId: reviewerUserOrg1._id,
        title: 'Reviewer Own Draft',
        contentType: 'email',
        originalContent: 'Original copy drafted by reviewer.',
        currentContent: 'Original copy drafted by reviewer.',
        status: 'pending_review',
        version: 1,
      });

      // Reviewer attempts to approve their own draft
      const res = await request(app)
        .post(`/api/review/decision/${sub._id}`)
        .set('Authorization', `Bearer ${reviewerTokenOrg1}`)
        .send({
          decision: 'approved',
          comments: 'Self-approval by reviewer.',
        });

      expect(res.status).toBe(403);
      expect(res.body.error).toContain('Separation of duties violation');
    });
  });

  // 3. Cross-Organisation Data Isolation
  describe('3. Cross-Organisation Data Isolation', () => {
    it('should block user from Org 2 reading submissions from Org 1', async () => {
      const res = await request(app)
        .get(`/api/submissions/${submissionOrg1Id}`)
        .set('Authorization', `Bearer ${creatorTokenOrg2}`);

      expect(res.status).toBe(404);
      expect(res.body.error).toContain('not found or does not belong to your organisation');
    });

    it('should block user from Org 2 editing submissions from Org 1', async () => {
      const res = await request(app)
        .patch(`/api/submissions/${submissionOrg1Id}/content`)
        .set('Authorization', `Bearer ${creatorTokenOrg2}`)
        .send({
          content: 'Cross-tenant data tamper attempt.',
        });

      expect(res.status).toBe(404);
    });

    it('should block user from Org 2 viewing brand guidelines from Org 1', async () => {
      const res = await request(app)
        .get(`/api/documents/${documentOrg1Id}`)
        .set('Authorization', `Bearer ${creatorTokenOrg2}`);

      expect(res.status).toBe(404);
    });
  });

  // 4. Unauthenticated API Access
  describe('4. Unauthenticated Access Protection', () => {
    it('should reject unauthenticated calls to /api/submissions', async () => {
      const res = await request(app).get('/api/submissions');
      expect(res.status).toBe(401);
      expect(res.body.error).toContain('Authentication required');
    });

    it('should reject unauthenticated calls to /api/documents', async () => {
      const res = await request(app).get('/api/documents');
      expect(res.status).toBe(401);
    });

    it('should reject unauthenticated calls to /api/review/queue', async () => {
      const res = await request(app).get('/api/review/queue');
      expect(res.status).toBe(401);
    });

    it('should reject unauthenticated calls to /api/auth/me', async () => {
      const res = await request(app).get('/api/auth/me');
      expect(res.status).toBe(401);
    });
  });

  // 5. Invalid and Expired JWT Handling
  describe('5. JWT Signature & Expiration Verification', () => {
    it('should reject malformed JWT tokens', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer totally.invalid.signature');

      expect(res.status).toBe(401);
      expect(res.body.error).toContain('Invalid or expired authentication token');
    });

    it('should reject JWT signed with wrong secret', async () => {
      const forgedToken = jwt.sign(
        { id: creatorUserOrg1.id, role: 'admin', organizationId: org1._id.toString() },
        'wrong-secret-key-attacker-signature'
      );

      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${forgedToken}`);

      expect(res.status).toBe(401);
    });

    it('should reject expired JWT tokens', async () => {
      const expiredToken = jwt.sign(
        { id: creatorUserOrg1.id, role: 'creator', organizationId: org1._id.toString() },
        ENV.JWT_SECRET,
        { expiresIn: '-1s' }
      );

      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${expiredToken}`);

      expect(res.status).toBe(401);
    });
  });

  // 6. Malformed File Uploads & File Signatures
  describe('6. Safe Upload & File Signature Verification', () => {
    it('should reject file disguised as PDF without %PDF- magic bytes', async () => {
      const fakePdfBuffer = Buffer.from('This is plain text with no PDF header at all.');
      const res = await request(app)
        .post('/api/documents/upload')
        .set('Authorization', `Bearer ${reviewerTokenOrg1}`)
        .attach('file', fakePdfBuffer, 'fake.pdf');

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('does not contain valid PDF magic bytes');
    });

    it('should reject executable files disguised as TXT (MZ signature)', async () => {
      // 0x4D 0x5A = MZ header for Windows executables
      const fakeExeBuffer = Buffer.from([0x4d, 0x5a, 0x90, 0x00, 0x03, 0x00, 0x00, 0x00]);
      const res = await request(app)
        .post('/api/documents/upload')
        .set('Authorization', `Bearer ${reviewerTokenOrg1}`)
        .attach('file', fakeExeBuffer, 'script.txt');

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('Windows PE/Executable file detected');
    });

    it('should reject empty document uploads', async () => {
      const emptyBuffer = Buffer.from('');
      const res = await request(app)
        .post('/api/documents/upload')
        .set('Authorization', `Bearer ${reviewerTokenOrg1}`)
        .attach('file', emptyBuffer, 'empty.txt');

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('empty');
    });
  });

  // 7. Missing Production Secrets & Safe Defaults
  describe('7. Production Environment Configuration Enforcement', () => {
    it('should refuse to allow seed-demo endpoint in production mode', async () => {
      // In production mode, seed-demo must be forbidden
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      const res = await request(app)
        .post('/api/org/seed-demo')
        .send({ force: true });

      // Restore
      process.env.NODE_ENV = originalEnv;

      expect(res.status).toBe(403);
      expect(res.body.error).toContain('disabled in production');
    });
  });
});

