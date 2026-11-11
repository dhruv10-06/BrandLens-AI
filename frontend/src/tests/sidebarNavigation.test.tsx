import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { Sidebar } from '../components/layout/Sidebar.tsx';

// Mock AuthContext so Sidebar can render with creator role
vi.mock('../context/AuthContext.tsx', () => ({
  useAuth: () => ({
    user: { id: 'test-user', name: 'Test Creator', role: 'creator', organizationId: 'test-org' },
    token: 'test-token',
    isAuthenticated: true,
    isLoading: false,
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
    refreshUser: vi.fn(),
  }),
}));

describe('Sidebar Navigation Route Highlighting Regression Tests', () => {
  /**
   * Helper that parses rendered HTML output from renderToString
   * and extracts navigation item names whose anchor tags have the active class 'bg-brand-600'.
   */
  const getActiveNavItems = (html: string): string[] => {
    // Match all <a ... class="... bg-brand-600 ..."> ... <span>Label</span> ... </a>
    const activeAnchors = [...html.matchAll(/<a[^>]*class="[^"]*bg-brand-600[^"]*"[^>]*>([\s\S]*?)<\/a>/g)];
    return activeAnchors.map((anchor) => {
      const spanMatch = anchor[1].match(/<span>(.*?)<\/span>/);
      return spanMatch ? spanMatch[1] : '';
    });
  };

  it('/submissions/new highlights only Submit Content', () => {
    const html = renderToString(
      <MemoryRouter initialEntries={['/submissions/new']}>
        <Sidebar />
      </MemoryRouter>
    );

    const activeItems = getActiveNavItems(html);
    expect(activeItems).toEqual(['Submit Content']);
    expect(activeItems).not.toContain('Submissions');
  });

  it('/submissions highlights only Submissions', () => {
    const html = renderToString(
      <MemoryRouter initialEntries={['/submissions']}>
        <Sidebar />
      </MemoryRouter>
    );

    const activeItems = getActiveNavItems(html);
    expect(activeItems).toEqual(['Submissions']);
    expect(activeItems).not.toContain('Submit Content');
  });

  it('/analytics highlights only Brand Analytics', () => {
    const html = renderToString(
      <MemoryRouter initialEntries={['/analytics']}>
        <Sidebar />
      </MemoryRouter>
    );

    const activeItems = getActiveNavItems(html);
    expect(activeItems).toEqual(['Brand Analytics']);
    expect(activeItems).not.toContain('Dashboard');
    expect(activeItems).not.toContain('Submissions');
  });

  it('/guidelines highlights only Brand Guidelines', () => {
    const html = renderToString(
      <MemoryRouter initialEntries={['/guidelines']}>
        <Sidebar />
      </MemoryRouter>
    );

    const activeItems = getActiveNavItems(html);
    expect(activeItems).toEqual(['Brand Guidelines']);
    expect(activeItems).not.toContain('Dashboard');
    expect(activeItems).not.toContain('Submissions');
  });
});

