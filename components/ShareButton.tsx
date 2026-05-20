'use client'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Share2, Check } from 'lucide-react'
import { toast } from 'sonner'

export function ShareButton({ joinCode }: { joinCode: string }) {
  const [copied, setCopied] = useState(false)
  const url = typeof window !== 'undefined' ? `${window.location.origin}/t/${joinCode}/join` : ''

  const share = async () => {
    if (navigator.share) {
      try { await navigator.share({ title: 'Camping Packen', url }); return } catch {}
    }
    await navigator.clipboard.writeText(url)
    setCopied(true)
    toast('Link kopiert')
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <Button variant="ghost" size="sm" onClick={share}>
      {copied ? <Check className="h-4 w-4" /> : <Share2 className="h-4 w-4" />}
      <span className="ml-1 text-xs">{joinCode}</span>
    </Button>
  )
}
