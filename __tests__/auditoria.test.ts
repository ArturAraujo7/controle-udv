import {
  camposAlterados, descreverRegistro, formatarValor, hrefRegistro, impactoEstoque, resumoAlteracao,
} from '@/lib/auditoria'

describe('camposAlterados', () => {
  it('ignora campos técnicos e compara números sem diferenciar tipo', () => {
    const antes = { id: 1, updated_at: 'a', quantidade_participantes: 32, explanador: 'João', quantidade_preparada: '10' }
    const depois = { id: 1, updated_at: 'b', quantidade_participantes: 34, explanador: 'João', quantidade_preparada: 10 }
    expect(camposAlterados(antes, depois)).toEqual([
      { campo: 'quantidade_participantes', rotulo: 'Participantes', antes: 32, depois: 34 },
    ])
  })

  it('resume a alteração em uma frase', () => {
    expect(resumoAlteracao({ quantidade_participantes: 32, tipo: 'Escala' }, { quantidade_participantes: 34, tipo: 'Extra' }))
      .toBe('Participantes: 32 → 34 · +1 campo')
    expect(resumoAlteracao({ tipo: 'Escala' }, { tipo: 'Escala' })).toBe('Sem mudanças visíveis')
  })
})

describe('formatação', () => {
  it('formata datas, booleanos, litros e vazios', () => {
    expect(formatarValor('data_saida', '2026-09-06')).toBe('06/09/2026')
    expect(formatarValor('ativo', false)).toBe('Não')
    expect(formatarValor('quantidade', 1.5)).toBe('1,5 L')
    expect(formatarValor('observacoes', null)).toBe('—')
  })

  it('descreve o registro e monta o link', () => {
    expect(descreverRegistro('saidas', { destino: 'Núcleo X', data_saida: '2026-09-06' })).toBe('Saída para Núcleo X · 06/09/2026')
    expect(hrefRegistro('sessoes', 12)).toBe('/sessoes/12')
    expect(hrefRegistro('consumos_sessao', 3)).toBeNull()
  })
})

describe('impactoEstoque', () => {
  it('soma preparos e subtrai saídas e consumos', () => {
    expect(impactoEstoque('preparos', 'UPDATE', { quantidade_preparada: 10 }, { quantidade_preparada: 12 })).toBe(2)
    expect(impactoEstoque('saidas', 'INSERT', null, { quantidade: 1.5 })).toBe(-1.5)
    expect(impactoEstoque('consumos_sessao', 'DELETE', { quantidade_consumida: 2 }, null)).toBe(2)
    expect(impactoEstoque('sessoes', 'UPDATE', {}, {})).toBeNull()
  })
})
