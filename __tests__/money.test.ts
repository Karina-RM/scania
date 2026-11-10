import { formatMoney, parseMoney, roundMoney, toInputMoney } from '@/utils/money';

const nbsp = / /g;

describe('parseMoney', () => {
  it('aceita vírgula decimal', () => {
    expect(parseMoney('10,5')).toBe(10.5);
    expect(parseMoney('0,99')).toBe(0.99);
  });

  it('aceita ponto como separador de milhar', () => {
    expect(parseMoney('1.234,56')).toBe(1234.56);
    expect(parseMoney('1.234')).toBe(1234);
  });

  it('aceita ponto decimal', () => {
    expect(parseMoney('12.5')).toBe(12.5);
  });

  it('retorna NaN para texto sem números', () => {
    expect(parseMoney('')).toBeNaN();
    expect(parseMoney('abc')).toBeNaN();
  });
});

describe('formatMoney', () => {
  it('formata em reais', () => {
    expect(formatMoney(1234.5).replace(nbsp, ' ')).toBe('R$ 1.234,50');
  });
});

describe('roundMoney / toInputMoney', () => {
  it('arredonda para 2 casas', () => {
    expect(roundMoney(0.1 + 0.2)).toBe(0.3);
  });

  it('gera texto de campo com vírgula', () => {
    expect(toInputMoney(1234.5)).toBe('1234,50');
  });
});
