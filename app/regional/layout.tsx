'use client'

import { EscopoRegionalProvider } from '@/components/regional/EscopoRegional'

export default function LayoutRegional({ children }: { children: React.ReactNode }) {
  return <EscopoRegionalProvider>{children}</EscopoRegionalProvider>
}
