'use client'
import { useEffect, useState } from 'react'

export function useKeyboardInset(active: boolean) {
  const [inset, setInset] = useState(0)
  useEffect(() => {
    if (!active || typeof window === 'undefined' || !window.visualViewport) return
    const vv = window.visualViewport
    const update = () => {
      const overlap = window.innerHeight - vv.height - vv.offsetTop
      setInset(Math.max(0, overlap))
    }
    update()
    vv.addEventListener('resize', update)
    vv.addEventListener('scroll', update)
    return () => {
      vv.removeEventListener('resize', update)
      vv.removeEventListener('scroll', update)
      setInset(0)
    }
  }, [active])
  return inset
}
