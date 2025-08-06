import { NextRequest, NextResponse } from 'next/server';

// Function to detect if request is for a simple component or full app
const isSimpleRequest = (prompt: string): boolean => {
  const simpleKeywords = ['button', 'input', 'card', 'modal', 'form', 'list item', 'header', 'footer', 'todo', 'counter', 'slider', 'toggle', 'checkbox'];
  const complexKeywords = ['app', 'application', 'dashboard', 'platform', 'system', 'full', 'complete', 'entire', 'comprehensive'];
  
  const lowerPrompt = prompt.toLowerCase();
  const hasSimple = simpleKeywords.some(keyword => lowerPrompt.includes(keyword));
  const hasComplex = complexKeywords.some(keyword => lowerPrompt.includes(keyword));
  
  if (hasComplex) return false;
  if (hasSimple) return true;
  
  // Default: if prompt is short and specific, treat as simple
  return prompt.split(' ').length < 8;
};

// Dynamic prompt generation based on request complexity
const createPrompt = (userPrompt: string, isSimple: boolean) => {
  if (isSimple) {
    return `Create a functional React component: "${userPrompt}"
    
REQUIREMENTS:
- Single focused component
- Use function declaration: function ComponentName() { ... }
- NO import/export statements
- Inline styles only (style={{}} objects)
- Available hooks: useState, useEffect, useRef
- Available icons: Home, Settings, BarChart3, Search, Music, User, Plus, X, Check
- Make it work perfectly with proper event handlers
- Focus on core functionality requested
- Include proper state management if needed

Return ONLY the component code, no explanations.`;
  } else {
    return `Create a complete React application: "${userPrompt}"
    
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
- Create a full-featured application experience

Return ONLY the complete application code, no explanations.`;
  }
};

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

    // Determine request complexity and create appropriate prompt
    const isSimple = isSimpleRequest(prompt);
    const enhancedPrompt = createPrompt(prompt, isSimple);

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: isSimple ? 'llama3-8b-8192' : 'llama3-70b-8192', // Use lighter model for simple requests
        messages: [
          {
            role: 'system',
            content: `You are a world-class React developer. You create components that are:
            - Functional and work perfectly
            - Visually appealing with modern design
            - Use inline styles for all styling
            - Include proper event handlers and state management
            
            CRITICAL REQUIREMENTS:
            1. Return ONLY React function component code
            2. NO explanations, NO markdown, NO backticks
            3. Use function declaration: function ComponentName() { ... }
            4. Use ONLY inline styles (style={{}} objects)
            5. Make all functionality work perfectly
            6. Include modern animations and interactions where appropriate`,
          },
          { role: 'user', content: enhancedPrompt },
        ],
        temperature: isSimple ? 0.1 : 0.3, // Lower temperature for simple, more consistent results
        max_tokens: isSimple ? 1500 : 4000, // Fewer tokens for simple components
        stop: ['```'], // Only stop on code blocks, not on export/import
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json({ error: data.error || 'Error from Groq API' }, { status: response.status });
    }

    let generatedCode = data.choices?.[0]?.message?.content || '';
    
    // Clean up the generated code (less aggressive cleanup)
    generatedCode = generatedCode.trim();
    generatedCode = generatedCode.replace(/```(?:jsx?|tsx?|javascript|typescript)?\n?/g, '');
    generatedCode = generatedCode.replace(/```/g, '');
    // Only remove imports at the start of lines
    generatedCode = generatedCode.replace(/^import\s+.*?from\s+['"].*?['"];?\s*$/gm, '');
    generatedCode = generatedCode.replace(/^export\s+default\s+/gm, '');
    generatedCode = generatedCode.replace(/^export\s+/gm, '');
    
    // Only wrap in function if it's not already a proper component
    if (!generatedCode.includes('function ') && !generatedCode.includes('const ') && !generatedCode.includes('=>')) {
      if (generatedCode.includes('<') && generatedCode.includes('>')) {
        generatedCode = `function GeneratedComponent() {
  return (
    ${generatedCode}
  );
}`;
      }
    }

    return NextResponse.json({ code: generatedCode });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}