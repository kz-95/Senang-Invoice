'use client'
import { useCallback } from 'react'

export function useCapture() {
  const captureImage = useCallback(async (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => {
        const result = reader.result as string
        // Strip the data URL prefix to get raw base64
        const base64 = result.split(',')[1] ?? ''
        resolve(base64)
      }
      reader.onerror = reject
      reader.readAsDataURL(file)
    })
  }, [])

  return { captureImage }
}
