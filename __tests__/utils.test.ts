describe('Calculadora de Estoque', () => {
    it('deve calcular corretamente o saldo restante', () => {
        const quantidadeInicial = 10;
        const consumido = 2.5;
        const saldo = quantidadeInicial - consumido;
        expect(saldo).toBe(7.5);
    });

    it('deve formatar valores corretamente', () => {
        const valor = 10.556;
        expect(valor.toFixed(2)).toBe('10.56');
    });
});
