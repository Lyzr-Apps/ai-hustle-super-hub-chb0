'use client'

import React, { useState, useRef, useCallback } from 'react'
import { callAIAgent } from '@/lib/aiAgent'
import { cn } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Skeleton } from '@/components/ui/skeleton'
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

const SAMPLE_HUSTLES: HustleData[] = [
  {
    hustle_name: 'AI Content Repurposing Service',
    description: 'Transform long-form content like podcasts and webinars into social media posts, blog articles, and newsletters using AI tools. Low barrier to entry with high demand from content creators and businesses.',
    difficulty_rating: 2,
    startup_cost_min: 50,
    startup_cost_max: 200,
    monthly_income_min: 800,
    monthly_income_max: 2500,
  },
  {
    hustle_name: 'AI-Powered Resume Optimization',
    description: 'Use AI to analyze and rewrite resumes for job seekers, optimizing for ATS systems and specific job postings. High volume potential with recurring clients.',
    difficulty_rating: 1,
    startup_cost_min: 20,
    startup_cost_max: 100,
    monthly_income_min: 500,
    monthly_income_max: 1500,
  },
  {
    hustle_name: 'Custom AI Chatbot Development',
    description: 'Build custom AI chatbots for small businesses using no-code and low-code platforms. Businesses increasingly need 24/7 customer support automation.',
    difficulty_rating: 4,
    startup_cost_min: 200,
    startup_cost_max: 800,
    monthly_income_min: 2000,
    monthly_income_max: 6000,
  },
]

function generateId(): string {
  return 'sess-' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
}

function getDifficultyLabel(value: number): string {
  if (value <= 33) return 'Easy'
  if (value <= 66) return 'Medium'
  return 'Hard'
}

function getDifficultyColor(value: number): string {
  if (value <= 33) return 'text-green-600'
  if (value <= 66) return 'text-amber-600'
  return 'text-red-500'
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
    hustle_name: String(parsed?.hustle_name ?? ''),
    description: String(parsed?.description ?? ''),
    difficulty_rating: Number(parsed?.difficulty_rating ?? 0),
    startup_cost_min: Number(parsed?.startup_cost_min ?? 0),
    startup_cost_max: Number(parsed?.startup_cost_max ?? 0),
    monthly_income_min: Number(parsed?.monthly_income_min ?? 0),
    monthly_income_max: Number(parsed?.monthly_income_max ?? 0),
  }
}

function renderMarkdown(text: string) {
  if (!text) return null
  return (
    <div className="space-y-2">
      {text.split('\n').map((line, i) => {
        if (line.startsWith('### ')) return <h4 key={i} className="font-semibold text-sm mt-3 mb-1">{line.slice(4)}</h4>
        if (line.startsWith('## ')) return <h3 key={i} className="font-semibold text-base mt-3 mb-1">{line.slice(3)}</h3>
        if (line.startsWith('# ')) return <h2 key={i} className="font-bold text-lg mt-4 mb-2">{line.slice(2)}</h2>
        if (line.startsWith('- ') || line.startsWith('* ')) return <li key={i} className="ml-4 list-disc text-sm">{formatInline(line.slice(2))}</li>
        if (/^\d+\.\s/.test(line)) return <li key={i} className="ml-4 list-decimal text-sm">{formatInline(line.replace(/^\d+\.\s/, ''))}</li>
        if (!line.trim()) return <div key={i} className="h-1" />
        return <p key={i} className="text-sm leading-relaxed">{formatInline(line)}</p>
      })}
    </div>
  )
}

function formatInline(text: string) {
  const parts = text.split(/\*\*(.*?)\*\*/g)
  if (parts.length === 1) return text
  return parts.map((part, i) => i % 2 === 1 ? <strong key={i} className="font-semibold">{part}</strong> : part)
}

function StarRating({ rating }: { rating: number }) {
  const stars = Math.max(0, Math.min(5, Math.round(rating || 0)))
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <FiStar
          key={s}
          className={cn('w-5 h-5 transition-colors', s <= stars ? 'text-amber-500 fill-amber-500' : 'text-muted-foreground/30')}
          style={s <= stars ? { fill: 'currentColor' } : {}}
        />
      ))}
      <span className="ml-2 text-sm text-muted-foreground font-medium">{stars}/5</span>
    </div>
  )
}

function StatPill({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 rounded-xl bg-white/50 backdrop-blur-sm border border-white/30 px-4 py-3">
      <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-primary/10 text-primary">{icon}</div>
      <div>
        <p className="text-xs text-muted-foreground font-medium tracking-wide uppercase">{label}</p>
        <p className="text-sm font-semibold text-foreground">{value}</p>
      </div>
    </div>
  )
}

function LoadingSkeleton() {
  return (
    <Card className="backdrop-blur-[16px] bg-white/75 border border-white/20 shadow-lg overflow-hidden">
      <CardHeader className="p-6 pb-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-7 w-3/5 rounded-lg" />
          <Skeleton className="h-6 w-20 rounded-full" />
        </div>
      </CardHeader>
      <CardContent className="p-6 pt-0 space-y-5">
        <div className="space-y-2">
          <Skeleton className="h-4 w-full rounded" />
          <Skeleton className="h-4 w-4/5 rounded" />
          <Skeleton className="h-4 w-3/5 rounded" />
        </div>
        <Skeleton className="h-5 w-32 rounded" />
        <div className="grid grid-cols-2 gap-3">
          <Skeleton className="h-16 rounded-xl" />
          <Skeleton className="h-16 rounded-xl" />
        </div>
      </CardContent>
    </Card>
  )
}

function HustleCard({ hustle, index, total, expanded, onToggle }: { hustle: HustleData; index: number; total: number; expanded?: boolean; onToggle?: () => void }) {
  const isCompact = onToggle !== undefined
  return (
    <Card className={cn('backdrop-blur-[16px] bg-white/75 border border-white/20 shadow-lg overflow-hidden transition-all duration-500', !isCompact && 'animate-in fade-in slide-in-from-bottom-4')}>
      <CardHeader className={cn('pb-3', isCompact ? 'p-4' : 'p-6')}>
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <Badge variant="secondary" className="shrink-0 bg-primary/10 text-primary border-primary/20 font-semibold text-xs">
              #{total - index}
            </Badge>
            <CardTitle className={cn('font-serif font-bold tracking-tight truncate', isCompact ? 'text-base' : 'text-xl')}>
              {hustle.hustle_name || 'Untitled Hustle'}
            </CardTitle>
          </div>
          {isCompact && (
            <Button variant="ghost" size="sm" onClick={onToggle} className="shrink-0 h-8 w-8 p-0">
              {expanded ? <FiChevronUp className="w-4 h-4" /> : <FiChevronDown className="w-4 h-4" />}
            </Button>
          )}
        </div>
        {isCompact && !expanded && (
          <div className="flex items-center gap-3 mt-2">
            <StarRating rating={hustle.difficulty_rating} />
            <Separator orientation="vertical" className="h-4" />
            <span className="text-xs text-muted-foreground font-medium">
              {formatCurrency(hustle.monthly_income_min)} - {formatCurrency(hustle.monthly_income_max)}/mo
            </span>
          </div>
        )}
      </CardHeader>
      {(!isCompact || expanded) && (
        <CardContent className={cn('pt-0 space-y-5', isCompact ? 'p-4' : 'p-6')}>
          <div className="text-foreground/80">{renderMarkdown(hustle.description || '')}</div>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground font-medium tracking-wide uppercase">Difficulty</p>
            <StarRating rating={hustle.difficulty_rating} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <StatPill icon={<FiDollarSign className="w-5 h-5" />} label="Startup Cost" value={`${formatCurrency(hustle.startup_cost_min)} - ${formatCurrency(hustle.startup_cost_max)}`} />
            <StatPill icon={<FiTrendingUp className="w-5 h-5" />} label="Monthly Income" value={`${formatCurrency(hustle.monthly_income_min)} - ${formatCurrency(hustle.monthly_income_max)}/mo`} />
          </div>
        </CardContent>
      )}
    </Card>
  )
}

class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean; error: string }> {
  constructor(props: { children: React.ReactNode }) {
    super(props)
    this.state = { hasError: false, error: '' }
  }
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error: error.message }
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
          <div className="text-center p-8 max-w-md">
            <h2 className="text-xl font-semibold mb-2">Something went wrong</h2>
            <p className="text-muted-foreground mb-4 text-sm">{this.state.error}</p>
            <button onClick={() => this.setState({ hasError: false, error: '' })} className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm">Try again</button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}

export default function Page() {
  const [difficulty, setDifficulty] = useState(50)
  const [hustles, setHustles] = useState<HustleData[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showSample, setShowSample] = useState(false)
  const [expandedHistory, setExpandedHistory] = useState<number | null>(null)
  const [activeAgentId, setActiveAgentId] = useState<string | null>(null)
  const sessionIdRef = useRef<string>(generateId())

  const difficultyLabel = getDifficultyLabel(difficulty)
  const displayHustles = showSample ? SAMPLE_HUSTLES : hustles

  const handleGenerate = useCallback(async () => {
    setLoading(true)
    setError(null)
    setActiveAgentId(AGENT_ID)
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
      setActiveAgentId(null)
    }
  }, [difficulty, difficultyLabel])

  const handleClearHistory = () => {
    setHustles([])
    setExpandedHistory(null)
  }

  const latestHustle = displayHustles.length > 0 ? displayHustles[0] : null
  const historyHustles = displayHustles.length > 1 ? displayHustles.slice(1) : []

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gradient-to-br from-[hsl(30,50%,97%)] via-[hsl(20,45%,95%)] to-[hsl(40,40%,96%)]">
        <div className="max-w-2xl mx-auto px-4 py-8 sm:py-12 space-y-8" style={{ letterSpacing: '-0.01em', lineHeight: '1.55' }}>

          {/* Header */}
          <div className="text-center space-y-3">
            <div className="flex items-center justify-center gap-3">
              <div className="flex items-center justify-center w-11 h-11 rounded-xl bg-primary/10 text-primary">
                <FiZap className="w-6 h-6" />
              </div>
              <h1 className="font-serif text-3xl sm:text-4xl font-bold text-foreground tracking-tight">AI Hustle Generator</h1>
            </div>
            <p className="text-muted-foreground text-sm font-medium">Discover AI-powered side hustle ideas tailored to your comfort level</p>
          </div>

          {/* Sample Data Toggle */}
          <div className="flex items-center justify-end gap-2">
            <Label htmlFor="sample-toggle" className="text-xs text-muted-foreground font-medium cursor-pointer">Sample Data</Label>
            <Switch id="sample-toggle" checked={showSample} onCheckedChange={setShowSample} />
          </div>

          {/* Difficulty Slider */}
          <Card className="backdrop-blur-[16px] bg-white/75 border border-white/20 shadow-lg">
            <CardContent className="p-6 sm:p-8 space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="font-serif text-lg font-semibold text-foreground">Select Difficulty</h2>
                <Badge variant="outline" className={cn('text-sm font-semibold px-3 py-1 border-2', getDifficultyColor(difficulty))}>
                  {difficultyLabel}
                </Badge>
              </div>
              <div className="space-y-3">
                <Slider min={1} max={100} step={1} value={[difficulty]} onValueChange={(val) => setDifficulty(val[0] ?? 50)} className="w-full" />
                <div className="flex justify-between text-xs text-muted-foreground font-medium">
                  <span>Easy</span>
                  <span>Medium</span>
                  <span>Hard</span>
                </div>
              </div>
              <Button onClick={handleGenerate} disabled={loading || showSample} className="w-full h-12 text-base font-semibold shadow-md hover:shadow-lg transition-all duration-300 hover:scale-[1.01] active:scale-[0.99]" size="lg">
                {loading ? (
                  <span className="flex items-center gap-2"><FiRefreshCw className="w-5 h-5 animate-spin" /> Generating...</span>
                ) : (
                  <span className="flex items-center gap-2"><FiZap className="w-5 h-5" /> Generate Hustle</span>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Error Display */}
          {error && (
            <Card className="border-destructive/50 bg-destructive/5 backdrop-blur-[16px]">
              <CardContent className="p-4 flex items-start gap-3">
                <FiAlertCircle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-destructive font-medium">{error}</p>
                </div>
                <Button variant="outline" size="sm" onClick={handleGenerate} className="shrink-0 text-xs border-destructive/30 text-destructive hover:bg-destructive/10">
                  <FiRefreshCw className="w-3.5 h-3.5 mr-1" /> Retry
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Loading Skeleton */}
          {loading && <LoadingSkeleton />}

          {/* Empty State */}
          {!loading && !latestHustle && !error && (
            <Card className="backdrop-blur-[16px] bg-white/75 border border-white/20 shadow-lg">
              <CardContent className="p-8 sm:p-12 text-center space-y-4">
                <div className="flex justify-center">
                  <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
                    <FiZap className="w-8 h-8 text-primary" />
                  </div>
                </div>
                <div className="space-y-2">
                  <h3 className="font-serif text-lg font-semibold text-foreground">Ready to discover your next hustle?</h3>
                  <p className="text-sm text-muted-foreground max-w-sm mx-auto">Slide to your comfort level and hit Generate! Each idea comes with startup costs, income potential, and difficulty ratings.</p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Latest Hustle */}
          {!loading && latestHustle && (
            <div className="space-y-2">
              <h2 className="font-serif text-lg font-semibold text-foreground">Latest Hustle</h2>
              <HustleCard hustle={latestHustle} index={0} total={displayHustles.length} />
            </div>
          )}

          {/* History */}
          {historyHustles.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="font-serif text-lg font-semibold text-foreground">History ({historyHustles.length})</h2>
                {!showSample && (
                  <Button variant="ghost" size="sm" onClick={handleClearHistory} className="text-xs text-muted-foreground hover:text-destructive">
                    <FiTrash2 className="w-3.5 h-3.5 mr-1" /> Clear
                  </Button>
                )}
              </div>
              <ScrollArea className="max-h-[500px]">
                <div className="space-y-3 pr-2">
                  {historyHustles.map((hustle, i) => (
                    <HustleCard
                      key={`history-${i}`}
                      hustle={hustle}
                      index={i + 1}
                      total={displayHustles.length}
                      expanded={expandedHistory === i}
                      onToggle={() => setExpandedHistory(expandedHistory === i ? null : i)}
                    />
                  ))}
                </div>
              </ScrollArea>
            </div>
          )}

          {/* Agent Info */}
          <Card className="backdrop-blur-[16px] bg-white/50 border border-white/15 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className={cn('w-2 h-2 rounded-full shrink-0', activeAgentId ? 'bg-green-500 animate-pulse' : 'bg-muted-foreground/30')} />
                <div className="flex items-center gap-2 min-w-0">
                  <FiActivity className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                  <span className="text-xs text-muted-foreground font-medium truncate">
                    Hustle Generator Agent
                  </span>
                  <span className="text-xs text-muted-foreground/60">|</span>
                  <span className="text-xs text-muted-foreground/60 truncate">
                    {activeAgentId ? 'Generating...' : 'Ready'}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

        </div>
      </div>
    </ErrorBoundary>
  )
}
