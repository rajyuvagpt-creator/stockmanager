'use client'

import { useState, useRef, useCallback } from 'react'
import { Mic, MicOff, Loader2 } from 'lucide-react'

interface VoiceInputProps {
  onTranscript: (text: string) => void
  disabled?: boolean
}

// Augment the window type for Web Speech API
declare global {
  interface Window {
    webkitSpeechRecognition: new () => SpeechRecognitionInstance
    SpeechRecognition: new () => SpeechRecognitionInstance
  }
}

interface SpeechRecognitionInstance {
  lang: string
  interimResults: boolean
  maxAlternatives: number
  continuous: boolean
  start(): void
  stop(): void
  onstart: (() => void) | null
  onresult: ((event: { results: Array<Array<{ transcript: string }>> }) => void) | null
  onerror: ((event: { error: string }) => void) | null
  onend: (() => void) | null
}

export function VoiceInput({ onTranscript, disabled = false }: VoiceInputProps) {
  const [listening, setListening] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null)

  const startListening = useCallback(() => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      setError('Speech recognition not supported in this browser')
      return
    }

    const SpeechRecognitionAPI = window.webkitSpeechRecognition || window.SpeechRecognition
    const recognition = new SpeechRecognitionAPI()
    recognition.lang = 'hi-IN'
    recognition.interimResults = false
    recognition.maxAlternatives = 1
    recognition.continuous = false

    recognition.onstart = () => setListening(true)

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript
      onTranscript(transcript)
    }

    recognition.onerror = (event) => {
      setError(`Voice error: ${event.error}`)
      setListening(false)
    }

    recognition.onend = () => setListening(false)

    recognitionRef.current = recognition
    recognition.start()
  }, [onTranscript])

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop()
    setListening(false)
  }, [])

  return (
    <div className="flex flex-col items-center gap-2">
      <button
        onClick={listening ? stopListening : startListening}
        disabled={disabled}
        className={`p-3 rounded-full transition-all ${
          listening
            ? 'bg-red-500 text-white animate-pulse hover:bg-red-600'
            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
        } disabled:opacity-50`}
        title={listening ? 'Stop recording' : 'Start voice input (Hindi/English)'}
      >
        {listening ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
      </button>

      {listening && (
        <div className="flex items-center gap-1 text-xs text-red-500">
          <Loader2 className="h-3 w-3 animate-spin" />
          Listening... (Hindi/English)
        </div>
      )}

      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  )
}
