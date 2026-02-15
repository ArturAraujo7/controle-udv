'use client'
import { useState, useEffect } from 'react'
import { X, Moon, Search, FileText, Layout, User } from 'lucide-react'

export function ChangelogModal() {
    const [isOpen, setIsOpen] = useState(false)
    const CURRENT_VERSION = 'v2.0' // Increment this to show modal again in future updates

    useEffect(() => {
        const savedVersion = localStorage.getItem('changelog_viewed_version')
        if (savedVersion !== CURRENT_VERSION) {
            setIsOpen(true)
        }
    }, [])

    const handleClose = () => {
        localStorage.setItem('changelog_viewed_version', CURRENT_VERSION)
        setIsOpen(false)
    }

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-white dark:bg-gray-800 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 border border-gray-100 dark:border-gray-700">

                {/* Header */}
                <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                        <Layout className="w-32 h-32 transform rotate-12 translate-x-8 -translate-y-8" />
                    </div>
                    <h2 className="text-2xl font-bold relative z-10">Novidades! 🎉</h2>
                    <p className="text-blue-100 text-sm relative z-10 mt-1">Confira o que mudou nesta atualização.</p>
                    <button
                        onClick={handleClose}
                        className="absolute top-4 right-4 text-white/70 hover:text-white bg-white/10 hover:bg-white/20 rounded-full p-1 transition-colors z-20"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Lista de Novidades */}
                <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">

                    <div className="flex gap-4">
                        <div className="bg-indigo-100 dark:bg-indigo-900/30 p-2 rounded-xl h-fit">
                            <Moon className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                        </div>
                        <div>
                            <h3 className="font-bold text-gray-900 dark:text-white">Modo Escuro</h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Descanse seus olhos! Agora você pode alternar entre temas claro e escuro no topo da tela.</p>
                        </div>
                    </div>

                    <div className="flex gap-4">
                        <div className="bg-blue-100 dark:bg-blue-900/30 p-2 rounded-xl h-fit">
                            <FileText className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                            <h3 className="font-bold text-gray-900 dark:text-white">Relatórios & PDF</h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Nova área de relatórios com gráficos e exportação profissional para PDF / Impressão.</p>
                        </div>
                    </div>

                    <div className="flex gap-4">
                        <div className="bg-green-100 dark:bg-green-900/30 p-2 rounded-xl h-fit">
                            <Search className="w-6 h-6 text-green-600 dark:text-green-400" />
                        </div>
                        <div>
                            <h3 className="font-bold text-gray-900 dark:text-white">Busca Inteligente</h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Encontre rapidamente sessões, dirigentes ou itens do estoque com a nova barra de pesquisa.</p>
                        </div>
                    </div>

                    <div className="flex gap-4">
                        <div className="bg-purple-100 dark:bg-purple-900/30 p-2 rounded-xl h-fit">
                            <Layout className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                        </div>
                        <div>
                            <h3 className="font-bold text-gray-900 dark:text-white">Detalhes da Sessão</h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Clique em qualquer sessão (no histórico ou na home) para ver todos os detalhes e o que foi servido.</p>
                        </div>
                    </div>

                    <div className="flex gap-4">
                        <div className="bg-orange-100 dark:bg-orange-900/30 p-2 rounded-xl h-fit">
                            <User className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                        </div>
                        <div>
                            <h3 className="font-bold text-gray-900 dark:text-white">Quem Registrou?</h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Agora mostramos qual usuário realizou o cadastro de cada sessão.</p>
                        </div>
                    </div>

                </div>

                {/* Footer */}
                <div className="p-4 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                    <button
                        onClick={handleClose}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition-colors shadow-lg shadow-blue-900/20"
                    >
                        Entendi, vamos lá! 🚀
                    </button>
                </div>

            </div>
        </div>
    )
}
