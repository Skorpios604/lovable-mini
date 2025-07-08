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

Requirements:
- Write a complete, functional React component
- Use modern React hooks (useState, useEffect, etc.) if needed
- Use Tailwind CSS for styling with modern, attractive designs
- Make the component interactive and visually appealing
- Do not include any import statements
- Do not include export statements
- Use proper React patterns and best practices
- Make sure the component is self-contained and complete
- Add hover effects, transitions, and micro-interactions where appropriate

Example format:
function MyComponent() {
  const [state, setState] = useState(initialValue);
  
  return (
    <div className="...">
      {/* Component JSX */}
    </div>
  );
}

Now create the component:`;

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
            content: 'You are an expert React developer who creates beautiful, functional components. Return only the component code without any explanations, markdown formatting, or additional text.',
          },
          { role: 'user', content: enhancedPrompt },
        ],
        temperature: 0.7,
        max_tokens: 2048,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json({ error: data.error || 'Error from Groq API' }, { status: response.status });
    }

    const generatedCode = data.choices?.[0]?.message?.content || '';

    return NextResponse.json({ code: generatedCode });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}