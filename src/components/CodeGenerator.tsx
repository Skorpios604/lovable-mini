'use client';

import React, { useState, useMemo, useEffect } from 'react';
import DotGrid from './DotGrid';
import { LiveProvider, LiveEditor, LiveError, LivePreview } from 'react-live';
import './neural-appforge.css';
import * as LucideReact from 'lucide-react';
import * as THREE from 'three';
import * as d3 from 'd3';
import { LineChart, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, Area, AreaChart, PieChart, Pie, Cell, Line } from 'recharts';
import * as Tone from 'tone';
import _ from 'lodash';

// Available scope for the live preview - now modular based on request type
const getScope = (requestType: 'component' | 'application') => {
  const baseScope = {
    React,
    useState: React.useState,
    useEffect: React.useEffect,
    useMemo: React.useMemo,
    useCallback: React.useCallback,
    useRef: React.useRef,
    render: (element: React.ReactElement) => element,
  };

  if (requestType === 'component') {
    // Minimal scope for components
    return {
      ...baseScope,
      // Basic Lucide icons
      Home: LucideReact.Home,
      Settings: LucideReact.Settings,
      Search: LucideReact.Search,
      User: LucideReact.User,
      Plus: LucideReact.Plus,
      X: LucideReact.X,
      Check: LucideReact.Check,
      Edit: LucideReact.Edit,
      Trash2: LucideReact.Trash2,
    };
  } else {
    // Full scope for applications
    return {
      ...baseScope,
      // All Lucide icons
      Home: LucideReact.Home,
      Settings: LucideReact.Settings,
      BarChart3: LucideReact.BarChart3,
      Search: LucideReact.Search,
      Music: LucideReact.Music,
      User: LucideReact.User,
      Loader: LucideReact.Loader,
      Plus: LucideReact.Plus,
      X: LucideReact.X,
      Check: LucideReact.Check,
      Edit: LucideReact.Edit,
      Trash2: LucideReact.Trash2,
      // Three.js
      THREE,
      // D3
      d3,
      // Recharts components
      LineChart,
      Line,
      XAxis,
      YAxis,
      CartesianGrid,
      Tooltip,
      Legend,
      ResponsiveContainer,
      BarChart,
      Bar,
      Area,
      AreaChart,
      PieChart,
      Pie,
      Cell,
      // Tone.js
      Tone,
      // Lodash
      _,
    };
  }
};

// Types for saved projects
interface SavedProject {
  id: string;
  name: string;
  prompt: string;
  code: string;
  type: 'component' | 'application';
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
  const [requestType, setRequestType] = useState<'component' | 'application'>('component');

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
        type: requestType,
        updatedAt: new Date().toISOString()
      };
      saveProject(updatedProject);
      setSavedProjects(getSavedProjects());
    }
  }, [rawCode, prompt, currentProject, requestType]);

  const componentTemplates = [
    { name: "Button", prompt: "Create a modern blue button with hover effects" },
    { name: "Input Field", prompt: "Create a styled input field with validation" },
    { name: "Card", prompt: "Create a product card with image and details" },
    { name: "Modal", prompt: "Create a modal dialog with close functionality" },
    { name: "Todo Item", prompt: "Create a todo list item with checkbox" },
    { name: "Navigation", prompt: "Create a horizontal navigation menu" },
    { name: "Form", prompt: "Create a contact form with validation" }
  ];

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
  return <div style={{color: '#ff0000', padding: '20px'}}>Error processing code: ${err}</div>;
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
      type: requestType,
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
      button.textContent = '✅ SAVED';
      button.classList.add('btn-success');
      button.classList.remove('btn-primary');
      setTimeout(() => {
        button.textContent = '💾 SAVE PROJECT';
        button.classList.remove('btn-success');
        button.classList.add('btn-primary');
      }, 1500);
    }
  };

  const handleLoadProject = (project: SavedProject) => {
    setCurrentProject(project);
    setPrompt(project.prompt);
    setRawCode(project.code);
    setProjectName(project.name);
    setRequestType(project.type);
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
      const endpoint = requestType === 'component' ? '/api/component' : '/api/application';
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
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
          type: requestType,
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

  const currentScope = useMemo(() => getScope(requestType), [requestType]);
  const currentTemplates = requestType === 'component' ? componentTemplates : applicationTemplates;

  return (
    <div className="neural-appforge">
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
          background: '#000',
        }}
      />

      <div className="neural-container">
        {/* Header */}
        <div>
          <h1 className="neural-title">
            ⚡ NEURAL APPFORGE ⚡
          </h1>
          <p className="neural-subtitle">
            AI-POWERED MODULAR CODE SYNTHESIS ENGINE
          </p>
          
          {/* Project Management Bar */}
          <div className="project-management-bar">
            <button onClick={handleNewProject} className="btn-neural btn-success">
              🆕 New Project
            </button>
            
            <button 
              onClick={() => setShowSavedProjects(!showSavedProjects)} 
              className="btn-neural btn-secondary"
            >
              🗂️ My Projects ({savedProjects.length})
            </button>

            {rawCode && (
              <button
                id="save-button"
                onClick={handleSaveProject}
                className="btn-neural btn-primary"
              >
                💾 Save Project
              </button>
            )}
          </div>

          {/* Current Project Info */}
          {currentProject && (
            <div className="current-project-info">
              <div className="current-project-name">
                📝 Current Project: {currentProject.name} 
                <span className="current-project-type">
                  [{currentProject.type.toUpperCase()}]
                </span>
              </div>
              <div className="current-project-meta">
                Created: {new Date(currentProject.createdAt).toLocaleDateString()} | 
                Updated: {new Date(currentProject.updatedAt).toLocaleString()}
              </div>
            </div>
          )}
        </div>

        {/* Mode Selector */}
        <div className="mode-selector">
          <div className="mode-selector-title">
            🎯 GENERATION MODE
          </div>
          <div className="mode-selector-buttons">
            <button
              onClick={() => setRequestType('component')}
              className={`btn-neural ${requestType === 'component' ? 'btn-primary' : 'btn-secondary'}`}
            >
              🔧 COMPONENT
            </button>
            <button
              onClick={() => setRequestType('application')}
              className={`btn-neural ${requestType === 'application' ? 'btn-primary' : 'btn-secondary'}`}
            >
              🏗️ FULL APP
            </button>
          </div>
          <div className="mode-description">
            {requestType === 'component' 
              ? "Perfect for: buttons, inputs, cards, forms, individual UI elements"
              : "Perfect for: dashboards, complete apps, multi-page systems, full platforms"
            }
          </div>
        </div>

        {/* Saved Projects Gallery */}
        {showSavedProjects && (
          <div className="projects-gallery">
            <h3 className="projects-gallery-title">
              🗂️ MY NEURAL PROJECTS
            </h3>
            
            {savedProjects.length === 0 ? (
              <div className="empty-state">
                No saved projects yet. Create your first project to get started!
              </div>
            ) : (
              <div className="projects-grid">
                {savedProjects.map((project) => (
                  <div
                    key={project.id}
                    onClick={() => handleLoadProject(project)}
                    className={`project-card ${currentProject?.id === project.id ? 'active' : ''}`}
                  >
                    <button
                      onClick={(e) => handleDeleteProject(project.id, e)}
                      className="project-card-delete"
                    >
                      ×
                    </button>
                    
                    <div className="project-card-title">
                      {project.name}
                      <span className="project-card-type">
                        [{project.type?.toUpperCase() || 'LEGACY'}]
                      </span>
                    </div>
                    
                    <div className="project-card-prompt">
                      {project.prompt}
                    </div>
                    
                    <div className="project-card-meta">
                      {new Date(project.updatedAt).toLocaleDateString()}
                      {currentProject?.id === project.id && (
                        <span className="project-active-indicator">
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
        <div className="text-center mb-xl">
          <button
            onClick={() => setShowTemplates(!showTemplates)}
            className="btn-neural btn-primary mb-lg"
          >
            🎯 Quick {requestType === 'component' ? 'Component' : 'Application'} Templates
          </button>
          
          {showTemplates && (
            <div className="templates-grid">
              {currentTemplates.map((template, index) => (
                <button
                  key={index}
                  onClick={() => {
                    setPrompt(template.prompt);
                    setShowTemplates(false);
                  }}
                  className="template-card"
                >
                  <div className="template-card-title">
                    {template.name}
                  </div>
                  <div className="template-card-description">
                    {template.prompt}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
        
        {/* Input form */}
        <form onSubmit={handleSubmit} className="neural-form">
          <div className="neural-form-container">
            <div className="neural-form-border" />
            
            <textarea
              placeholder={requestType === 'component' 
                ? "⚡ CREATE COMPONENT... (e.g., 'make a blue button', 'create a todo item', 'build a contact form')"
                : "⚡ INITIALIZE APPLICATION MATRIX... (e.g., 'Create a streaming app', 'Build a project management dashboard', 'Generate a social media platform')"
              }
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={4}
              className="neural-textarea"
              disabled={loading}
            />
            
            <button
              type="submit"
              disabled={loading || !prompt.trim()}
              className={`btn-neural btn-large btn-primary mt-lg ${loading ? 'btn-loading' : ''}`}
            >
              {loading ? (
                <span className="loading-text">
                  <span className="loading-spinner" />
                  NEURAL SYNTHESIS...
                </span>
              ) : (
                `⚡ FORGE ${requestType.toUpperCase()} ⚡`
              )}
            </button>
          </div>
        </form>

        {/* Error display */}
        {error && (
          <div className="error-container">
            ⚠️ NEURAL ERROR: {error}
          </div>
        )}

        {/* Results area */}
        {rawCode && (
          <div className="results-container">
            <div className="results-scan-line" />
            
            {/* Tab Navigation */}
            <div className="results-tabs">
              <button
                className={`results-tab ${activeTab === 'preview' ? 'active' : ''}`}
                onClick={() => setActiveTab('preview')}
              >
                📺 {requestType.toUpperCase()} PREVIEW
              </button>
              <button
                className={`results-tab ${activeTab === 'code' ? 'active' : ''}`}
                onClick={() => setActiveTab('code')}
              >
                🔬 {requestType.toUpperCase()} CODE
              </button>
            </div>

            {/* Tab Content */}
            <div className="results-content">
              {activeTab === 'preview' ? (
                <div>
                  <h3 className="results-title">
                    ⚡ LIVE {requestType.toUpperCase()} PREVIEW ⚡
                  </h3>
                  <div className="preview-container">
                    <div className="preview-scan" />
                    <LiveProvider code={processedCode} scope={currentScope} noInline={true}>
                      <LiveError className="live-error" />
                      <LivePreview />
                    </LiveProvider>
                  </div>
                </div>
              ) : (
                <div>
                  <h3 className="results-title">
                    🔬 {requestType.toUpperCase()} SOURCE CODE 🔬
                  </h3>
                  <div className="code-container">
                    <LiveProvider code={processedCode} scope={currentScope} noInline={true}>
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
                      <LiveError className="live-error" style={{ margin: '20px' }} />
                    </LiveProvider>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
        
        {/* Debug info */}
        {rawCode && (
          <details className="debug-container">
            <summary className="debug-summary">
              🔍 DEBUG: Raw Neural Output
            </summary>
            <pre className="debug-code">
              {rawCode}
            </pre>
          </details>
        )}
      </div>
    </div>
  );
}