'use client'
import { useState, useEffect } from 'react'
import { CalendarDays, LayoutDashboard, Navigation, Package, ShieldCheck, UserRound, type LucideIcon } from 'lucide-react'

import {
    Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

const CURRENT_VERSION = 'v4.0'

const NOVIDADES: { icone: LucideIcon; titulo: string; descricao: string }[] = [
    {
        icone: Navigation,
        titulo: 'Nova navegação',
        descricao: 'No celular, a barra de baixo leva a Início, Estoque, Sessões e Relatórios. O botão + registra sessões, preparos e saídas.',
    },
    {
        icone: LayoutDashboard,
        titulo: 'Início renovado',
        descricao: 'Estoque disponível, quantas sessões ele atende, alertas, última sessão e os números do ano.',
    },
    {
        icone: Package,
        titulo: 'Estoque por lote',
        descricao: 'Filtros por situação, extrato de movimentações com saldo e lotes em maturação.',
    },
    {
        icone: CalendarDays,
        titulo: 'Tela de cada sessão',
        descricao: 'Condução, vegetal servido, documentos lidos, histórias, visitantes e observações num só lugar.',
    },
    {
        icone: UserRound,
        titulo: 'Ficha do membro',
        descricao: 'Em Sessões → Membros: quantas vezes cada um dirigiu, leu, explanou ou foi mestre do preparo.',
    },
    {
        icone: ShieldCheck,
        titulo: 'Configurações e auditoria',
        descricao: 'Administradores ajustam listas e alertas e veem exatamente o que mudou em cada registro.',
    },
]

export function ChangelogModal() {
    const [isOpen, setIsOpen] = useState(false)

    useEffect(() => {
        const savedVersion = localStorage.getItem('changelog_viewed_version')
        if (savedVersion !== CURRENT_VERSION) {
            const timer = setTimeout(() => setIsOpen(true), 0)
            return () => clearTimeout(timer)
        }
    }, [])

    const handleClose = () => {
        localStorage.setItem('changelog_viewed_version', CURRENT_VERSION)
        setIsOpen(false)
    }

    return (
        <Dialog open={isOpen} onOpenChange={aberto => { if (!aberto) handleClose() }}>
            <DialogContent className="max-h-[85vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Novidades desta versão</DialogTitle>
                    <DialogDescription>O Guardião foi reorganizado para achar tudo mais rápido.</DialogDescription>
                </DialogHeader>

                <ul className="space-y-4">
                    {NOVIDADES.map(({ icone: Icone, titulo, descricao }) => (
                        <li key={titulo} className="flex gap-3">
                            <Icone className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                            <div>
                                <h3 className="text-sm font-medium leading-tight">{titulo}</h3>
                                <p className="text-sm text-muted-foreground mt-0.5">{descricao}</p>
                            </div>
                        </li>
                    ))}
                </ul>

                <DialogFooter>
                    <Button onClick={handleClose} className="w-full">Entendi</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
