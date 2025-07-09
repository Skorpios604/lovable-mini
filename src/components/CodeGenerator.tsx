'use client';

import React, { useState, useMemo } from 'react';
import { LiveProvider, LiveEditor, LiveError, LivePreview } from 'react-live';

// Available scope for the live preview
const scope = {
  React,
  useState: React.useState,
  useEffect: React.useEffect,
  useMemo: React.useMemo,
  useCallback: React.useCallback,
  render: (element: React.ReactElement) => element, // Add render function for react-live
};

export default function CodeGenerator() {
  const [prompt, setPrompt] = useState('');
  const [rawCode, setRawCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'preview' | 'code'>('preview');

  // Process the generated code to make it renderable
  const processedCode = useMemo(() => {
    if (!rawCode) return '';

    try {
      // Remove any markdown code blocks
      let cleanCode = rawCode.replace(/```(?:jsx?|tsx?|javascript|typescript)?\n?/g, '').trim();
      
      // Remove import statements (they'll be handled by scope)
      cleanCode = cleanCode.replace(/import\s+.*?from\s+['"].*?['"];?\s*/g, '');
      
      // Remove export statements
      cleanCode = cleanCode.replace(/export\s+default\s+/g, '');
      cleanCode = cleanCode.replace(/export\s+/g, '');
      
      // Extract component name and ensure it's properly formatted
      let componentName = 'GeneratedComponent';
      const functionMatch = cleanCode.match(/function\s+(\w+)/);
      const constMatch = cleanCode.match(/const\s+(\w+)\s*=/);
      
      if (functionMatch) {
        componentName = functionMatch[1];
      } else if (constMatch) {
        componentName = constMatch[1];
      }
      
      // If it's not already a proper component, wrap it
      if (!cleanCode.includes('function ') && !cleanCode.includes('const ') && !cleanCode.includes('=>')) {
        // If it's just JSX, wrap it in a component
        cleanCode = `function GeneratedComponent() {
  return (
    ${cleanCode}
  );
}`;
        componentName = 'GeneratedComponent';
      }
      
      // Make sure we render the component using render() for react-live
      if (!cleanCode.includes('render(')) {
        cleanCode = `${cleanCode}

render(<${componentName} />);`;
      }

      return cleanCode;
    } catch (err) {
      console.error('Error processing code:', err);
      return `function ErrorComponent() {
  return <div style={{color: 'red', padding: '20px'}}>Error processing code: ${err}</div>;
}

<ErrorComponent />`;
    }
  }, [rawCode]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setRawCode('');

    try {
      const res = await fetch('/api/groq', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Something went wrong');
      setRawCode(data.code);
      setActiveTab('preview'); // Switch to preview tab when new code is generated
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ maxWidth: 1200, margin: 'auto', padding: 20, background: '#18181b', minHeight: '100vh', color: '#f4f4f5' }}>
      <h1 style={{ color: '#f4f4f5', marginBottom: 20 }}>Generate React Components with Groq Llama3</h1>
      
      <form onSubmit={handleSubmit} style={{ marginBottom: 20 }}>
        <textarea
          placeholder="Enter your prompt here... (e.g., 'Create a button with hover effects' or 'Build a todo list component')"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          rows={4}
          style={{ 
            width: '100%', 
            fontSize: 16, 
            padding: 10, 
            background: '#27272a', 
            color: '#f4f4f5', 
            border: '1px solid #3f3f46', 
            borderRadius: 8,
            resize: 'vertical'
          }}
          disabled={loading}
        />
        <button
          type="submit"
          disabled={loading || !prompt.trim()}
          style={{
            marginTop: 10,
            background: loading ? '#52525b' : '#2563eb',
            color: '#f4f4f5',
            border: 'none',
            borderRadius: 8,
            padding: '12px 24px',
            fontWeight: 600,
            fontSize: 16,
            cursor: loading ? 'not-allowed' : 'pointer',
            transition: 'background 0.2s',
            boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
          }}
        >
          {loading ? 'Generating...' : 'Generate Component'}
        </button>
      </form>

      {error && (
        <div style={{ 
          color: '#f87171', 
          background: '#3f1f1f', 
          padding: '12px', 
          borderRadius: '8px', 
          marginBottom: '20px',
          border: '1px solid #991b1b'
        }}>
          Error: {error}
        </div>
      )}

      {rawCode && (
        <div style={{ border: '1px solid #3f3f46', borderRadius: 8, overflow: 'hidden', background: '#27272a' }}>
          {/* Tab Navigation */}
          <div style={{ display: 'flex', borderBottom: '1px solid #3f3f46', background: '#1f1f23' }}>
            <button
              style={{
                padding: '12px 16px',
                fontSize: 14,
                fontWeight: 500,
                background: activeTab === 'preview' ? '#2563eb' : 'transparent',
                color: activeTab === 'preview' ? '#ffffff' : '#a1a1aa',
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
              onClick={() => setActiveTab('preview')}
            >
              Preview
            </button>
            <button
              style={{
                padding: '12px 16px',
                fontSize: 14,
                fontWeight: 500,
                background: activeTab === 'code' ? '#2563eb' : 'transparent',
                color: activeTab === 'code' ? '#ffffff' : '#a1a1aa',
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
              onClick={() => setActiveTab('code')}
            >
              Code
            </button>
          </div>

          {/* Tab Content */}
          <div style={{ padding: 24 }}>
            {activeTab === 'preview' ? (
              <div>
                <h3 style={{ color: '#f4f4f5', marginBottom: 16, fontSize: 18, fontWeight: 600 }}>Live Preview</h3>
                <div style={{ 
                  border: '1px solid #3f3f46', 
                  borderRadius: 8, 
                  padding: 24, 
                  background: '#ffffff', 
                  minHeight: 200,
                  color: '#000000' // Reset color for the preview area
                }}>
                  <LiveProvider code={processedCode} scope={scope} noInline={true}>
                    <LiveError style={{ 
                      color: '#dc2626', 
                      background: '#fef2f2', 
                      padding: 12, 
                      borderRadius: 6, 
                      marginBottom: 16,
                      border: '1px solid #fecaca'
                    }} />
                    <LivePreview />
                  </LiveProvider>
                </div>
              </div>
            ) : (
              <div>
                <h3 style={{ color: '#f4f4f5', marginBottom: 16, fontSize: 18, fontWeight: 600 }}>Generated Code</h3>
                <LiveProvider code={processedCode} scope={scope} noInline={true}>
                  <LiveEditor
                    style={{
                      backgroundColor: '#1e1e1e',
                      fontFamily: 'Monaco, Menlo, "Ubuntu Mono", monospace',
                      fontSize: 14,
                      minHeight: 300,
                      borderRadius: 8,
                      border: '1px solid #3f3f46',
                    }}
                  />
                  <LiveError style={{ 
                    color: '#dc2626', 
                    background: '#fef2f2', 
                    padding: 12, 
                    borderRadius: 6, 
                    marginTop: 16,
                    border: '1px solid #fecaca'
                  }} />
                </LiveProvider>
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* Debug info */}
      {rawCode && (
        <details style={{ marginTop: 20, color: '#a1a1aa' }}>
          <summary style={{ cursor: 'pointer', padding: '8px 0' }}>Debug: Raw Generated Code</summary>
          <pre style={{ 
            background: '#1f1f23', 
            padding: 12, 
            borderRadius: 6, 
            overflow: 'auto',
            fontSize: 12,
            border: '1px solid #3f3f46'
          }}>
            {rawCode}
          </pre>
        </details>
      )}
    </div>
  );
}