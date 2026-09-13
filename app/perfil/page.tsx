'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Save, Loader2, ShieldCheck, Database } from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'

import { useAuth } from '@/components/AuthProvider'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

export default function Perfil() {
    const router = useRouter()
    const [loading, setLoading] = useState(true)
    const [updating, setUpdating] = useState(false)
    const [fullName, setFullName] = useState('')
    const { session, profile } = useAuth()
    const userId = session?.user?.id || null
    const ehAdmin = profile?.role === 'admin' || (profile?.role as string) === 'geral'

    useEffect(() => {
        async function getProfile() {
            if (!session?.user?.id) {
                setLoading(false)
                return
            }

            const { data } = await supabase
                .from('profiles')
                .select('full_name')
                .eq('id', session.user.id)
                .single()

            if (data) {
                setFullName(data.full_name || '')
            }

            setLoading(false)
        }

        getProfile()
    }, [session?.user?.id])

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!userId) return

        setUpdating(true)

        const updates = {
            id: userId,
            full_name: fullName,
            updated_at: new Date().toISOString(),
        }

        const { error } = await supabase.from('profiles').upsert(updates)

        if (error) {
            toast.error('Erro ao atualizar perfil', { description: error.message })
        } else {
            toast.success('Perfil atualizado')
            router.back()
        }
        setUpdating(false)
    }

    if (loading) {
        return (
            <div className="space-y-6 max-w-lg">
                <Skeleton className="h-9 w-40" />
                <Skeleton className="h-56 rounded-xl" />
            </div>
        )
    }

    return (
        <>
            <div className="flex items-center gap-3 mb-6">
                <Button variant="ghost" size="icon" onClick={() => router.back()} aria-label="Voltar">
                    <ArrowLeft />
                </Button>
                <h1 className="text-2xl font-semibold tracking-tight">Meu perfil</h1>
            </div>

            <div className="max-w-lg space-y-5">
                <Card>
                    <CardContent>
                        <form onSubmit={handleUpdate} className="space-y-5">
                            <div className="flex items-center justify-between gap-3">
                                <div>
                                    <p className="text-xs text-muted-foreground">Cargo no sistema</p>
                                    <Badge variant="secondary" className="mt-1">{profile?.role || 'mestre'}</Badge>
                                </div>
                                <div className="text-right">
                                    <p className="text-xs text-muted-foreground">Identificador</p>
                                    <p className="text-xs font-mono mt-1">{userId?.slice(0, 8)}…</p>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="nome">Nome de exibição</Label>
                                <Input
                                    id="nome"
                                    value={fullName}
                                    onChange={(e) => setFullName(e.target.value)}
                                    placeholder="Seu nome completo"
                                />
                                <p className="text-xs text-muted-foreground">
                                    Este nome aparece no histórico das sessões que você registrar.
                                </p>
                            </div>

                            <Button type="submit" disabled={updating}>
                                {updating ? <Loader2 data-slot="icon" className="animate-spin" /> : <Save data-slot="icon" />}
                                {updating ? 'Salvando…' : 'Salvar perfil'}
                            </Button>
                        </form>
                    </CardContent>
                </Card>

                {ehAdmin && (
                    <div className="space-y-3">
                        <h2 className="text-sm font-medium text-muted-foreground">Administração</h2>
                        <Button variant="outline" asChild className="w-full justify-start">
                            <Link href="/admin/usuarios"><ShieldCheck data-slot="icon" /> Usuários e cargos</Link>
                        </Button>
                        <Button variant="outline" asChild className="w-full justify-start">
                            <Link href="/admin/auditoria"><Database data-slot="icon" /> Auditoria de dados</Link>
                        </Button>
                    </div>
                )}
            </div>
        </>
    )
}
