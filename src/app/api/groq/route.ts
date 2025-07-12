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
1. Return ONLY a complete React function component
2. Use function declaration: function ComponentName() { ... }
3. NO import statements, NO export statements
4. Available hooks: useState, useEffect, useMemo, useCallback
5. Available libraries: React, Lucide icons, Three.js, D3, Recharts, Tone.js, Lodash
6. Use ONLY inline styles (no Tailwind classes)
7. Focus on VISUAL IMPACT and MODERN AESTHETICS

DESIGN PRINCIPLES:
- Use gradients, shadows, and glassmorphism effects
- Add smooth animations and transitions
- Include hover effects and micro-interactions
- Use modern color palettes (consider dark themes)
- Add depth with layering and shadows
- Include loading states and smooth state transitions
- Make it feel premium and cutting-edge

STYLING GUIDELINES:
- Use CSS-in-JS with style objects ONLY
- NO styled-jsx, NO <style> tags, NO external CSS
- Use inline styles with CSS animations via animation property
- Add keyframes using CSS strings in the animation property
- Use transitions for smooth hover effects
- Include responsive design with conditional styling

EXAMPLE (Advanced Interactive Card):
function ModernCard() {
  const [isHovered, setIsHovered] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [pulse, setPulse] = useState(0);
  
  useEffect(() => {
    const interval = setInterval(() => {
      setPulse(prev => (prev + 1) % 100);
    }, 50);
    return () => clearInterval(interval);
  }, []);
  
  const handleAction = async () => {
    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 2000));
    setIsLoading(false);
  };
  
  return (
    <div 
      style={{
        position: 'relative',
        width: '400px',
        height: '250px',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        borderRadius: '20px',
        padding: '30px',
        boxShadow: isHovered 
          ? '0 25px 50px rgba(0,0,0,0.3), 0 0 0 1px rgba(255,255,255,0.1)'
          : '0 15px 35px rgba(0,0,0,0.1), 0 0 0 1px rgba(255,255,255,0.05)',
        cursor: 'pointer',
        transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
        transform: isHovered ? 'translateY(-8px) scale(1.02)' : 'translateY(0) scale(1)',
        overflow: 'hidden',
        color: 'white',
        fontFamily: 'system-ui, -apple-system, sans-serif'
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Animated background pattern */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: \`radial-gradient(circle at \${20 + Math.sin(pulse * 0.1) * 10}% 50%, rgba(255,255,255,0.1) 0%, transparent 50%)\`,
        transform: \`rotate(\${pulse * 2}deg)\`,
        transition: 'transform 0.1s ease'
      }} />
      
      <div style={{
        position: 'relative',
        zIndex: 2,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between'
      }}>
        <div>
          <h3 style={{
            fontSize: '24px',
            fontWeight: '700',
            marginBottom: '12px',
            background: 'linear-gradient(45deg, #fff, #f0f0f0)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>
            Modern Component
          </h3>
          <p style={{
            fontSize: '16px',
            opacity: 0.9,
            lineHeight: '1.5'
          }}>
            This is a premium component with smooth animations and beautiful styling.
          </p>
        </div>
        
        <button
          onClick={handleAction}
          disabled={isLoading}
          style={{
            background: isLoading 
              ? 'rgba(255,255,255,0.2)'
              : 'linear-gradient(45deg, rgba(255,255,255,0.2), rgba(255,255,255,0.1))',
            border: '1px solid rgba(255,255,255,0.3)',
            borderRadius: '12px',
            padding: '12px 24px',
            color: 'white',
            fontWeight: '600',
            cursor: isLoading ? 'not-allowed' : 'pointer',
            transition: 'all 0.3s ease',
            backdropFilter: 'blur(10px)',
            fontSize: '14px',
            opacity: isLoading ? 0.7 : 1,
            transform: isLoading ? 'scale(0.98)' : 'scale(1)'
          }}
        >
          {isLoading ? (
            <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{
                width: '16px',
                height: '16px',
                border: '2px solid rgba(255,255,255,0.3)',
                borderTop: '2px solid white',
                borderRadius: '50%',
                transform: \`rotate(\${pulse * 10}deg)\`,
                transition: 'transform 0.1s ease'
              }} />
              Processing...
            </span>
          ) : (
            'Take Action'
          )}
        </button>
      </div>
    </div>
  );
}

EXAMPLE (Interactive Button with Ripple Effect):
function InteractiveButton() {
  const [isPressed, setIsPressed] = useState(false);
  const [ripples, setRipples] = useState([]);
  const [animationFrame, setAnimationFrame] = useState(0);
  
  useEffect(() => {
    const interval = setInterval(() => {
      setAnimationFrame(prev => prev + 1);
    }, 16);
    return () => clearInterval(interval);
  }, []);
  
  const createRipple = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const newRipple = {
      id: Date.now(),
      x,
      y,
      startTime: Date.now()
    };
    
    setRipples(prev => [...prev, newRipple]);
    setTimeout(() => {
      setRipples(prev => prev.filter(r => r.id !== newRipple.id));
    }, 1000);
  };
  
  return (
    <button
      onMouseDown={() => setIsPressed(true)}
      onMouseUp={() => setIsPressed(false)}
      onMouseLeave={() => setIsPressed(false)}
      onClick={createRipple}
      style={{
        position: 'relative',
        width: '200px',
        height: '60px',
        background: 'linear-gradient(145deg, #667eea, #764ba2)',
        border: 'none',
        borderRadius: '30px',
        color: 'white',
        fontSize: '16px',
        fontWeight: '600',
        cursor: 'pointer',
        overflow: 'hidden',
        boxShadow: isPressed
          ? 'inset 0 4px 8px rgba(0,0,0,0.3), 0 2px 4px rgba(0,0,0,0.2)'
          : '0 8px 16px rgba(0,0,0,0.2), 0 4px 8px rgba(0,0,0,0.1)',
        transform: isPressed ? 'scale(0.98)' : 'scale(1)',
        transition: 'all 0.15s ease',
        fontFamily: 'system-ui, -apple-system, sans-serif'
      }}
    >
      <span style={{
        position: 'relative',
        zIndex: 2,
        display: 'block',
        transform: isPressed ? 'translateY(1px)' : 'translateY(0)',
        transition: 'transform 0.15s ease'
      }}>
        Interactive Button
      </span>
      
      {/* Animated ripple effects */}
      {ripples.map(ripple => {
        const elapsed = (Date.now() - ripple.startTime) / 1000;
        const scale = Math.min(elapsed * 20, 20);
        const opacity = Math.max(0.6 - elapsed, 0);
        
        return (
          <div
            key={ripple.id}
            style={{
              position: 'absolute',
              left: ripple.x,
              top: ripple.y,
              width: '4px',
              height: '4px',
              background: 'rgba(255,255,255,0.6)',
              borderRadius: '50%',
              transform: \`translate(-50%, -50%) scale(\${scale})\`,
              opacity,
              pointerEvents: 'none',
              transition: 'transform 0.1s ease, opacity 0.1s ease'
            }}
          />
        );
      })}
    </button>
  );
}

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

Make it feel premium, interactive, and something users would be excited to use. Push the boundaries of what's possible with modern web technologies!`;

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