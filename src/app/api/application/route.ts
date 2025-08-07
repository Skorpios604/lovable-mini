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

    // Strict prompt for full applications - no explanations allowed
    const applicationPrompt = `Build: "${prompt}"

RULES:
- Return ONLY React code, NO explanations
- Multiple components with navigation
- Function declarations only
- Inline styles only
- Complete working application
- NO text before/after code

Start with function declarations immediately.`;

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
            content: `You return ONLY React function component code. NO explanations, NO descriptions, NO markdown.

FORBIDDEN RESPONSES:
- "Here is a complete React application..."
- "This application includes..."
- Any explanatory text
- Markdown formatting
- Code comments explaining what you built

REQUIRED RESPONSES:
- Start immediately with: function ComponentName() {
- Multiple interconnected components
- Inline styles: style={{}}
- Working navigation between sections
- Complete functionality
- NO import/export statements

You are a code generator, not an explainer. Return executable code only.`,
          },
          { role: 'user', content: applicationPrompt },
        ],
        temperature: 0.2, // Lower temperature for more consistent code-only output
        max_tokens: 4000,
        stop: ['```', 'Here is', 'This is', 'Below is'],
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json({ error: data.error || 'Error from Groq API' }, { status: response.status });
    }

    let generatedCode = data.choices?.[0]?.message?.content || '';
    
    // Aggressive cleanup to remove any explanatory text
    generatedCode = generatedCode.trim();
    
    // Remove markdown
    generatedCode = generatedCode.replace(/```(?:jsx?|tsx?|javascript|typescript)?\n?/g, '');
    generatedCode = generatedCode.replace(/```/g, '');
    
    // Remove imports/exports
    generatedCode = generatedCode.replace(/^import\s+.*?from\s+['"].*?['"];?\s*$/gm, '');
    generatedCode = generatedCode.replace(/^export\s+default\s+/gm, '');
    generatedCode = generatedCode.replace(/^export\s+/gm, '');
    
    // Remove any explanatory text patterns
    generatedCode = generatedCode.replace(/^.*?Here\s+is.*?:/gim, '');
    generatedCode = generatedCode.replace(/^.*?This\s+is.*?:/gim, '');
    generatedCode = generatedCode.replace(/^.*?Below\s+is.*?:/gim, '');
    generatedCode = generatedCode.replace(/^.*?Complete.*?application.*?:/gim, '');
    generatedCode = generatedCode.replace(/^.*?React\s+application.*?:/gim, '');
    
    // Remove any leading explanatory sentences
    const lines = generatedCode.split('\n');
    let startIndex = 0;
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].trim().startsWith('function ') || lines[i].trim().startsWith('const ')) {
        startIndex = i;
        break;
      }
    }
    generatedCode = lines.slice(startIndex).join('\n').trim();
    
    // Ensure it starts with a function declaration
    if (!generatedCode.startsWith('function ') && !generatedCode.startsWith('const ')) {
      // Look for the first function in the text
      const functionMatch = generatedCode.match(/(function\s+\w+[\s\S]*)/);
      if (functionMatch) {
        generatedCode = functionMatch[1];
      } else {
        // Last resort wrapper
        generatedCode = `function CompleteApplication() {
  return (
    <div style={{padding: '20px', color: '#fff'}}>
      <h1>Application Generation Error</h1>
      <p>Could not parse the generated application code.</p>
    </div>
  );
}`;
      }
    }
    
    // Clean up any remaining issues
    generatedCode = generatedCode.trim();

    return NextResponse.json({ code: generatedCode });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
