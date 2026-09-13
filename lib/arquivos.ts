import { supabase } from './supabaseClient'

/** Bucket privado criado na migration 20260913120400_armazenamento_arquivos. */
const BUCKET = 'arquivos'

export type PastaArquivo = 'membros' | 'atas' | 'nucleo'

/** Envia o arquivo e devolve o caminho a ser gravado na coluna `*_arquivo`. */
export async function enviarArquivo(arquivo: File, pasta: PastaArquivo) {
  const extensao = arquivo.name.split('.').pop()?.toLowerCase() || 'bin'
  const caminho = `${pasta}/${crypto.randomUUID()}.${extensao}`

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(caminho, arquivo, { contentType: arquivo.type, upsert: false })

  if (error) throw error
  return caminho
}

export async function removerArquivo(caminho: string) {
  await supabase.storage.from(BUCKET).remove([caminho])
}

/** URL assinada temporária para exibir um arquivo privado. */
export async function urlArquivo(caminho: string, segundos = 3600) {
  const { data } = await supabase.storage.from(BUCKET).createSignedUrl(caminho, segundos)
  return data?.signedUrl ?? null
}
