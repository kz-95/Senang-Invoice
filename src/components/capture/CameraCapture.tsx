'use client'
import { useRef, useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/common/Button'
import { useT } from '@/hooks/useT'

interface CameraCaptureProps {
  onCapture: (base64: string) => void
}

export function CameraCapture({ onCapture }: CameraCaptureProps) {
  const fileRef = useRef<HTMLInputElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [pending, setPending] = useState<string | null>(null)
  const [dragOver, setDragOver] = useState(false)
  const [showWebcam, setShowWebcam] = useState(false)
  const t = useT()

  const stopWebcam = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop())
      streamRef.current = null
    }
    setShowWebcam(false)
  }, [])

  useEffect(() => {
    return () => stopWebcam()
  }, [stopWebcam])

  useEffect(() => {
    if (showWebcam && streamRef.current && videoRef.current) {
      videoRef.current.srcObject = streamRef.current
      videoRef.current.play().catch(() => {})
    }
  }, [showWebcam])

  const startWebcam = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 } },
      })
      streamRef.current = stream
      setShowWebcam(true)
    } catch {
      fileRef.current?.click()
    }
  }

  const captureWebcam = () => {
    const video = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas) return
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.drawImage(video, 0, 0)
    const dataUrl = canvas.toDataURL('image/jpeg', 0.9)
    setPreview(dataUrl)
    setPending(dataUrl.split(',')[1] ?? '')
    stopWebcam()
  }

  const readFile = (file: File) => {
    const reader = new FileReader()
    reader.onload = () => {
      const dataUrl = reader.result as string
      setPreview(dataUrl)
      setPending(dataUrl.split(',')[1] ?? '')
    }
    reader.readAsDataURL(file)
  }

  const startScan = () => {
    if (pending) {
      onCapture(pending)
      setPending(null)
    }
  }

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) readFile(file)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files?.[0]
    if (file?.type.startsWith('image/')) readFile(file)
  }

  if (showWebcam) {
    return (
      <div className="space-y-3">
        <div className="relative rounded-xl overflow-hidden bg-black">
          <video ref={videoRef} autoPlay playsInline muted className="w-full max-h-80 object-cover" aria-label="Camera preview" />
          <canvas ref={canvasRef} className="hidden" />
        </div>
        <div className="flex gap-2">
          <Button type="button" variant="primary" size="sm" onClick={captureWebcam} className="flex-1">
            {t('create.capture')}
          </Button>
          <Button type="button" variant="ghost" size="sm" onClick={stopWebcam}>
            {t('common.cancel')}
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFile}
        className="hidden"
      />

      {preview ? (
        <div className="space-y-3">
          <img src={preview} alt="Receipt preview" className="max-h-64 w-full rounded-xl object-contain bg-gray-50" />
          <div className="flex gap-2">
            <Button type="button" variant="outline" size="sm" onClick={startWebcam} className="flex-1">
              {t('create.retakeCamera')}
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={() => fileRef.current?.click()} className="flex-1">
              {t('create.retakeFile')}
            </Button>
          </div>
          <Button type="button" variant="primary" size="sm" onClick={startScan} className="w-full">
            {t('create.startScan')}
          </Button>
        </div>
      ) : (
        <button
          type="button"
          aria-label="Camera capture area - tap to take photo or drag an image"
          onClick={startWebcam}
          onDragOver={e => { e.preventDefault(); setDragOver(true) }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          className={`flex min-h-[220px] w-full flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed px-4 py-8 text-center transition-colors focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 ${
            dragOver
              ? 'border-teal-500 bg-teal-50'
              : 'border-gray-300 bg-gray-50 hover:border-teal-300 hover:bg-teal-50/50'
          }`}
        >
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-teal-100 text-teal-700">
            <svg className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z" />
            </svg>
          </div>
          <div>
            <p className="font-medium text-gray-900">{t('create.captureHint')}</p>
            <p className="mt-1 text-sm text-gray-500">{t('create.captureHint2')}</p>
          </div>
          <span className="ripple mt-1 inline-flex min-h-[44px] items-center rounded-xl bg-teal-700 px-5 text-sm font-medium text-white">
            {t('create.takePhoto')}
          </span>
        </button>
      )}
    </div>
  )
}
