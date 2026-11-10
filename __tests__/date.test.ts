import {
  addDaysISO,
  brToISO,
  dayLabel,
  isoToBr,
  maskBrDate,
  monthLabel,
  monthRange,
  shiftMonth,
} from '@/utils/date';

describe('conversão de datas', () => {
  it('converte ISO para BR e de volta', () => {
    expect(isoToBr('2026-09-19')).toBe('19/09/2026');
    expect(brToISO('19/09/2026')).toBe('2026-09-19');
  });

  it('rejeita datas inexistentes', () => {
    expect(brToISO('31/02/2026')).toBeNull();
    expect(brToISO('19/13/2026')).toBeNull();
    expect(brToISO('19/09/26')).toBeNull();
  });

  it('aplica a máscara DD/MM/AAAA', () => {
    expect(maskBrDate('19092026')).toBe('19/09/2026');
    expect(maskBrDate('1909')).toBe('19/09');
    expect(maskBrDate('19a')).toBe('19');
  });

  it('soma dias atravessando o mês', () => {
    expect(addDaysISO('2026-03-01', -1)).toBe('2026-02-28');
  });
});

describe('meses', () => {
  it('avança e volta atravessando o ano', () => {
    expect(shiftMonth({ year: 2026, month: 12 }, 1)).toEqual({ year: 2027, month: 1 });
    expect(shiftMonth({ year: 2026, month: 1 }, -1)).toEqual({ year: 2025, month: 12 });
  });

  it('calcula o intervalo do mês', () => {
    expect(monthRange({ year: 2026, month: 12 })).toEqual({
      start: '2026-12-01',
      endExclusive: '2027-01-01',
    });
  });

  it('gera o rótulo em português', () => {
    expect(monthLabel({ year: 2026, month: 9 })).toBe('Setembro 2026');
  });
});

describe('dayLabel', () => {
  it('usa Hoje, Ontem ou dd/mm', () => {
    expect(dayLabel('2026-09-19', '2026-09-19')).toBe('Hoje');
    expect(dayLabel('2026-09-18', '2026-09-19')).toBe('Ontem');
    expect(dayLabel('2026-09-10', '2026-09-19')).toBe('10/09');
  });
});
