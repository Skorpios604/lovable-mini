import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { prompt } = await req.json();

    if (!prompt || typeof prompt !== 'string') {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
    }

    const API_KEY = process.env.GROQ_API_KEY;
    if (!API_KEY) {
      return NextResponse.json({ error: 'Missing Groq API key' }, { status: 500 });
    }

    // Complex prompt for full applications
    const applicationPrompt = `Create a complete React application: "${prompt}"
    
REQUIREMENTS:
- Multiple interconnected components
- Use function declarations for all components
- NO import/export statements  
- Inline styles only (style={{}} objects)
- Complete functionality with navigation between sections
- State management between components
- Rich interactions and features
- Available libraries: THREE (Three.js), d3, Recharts components, Tone, _ (Lodash)
- Available hooks: useState, useEffect, useRef, useMemo, useCallback
- Available icons: Home, Settings, BarChart3, Search, Music, User, Plus, X, Check
- Create a full-featured application experience
- Include multiple views/pages with navigation
- Add loading states and smooth transitions

Build a complete, professional application with multiple components working together.`;

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama3-70b-8192', // Powerful model for complex applications
        messages: [
          {
            role: 'system',
            content: `You are a world-class React developer creating complete applications.

You build:
- Multi-component applications with navigation
- Rich user interfaces with multiple views
- Full functionality and state management
- Professional, polished applications
- Interactive features throughout

TECHNICAL REQUIREMENTS:
- Use function declarations for all components
- Inline styles exclusively (no CSS classes)
- Include navigation between sections
- Implement comprehensive state management
- Add loading states and transitions
- Use available libraries (Three.js, D3, Recharts, etc.)
- Create multiple interconnected components
- Build complete user experiences

You create full applications, not just single components.`,
          },
          { role: 'user', content: applicationPrompt },
        ],
        temperature: 0.3, // Higher creativity for complex apps
        max_tokens: 4000, // More tokens for full applications
        stop: ['```'],
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json({ error: data.error || 'Error from Groq API' }, { status: response.status });
    }

    let generatedCode = data.choices?.[0]?.message?.content || '';
    
    // Standard cleanup for applications
    generatedCode = generatedCode.trim();
    generatedCode = generatedCode.replace(/```(?:jsx?|tsx?|javascript|typescript)?\n?/g, '');
    generatedCode = generatedCode.replace(/```/g, '');
    generatedCode = generatedCode.replace(/^import\s+.*?from\s+['"].*?['"];?\s*$/gm, '');
    generatedCode = generatedCode.replace(/^export\s+default\s+/gm, '');
    generatedCode = generatedCode.replace(/^export\s+/gm, '');
    
    // Wrap if needed for applications
    if (!generatedCode.includes('function ') && !generatedCode.includes('const ') && generatedCode.includes('<')) {
      generatedCode = `function Application() {
  return (
    ${generatedCode}
  );
}`;
    }

    return NextResponse.json({ code: generatedCode });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}