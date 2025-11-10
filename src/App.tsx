import { useState } from 'react'
import { Upload, TrendingUp, AlertCircle } from 'lucide-react'
import toast, { Toaster } from 'react-hot-toast'
import { supabase } from './supabase'
import { analyzeRevenueScreenshot, formatCurrency } from './revenueAnalyzer'
import type { RevenueAnalysis } from './revenueAnalyzer'

function App() {
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [showDashboard, setShowDashboard] = useState(false)
  const [analysisResult, setAnalysisResult] = useState<RevenueAnalysis | null>(null)
  const [analyzing, setAnalyzing] = useState(false)
  const [email, setEmail] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      setFile(selectedFile)
      const reader = new FileReader()
      reader.onloadend = () => {
        setPreview(reader.result as string)
      }
      reader.readAsDataURL(selectedFile)
      toast.success('Screenshot uploaded! 📸')
      // Reset previous analysis
      setShowDashboard(false)
      setAnalysisResult(null)
    }
  }

  const handleGenerateDashboard = async () => {
    if (!file) {
      toast.error('Please upload a screenshot first')
      return
    }

    setAnalyzing(true)
    toast.loading('Analyzing your revenue screenshot...', { id: 'analyzing' })

    try {
      // Call the real analysis engine
      const result = await analyzeRevenueScreenshot(file)
      
      // Update state with results
      setAnalysisResult(result)
      setShowDashboard(true)
      
      // Show success message with confidence indicator
      toast.success(
        `Analysis complete! Confidence: ${Math.round(result.confidence * 100)}%`,
        { id: 'analyzing' }
      )
      
      // Log analysis for debugging
      console.log('Analysis Result:', result)
      
    } catch (error) {
      console.error('Analysis error:', error)
      toast.error('Failed to analyze screenshot. Please try again.', { id: 'analyzing' })
    } finally {
      setAnalyzing(false)
    }
  }

  const handleWaitlistSubmit = async () => {
    if (!email) {
      toast.error('Please enter your email')
      return
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      toast.error('Please enter a valid email')
      return
    }

    setSubmitting(true)
    try {
      const { error } = await supabase
        .from('waitlist')
        .insert({ email })

      if (error) throw error

      toast.success('You\'re on the waitlist! 🎉')
      setEmail('')
    } catch (error: any) {
      toast.error('Failed to join waitlist. Please try again.')
      console.error('Waitlist error:', error)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-blue-50">
      <Toaster position="top-right" />

      {/* Header */}
      <nav className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="flex items-center gap-2">
          <TrendingUp className="text-emerald-500" size={28} />
          <h1 className="text-2xl font-bold text-slate-900">RevTrackr Test</h1>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-6 py-12">
        <div className="text-center mb-12">
          <h2 className="text-5xl font-bold text-slate-900 mb-4">
            Stop Wrestling with Spreadsheets
          </h2>
          <p className="text-xl text-slate-600 mb-8">
            Upload ANY revenue screenshot. Get a beautiful dashboard. In 30 seconds.
          </p>
          <div className="flex items-center justify-center gap-8 text-sm text-slate-500">
            <div className="flex items-center gap-2">
              ✓ No signup required
            </div>
            <div className="flex items-center gap-2">
              ✓ 100% free to test
            </div>
            <div className="flex items-center gap-2">
              ✓ Works with any screenshot
            </div>
          </div>
        </div>

        {/* How it works */}
        {!preview && !showDashboard && (
          <div className="mb-12 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-xl p-6 border border-slate-200">
              <div className="text-4xl mb-3">📸</div>
              <h3 className="font-semibold text-slate-900 mb-2">1. Upload</h3>
              <p className="text-slate-600 text-sm">Take a screenshot of your revenue</p>
            </div>
            <div className="bg-white rounded-xl p-6 border border-slate-200">
              <div className="text-4xl mb-3">🤖</div>
              <h3 className="font-semibold text-slate-900 mb-2">2. Analyze</h3>
              <p className="text-slate-600 text-sm">AI extracts the data instantly</p>
            </div>
            <div className="bg-white rounded-xl p-6 border border-slate-200">
              <div className="text-4xl mb-3">📊</div>
              <h3 className="font-semibold text-slate-900 mb-2">3. Dashboard</h3>
              <p className="text-slate-600 text-sm">Beautiful insights in seconds</p>
            </div>
          </div>
        )}

        {/* Upload Area */}
        {!showDashboard && (
          <div className="bg-white rounded-2xl shadow-lg border-2 border-dashed border-slate-300 p-12 text-center hover:border-emerald-500 transition-colors">
            <input
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
              id="file-upload"
            />
            <label htmlFor="file-upload" className="cursor-pointer">
              <Upload className="mx-auto text-slate-400 mb-4" size={48} />
              <p className="text-lg font-semibold text-slate-900 mb-2">
                Click to upload your revenue screenshot
              </p>
              <p className="text-sm text-slate-500">
                Stripe dashboard, Excel sheet, bank statement - anything works!
              </p>
            </label>
          </div>
        )}

        {/* Preview */}
        {preview && !showDashboard && (
          <div className="mt-8 bg-white rounded-2xl shadow-lg p-6">
            <h3 className="text-xl font-semibold text-slate-900 mb-4">Your Screenshot:</h3>
            <img src={preview} alt="Preview" className="w-full rounded-lg border border-slate-200" />
            <button
              onClick={handleGenerateDashboard}
              disabled={analyzing}
              className="mt-4 px-6 py-3 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors font-semibold w-full disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {analyzing ? 'Analyzing... 🤖' : 'Generate Dashboard →'}
            </button>
          </div>
        )}

        {/* Dashboard */}
        {showDashboard && analysisResult && (
          <div className="mt-8 space-y-6">
            {/* Confidence Warning */}
            {analysisResult.confidence < 0.5 && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 flex items-start gap-3">
                <AlertCircle className="text-yellow-600 flex-shrink-0 mt-0.5" size={20} />
                <div>
                  <p className="text-sm font-semibold text-yellow-900">Low Confidence Analysis</p>
                  <p className="text-sm text-yellow-700 mt-1">
                    We detected numbers but couldn't confidently identify revenue data. 
                    Try uploading a clearer screenshot with visible labels.
                  </p>
                </div>
              </div>
            )}

            <div className="bg-white rounded-2xl shadow-lg p-8">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-slate-900">Your Revenue Dashboard</h3>
                <div className="text-sm text-slate-500">
                  Confidence: {Math.round(analysisResult.confidence * 100)}%
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-gradient-to-r from-emerald-500 to-blue-500 rounded-xl p-6 text-white">
                  <p className="text-emerald-100 text-sm mb-1">Total Revenue</p>
                  <p className="text-4xl font-bold">
                    {formatCurrency(analysisResult.totalRevenue, analysisResult.currency)}
                  </p>
                </div>
                <div className="bg-white border border-slate-200 rounded-xl p-6">
                  <p className="text-slate-600 text-sm mb-1">This Month</p>
                  <p className="text-4xl font-bold text-slate-900">
                    {formatCurrency(analysisResult.thisMonth, analysisResult.currency)}
                  </p>
                </div>
                <div className="bg-white border border-slate-200 rounded-xl p-6">
                  <p className="text-slate-600 text-sm mb-1">Growth</p>
                  <p className={`text-4xl font-bold ${analysisResult.growth >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                    {analysisResult.growth >= 0 ? '+' : ''}{analysisResult.growth}%
                  </p>
                </div>
              </div>

              {/* Analysis Details (for transparency) */}
              <div className="border-t border-slate-200 pt-6 mb-6">
                <details className="text-sm">
                  <summary className="cursor-pointer text-slate-600 hover:text-slate-900 font-medium">
                    View Analysis Details
                  </summary>
                  <div className="mt-4 space-y-2 text-slate-600 bg-slate-50 p-4 rounded-lg">
                    <p><strong>Method:</strong> {analysisResult.analysisMethod === 'ocr' ? 'OCR Text Recognition' : 'Mock Data'}</p>
                    <p><strong>Numbers Detected:</strong> {analysisResult.detectedNumbers.join(', ')}</p>
                    <p><strong>Currency:</strong> {analysisResult.currency}</p>
                    <p><strong>Raw Text (first 200 chars):</strong></p>
                    <p className="text-xs bg-white p-2 rounded border border-slate-200 font-mono">
                      {analysisResult.rawText.substring(0, 200)}...
                    </p>
                  </div>
                </details>
              </div>

              {/* Original Screenshot */}
              <div className="border-t border-slate-200 pt-6">
                <p className="text-sm text-slate-600 mb-3">Based on your screenshot:</p>
                <img src={preview} alt="Original" className="w-full rounded-lg opacity-50" />
              </div>
            </div>

            {/* CTA */}
            <div className="bg-gradient-to-r from-slate-800 to-slate-700 rounded-2xl p-12 text-center text-white">
              <h3 className="text-3xl font-bold mb-4">Want automatic tracking?</h3>
              <p className="text-slate-300 mb-6 text-lg">
                Join the waitlist to get RevTrackr when we launch with real-time API integrations
              </p>
              <input
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleWaitlistSubmit()}
                className="px-6 py-4 rounded-lg w-full max-w-md text-slate-900 mb-4"
              />
              <button
                onClick={handleWaitlistSubmit}
                disabled={submitting}
                className="w-full max-w-md bg-emerald-500 text-white px-8 py-4 rounded-lg hover:bg-emerald-600 transition-colors font-semibold text-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? 'Joining...' : 'Join Waitlist (100% Free)'}
              </button>
            </div>

            {/* Try Another */}
            <button
              onClick={() => {
                setShowDashboard(false)
                setAnalysisResult(null)
                setFile(null)
                setPreview(null)
              }}
              className="w-full px-6 py-3 bg-white text-slate-700 rounded-lg border border-slate-300 hover:bg-slate-50 transition-colors font-semibold"
            >
              ← Analyze Another Screenshot
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default App