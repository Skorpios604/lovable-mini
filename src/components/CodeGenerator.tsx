'use client';

import React, { useState, useMemo, useEffect } from 'react';
import DotGrid from './DotGrid'; // Adjust the path based on where you put the file
import { LiveProvider, LiveEditor, LiveError, LivePreview } from 'react-live';

// Available scope for the live preview
const scope = {
  React,
  useState: React.useState,
  useEffect: React.useEffect,
  useMemo: React.useMemo,
  useCallback: React.useCallback,
  render: (element: React.ReactElement) => element,
};

// Types for saved projects
interface SavedProject {
  id: string;
  name: string;
  prompt: string;
  code: string;
  createdAt: string;
  updatedAt: string;
  thumbnail?: string;
}

// Storage utilities
const STORAGE_KEY = 'neural-appforge-projects';

const saveProject = (project: SavedProject): void => {
  try {
    const savedProjects = getSavedProjects();
    const existingIndex = savedProjects.findIndex(p => p.id === project.id);
    
    if (existingIndex >= 0) {
      savedProjects[existingIndex] = { ...project, updatedAt: new Date().toISOString() };
    } else {
      savedProjects.unshift(project);
    }
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(savedProjects));
  } catch (error) {
    console.error('Failed to save project:', error);
  }
};

const getSavedProjects = (): SavedProject[] => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch (error) {
    console.error('Failed to load projects:', error);
    return [];
  }
};

const deleteProject = (id: string): void => {
  try {
    const savedProjects = getSavedProjects();
    const filtered = savedProjects.filter(p => p.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  } catch (error) {
    console.error('Failed to delete project:', error);
  }
};

const generateProjectName = (prompt: string): string => {
  const words = prompt.split(' ').slice(0, 3);
  return words.map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
};

export default function CodeGenerator() {
  const [prompt, setPrompt] = useState('');
  const [rawCode, setRawCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'preview' | 'code'>('preview');
  const [showTemplates, setShowTemplates] = useState(false);
  const [currentProject, setCurrentProject] = useState<SavedProject | null>(null);
  const [savedProjects, setSavedProjects] = useState<SavedProject[]>([]);
  const [showSavedProjects, setShowSavedProjects] = useState(false);
  const [projectName, setProjectName] = useState('');

  // Load saved projects on mount
  useEffect(() => {
    setSavedProjects(getSavedProjects());
  }, []);

  // Auto-save when code changes
  useEffect(() => {
    if (rawCode && prompt && currentProject) {
      const updatedProject = {
        ...currentProject,
        code: rawCode,
        prompt: prompt,
        updatedAt: new Date().toISOString()
      };
      saveProject(updatedProject);
      setSavedProjects(getSavedProjects());
    }
  }, [rawCode, prompt, currentProject]);

  const applicationTemplates = [
    { name: "Dashboard Analytics", prompt: "Create a comprehensive analytics dashboard with charts, metrics, and data visualization" },
    { name: "Social Media App", prompt: "Build a social media application with posts, profiles, and messaging features" },
    { name: "E-commerce Store", prompt: "Generate an e-commerce application with product catalog, cart, and checkout" },
    { name: "Project Manager", prompt: "Create a project management tool with tasks, timelines, and team collaboration" },
    { name: "Learning Platform", prompt: "Generate an online learning platform with courses, progress tracking, and quizzes" },
    { name: "Financial App", prompt: "Create a financial dashboard with portfolio tracking, transactions, and analytics" },
    { name: "Creative Studio", prompt: "Build a creative tool for design, drawing, or content creation" }
  ];

  // Process the generated code to make it renderable
  const processedCode = useMemo(() => {
    if (!rawCode) return '';

    try {
      let cleanCode = rawCode.replace(/```(?:jsx?|tsx?|javascript|typescript)?\n?/g, '').trim();
      cleanCode = cleanCode.replace(/import\s+.*?from\s+['"].*?['"];?\s*/g, '');
      cleanCode = cleanCode.replace(/export\s+default\s+/g, '');
      cleanCode = cleanCode.replace(/export\s+/g, '');
      
      let componentName = 'GeneratedComponent';
      const functionMatch = cleanCode.match(/function\s+(\w+)/);
      const constMatch = cleanCode.match(/const\s+(\w+)\s*=/);
      
      if (functionMatch) {
        componentName = functionMatch[1];
      } else if (constMatch) {
        componentName = constMatch[1];
      }
      
      if (!cleanCode.includes('function ') && !cleanCode.includes('const ') && !cleanCode.includes('=>')) {
        cleanCode = `function GeneratedComponent() {
  return (
    ${cleanCode}
  );
}`;
        componentName = 'GeneratedComponent';
      }
      
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

render(<ErrorComponent />);`;
    }
  }, [rawCode]);

  const handleSaveProject = () => {
    if (!rawCode || !prompt) return;
    
    const name = projectName || generateProjectName(prompt);
    const project: SavedProject = {
      id: currentProject?.id || Date.now().toString(),
      name,
      prompt,
      code: rawCode,
      createdAt: currentProject?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    saveProject(project);
    setCurrentProject(project);
    setSavedProjects(getSavedProjects());
    setProjectName('');
    
    // Show success animation
    const button = document.getElementById('save-button');
    if (button) {
      button.style.background = 'linear-gradient(45deg, #00ff00, #00ffaa)';
      button.textContent = '✅ SAVED';
      setTimeout(() => {
        button.style.background = 'linear-gradient(45deg, #ff00ff, #00ffff)';
        button.textContent = '💾 SAVE PROJECT';
      }, 1500);
    }
  };

  const handleLoadProject = (project: SavedProject) => {
    setCurrentProject(project);
    setPrompt(project.prompt);
    setRawCode(project.code);
    setProjectName(project.name);
    setShowSavedProjects(false);
    setActiveTab('preview');
  };

  const handleDeleteProject = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this project?')) {
      deleteProject(id);
      setSavedProjects(getSavedProjects());
      if (currentProject?.id === id) {
        setCurrentProject(null);
        setPrompt('');
        setRawCode('');
        setProjectName('');
      }
    }
  };

  const handleNewProject = () => {
    setCurrentProject(null);
    setPrompt('');
    setRawCode('');
    setProjectName('');
    setActiveTab('preview');
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setRawCode('');

    try {
      const res = await fetch('/api/groq', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          prompt: prompt + " (IMPORTANT: Create a COMPLETE APPLICATION with multiple components and features, not just a single component. Use inline styles instead of Tailwind classes. Make it a full-featured app with navigation, multiple views, and comprehensive functionality.)" 
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Something went wrong');
      setRawCode(data.code);
      setActiveTab('preview');
      
      // Auto-create project if this is a new generation
      if (!currentProject && data.code) {
        const newProject: SavedProject = {
          id: Date.now().toString(),
          name: generateProjectName(prompt),
          prompt,
          code: data.code,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        setCurrentProject(newProject);
        saveProject(newProject);
        setSavedProjects(getSavedProjects());
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <div style={{ 
        minHeight: '100vh', 
        background: 'linear-gradient(135deg, #0a0a0a 0%, #1a0a2e 50%, #16213e 100%)',
        color: '#00ffff',
        fontFamily: '"Orbitron", "Courier New", monospace',
        position: 'relative',
        overflow: 'hidden'
      }}>

        {/* DotGrid Background */}
        <DotGrid 
          dotSize={4}
          gap={18}
          baseColor="#A275F0"
          activeColor="#ff00ff"
          proximity={175}
          speedTrigger={100}
          shockRadius={300}
          shockStrength={20}
          resistance={300}
          returnDuration={10}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 1,
            background: '#000', // Set background behind dots to black
          }}
        />

        <div style={{ 
          maxWidth: '1200px', 
          margin: 'auto', 
          padding: '40px 20px',
          position: 'relative',
          zIndex: 2
        }}>
          <div>
            <h1 style={{ 
              fontSize: '3.5rem',
              fontWeight: '900',
              background: 'linear-gradient(45deg, #00ffff, #ff00ff, #00ff00)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              textShadow: '0 0 20px #00ffff, 0 0 40px #ff00ff, 0 0 60px #00ff00',
              marginBottom: '10px',
              letterSpacing: '2px',
              animation: 'glow 2s ease-in-out infinite alternate'
            }}>
              ⚡ NEURAL APPFORGE ⚡
            </h1>
            <p style={{
              fontSize: '1.2rem',
              color: '#00ffaa',
              textShadow: '0 0 10px #00ffaa',
              fontWeight: '300',
              letterSpacing: '1px'
            }}>
              AI-POWERED FULL-STACK APPLICATION SYNTHESIS ENGINE
            </p>
            
            {/* Project Management Bar */}
            <div style={{
              display: 'flex',
              gap: '15px',
              marginTop: '30px',
              justifyContent: 'center',
              flexWrap: 'wrap'
            }}>
              <button
                onClick={handleNewProject}
                style={{
                  background: 'linear-gradient(45deg, #00ff00, #00ffaa)',
                  color: '#000',
                  border: 'none',
                  borderRadius: '15px',
                  padding: '12px 25px',
                  fontWeight: '700',
                  fontSize: '14px',
                  cursor: 'pointer',
                  textTransform: 'uppercase',
                  letterSpacing: '1px',
                  boxShadow: '0 0 20px rgba(0,255,0,0.4)',
                  transition: 'all 0.3s ease'
                }}
                onMouseEnter={(e) => {
                  const target = e.target as HTMLButtonElement;
                  target.style.transform = 'scale(1.05)';
                  target.style.boxShadow = '0 0 30px rgba(0,255,0,0.6)';
                }}
                onMouseLeave={(e) => {
                  const target = e.target as HTMLButtonElement;
                  target.style.transform = 'scale(1)';
                  target.style.boxShadow = '0 0 20px rgba(0,255,0,0.4)';
                }}
              >
                🆕 New Project
              </button>
              
              <button
                onClick={() => setShowSavedProjects(!showSavedProjects)}
                style={{
                  background: 'linear-gradient(45deg, #ff00ff, #ff0099)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '15px',
                  padding: '12px 25px',
                  fontWeight: '700',
                  fontSize: '14px',
                  cursor: 'pointer',
                  textTransform: 'uppercase',
                  letterSpacing: '1px',
                  boxShadow: '0 0 20px rgba(255,0,255,0.4)',
                  transition: 'all 0.3s ease'
                }}
                onMouseEnter={(e) => {
                  const target = e.target as HTMLButtonElement;
                  target.style.transform = 'scale(1.05)';
                  target.style.boxShadow = '0 0 30px rgba(255,0,255,0.6)';
                }}
                onMouseLeave={(e) => {
                  const target = e.target as HTMLButtonElement;
                  target.style.transform = 'scale(1)';
                  target.style.boxShadow = '0 0 20px rgba(255,0,255,0.4)';
                }}
              >
                🗂️ My Apps ({savedProjects.length})
              </button>

              {rawCode && (
                <button
                  id="save-button"
                  onClick={handleSaveProject}
                  style={{
                    background: 'linear-gradient(45deg, #ff00ff, #00ffff)',
                    color: '#000',
                    border: 'none',
                    borderRadius: '15px',
                    padding: '12px 25px',
                    fontWeight: '700',
                    fontSize: '14px',
                    cursor: 'pointer',
                    textTransform: 'uppercase',
                    letterSpacing: '1px',
                    boxShadow: '0 0 20px rgba(255,0,255,0.4)',
                    transition: 'all 0.3s ease'
                  }}
                  onMouseEnter={(e) => {
                    const target = e.target as HTMLButtonElement;
                    target.style.transform = 'scale(1.05)';
                    target.style.boxShadow = '0 0 30px rgba(0,255,255,0.6)';
                  }}
                  onMouseLeave={(e) => {
                    const target = e.target as HTMLButtonElement;
                    target.style.transform = 'scale(1)';
                    target.style.boxShadow = '0 0 20px rgba(255,0,255,0.4)';
                  }}
                >
                  💾 Save Project
                </button>
              )}
            </div>

            {/* Current Project Info */}
            {currentProject && (
              <div style={{
                marginTop: '20px',
                padding: '15px',
                background: 'rgba(0,255,255,0.1)',
                border: '1px solid #00ffff',
                borderRadius: '10px',
                textAlign: 'center'
              }}>
                <div style={{ color: '#00ffff', fontWeight: 'bold', marginBottom: '5px' }}>
                  📝 Current Project: {currentProject.name}
                </div>
                <div style={{ color: '#00ffaa', fontSize: '12px' }}>
                  Created: {new Date(currentProject.createdAt).toLocaleDateString()} | 
                  Updated: {new Date(currentProject.updatedAt).toLocaleString()}
                </div>
              </div>
            )}
          </div>

          {/* Saved Projects Gallery */}
          {showSavedProjects && (
            <div style={{
              background: 'linear-gradient(135deg, rgba(0,0,0,0.9), rgba(0,30,60,0.9))',
              border: '2px solid #ff00ff',
              borderRadius: '20px',
              padding: '30px',
              marginBottom: '30px',
              boxShadow: '0 0 50px rgba(255,0,255,0.3)'
            }}>
              <h3 style={{
                color: '#ff00ff',
                textAlign: 'center',
                marginBottom: '25px',
                fontSize: '24px',
                fontWeight: '700',
                textTransform: 'uppercase',
                letterSpacing: '2px'
              }}>
                🗂️ MY NEURAL APPLICATIONS
              </h3>
              
              {savedProjects.length === 0 ? (
                <div style={{
                  textAlign: 'center',
                  color: '#666',
                  fontSize: '18px',
                  padding: '40px'
                }}>
                  No saved projects yet. Create your first app to get started!
                </div>
              ) : (
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                  gap: '20px'
                }}>
                  {savedProjects.map((project) => (
                    <div
                      key={project.id}
                      onClick={() => handleLoadProject(project)}
                      style={{
                        background: 'linear-gradient(135deg, rgba(0,255,255,0.1), rgba(255,0,255,0.1))',
                        border: currentProject?.id === project.id ? '2px solid #00ff00' : '1px solid #00ffaa',
                        borderRadius: '15px',
                        padding: '20px',
                        cursor: 'pointer',
                        transition: 'all 0.3s ease',
                        position: 'relative',
                        minHeight: '150px'
                      }}
                      onMouseEnter={(e) => {
                        const target = e.target as HTMLDivElement;
                        target.style.transform = 'scale(1.02)';
                        target.style.boxShadow = '0 0 30px rgba(0,255,255,0.4)';
                      }}
                      onMouseLeave={(e) => {
                        const target = e.target as HTMLDivElement;
                        target.style.transform = 'scale(1)';
                        target.style.boxShadow = 'none';
                      }}
                    >
                      <button
                        onClick={(e) => handleDeleteProject(project.id, e)}
                        style={{
                          position: 'absolute',
                          top: '10px',
                          right: '10px',
                          background: 'rgba(255,0,0,0.8)',
                          color: '#fff',
                          border: 'none',
                          borderRadius: '50%',
                          width: '30px',
                          height: '30px',
                          cursor: 'pointer',
                          fontSize: '16px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        ×
                      </button>
                      
                      <div style={{
                        color: '#00ffff',
                        fontWeight: 'bold',
                        fontSize: '18px',
                        marginBottom: '10px',
                        paddingRight: '40px'
                      }}>
                        {project.name}
                      </div>
                      
                      <div style={{
                        color: '#00ffaa',
                        fontSize: '14px',
                        marginBottom: '15px',
                        opacity: 0.8,
                        lineHeight: '1.4',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden'
                      }}>
                        {project.prompt}
                      </div>
                      
                      <div style={{
                        color: '#666',
                        fontSize: '12px',
                        position: 'absolute',
                        bottom: '15px',
                        left: '20px',
                        right: '20px'
                      }}>
                        {new Date(project.updatedAt).toLocaleDateString()}
                        {currentProject?.id === project.id && (
                          <span style={{
                            color: '#00ff00',
                            fontWeight: 'bold',
                            marginLeft: '10px'
                          }}>
                            • ACTIVE
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Template Selector */}
          <div style={{ marginBottom: '30px', textAlign: 'center' }}>
            <button
              onClick={() => setShowTemplates(!showTemplates)}
              style={{
                background: 'linear-gradient(45deg, #ff00ff, #00ffff)',
                color: '#000',
                border: 'none',
                borderRadius: '15px',
                padding: '12px 30px',
                fontWeight: '700',
                fontSize: '14px',
                cursor: 'pointer',
                textTransform: 'uppercase',
                letterSpacing: '1px',
                marginBottom: '20px',
                boxShadow: '0 0 20px rgba(255,0,255,0.4)'
              }}
            >
              🎯 Quick Application Templates
            </button>
            
            {showTemplates && (
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                gap: '15px',
                marginTop: '20px'
              }}>
                {applicationTemplates.map((template, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      setPrompt(template.prompt);
                      setShowTemplates(false);
                    }}
                    style={{
                      background: 'rgba(0,255,255,0.1)',
                      border: '1px solid #00ffaa',
                      borderRadius: '10px',
                      padding: '15px',
                      color: '#00ffaa',
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'all 0.3s ease'
                    }}
                    onMouseEnter={(e) => {
                      const target = e.target as HTMLButtonElement;
                      target.style.background = 'rgba(0,255,255,0.2)';
                      target.style.transform = 'scale(1.02)';
                    }}
                    onMouseLeave={(e) => {
                      const target = e.target as HTMLButtonElement;
                      target.style.background = 'rgba(0,255,255,0.1)';
                      target.style.transform = 'scale(1)';
                    }}
                  >
                    <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>
                      {template.name}
                    </div>
                    <div style={{ fontSize: '12px', opacity: 0.8 }}>
                      {template.prompt}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
          
          {/* Input form with cyberpunk styling */}
          <form onSubmit={handleSubmit} style={{ marginBottom: '40px' }}>
            <div style={{
              background: 'linear-gradient(135deg, rgba(0,255,255,0.1) 0%, rgba(255,0,255,0.1) 100%)',
              border: '2px solid #00ffff',
              borderRadius: '15px',
              padding: '25px',
              boxShadow: '0 0 30px rgba(0,255,255,0.3), inset 0 0 30px rgba(255,0,255,0.1)',
              backdropFilter: 'blur(10px)',
              position: 'relative'
            }}>
              <div style={{
                position: 'absolute',
                top: '-1px',
                left: '-1px',
                right: '-1px',
                bottom: '-1px',
                background: 'linear-gradient(45deg, #00ffff, #ff00ff, #00ff00, #00ffff)',
                borderRadius: '15px',
                zIndex: -1,
                animation: 'border-flow 3s linear infinite'
              }} />
              
              <textarea
                placeholder="⚡ INITIALIZE APPLICATION MATRIX... (e.g., 'Create a streaming app', 'Build a project management dashboard', 'Generate a social media platform')"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                rows={4}
                style={{ 
                  width: '100%', 
                  fontSize: '16px', 
                  padding: '20px', 
                  background: 'rgba(0,0,0,0.8)', 
                  color: '#00ffff', 
                  border: '1px solid #00ffaa', 
                  borderRadius: '10px',
                  resize: 'vertical',
                  fontFamily: '"Courier New", monospace',
                  boxShadow: 'inset 0 0 20px rgba(0,255,255,0.2)',
                  outline: 'none'
                }}
                disabled={loading}
                onFocus={(e) => {
                  const target = e.target as HTMLTextAreaElement;
                  target.style.border = '2px solid #ff00ff';
                  target.style.boxShadow = 'inset 0 0 30px rgba(255,0,255,0.3), 0 0 20px rgba(255,0,255,0.5)';
                }}
                onBlur={(e) => {
                  const target = e.target as HTMLTextAreaElement;
                  target.style.border = '1px solid #00ffaa';
                  target.style.boxShadow = 'inset 0 0 20px rgba(0,255,255,0.2)';
                }}
              />
              
              <button
                type="submit"
                disabled={loading || !prompt.trim()}
                style={{
                  marginTop: '20px',
                  background: loading ? 'linear-gradient(45deg, #333, #555)' : 'linear-gradient(45deg, #ff00ff, #00ffff)',
                  color: '#000',
                  border: 'none',
                  borderRadius: '25px',
                  padding: '15px 40px',
                  fontWeight: '900',
                  fontSize: '16px',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  transition: 'all 0.3s ease',
                  boxShadow: loading ? 'none' : '0 0 30px rgba(255,0,255,0.6)',
                  textTransform: 'uppercase',
                  letterSpacing: '2px',
                  fontFamily: '"Orbitron", monospace',
                  animation: loading ? 'pulse 1s infinite' : 'none',
                  position: 'relative',
                  overflow: 'hidden'
                }}
                onMouseEnter={(e) => {
                  if (!loading) {
                    const target = e.target as HTMLButtonElement;
                    target.style.transform = 'scale(1.05)';
                    target.style.boxShadow = '0 0 50px rgba(0,255,255,0.8)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!loading) {
                    const target = e.target as HTMLButtonElement;
                    target.style.transform = 'scale(1)';
                    target.style.boxShadow = '0 0 30px rgba(255,0,255,0.6)';
                  }
                }}
              >
                {loading ? (
                  <span style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ 
                      width: '20px', 
                      height: '20px', 
                      border: '3px solid #00ffff',
                      borderTop: '3px solid transparent',
                      borderRadius: '50%',
                      animation: 'spin 1s linear infinite'
                    }} />
                    NEURAL SYNTHESIS...
                  </span>
                ) : (
                  '⚡ FORGE APPLICATION ⚡'
                )}
              </button>
            </div>
          </form>

          {/* Error display */}
          {error && (
            <div style={{ 
              color: '#ff0066', 
              background: 'linear-gradient(135deg, rgba(255,0,102,0.2), rgba(255,0,0,0.1))',
              padding: '20px', 
              borderRadius: '15px', 
              marginBottom: '30px',
              border: '2px solid #ff0066',
              boxShadow: '0 0 30px rgba(255,0,102,0.4)',
              textAlign: 'center',
              fontWeight: 'bold',
              animation: 'error-pulse 2s ease-in-out infinite'
            }}>
              ⚠️ NEURAL ERROR: {error}
            </div>
          )}

          {/* Results area */}
          {rawCode && (
            <div style={{ 
              border: '2px solid #00ffaa', 
              borderRadius: '20px', 
              overflow: 'hidden', 
              background: 'linear-gradient(135deg, rgba(0,0,0,0.9), rgba(0,20,40,0.9))',
              boxShadow: '0 0 50px rgba(0,255,170,0.3)',
              position: 'relative'
            }}>
              {/* Animated border */}
              <div style={{
                position: 'absolute',
                top: '0',
                left: '0',
                right: '0',
                height: '2px',
                background: 'linear-gradient(90deg, transparent, #00ffff, transparent)',
                animation: 'scan 2s linear infinite'
              }} />
              
              {/* Tab Navigation */}
              <div style={{ 
                display: 'flex', 
                borderBottom: '2px solid #00ffaa', 
                background: 'linear-gradient(135deg, rgba(0,0,0,0.9), rgba(0,30,60,0.9))'
              }}>
                <button
                  style={{
                    padding: '20px 30px',
                    fontSize: '16px',
                    fontWeight: '700',
                    background: activeTab === 'preview' 
                      ? 'linear-gradient(45deg, #00ffff, #ff00ff)' 
                      : 'transparent',
                    color: activeTab === 'preview' ? '#000' : '#00ffaa',
                    border: 'none',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    textTransform: 'uppercase',
                    letterSpacing: '1px',
                    fontFamily: '"Orbitron", monospace',
                    boxShadow: activeTab === 'preview' ? '0 0 20px rgba(0,255,255,0.5)' : 'none',
                    position: 'relative'
                  }}
                  onClick={() => setActiveTab('preview')}
                  onMouseEnter={(e) => {
                    if (activeTab !== 'preview') {
                      const target = e.target as HTMLButtonElement;
                      target.style.color = '#00ffff';
                      target.style.textShadow = '0 0 10px #00ffff';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (activeTab !== 'preview') {
                      const target = e.target as HTMLButtonElement;
                      target.style.color = '#00ffaa';
                      target.style.textShadow = 'none';
                    }
                  }}
                >
                  📺 APPLICATION PREVIEW
                </button>
                <button
                  style={{
                    padding: '20px 30px',
                    fontSize: '16px',
                    fontWeight: '700',
                    background: activeTab === 'code' 
                      ? 'linear-gradient(45deg, #00ffff, #ff00ff)' 
                      : 'transparent',
                    color: activeTab === 'code' ? '#000' : '#00ffaa',
                    border: 'none',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    textTransform: 'uppercase',
                    letterSpacing: '1px',
                    fontFamily: '"Orbitron", monospace',
                    boxShadow: activeTab === 'code' ? '0 0 20px rgba(0,255,255,0.5)' : 'none'
                  }}
                  onClick={() => setActiveTab('code')}
                  onMouseEnter={(e) => {
                    if (activeTab !== 'code') {
                      const target = e.target as HTMLButtonElement;
                      target.style.color = '#00ffff';
                      target.style.textShadow = '0 0 10px #00ffff';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (activeTab !== 'code') {
                      const target = e.target as HTMLButtonElement;
                      target.style.color = '#00ffaa';
                      target.style.textShadow = 'none';
                    }
                  }}
                >
                  🔬 APPLICATION CODE
                </button>
              </div>

              {/* Tab Content */}
              <div style={{ padding: '40px' }}>
                {activeTab === 'preview' ? (
                  <div>
                    <h3 style={{ 
                      color: '#00ffff', 
                      marginBottom: '25px', 
                      fontSize: '24px', 
                      fontWeight: '700',
                      textShadow: '0 0 15px #00ffff',
                      textTransform: 'uppercase',
                      letterSpacing: '2px'
                    }}>
                      ⚡ LIVE APPLICATION PREVIEW ⚡
                    </h3>
                    <div style={{ 
                      border: '2px solid #ff00ff', 
                      borderRadius: '15px', 
                      padding: '30px', 
                      background: '#000000', 
                      minHeight: '300px',
                      color: '#ffffff',
                      boxShadow: '0 0 30px rgba(255,0,255,0.4), inset 0 0 30px rgba(0,255,255,0.1)',
                      position: 'relative',
                      overflow: 'hidden'
                    }}>
                      <div style={{
                        position: 'absolute',
                        top: '0',
                        left: '0',
                        right: '0',
                        bottom: '0',
                        background: 'linear-gradient(45deg, transparent 49%, rgba(0,255,255,0.1) 50%, transparent 51%)',
                        animation: 'scan-diagonal 3s linear infinite',
                        pointerEvents: 'none'
                      }} />
                      <LiveProvider code={processedCode} scope={scope} noInline={true}>
                        <LiveError style={{ 
                          color: '#dc2626', 
                          background: 'rgba(220,38,38,0.1)', 
                          padding: '15px', 
                          borderRadius: '10px', 
                          marginBottom: '20px',
                          border: '2px solid #dc2626',
                          boxShadow: '0 0 20px rgba(220,38,38,0.3)'
                        }} />
                        <LivePreview />
                      </LiveProvider>
                    </div>
                  </div>
                ) : (
                  <div>
                    <h3 style={{ 
                      color: '#00ffff', 
                      marginBottom: '25px', 
                      fontSize: '24px', 
                      fontWeight: '700',
                      textShadow: '0 0 15px #00ffff',
                      textTransform: 'uppercase',
                      letterSpacing: '2px'
                    }}>
                      🔬 APPLICATION SOURCE CODE 🔬
                    </h3>
                    <div style={{
                      border: '2px solid #00ffaa',
                      borderRadius: '15px',
                      overflow: 'hidden',
                      background: 'rgba(0,0,0,0.9)',
                      boxShadow: '0 0 30px rgba(0,255,170,0.3)'
                    }}>
                      <LiveProvider code={processedCode} scope={scope} noInline={true}>
                        <LiveEditor
                          style={{
                            backgroundColor: '#0a0a0a',
                            fontFamily: '"Courier New", "Fira Code", monospace',
                            fontSize: '14px',
                            minHeight: '400px',
                            color: '#00ffaa',
                            lineHeight: '1.6'
                          }}
                        />
                        <LiveError style={{ 
                          color: '#ff0066', 
                          background: 'rgba(255,0,102,0.1)', 
                          padding: '15px', 
                          margin: '20px',
                          borderRadius: '10px',
                          border: '2px solid #ff0066',
                          boxShadow: '0 0 20px rgba(255,0,102,0.3)'
                        }} />
                      </LiveProvider>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
          
          {/* Debug info with cyberpunk styling */}
          {rawCode && (
            <details style={{ 
              marginTop: '30px', 
              color: '#666',
              background: 'rgba(0,0,0,0.5)',
              padding: '20px',
              borderRadius: '10px',
              border: '1px solid #333'
            }}>
              <summary style={{ 
                cursor: 'pointer', 
                padding: '10px 0',
                color: '#00ffaa',
                fontWeight: 'bold',
                textTransform: 'uppercase'
              }}>
                🔍 DEBUG: Raw Neural Output
              </summary>
              <pre style={{ 
                background: '#0a0a0a', 
                padding: '20px', 
                borderRadius: '10px', 
                overflow: 'auto',
                fontSize: '12px',
                border: '1px solid #333',
                color: '#00ffaa',
                fontFamily: '"Courier New", monospace'
              }}>
                {rawCode}
              </pre>
            </details>
          )}
        </div>
      </div>

      {/* Add CSS animations via a style tag */}
      <style dangerouslySetInnerHTML={{
        __html: `
          @keyframes glow {
            0%, 100% { text-shadow: 0 0 20px #00ffff, 0 0 40px #ff00ff, 0 0 60px #00ff00; }
            50% { text-shadow: 0 0 30px #ff00ff, 0 0 50px #00ffff, 0 0 70px #00ff00; }
          }
        
          @keyframes border-flow {
            0% { background-position: 0% 0%; }
            100% { background-position: 100% 100%; }
          }
          
          @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.7; }
          }
          
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          
          @keyframes error-pulse {
            0%, 100% { box-shadow: 0 0 30px rgba(255,0,102,0.4); }
            50% { box-shadow: 0 0 50px rgba(255,0,102,0.8); }
          }
          
          @keyframes scan {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(100%); }
          }
          
          @keyframes scan-diagonal {
            0% { transform: translateX(-100%) translateY(-100%); }
            100% { transform: translateX(100%) translateY(100%); }
          }
        `
      }} />
    </>
  );
}