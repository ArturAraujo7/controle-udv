'use client'
import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Search, User, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

import { useAuth } from '@/components/AuthProvider'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'

type UserProfile = {
  id: string
  full_name: string | null
  email: string | null
  role: 'admin' | 'representante' | 'assistente' | 'mestre'
}

const CARGOS: { valor: UserProfile['role']; rotulo: string }[] = [
  { valor: 'mestre', rotulo: 'Mestre' },
  { valor: 'assistente', rotulo: 'Mestre Assistente' },
  { valor: 'representante', rotulo: 'Mestre Representante' },
  { valor: 'admin', rotulo: 'Administrador' },
]

const rotuloCargo = Object.fromEntries(CARGOS.map(c => [c.valor, c.rotulo]))

export default function AdminUsuarios() {
  const router = useRouter()
  const { profile, loading: authLoading } = useAuth()
  const [profiles, setProfiles] = useState<UserProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  // 1. Protection: Only admins can stay on this page
  useEffect(() => {
    if (!authLoading && (!profile || profile.role !== 'admin')) {
      router.replace('/')
    }
  }, [profile, authLoading, router])

  // 2. Fetch all users
  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, email, role')
        .order('full_name', { ascending: true })

      if (error) throw error
      if (data) setProfiles(data as UserProfile[])
    } catch (err: unknown) {
      console.error('Erro ao buscar usuários:', err)
      const errorMsg = err instanceof Error ? err.message : 'Falha ao carregar lista'
      toast.error('Erro ao carregar usuários', { description: errorMsg })
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (profile?.role === 'admin') {
      fetchUsers()
    }
  }, [profile, fetchUsers])

  // 3. Update User Role
  const handleUpdateRole = async (userId: string, newRole: UserProfile['role']) => {
    setUpdatingId(userId)
    const { error } = await supabase
      .from('profiles')
      .update({ role: newRole })
      .eq('id', userId)

    if (error) {
      toast.error('Erro ao atualizar cargo', { description: error.message })
    } else {
      setProfiles(prev => prev.map(p => p.id === userId ? { ...p, role: newRole } : p))
      toast.success(`Cargo atualizado para ${rotuloCargo[newRole]}`)
    }
    setUpdatingId(null)
  }

  const busca = searchTerm.toLowerCase()
  const filteredProfiles = profiles.filter(p =>
    p.full_name?.toLowerCase().includes(busca) ||
    p.email?.toLowerCase().includes(busca)
  )

  if (authLoading || (loading && profiles.length === 0)) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-9 w-56" />
        {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
      </div>
    )
  }

  return (
    <>
      <div className="flex items-center gap-3 mb-2">
        <Button variant="ghost" size="icon" onClick={() => router.back()} aria-label="Voltar">
          <ArrowLeft />
        </Button>
        <h1 className="text-2xl font-semibold tracking-tight">Usuários e cargos</h1>
      </div>
      <p className="text-sm text-muted-foreground mb-6 ml-12">
        O cargo define quem pode registrar e editar dados no sistema.
      </p>

      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
        <Input
          className="pl-9"
          placeholder="Buscar por nome ou e-mail…"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          aria-label="Buscar usuário"
        />
      </div>

      {filteredProfiles.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-10 text-center">
            <User className="w-6 h-6 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">Nenhum usuário encontrado.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredProfiles.map((user) => (
            <Card key={user.id}>
              <CardContent className="flex flex-col sm:flex-row sm:items-center gap-4">
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium truncate flex items-center gap-2">
                    {user.full_name || 'Sem nome'}
                    {user.id === profile?.id && <Badge variant="secondary">você</Badge>}
                  </h3>
                  <p className="text-sm text-muted-foreground truncate">
                    {user.email || 'E-mail não disponível'}
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <Select
                    disabled={updatingId === user.id}
                    value={user.role}
                    onValueChange={(valor) => handleUpdateRole(user.id, valor as UserProfile['role'])}
                  >
                    <SelectTrigger className="w-full sm:w-56" aria-label={`Cargo de ${user.full_name || 'usuário'}`}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CARGOS.map(({ valor, rotulo }) => (
                        <SelectItem key={valor} value={valor}>{rotulo}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {updatingId === user.id && (
                    <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </>
  )
}
