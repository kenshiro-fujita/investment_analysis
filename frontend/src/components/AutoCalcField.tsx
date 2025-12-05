interface AutoCalcFieldProps {
  label: string;
  value: number | undefined;
  unit?: string;
  noDataText?: string;  // undefinedの場合に表示するテキスト
}

export function AutoCalcField({ label, value, unit, noDataText }: AutoCalcFieldProps) {
  const formatValue = (val: number): string => {
    // 整数の場合はそのまま表示、小数の場合は2桁表示
    if (Number.isInteger(val)) {
      return val.toLocaleString();
    }
    return val.toFixed(2);
  };

  const displayValue = typeof value === 'number' 
    ? formatValue(value) 
    : (noDataText || '—');

  const isNoData = typeof value !== 'number' && noDataText;

  return (
    <div className={`auto-calc-field ${isNoData ? 'no-data' : ''}`}>
      <span className="auto-calc-label">{label}</span>
      <div className="auto-calc-content">
        <span className={`auto-calc-value ${isNoData ? 'no-data-text' : ''}`}>
          {displayValue}
        </span>
        {!isNoData && unit && <span className="auto-calc-unit">{unit}</span>}
      </div>
      <span className="auto-calc-badge">自動計算</span>
    </div>
  );
}
