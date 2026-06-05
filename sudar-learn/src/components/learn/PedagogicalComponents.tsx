/**
 * Sudar Learn — Pedagogical Content Components
 * Reusable components for case studies, frameworks, highlights, key takeaways
 */

'use client'

import React from 'react'
import type {
  CaseStudy,
  FrameworkGrid,
  HighlightBox,
  KeyTakeaways,
  ExpertVoice,
  ScenarioChallenge,
  RealWorldExample,
} from '@/types/contentThemes'

// ============ CASE STUDY ============
export function CaseStudyBlock({ data }: { data: CaseStudy }) {
  return (
    <div className="pedagogical-component case-study-block">
      <div className="case-study-header">
        {data.icon && <span className="case-study-icon">{data.icon}</span>}
        <div>
          <h4 className="case-study-title">{data.title}</h4>
          {data.company && <p className="case-study-meta">{data.company} • {data.industry || 'Case Study'}</p>}
        </div>
      </div>
      
      <div className="case-study-content">
        <div className="case-study-section">
          <strong>Challenge:</strong> {data.challenge}
        </div>
        <div className="case-study-section">
          <strong>Solution:</strong> {data.solution}
        </div>
        <div className="case-study-section">
          <strong>Outcome:</strong> {data.outcome}
        </div>
        <div className="case-study-key-learning">
          <strong>🎯 Key Learning:</strong> {data.keyLearning}
        </div>
      </div>
    </div>
  )
}

// ============ FRAMEWORK GRID ============
export function FrameworkGridBlock({ data }: { data: FrameworkGrid }) {
  return (
    <div className="pedagogical-component framework-grid-block">
      <h4 className="framework-title">{data.title}</h4>
      {data.description && <p className="framework-description">{data.description}</p>}
      
      <div className={`framework-grid grid-${data.columns}col`}>
        {data.items.map((item, idx) => (
          <div key={idx} className="framework-item">
            {item.icon && <span className="framework-icon">{item.icon}</span>}
            <h5 className="framework-item-title">{item.title}</h5>
            <p className="framework-item-desc">{item.description}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

// ============ HIGHLIGHT BOX ============
export function HighlightBoxBlock({ data }: { data: HighlightBox }) {
  const emphasisClass = `emphasis-${data.emphasis || 'info'}`
  
  return (
    <div className={`pedagogical-component highlight-box ${emphasisClass}`}>
      <strong className="highlight-heading">{data.heading}</strong>
      <p className="highlight-content">{data.content}</p>
    </div>
  )
}

// ============ KEY TAKEAWAYS ============
export function KeyTakeawaysBlock({ data }: { data: KeyTakeaways }) {
  return (
    <div className="pedagogical-component key-takeaways-block">
      {data.title && <h4 className="key-takeaways-title">{data.title}</h4>}
      
      <ul className="key-takeaways-list">
        {data.items.map((item, idx) => (
          <li key={idx} className="key-takeaway-item">
            {item}
          </li>
        ))}
      </ul>
    </div>
  )
}

// ============ EXPERT VOICE ============
export function ExpertVoiceBlock({ data }: { data: ExpertVoice }) {
  return (
    <div className="pedagogical-component expert-voice-block">
      <div className="expert-quote-mark">&ldquo;</div>
      <p className="expert-quote">{data.quote}</p>
      <div className="expert-attribution">
        {data.image && <img src={data.image} alt={data.attribution} className="expert-image" />}
        <div>
          <strong className="expert-name">{data.attribution}</strong>
          {data.role && <p className="expert-role">{data.role}</p>}
        </div>
      </div>
    </div>
  )
}

// ============ SCENARIO CHALLENGE ============
export function ScenarioChallengeBlock({ data }: { data: ScenarioChallenge }) {
  const [selectedId, setSelectedId] = React.useState<string | null>(null)
  const [revealed, setRevealed] = React.useState(false)
  
  return (
    <div className="pedagogical-component scenario-challenge-block">
      <div className="scenario-setup">
        <h5 className="scenario-label">🎯 Scenario Challenge</h5>
        <p className="scenario-text">{data.scenario}</p>
        <p className="scenario-question"><strong>{data.question}</strong></p>
      </div>
      
      <div className="scenario-options">
        {data.options.map((option) => (
          <button
            key={option.id}
            className={`scenario-option ${selectedId === option.id ? 'selected' : ''} ${
              revealed && option.id === data.correctOptionId ? 'correct' : ''
            } ${revealed && selectedId === option.id && option.id !== data.correctOptionId ? 'incorrect' : ''}`}
            onClick={() => {
              setSelectedId(option.id)
              setRevealed(true)
            }}
          >
            {option.text}
          </button>
        ))}
      </div>
      
      {revealed && selectedId && (
        <div className={`scenario-feedback ${selectedId === data.correctOptionId ? 'correct' : 'incorrect'}`}>
          {selectedId === data.correctOptionId ? '✅ Correct!' : '❌ Not quite.'} 
          {data.options.find(o => o.id === selectedId)?.feedback && (
            <p>{data.options.find(o => o.id === selectedId)?.feedback}</p>
          )}
        </div>
      )}
    </div>
  )
}

// ============ REAL WORLD EXAMPLE ============
export function RealWorldExampleBlock({ data }: { data: RealWorldExample }) {
  return (
    <div className="pedagogical-component real-world-example-block">
      <h5 className="example-title">🌍 Real-World Example: {data.title}</h5>
      <p className="example-context"><strong>Context:</strong> {data.context}</p>
      <p className="example-details">{data.details}</p>
      <div className="example-why-matters">
        <strong>Why it matters:</strong> {data.why_matters}
      </div>
      {data.source && <p className="example-source">📚 Source: {data.source}</p>}
    </div>
  )
}
