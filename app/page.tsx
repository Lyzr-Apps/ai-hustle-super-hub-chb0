'use client'

import React, { useState, useRef, useCallback } from 'react'
import { callAIAgent } from '@/lib/aiAgent'
import { cn } from '@/lib/utils'
import { FiZap, FiStar, FiDollarSign, FiTrendingUp, FiTrash2, FiRefreshCw, FiChevronDown, FiChevronUp, FiAlertCircle, FiActivity } from 'react-icons/fi'

const AGENT_ID = '69a387d25d446100f182a997'

interface HustleData {
  hustle_name: string
  description: string
  difficulty_rating: number
  startup_cost_min: number
  startup_cost_max: number
  monthly_income_min: number
  monthly_income_max: number
}

function generateId(): string {
  return 'sess-' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
}

function getDifficultyLabel(value: number): string {
  if (value <= 33) return 'Easy'
  if (value <= 66) return 'Medium'
  return 'Hard'
}

function getDifficultyColor(value: number): string {
  if (value <= 33) return '#16a34a'
  if (value <= 66) return '#d97706'
  return '#ef4444'
}

function formatCurrency(amount: number | undefined | null): string {
  if (amount == null || isNaN(amount)) return '$0'
  return '$' + amount.toLocaleString()
}

function parseHustleData(data: unknown): HustleData | null {
  if (!data || typeof data !== 'object') return null
  let parsed = data as Record<string, unknown>
  if (typeof parsed === 'string') {
    try { parsed = JSON.parse(parsed as unknown as string) } catch { return null }
  }
  if (parsed.result && typeof parsed.result === 'object') {
    parsed = parsed.result as Record<string, unknown>
  }
  const name = parsed?.hustle_name
  if (!name || typeof name !== 'string') return null
  return {
    hustle_name: String(parsed.hustle_name ?? ''),
    description: String(parsed.description ?? ''),
    difficulty_rating: Number(parsed.difficulty_rating ?? 0),
    startup_cost_min: Number(parsed.startup_cost_min ?? 0),
    startup_cost_max: Number(parsed.startup_cost_max ?? 0),
    monthly_income_min: Number(parsed.monthly_income_min ?? 0),
    monthly_income_max: Number(parsed.monthly_income_max ?? 0),
  }
}

function StarRating({ rating }: { rating: number }) {
  const stars = Math.max(0, Math.min(5, Math.round(rating || 0)))
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
      {[1, 2, 3, 4, 5].map((s) => (
        <FiStar
          key={s}
          style={{
            width: '18px',
            height: '18px',
            color: s <= stars ? '#f59e0b' : '#d1d5db',
            fill: s <= stars ? '#f59e0b' : 'none',
          }}
        />
      ))}
      <span style={{ marginLeft: '8px', fontSize: '13px', color: '#78716c', fontWeight: 500 }}>{stars}/5</span>
    </div>
  )
}

function StatPill({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      borderRadius: '12px',
      backgroundColor: 'rgba(255,255,255,0.5)',
      backdropFilter: 'blur(8px)',
      border: '1px solid rgba(255,255,255,0.3)',
      padding: '12px 16px',
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '36px',
        height: '36px',
        borderRadius: '8px',
        backgroundColor: 'rgba(234, 88, 12, 0.1)',
        color: '#ea580c',
      }}>{icon}</div>
      <div>
        <p style={{ fontSize: '11px', color: '#78716c', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0 }}>{label}</p>
        <p style={{ fontSize: '14px', fontWeight: 600, color: '#292524', margin: 0 }}>{value}</p>
      </div>
    </div>
  )
}

function SkeletonLoader() {
  return (
    <div style={{
      borderRadius: '14px',
      backgroundColor: 'rgba(255,255,255,0.75)',
      backdropFilter: 'blur(16px)',
      border: '1px solid rgba(255,255,255,0.2)',
      boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)',
      padding: '24px',
      overflow: 'hidden',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
        <div style={{ height: '24px', width: '60%', backgroundColor: '#e7e5e4', borderRadius: '8px', animation: 'pulse 1.5s infinite' }} />
        <div style={{ height: '24px', width: '60px', backgroundColor: '#e7e5e4', borderRadius: '12px', animation: 'pulse 1.5s infinite' }} />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
        <div style={{ height: '14px', width: '100%', backgroundColor: '#e7e5e4', borderRadius: '4px', animation: 'pulse 1.5s infinite' }} />
        <div style={{ height: '14px', width: '80%', backgroundColor: '#e7e5e4', borderRadius: '4px', animation: 'pulse 1.5s infinite' }} />
        <div style={{ height: '14px', width: '60%', backgroundColor: '#e7e5e4', borderRadius: '4px', animation: 'pulse 1.5s infinite' }} />
      </div>
      <div style={{ height: '20px', width: '120px', backgroundColor: '#e7e5e4', borderRadius: '4px', marginBottom: '12px', animation: 'pulse 1.5s infinite' }} />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
        <div style={{ height: '60px', backgroundColor: '#e7e5e4', borderRadius: '12px', animation: 'pulse 1.5s infinite' }} />
        <div style={{ height: '60px', backgroundColor: '#e7e5e4', borderRadius: '12px', animation: 'pulse 1.5s infinite' }} />
      </div>
    </div>
  )
}

function HustleCard({ hustle, index, total, isCompact, expanded, onToggle }: {
  hustle: HustleData
  index: number
  total: number
  isCompact?: boolean
  expanded?: boolean
  onToggle?: () => void
}) {
  return (
    <div style={{
      borderRadius: '14px',
      backgroundColor: 'rgba(255,255,255,0.75)',
      backdropFilter: 'blur(16px)',
      border: '1px solid rgba(255,255,255,0.2)',
      boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)',
      overflow: 'hidden',
      transition: 'all 0.3s ease',
    }}>
      <div style={{ padding: isCompact ? '16px' : '24px', paddingBottom: isCompact ? '12px' : '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              padding: '2px 10px',
              borderRadius: '9999px',
              fontSize: '12px',
              fontWeight: 600,
              backgroundColor: 'rgba(234, 88, 12, 0.1)',
              color: '#ea580c',
              flexShrink: 0,
            }}>#{total - index}</span>
            <h3 style={{
              fontFamily: 'Georgia, serif',
              fontWeight: 700,
              fontSize: isCompact ? '16px' : '20px',
              letterSpacing: '-0.02em',
              color: '#292524',
              margin: 0,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}>{hustle.hustle_name || 'Untitled Hustle'}</h3>
          </div>
          {isCompact && onToggle && (
            <button
              onClick={onToggle}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                border: 'none',
                backgroundColor: 'transparent',
                cursor: 'pointer',
                color: '#78716c',
                flexShrink: 0,
              }}
            >
              {expanded ? <FiChevronUp /> : <FiChevronDown />}
            </button>
          )}
        </div>
        {isCompact && !expanded && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '8px' }}>
            <StarRating rating={hustle.difficulty_rating} />
            <span style={{ color: '#d6d3d1' }}>|</span>
            <span style={{ fontSize: '12px', color: '#78716c', fontWeight: 500 }}>
              {formatCurrency(hustle.monthly_income_min)} - {formatCurrency(hustle.monthly_income_max)}/mo
            </span>
          </div>
        )}
      </div>
      {(!isCompact || expanded) && (
        <div style={{ padding: isCompact ? '0 16px 16px' : '0 24px 24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <p style={{ fontSize: '14px', lineHeight: '1.6', color: 'rgba(41,37,36,0.8)', margin: 0 }}>{hustle.description}</p>
          <div>
            <p style={{ fontSize: '11px', color: '#78716c', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 4px' }}>Difficulty</p>
            <StarRating rating={hustle.difficulty_rating} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <StatPill icon={<FiDollarSign style={{ width: '18px', height: '18px' }} />} label="Startup Cost" value={`${formatCurrency(hustle.startup_cost_min)} - ${formatCurrency(hustle.startup_cost_max)}`} />
            <StatPill icon={<FiTrendingUp style={{ width: '18px', height: '18px' }} />} label="Monthly Income" value={`${formatCurrency(hustle.monthly_income_min)} - ${formatCurrency(hustle.monthly_income_max)}/mo`} />
          </div>
        </div>
      )}
    </div>
  )
}

export default function Page() {
  const [difficulty, setDifficulty] = useState(50)
  const [hustles, setHustles] = useState<HustleData[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [expandedHistory, setExpandedHistory] = useState<number | null>(null)
  const sessionIdRef = useRef<string>(generateId())

  const difficultyLabel = getDifficultyLabel(difficulty)

  const handleGenerate = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const message = `Generate a unique AI hustle idea for difficulty level: ${difficultyLabel} (${difficulty}/100). Make sure it's different from any previous hustles.`
      const result = await callAIAgent(message, AGENT_ID, { session_id: sessionIdRef.current })
      if (result.success && result?.response?.result) {
        const parsed = parseHustleData(result.response.result)
        if (parsed) {
          setHustles((prev) => [parsed, ...prev])
        } else {
          setError('Received an unexpected response format. Please try again.')
        }
      } else {
        setError(result?.error || result?.response?.message || 'Something went wrong. Please try again.')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Network error. Please check your connection.')
    } finally {
      setLoading(false)
    }
  }, [difficulty, difficultyLabel])

  const handleClearHistory = () => {
    setHustles([])
    setExpandedHistory(null)
  }

  const latestHustle = hustles.length > 0 ? hustles[0] : null
  const historyHustles = hustles.length > 1 ? hustles.slice(1) : []

  return (
    <>
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .fade-in-up { animation: fadeInUp 0.5s ease forwards; }
        .slider-input::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 22px;
          height: 22px;
          border-radius: 50%;
          background: #ea580c;
          cursor: pointer;
          border: 3px solid white;
          box-shadow: 0 1px 3px rgba(0,0,0,0.2);
        }
        .slider-input::-moz-range-thumb {
          width: 22px;
          height: 22px;
          border-radius: 50%;
          background: #ea580c;
          cursor: pointer;
          border: 3px solid white;
          box-shadow: 0 1px 3px rgba(0,0,0,0.2);
        }
        .slider-input {
          -webkit-appearance: none;
          appearance: none;
          width: 100%;
          height: 8px;
          border-radius: 4px;
          outline: none;
          transition: background 0.15s ease;
        }
        .gen-btn {
          width: 100%;
          height: 48px;
          border: none;
          border-radius: 12px;
          background: #ea580c;
          color: white;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          transition: all 0.2s ease;
          box-shadow: 0 4px 6px -1px rgba(234,88,12,0.25);
        }
        .gen-btn:hover { background: #dc5a09; transform: translateY(-1px); box-shadow: 0 6px 12px -2px rgba(234,88,12,0.3); }
        .gen-btn:active { transform: scale(0.98); }
        .gen-btn:disabled { opacity: 0.6; cursor: not-allowed; transform: none; }
      `}</style>

      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, hsl(30,50%,97%) 0%, hsl(20,45%,95%) 35%, hsl(40,40%,96%) 70%, hsl(15,35%,97%) 100%)',
      }}>
        <div style={{
          maxWidth: '640px',
          margin: '0 auto',
          padding: '32px 16px 48px',
          display: 'flex',
          flexDirection: 'column',
          gap: '24px',
          letterSpacing: '-0.01em',
          lineHeight: '1.55',
        }}>

          {/* Header */}
          <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '44px',
                height: '44px',
                borderRadius: '12px',
                backgroundColor: 'rgba(234, 88, 12, 0.1)',
                color: '#ea580c',
              }}>
                <FiZap style={{ width: '24px', height: '24px' }} />
              </div>
              <h1 style={{
                fontFamily: 'Georgia, serif',
                fontSize: '32px',
                fontWeight: 700,
                color: '#292524',
                letterSpacing: '-0.02em',
                margin: 0,
              }}>AI Hustle Generator</h1>
            </div>
            <p style={{ fontSize: '14px', color: '#78716c', fontWeight: 500, margin: 0 }}>
              Discover AI-powered side hustle ideas tailored to your comfort level
            </p>
          </div>

          {/* Difficulty Slider Card */}
          <div style={{
            borderRadius: '14px',
            backgroundColor: 'rgba(255,255,255,0.75)',
            backdropFilter: 'blur(16px)',
            border: '1px solid rgba(255,255,255,0.2)',
            boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)',
            padding: '24px',
            display: 'flex',
            flexDirection: 'column',
            gap: '20px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h2 style={{ fontFamily: 'Georgia, serif', fontSize: '18px', fontWeight: 600, color: '#292524', margin: 0 }}>Select Difficulty</h2>
              <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                padding: '4px 14px',
                borderRadius: '9999px',
                fontSize: '14px',
                fontWeight: 600,
                border: '2px solid',
                borderColor: getDifficultyColor(difficulty),
                color: getDifficultyColor(difficulty),
              }}>{difficultyLabel}</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <input
                type="range"
                min={1}
                max={100}
                step={1}
                value={difficulty}
                onChange={(e) => setDifficulty(Number(e.target.value))}
                className="slider-input"
                style={{
                  background: `linear-gradient(to right, #ea580c 0%, #ea580c ${(difficulty - 1) / 99 * 100}%, #e7e5e4 ${(difficulty - 1) / 99 * 100}%, #e7e5e4 100%)`,
                }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#78716c', fontWeight: 500 }}>
                <span>Easy</span>
                <span>Medium</span>
                <span>Hard</span>
              </div>
            </div>

            <button
              onClick={handleGenerate}
              disabled={loading}
              className="gen-btn"
            >
              {loading ? (
                <><FiRefreshCw style={{ width: '20px', height: '20px', animation: 'spin 1s linear infinite' }} /> Generating...</>
              ) : (
                <><FiZap style={{ width: '20px', height: '20px' }} /> Generate Hustle</>
              )}
            </button>
          </div>

          {/* Error Display */}
          {error && (
            <div style={{
              borderRadius: '14px',
              border: '1px solid rgba(239,68,68,0.3)',
              backgroundColor: 'rgba(239,68,68,0.05)',
              backdropFilter: 'blur(16px)',
              padding: '16px',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '12px',
            }}>
              <FiAlertCircle style={{ width: '20px', height: '20px', color: '#ef4444', flexShrink: 0, marginTop: '2px' }} />
              <p style={{ flex: 1, fontSize: '14px', color: '#ef4444', fontWeight: 500, margin: 0 }}>{error}</p>
              <button
                onClick={handleGenerate}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '6px 12px',
                  borderRadius: '8px',
                  border: '1px solid rgba(239,68,68,0.3)',
                  backgroundColor: 'transparent',
                  color: '#ef4444',
                  fontSize: '12px',
                  fontWeight: 500,
                  cursor: 'pointer',
                  flexShrink: 0,
                }}
              >
                <FiRefreshCw style={{ width: '14px', height: '14px' }} /> Retry
              </button>
            </div>
          )}

          {/* Loading Skeleton */}
          {loading && <SkeletonLoader />}

          {/* Empty State */}
          {!loading && !latestHustle && !error && (
            <div style={{
              borderRadius: '14px',
              backgroundColor: 'rgba(255,255,255,0.75)',
              backdropFilter: 'blur(16px)',
              border: '1px solid rgba(255,255,255,0.2)',
              boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)',
              padding: '48px 24px',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '16px',
            }}>
              <div style={{
                width: '64px',
                height: '64px',
                borderRadius: '16px',
                backgroundColor: 'rgba(234, 88, 12, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <FiZap style={{ width: '32px', height: '32px', color: '#ea580c' }} />
              </div>
              <div>
                <h3 style={{ fontFamily: 'Georgia, serif', fontSize: '18px', fontWeight: 600, color: '#292524', margin: '0 0 8px' }}>Ready to discover your next hustle?</h3>
                <p style={{ fontSize: '14px', color: '#78716c', maxWidth: '340px', margin: '0 auto' }}>
                  Slide to your comfort level and hit Generate! Each idea comes with startup costs, income potential, and difficulty ratings.
                </p>
              </div>
            </div>
          )}

          {/* Latest Hustle */}
          {!loading && latestHustle && (
            <div className="fade-in-up" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <h2 style={{ fontFamily: 'Georgia, serif', fontSize: '18px', fontWeight: 600, color: '#292524', margin: 0 }}>Latest Hustle</h2>
              <HustleCard hustle={latestHustle} index={0} total={hustles.length} />
            </div>
          )}

          {/* History */}
          {historyHustles.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <h2 style={{ fontFamily: 'Georgia, serif', fontSize: '18px', fontWeight: 600, color: '#292524', margin: 0 }}>
                  History ({historyHustles.length})
                </h2>
                <button
                  onClick={handleClearHistory}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '4px 10px',
                    borderRadius: '6px',
                    border: 'none',
                    backgroundColor: 'transparent',
                    color: '#78716c',
                    fontSize: '12px',
                    fontWeight: 500,
                    cursor: 'pointer',
                  }}
                >
                  <FiTrash2 style={{ width: '14px', height: '14px' }} /> Clear
                </button>
              </div>
              <div style={{ maxHeight: '500px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px', paddingRight: '4px' }}>
                {historyHustles.map((hustle, i) => (
                  <HustleCard
                    key={`history-${i}`}
                    hustle={hustle}
                    index={i + 1}
                    total={hustles.length}
                    isCompact
                    expanded={expandedHistory === i}
                    onToggle={() => setExpandedHistory(expandedHistory === i ? null : i)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Agent Info */}
          <div style={{
            borderRadius: '14px',
            backgroundColor: 'rgba(255,255,255,0.5)',
            backdropFilter: 'blur(16px)',
            border: '1px solid rgba(255,255,255,0.15)',
            padding: '14px 16px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: loading ? '#22c55e' : '#a8a29e',
                flexShrink: 0,
                ...(loading ? { animation: 'pulse 1.5s infinite' } : {}),
              }} />
              <FiActivity style={{ width: '14px', height: '14px', color: '#78716c', flexShrink: 0 }} />
              <span style={{ fontSize: '12px', color: '#78716c', fontWeight: 500 }}>Hustle Generator Agent</span>
              <span style={{ fontSize: '12px', color: '#a8a29e' }}>|</span>
              <span style={{ fontSize: '12px', color: '#a8a29e' }}>{loading ? 'Generating...' : 'Ready'}</span>
            </div>
          </div>

        </div>
      </div>
    </>
  )
}
