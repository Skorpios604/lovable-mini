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
You are creating a React functional component. Follow these rules EXACTLY:

Request: "${prompt}"

CRITICAL RULES:
1. Return ONLY a complete React function component
2. Use function declaration: function ComponentName() { ... }
3. NO import statements, NO export statements
4. Use React hooks if needed (useState, useEffect available in scope)
5. Use Tailwind CSS classes for ALL styling
6. Make components interactive with proper event handlers
7. Ensure all click handlers and form submissions work properly
8. Component must be complete and functional

EXAMPLE (for a button):
function MyButton() {
  const [clicked, setClicked] = useState(false);
  
  const handleClick = () => {
    setClicked(!clicked);
  };
  
  return (
    <button 
      onClick={handleClick}
      className={\`px-6 py-3 rounded-lg font-medium transition-all duration-200 \${
        clicked 
          ? 'bg-green-500 text-white hover:bg-green-600' 
          : 'bg-blue-500 text-white hover:bg-blue-600'
      }\`}
    >
      {clicked ? 'Clicked!' : 'Click me'}
    </button>
  );
}

EXAMPLE (for a todo list):
function TodoList() {
  const [todos, setTodos] = useState([]);
  const [inputValue, setInputValue] = useState('');
  
  const addTodo = () => {
    if (inputValue.trim()) {
      setTodos([...todos, { id: Date.now(), text: inputValue, completed: false }]);
      setInputValue('');
    }
  };
  
  const toggleTodo = (id) => {
    setTodos(todos.map(todo => 
      todo.id === id ? { ...todo, completed: !todo.completed } : todo
    ));
  };
  
  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-4">Todo List</h2>
      <div className="flex gap-2 mb-4">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && addTodo()}
          placeholder="Add a todo..."
          className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          onClick={addTodo}
          className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
        >
          Add
        </button>
      </div>
      <ul className="space-y-2">
        {todos.map(todo => (
          <li
            key={todo.id}
            onClick={() => toggleTodo(todo.id)}
            className={\`p-3 rounded-md cursor-pointer transition-colors \${
              todo.completed
                ? 'bg-green-100 text-green-800 line-through'
                : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
            }\`}
          >
            {todo.text}
          </li>
        ))}
      </ul>
    </div>
  );
}

Now create a component for: "${prompt}"`;

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
            1. Return ONLY a complete React function component
            2. NO explanations, NO markdown, NO backticks
            3. Use function declaration syntax: function ComponentName() { ... }
            4. Make components interactive with working event handlers
            5. Use Tailwind CSS for ALL styling
            6. Ensure all functionality works (buttons click, forms submit, etc.)
            7. Component should be complete and render immediately
            8. Use proper React patterns and hooks
            9. Handle edge cases and user interactions properly`,
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