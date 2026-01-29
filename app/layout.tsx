import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { ThemeProvider } from './providers' // Importe isso

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Controle UDV',
  description: 'Gestão de Estoque e Sessões',
  manifest: '/manifest.json', // Vamos adicionar isso depois se quiser instalar
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR" suppressHydrationWarning> 
      <body className={`${inter.className} transition-colors duration-300`}>
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}