'use client'

import { useState, useCallback, useRef } from 'react'

interface Message {
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  actionTaken?: string | null
}

export function useChat() {
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(false)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const abortRef = useRef<AbortController | null>(null)

  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim() || loading) return

    const userMsg: Message = { role: 'user', content, timestamp: new Date() }
    setMessages((prev) => [...prev, userMsg])
    setLoading(true)

    abortRef.current = new AbortController()

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: content, sessionId }),
        signal: abortRef.current.signal,
      })

      const data = await res.json()
      if (data.sessionId) setSessionId(data.sessionId)

      const assistantMsg: Message = {
        role: 'assistant',
        content: data.response,
        timestamp: new Date(),
        actionTaken: data.actionTaken,
      }
      setMessages((prev) => [...prev, assistantMsg])
    } catch (err) {
      if ((err as Error).name !== 'AbortError') {
        const errorMsg: Message = {
          role: 'assistant',
          content: 'Sorry, I encountered an error. Please try again.',
          timestamp: new Date(),
        }
        setMessages((prev) => [...prev, errorMsg])
      }
    } finally {
      setLoading(false)
    }
  }, [loading, sessionId])

  const clearChat = useCallback(() => {
    setMessages([])
    setSessionId(null)
  }, [])

  const abort = useCallback(() => {
    abortRef.current?.abort()
  }, [])

  return { messages, loading, sessionId, sendMessage, clearChat, abort }
}
