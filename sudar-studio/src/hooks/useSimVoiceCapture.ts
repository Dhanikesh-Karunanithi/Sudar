'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

const PREFERRED_AUDIO_TYPES = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/ogg'] as const

function pickRecorderMime(): string | undefined {
  if (typeof MediaRecorder === 'undefined') return undefined
  return PREFERRED_AUDIO_TYPES.find((t) => MediaRecorder.isTypeSupported(t))
}

type SpeechRecognitionCtor = new () => SpeechRecognition

function getSpeechRecognition(): SpeechRecognitionCtor | null {
  if (typeof window === 'undefined') return null
  const w = window as unknown as {
    SpeechRecognition?: SpeechRecognitionCtor
    webkitSpeechRecognition?: SpeechRecognitionCtor
  }
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null
}

export type SimVoiceCaptureResult = {
  audio_base64?: string
  audio_mime?: string
  text?: string
}

export function micErrorMessage(err: unknown): string {
  if (err instanceof DOMException) {
    if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
      return 'Microphone blocked. Open browser site settings for localhost:3000, allow Microphone, then reload.'
    }
    if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
      return 'No microphone found. Connect a mic or type your reply.'
    }
    if (err.name === 'NotReadableError') {
      return 'Microphone is in use by another app. Close Teams/Zoom/etc. and try again.'
    }
    if (err.name === 'SecurityError') {
      return 'Microphone requires HTTPS or localhost.'
    }
    return `Microphone error: ${err.message}`
  }
  return 'Could not access microphone. Type your reply instead.'
}

export function useSimVoiceCapture() {
  const [micReady, setMicReady] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [interimTranscript, setInterimTranscript] = useState('')
  const [micLevel, setMicLevel] = useState(0)
  const [captureError, setCaptureError] = useState<string | null>(null)

  const mediaStreamRef = useRef<MediaStream | null>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const rafRef = useRef(0)
  const speechRef = useRef<SpeechRecognition | null>(null)
  const speechFinalRef = useRef('')
  const speechInterimRef = useRef('')

  const stopAnalyser = useCallback(() => {
    cancelAnimationFrame(rafRef.current)
    rafRef.current = 0
    setMicLevel(0)
    void audioContextRef.current?.close()
    audioContextRef.current = null
    analyserRef.current = null
  }, [])

  const startAnalyser = useCallback((stream: MediaStream) => {
    stopAnalyser()
    try {
      const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
      if (!Ctx) return
      const ctx = new Ctx()
      audioContextRef.current = ctx
      const source = ctx.createMediaStreamSource(stream)
      const analyser = ctx.createAnalyser()
      analyser.fftSize = 256
      source.connect(analyser)
      analyserRef.current = analyser
      const data = new Uint8Array(analyser.frequencyBinCount)

      const tick = () => {
        rafRef.current = requestAnimationFrame(tick)
        analyser.getByteFrequencyData(data)
        const avg = data.reduce((sum, v) => sum + v, 0) / data.length
        setMicLevel(Math.min(Math.max(avg / 128, 0.05), 1))
      }
      tick()
    } catch {
      /* optional visual */
    }
  }, [stopAnalyser])

  const stopSpeechRecognition = useCallback(() => {
    const rec = speechRef.current
    if (rec) {
      rec.onresult = null
      rec.onerror = null
      rec.onend = null
      try {
        rec.stop()
      } catch {
        /* already stopped */
      }
    }
    speechRef.current = null
  }, [])

  const startSpeechRecognition = useCallback(() => {
    stopSpeechRecognition()
    speechFinalRef.current = ''
    speechInterimRef.current = ''
    setInterimTranscript('')

    const Ctor = getSpeechRecognition()
    if (!Ctor) return

    const rec = new Ctor()
    rec.continuous = true
    rec.interimResults = true
    rec.lang = 'en-US'

    rec.onresult = (event: SpeechRecognitionEvent) => {
      let interim = ''
      let finalText = speechFinalRef.current
      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        const result = event.results[i]
        const text = result[0]?.transcript ?? ''
        if (result.isFinal) {
          finalText = `${finalText} ${text}`.trim()
        } else {
          interim = `${interim} ${text}`.trim()
        }
      }
      speechFinalRef.current = finalText
      speechInterimRef.current = interim
      setInterimTranscript(finalText || interim ? `${finalText} ${interim}`.trim() : '')
    }

    rec.onerror = () => {
      /* fall back to server STT */
    }

    try {
      rec.start()
      speechRef.current = rec
    } catch {
      /* unavailable */
    }
  }, [stopSpeechRecognition])

  const ensureMicStream = useCallback(async (): Promise<MediaStream> => {
    if (mediaStreamRef.current?.active) {
      return mediaStreamRef.current
    }
    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      throw new DOMException('Microphone not supported', 'NotSupportedError')
    }
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      },
    })
    mediaStreamRef.current = stream
    setMicReady(true)
    return stream
  }, [])

  const enableMicrophone = useCallback(async () => {
    setCaptureError(null)
    try {
      await ensureMicStream()
    } catch (err) {
      setMicReady(false)
      setCaptureError(micErrorMessage(err))
      throw err
    }
  }, [ensureMicStream])

  const blobToBase64 = (blob: Blob): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onloadend = () => {
        const result = reader.result
        if (typeof result !== 'string') {
          reject(new Error('Failed to read audio'))
          return
        }
        const comma = result.indexOf(',')
        resolve(comma >= 0 ? result.slice(comma + 1) : result)
      }
      reader.onerror = () => reject(reader.error ?? new Error('Failed to read audio'))
      reader.readAsDataURL(blob)
    })

  const finishRecording = useCallback(async (): Promise<SimVoiceCaptureResult> => {
    const recorder = mediaRecorderRef.current
    if (!recorder || recorder.state === 'inactive') {
      throw new Error('Not recording')
    }

    await new Promise<void>((resolve) => {
      recorder.onstop = () => resolve()
      recorder.stop()
    })

    stopSpeechRecognition()
    stopAnalyser()
    setIsRecording(false)

    const mime = recorder.mimeType || 'audio/webm'
    const blob = new Blob(chunksRef.current, { type: mime })
    chunksRef.current = []
    mediaRecorderRef.current = null

    const finalSpeech = speechFinalRef.current.trim()
    speechFinalRef.current = ''
    speechInterimRef.current = ''
    setInterimTranscript('')

    if (finalSpeech) {
      return { text: finalSpeech }
    }

    if (blob.size < 200) {
      throw new Error('Recording too short. Hold the mic and speak for at least 1 second.')
    }

    const audio_base64 = await blobToBase64(blob)
    return { audio_base64, audio_mime: mime }
  }, [stopAnalyser, stopSpeechRecognition])

  const startRecording = useCallback(async () => {
    setCaptureError(null)
    const stream = await ensureMicStream()
    startAnalyser(stream)
    startSpeechRecognition()

    const mime = pickRecorderMime()
    const recorder = mime ? new MediaRecorder(stream, { mimeType: mime }) : new MediaRecorder(stream)
    mediaRecorderRef.current = recorder
    chunksRef.current = []
    recorder.ondataavailable = (ev) => {
      if (ev.data.size > 0) chunksRef.current.push(ev.data)
    }
    recorder.start(250)
    setIsRecording(true)
  }, [ensureMicStream, startAnalyser, startSpeechRecognition])

  const stopRecording = useCallback(async (): Promise<SimVoiceCaptureResult> => {
    try {
      return await finishRecording()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Recording failed'
      setCaptureError(message)
      throw err
    }
  }, [finishRecording])

  const dispose = useCallback(() => {
    stopSpeechRecognition()
    stopAnalyser()
    mediaRecorderRef.current?.stop()
    mediaRecorderRef.current = null
    mediaStreamRef.current?.getTracks().forEach((t) => t.stop())
    mediaStreamRef.current = null
    setMicReady(false)
    setIsRecording(false)
    setInterimTranscript('')
  }, [stopAnalyser, stopSpeechRecognition])

  useEffect(() => () => dispose(), [dispose])

  return {
    micReady,
    isRecording,
    interimTranscript,
    micLevel,
    captureError,
    clearCaptureError: () => setCaptureError(null),
    enableMicrophone,
    startRecording,
    stopRecording,
    dispose,
  }
}
