'use client';

import React, { useState, useMemo } from 'react';
import { LiveProvider, LiveEditor, LiveError, LivePreview } from 'react-live';
import * as Babel from '@babel/standalone';

// Available scope for the live preview
const scope = {
  React,
  useState: React.useState,
  useEffect: React.useEffect,
  useMemo: React.useMemo,
  useCallback: React.useCallback,
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
      
      // If it's a function component, wrap it properly
      if (cleanCode.includes('function ') || cleanCode.includes('const ') || cleanCode.includes('let ') || cleanCode.includes('var ')) {
        // Extract the component name if it's a named function
        const functionMatch = cleanCode.match(/function\s+(\w+)/);
        const constMatch = cleanCode.match(/const\s+(\w+)\s*=/);
        const componentName = functionMatch?.[1] || constMatch?.[1] || 'Component';
        
        // Ensure the component is returned/rendered
        if (!cleanCode.includes('render(')) {
          cleanCode = `${cleanCode}\n\nrender(<${componentName} />);`;
        }
      } else if (cleanCode.startsWith('<')) {
        // If it's JSX, wrap it in a render call
        cleanCode = `render(${cleanCode});`;
      } else if (!cleanCode.includes('render(')) {
        // If no render call, add one
        cleanCode = `${cleanCode}\n\nrender(<div>Component generated</div>);`;
      }

      return cleanCode;
    } catch (err) {
      console.error('Error processing code:', err);
      return rawCode;
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
    <div style={{ maxWidth: 800, margin: 'auto', padding: 20, background: '#18181b', minHeight: '100vh', color: '#f4f4f5' }}>
      <h1 style={{ color: '#f4f4f5' }}>Generate React Components with Groq Llama3</h1>
      <form onSubmit={handleSubmit} style={{ marginBottom: 20 }}>
        <textarea
          placeholder="Enter your prompt here..."
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          rows={4}
          style={{ width: '100%', fontSize: 16, padding: 10, background: '#27272a', color: '#f4f4f5', border: '1px solid #3f3f46', borderRadius: 8 }}
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
            padding: '10px 20px',
            fontWeight: 600,
            fontSize: 16,
            cursor: loading ? 'not-allowed' : 'pointer',
            transition: 'background 0.2s',
            boxShadow: '0 2px 8px #0002',
          }}
        >
          {loading ? 'Generating...' : 'Generate Component'}
        </button>
      </form>

      {error && <p style={{ color: '#f87171' }}>{error}</p>}

      {rawCode && (
        <div className="border border-gray-200 rounded-lg overflow-hidden">
          {/* Tab Navigation */}
          <div className="flex border-b border-gray-200 bg-gray-50">
            <button
              className={`px-4 py-2 text-sm font-medium ${
                activeTab === 'preview'
                  ? 'border-b-2 border-blue-500 text-blue-600 bg-white'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
              onClick={() => setActiveTab('preview')}
            >
              Preview
            </button>
            <button
              className={`px-4 py-2 text-sm font-medium ${
                activeTab === 'code'
                  ? 'border-b-2 border-blue-500 text-blue-600 bg-white'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
              onClick={() => setActiveTab('code')}
            >
              Code
            </button>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {activeTab === 'preview' ? (
              <div>
                <h3 className="text-lg font-semibold text-white-900 mb-4">Live Preview</h3>
                <div className="border border-gray-200 rounded-lg p-6 bg-gray-50 min-h-[200px]" style={{ background: '#000' }}>
                  <LiveProvider code={processedCode} scope={scope} noInline={true}>
                    <LiveError className="text-red-600 bg-red-50 p-3 rounded mb-4" />
                    <LivePreview />
                  </LiveProvider>
                </div>
              </div>
            ) : (
              <div>
                <h2 style={{ color: '#fafafa' }}>Generated Code:</h2>
                <LiveProvider code={processedCode} scope={scope} noInline={true}>
                  <LiveEditor
                    className="rounded-lg border border-gray-200"
                    style={{
                      backgroundColor: '#27272a',
                      fontFamily: 'Monaco, Menlo, "Ubuntu Mono", monospace',
                      fontSize: 14,
                      minHeight: 300,
                      color: '#f4f4f5',
                    }}
                  />
                  <LiveError className="text-red-600 bg-red-50 p-3 rounded mt-4" />
                </LiveProvider>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}