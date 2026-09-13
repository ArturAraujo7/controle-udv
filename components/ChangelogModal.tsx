'use client'
import { useState, useEffect } from 'react'
import { Moon, Search, FileText, Layout, User, Sparkles, type LucideIcon } from 'lucide-react'

import {
    Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

const CURRENT_VERSION = 'v3.0'

const NOVIDADES: { icone: LucideIcon; titulo: string; descricao: string }[] = [
    {
        icone: Sparkles,
        titulo: 'Nova identidade visual',
        descricao: 'Interface redesenhada: mais limpa, mais legível e com a identidade do Guardião em verde.',
    },
    {
        icone: Layout,
        titulo: 'Navegação em todas as telas',
        descricao: 'Menu fixo no topo (e barra inferior no celular) para ir direto a qualquer área.',
    },
    {
        icone: Moon,
        titulo: 'Modo escuro',
        descricao: 'Alterne entre tema claro e escuro pelo botão no topo da tela.',
    },
    {
        icone: FileText,
        titulo: 'Relatórios & PDF',
        descricao: 'Área de relatórios com gráficos e exportação para PDF / impressão.',
    },
    {
        icone: Search,
        titulo: 'Busca',
        descricao: 'Encontre sessões, dirigentes ou itens do estoque pela barra de pesquisa.',
    },
    {
        icone: User,
        titulo: 'Detalhes da sessão',
        descricao: 'Toque em qualquer sessão para ver os dados completos e o que foi servido.',
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
                    <DialogDescription>O que mudou no Guardião.</DialogDescription>
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
