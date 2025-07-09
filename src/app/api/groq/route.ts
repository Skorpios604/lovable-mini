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

    const enhancedPrompt = `
Create a React functional component based on this request: "${prompt}"

CRITICAL REQUIREMENTS:
- Return ONLY the React component code, no explanations or markdown
- Use function declaration: function ComponentName() { ... }
- Do NOT include any import statements
- Do NOT include any export statements
- Use React hooks (useState, useEffect, etc.) if needed - they're available in scope
- Use Tailwind CSS classes for styling
- Make it interactive and visually appealing
- Component should be self-contained and functional
- Add hover effects and transitions where appropriate
- Use modern React patterns

EXAMPLE FORMAT:
function MyComponent() {
  const [count, setCount] = useState(0);
  
  return (
    <div className="p-6 max-w-md mx-auto bg-white rounded-xl shadow-lg">
      <button 
        onClick={() => setCount(count + 1)}
        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
      >
        Count: {count}
      </button>
    </div>
  );
}

IMPORTANT: Only return the function component code, no render() calls or JSX at the end.

Now create the component for: "${prompt}"`;

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama3-70b-8192',
        messages: [
          {
            role: 'system',
            content: `You are an expert React developer. You MUST:
            1. Return ONLY the React component code
            2. NO explanations, NO markdown, NO backticks
            3. Use function declaration syntax
            4. Make components interactive and beautiful
            5. Use Tailwind CSS for styling
            6. Component should work immediately when rendered`,
          },
          { role: 'user', content: enhancedPrompt },
        ],
        temperature: 0.7,
        max_tokens: 2048,
        stop: ['```', 'export', 'import'],
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json({ error: data.error || 'Error from Groq API' }, { status: response.status });
    }

    let generatedCode = data.choices?.[0]?.message?.content || '';
    
    // Clean up the generated code
    generatedCode = generatedCode.trim();
    
    // Remove any potential markdown or code blocks
    generatedCode = generatedCode.replace(/```(?:jsx?|tsx?|javascript|typescript)?\n?/g, '');
    generatedCode = generatedCode.replace(/```/g, '');
    
    // Remove import/export statements if they slipped through
    generatedCode = generatedCode.replace(/import\s+.*?from\s+['"].*?['"];?\s*/g, '');
    generatedCode = generatedCode.replace(/export\s+default\s+/g, '');
    generatedCode = generatedCode.replace(/export\s+/g, '');
    
    // If it doesn't start with function, try to wrap it properly
    if (!generatedCode.includes('function ') && !generatedCode.includes('const ') && !generatedCode.includes('=>')) {
      // If it looks like JSX, wrap it in a component
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