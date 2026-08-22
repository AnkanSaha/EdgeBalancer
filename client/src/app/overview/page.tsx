'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import { Sidebar, Topbar } from '@/components/dashboard/Sidebar';
import { Icons } from '@/components/shared/Icons';
import { AiPromptCard, AiAgentModal, applyAiEvent, initialAiRunState, type AiRunState } from '@/components/dashboard/AiAgentModal';
import { streamAiGeneration } from '@/lib/aiStream';
import type { ConversationTurn, LoadBalancer } from '@/types/api';

export default function OverviewPage() {
  const router = useRouter();
  const { user, loading: authLoading, logout } = useAuth();
  const [loadBalancers, setLoadBalancers] = useState<LoadBalancer[]>([]);
  const [loading, setLoading] = useState(true);

  // AI Agent state — the conversation chain lives here and is replayed on every call
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiMessages, setAiMessages] = useState<ConversationTurn[]>([]);
  const [aiRun, setAiRun] = useState<AiRunState | null>(null);
  const aiAbortRef = useRef<AbortController | null>(null);
  // runId of the conversation's first turn — echoed back so the server keeps one history entry
  // per conversation instead of one per turn.
  const aiConversationRef = useRef<string | null>(null);

  useEffect(() => {
    if (!authLoading && user && !user.hasCloudflareCredentials) {
      router.push('/onboarding');
      return;
    }
    if (!authLoading && !user) {
      router.push('/login');
      return;
    }
  }, [user, authLoading, router]);

  // Counts only — the fleet stats above the prompt card.
  const fetchLoadBalancers = useCallback(async () => {
    try {
      const response = await api.getLoadBalancers({});
      if (response.success && response.data?.loadBalancers) {
        setLoadBalancers(response.data.loadBalancers);
      }
    } catch {
      // silent — a failed count must not break the page
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user) fetchLoadBalancers();
  }, [user]);

  /**
   * One SSE call of the agent session. `history` is everything said before `prompt` — the server
   * appends the prompt as the newest user message, so clarification round-trips resume with full
   * context. The agent's answer is appended to the visible conversation when the turn settles.
   */
  const streamAiTurn = useCallback(async (prompt: string, history: ConversationTurn[]) => {
    const controller = new AbortController();
    aiAbortRef.current = controller;
    setAiRun(initialAiRunState);

    try {
      await streamAiGeneration(prompt, {
        history,
        conversationId: aiConversationRef.current,
        signal: controller.signal,
        onEvent: (event) => {
          if (event.name === 'run_start' && !aiConversationRef.current) {
            aiConversationRef.current = event.payload.runId;
          }
          setAiRun((current) => applyAiEvent(current ?? initialAiRunState, event));
          if (event.name === 'done' || event.name === 'error') {
            const message = event.payload.message;
            if (message) setAiMessages((prev) => [...prev, { role: 'assistant', content: message }]);
          }
        },
      });
    } catch (error: any) {
      // Aborting closes the request, which the server treats as a cancellation and rolls back.
      const cancelled = controller.signal.aborted;
      setAiRun((current) => {
        const base = current ?? initialAiRunState;
        return cancelled
          ? { ...base, phase: 'done', outcome: 'failure', message: 'You cancelled the run. The step in progress was rolled back; anything already finished was kept.' }
          : applyAiEvent(base, { name: 'error', payload: { message: error.message || 'AI generation failed' } });
      });
    } finally {
      aiAbortRef.current = null;
    }
  }, []);

  const cancelAiGeneration = useCallback(() => aiAbortRef.current?.abort(), []);

  const runAiGeneration = useCallback(() => {
    const prompt = aiPrompt.trim();
    if (!prompt || aiRun?.phase === 'running') return;

    setAiMessages((prev) => [...prev, { role: 'user', content: prompt }]);
    void streamAiTurn(prompt, aiMessages);
    setAiPrompt('');
  }, [aiPrompt, aiMessages, aiRun, streamAiTurn]);

  // The agent asked something — the reply continues the same conversation chain.
  const handleAiReply = useCallback((text: string) => {
    if (aiRun?.phase === 'running') return;
    setAiMessages((prev) => [...prev, { role: 'user', content: text }]);
    void streamAiTurn(text, aiMessages);
  }, [aiMessages, aiRun, streamAiTurn]);

  // A failed run can still have deployed something before it broke, so always resync.
  const closeAiModal = useCallback(() => {
    aiAbortRef.current?.abort();
    aiConversationRef.current = null;
    setAiMessages([]);
    setAiRun(null);
    fetchLoadBalancers();
  }, [fetchLoadBalancers]);

  const handleNav = (id: string) => {
    if (id === 'gateways') router.push('/gateways');
    else if (id === 'balancers') router.push('/loadbalancers');
    else if (id === 'sessions') router.push('/sessions');
    else if (id === 'ai-runs') router.push('/ai-runs');
    else if (id === 'pro') router.push('/pro');
    else if (id === 'payments') router.push('/payments');
    else if (id === 'settings') router.push('/settings');
  };

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  if (authLoading || loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: 48, height: 48, margin: '0 auto 16px',
            border: '2px solid var(--line)', borderTopColor: 'var(--accent)',
            borderRadius: '50%', animation: 'spin 0.9s linear infinite',
          }} />
          <p style={{ color: 'var(--text-3)' }}>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg)', flexDirection: 'column' }}>
      <div className="app-shell">
        <Sidebar
          current="overview"
          onNav={handleNav}
          onLogout={handleLogout}
          userEmail={user?.email}
          hasCloudflareCredentials={user?.hasCloudflareCredentials}
          cloudflareOAuthConnected={user?.cloudflareOAuthConnected}
          isReady={!!user?.hasCloudflareCredentials}
          isPro={user?.isPro}
          plan={user?.plan}
          planExpiresAt={user?.planExpiresAt}
        />
        <main style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <Topbar
            crumbs={['Overview']}
            title="Overview"
            subtitle="Describe what you need, and see your fleet at a glance"
            actions={
              <button className="btn btn-ghost btn-sm" onClick={fetchLoadBalancers}>
                <Icons.Refresh size={14} /> <span className="hide-sm">Refresh</span>
              </button>
            }
          />
          <div style={{ padding: 'clamp(16px, 4vw, 32px)', overflow: 'auto', flex: 1 }}>
            <AiPromptCard
              value={aiPrompt}
              onChange={setAiPrompt}
              onSubmit={runAiGeneration}
              disabled={!!aiRun}
              isPro={user?.isPro}
            />

            {/* Summary */}
            <div className="dash-stats" style={{
              gap: 'clamp(12px, 2vw, 16px)', marginBottom: 'clamp(20px, 4vw, 32px)',
            }}>
              {[
                { l: 'Active balancers', v: loadBalancers.filter(b => b.status === 'active').length, sub: `of ${loadBalancers.length} total` },
                { l: 'Origins total', v: loadBalancers.reduce((a, b) => a + (b.originCount || 0), 0), sub: 'all checks passing', color: 'var(--green)' },
              ].map((s, i) => (
                <div
                  key={i}
                  className="feature-card animate-slide-up"
                  style={{ padding: 'clamp(16px, 2vw, 20px)', animationDelay: `${i * 0.08}s` }}
                >
                  <div className="kicker" style={{ fontSize: 'clamp(9px, 2vw, 11px)' }}>{s.l}</div>
                  <div className="mono" style={{ fontSize: 'clamp(20px, 3vw, 24px)', marginTop: 8, letterSpacing: '-0.02em', color: s.color || 'var(--text)' }}>
                    {s.v}
                  </div>
                  <div style={{ fontSize: 'clamp(11px, 1vw, 12px)', color: 'var(--text-3)', marginTop: 4 }}>{s.sub}</div>
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>

      <AiAgentModal
        isOpen={!!aiRun}
        run={aiRun ?? initialAiRunState}
        messages={aiMessages}
        onCancel={cancelAiGeneration}
        onClose={closeAiModal}
        onReply={handleAiReply}
      />
    </div>
  );
}
