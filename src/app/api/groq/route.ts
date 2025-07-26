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
You are an expert React developer creating visually stunning, modern components. Create something that would make users say "wow" and feel premium.

Request: "${prompt}"

CRITICAL RULES:
1. Return a COMPLETE multi-component React application
2. Use function declarations: function ComponentName() { ... }
3. NO import statements, NO export statements
4. Available hooks: useState, useEffect, useMemo, useCallback
5. Available libraries: React, Lucide icons, Three.js, D3, Recharts, Tone.js, Lodash
6. Use ONLY inline styles (no Tailwind classes)
7. Create a FULL APPLICATION with multiple components and features

APPLICATION STRUCTURE:
- Main App component that orchestrates everything
- Multiple child components for different features
- Complete functionality, not just UI
- Navigation between different views/sections
- Data management with state
- Interactive features throughout

DESIGN PRINCIPLES:
- Modern, premium aesthetics with dark themes
- Smooth animations and transitions throughout
- Responsive design that works on all devices
- Micro-interactions and hover effects
- Progressive disclosure of information
- Loading states and smooth state transitions
- Use glassmorphism, gradients, and depth

EXAMPLE APPLICATION TYPES:
1. Dashboard Applications (analytics, admin panels)
2. Social Media Apps (feeds, profiles, messaging)
3. E-commerce Applications (product catalogs, shopping carts)
4. Content Management Systems
5. Project Management Tools
6. Music/Media Players
7. Gaming Applications
8. Financial Applications
9. Learning Platforms
10. Creative Tools

APPLICATION FEATURES TO INCLUDE:
- Multiple interconnected components
- Routing/navigation between sections
- Forms with validation
- Data visualization
- Search and filtering
- User interactions and feedback
- Responsive layouts
- Loading and error states
- Local state management
- Dynamic content generation

AVAILABLE LIBRARIES:
- Lucide React: import { IconName } from 'lucide-react' (use for beautiful icons)
- Three.js: Create 3D scenes and interactive graphics
- D3: Data visualization and complex animations
- Recharts: Beautiful charts and graphs
- Tone.js: Audio synthesis and music
- Lodash: Utility functions for data manipulation

COMPONENT CATEGORIES TO EXCEL AT:
1. Interactive Cards & Panels
2. Data Visualization Components
3. 3D Interactive Elements
4. Audio/Music Players
5. Image Galleries & Carousels
6. Form Components with Validation
7. Dashboard Widgets
8. Game-like Interactive Elements
9. Loading States & Animations
10. Social Media Components

Now create a visually stunning, modern component for: "${prompt}"

Make it a FULL APPLICATION with multiple features, not just a single component!`;

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
            content: `You are a world-class React developer and UI/UX designer. You create components that are:
            - Visually stunning and modern
            - Highly interactive with smooth animations
            - Premium feeling with attention to detail
            - Cutting-edge in design and functionality
            
            REQUIREMENTS:
            1. Return ONLY a complete React function component
            2. NO explanations, NO markdown, NO backticks
            3. Use function declaration: function ComponentName() { ... }
            4. Use ONLY inline styles (no CSS classes)
            5. Include modern animations and interactions
            6. Make it feel premium and polished
            7. Use gradients, shadows, and modern effects
            8. Include loading states and micro-interactions
            9. Ensure all functionality works perfectly
            10. Push creative boundaries while maintaining usability`,
          },
          { role: 'user', content: enhancedPrompt },
        ],
        temperature: 0.8,
        max_tokens: 3000,
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
    generatedCode = generatedCode.replace(/```(?:jsx?|tsx?|javascript|typescript)?\n?/g, '');
    generatedCode = generatedCode.replace(/```/g, '');
    generatedCode = generatedCode.replace(/import\s+.*?from\s+['"].*?['"];?\s*/g, '');
    generatedCode = generatedCode.replace(/export\s+default\s+/g, '');
    generatedCode = generatedCode.replace(/export\s+/g, '');
    
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