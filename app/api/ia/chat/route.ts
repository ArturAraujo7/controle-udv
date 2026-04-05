import { GoogleGenerativeAI } from '@google/generative-ai'
import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const systemPrompt = `Você é um assistente do Núcleo Jardim Real da União do Vegetal (UDV).
Responda de forma extremamente simples, curta e direta baseando-se apenas nos dados abaixo.
Evite textos complexos, jargões, introduções longas ou explicações de como você buscou a resposta.
Vá direto ao ponto e forneça apenas a informação solicitada em no máximo 1 a 2 parágrafos curtos.
Use um tom amigável, claro e respeitoso. Se não encontrar a informação, simplesmente diga que não a encontrou, sem inventar.

DADOS DE CONTEXTO ATUAIS DO BANCO:
`

export async function POST(req: Request) {
  try {
    const { messages } = await req.json()
    const authHeader = req.headers.get('authorization')
    const apiKey = process.env.GEMINI_API_KEY

    if (!apiKey) {
      return NextResponse.json({ error: 'GEMINI_API_KEY não configurada no servidor.' }, { status: 500 })
    }

    if (!authHeader) {
      return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })
    }

    // Criar um client do Supabase isolado para esta request, injetando o token do usuário
    // Isso garante que o RLS seja respeitado usando a identidade de quem fez a request.
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { global: { headers: { Authorization: authHeader } } }
    )

    // Buscar todos os dados relevantes em paralelo (ORDENADOS POR DATA DECRESCENTE)
    const [sessoesReq, consumosReq, preparosReq, saidasReq] = await Promise.all([
      supabase.from('sessoes').select('id, data_realizacao, tipo, dirigente, explanador, leitor_documentos, quantidade_participantes').order('data_realizacao', { ascending: false }),
      supabase.from('consumos_sessao').select('id_sessao, quantidade_consumida, id_preparo'),
      supabase.from('preparos').select('id, data_preparo, mestre_preparo, grau, quantidade_preparada').order('data_preparo', { ascending: false }),
      supabase.from('saidas').select('id, data_saida, quantidade, destino').order('data_saida', { ascending: false })
    ])

    // O sistema funciona muito melhor (reduz alucinação do modelo Flash)
    // ao receber dados formatados e simplificados invés de JSON bruto com ISO Strings.
    const sessoesContext = (sessoesReq.data || []).map(s => {
      const dataStr = new Date(s.data_realizacao).toLocaleDateString('pt-BR')
      return `[ID da Sessão: ${s.id}] -> Data: ${dataStr} | Tipo de Sessão: ${s.tipo} | Qtd Pessoas: ${s.quantidade_participantes || 0} | Mestre Dirigente: ${s.dirigente || '-'} | Leu os Documentos: ${s.leitor_documentos || '-'} | Fez a Explanação: ${s.explanador || '-'}`
    }).join('\n')

    const preparosContext = (preparosReq.data || []).map(p => {
      const dataStr = new Date(p.data_preparo).toLocaleDateString('pt-BR')
      return `Preparo ID:${p.id} | Data:${dataStr} | Mestre:${p.mestre_preparo} | Grau:${p.grau} | Qtd:${p.quantidade_preparada}L`
    }).join('\n')

    const consumosContext = (consumosReq.data || []).map(c => `Sessão ID:${c.id_sessao} consumiu ${c.quantidade_consumida}L do Preparo ID:${c.id_preparo}`).join('\n')
    const saidasContext = (saidasReq.data || []).map(s => `Saída ID:${s.id} | Data:${new Date(s.data_saida).toLocaleDateString('pt-BR')} | Destino:${s.destino} | Qtd:${s.quantidade}L`).join('\n')

    const genAI = new GoogleGenerativeAI(apiKey)
    const model = genAI.getGenerativeModel({ model: 'gemini-flash-lite-latest' })

    // O último item do array messages é a pergunta atual do usuário.
    // Os anteriores são o histórico.
    const userMessage = messages[messages.length - 1].text

    const fullPrompt = `
${systemPrompt}

REGRAS ESTRITAS DE LEITURA DOS DADOS ABAIXO (MUITO IMPORTANTE):
1. Cada linha representa uma SESSÃO única encabeçada por [ID da Sessão: X]. NUNCA cruze informações de linhas diferentes.
2. Se procurarem por quem "leu", "leitor" ou "leitura", busque APENAS E ESTRITAMENTE o que está escrito após a etiqueta "Leu os Documentos: ".
3. Ignore letras maiúsculas ou acentos na sua busca (ex: Jessica é igual a Jéssica).
4. Para a "última vez", localize a PRIMEIRA VEZ que o nome aparece descendo a lista na coluna "Leu os Documentos:", pois já organizei do mais recente pro mais antigo.
5. Retorne a "Data" que antecede o nome naquela EXATA linha. Se disser uma data de outra linha, você fracassou estruturalmente.
6. NUNCA explique o seu raciocínio, nem como encontrou os dados, entregue apenas a resposta final e de forma simpática.

=== SESSOES ===
${sessoesContext}

=== PREPAROS ===
${preparosContext}

=== CONSUMOS ===
${consumosContext}

=== SAIDAS ===
${saidasContext}

Sempre verifique cuidadosamente a linha exata da Sessão antes de responder datas ou nomes! Pessoas diferentes leem ou palestram (explanam) em dias diferentes. Associe as colunas corretamente lendo a linha inteira.

Histórico da conversa até agora:
${JSON.stringify(messages.slice(0, -1))}

Pergunta atual do usuário: ${userMessage}
`

    // Executar o stream do Gemini
    const result = await model.generateContentStream(fullPrompt)
    
    // Converter o AsyncGenerator nativo do Gemini para um ReadableStream padrão da Web
    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of result.stream) {
            const chunkText = chunk.text()
            controller.enqueue(new TextEncoder().encode(chunkText))
          }
          controller.close()
        } catch (error) {
          console.error("Erro no stream:", error)
          controller.error(error)
        }
      }
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    })
  } catch (error: unknown) {
    console.error('API Error:', error)
    const err = error as Error
    return NextResponse.json({ error: err.message || 'Erro interno no servidor' }, { status: 500 })
  }
}
