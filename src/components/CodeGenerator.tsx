'use client';

import React, { useState } from 'react';
import { LiveProvider, LiveEditor, LiveError, LivePreview } from 'react-live';

export default function CodeGenerator() {
  const [prompt, setPrompt] = useState('');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setCode('');

    try {
      const res = await fetch('/api/groq', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Something went wrong');
      setCode(data.code);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ maxWidth: 800, margin: 'auto', padding: 20 }}>
      <h1>Generate React Components with Groq Llama3</h1>
      <form onSubmit={handleSubmit} style={{ marginBottom: 20 }}>
        <textarea
          placeholder="Enter your prompt here..."
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          rows={4}
          style={{ width: '100%', fontSize: 16, padding: 10 }}
          disabled={loading}
        />
        <button type="submit" disabled={loading || !prompt.trim()} style={{ marginTop: 10 }}>
          {loading ? 'Generating...' : 'Generate Component'}
        </button>
      </form>

      {error && <p style={{ color: 'red' }}>{error}</p>}

      {code && (
        <>
          <h2>Generated Code:</h2>
          <LiveProvider code={code} noInline={true}>
            <LiveEditor style={{ backgroundColor: '#f0f0f0', fontSize: 14, minHeight: 200 }} />
            <LiveError style={{ color: 'red' }} />
            <h2>Live Preview:</h2>
            <div style={{ padding: 20, border: '1px solid #ccc', marginTop: 10 }}>
              <LivePreview />
            </div>
          </LiveProvider>
        </>
      )}
    </div>
  );
}
