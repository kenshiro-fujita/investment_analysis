export interface FinancialData {
  id?: string;
  year_period: string;
  
  // 損益計算書
  revenue?: number;
  net_income?: number;
  operating_income?: number;
  interest_expense?: number;
  
  // 貸借対照表
  cash_and_equivalents?: number;
  current_assets?: number;
  investments_and_other_assets?: number;
  current_liabilities?: number;
  fixed_liabilities?: number;
  interest_bearing_debt?: number;
  shareholders_equity?: number;
  net_assets?: number;
  total_assets?: number;
  
  // 株式情報
  shares_outstanding?: number;
  stock_price_end?: number;
  
  // 財務指標
  equity_ratio?: number;
  net_profit_margin?: number;
  operating_profit_margin?: number;
  
  // バリュエーション
  current_business_value?: number;
  current_asset_value?: number;
  current_theoretical_stock_price?: number;
  margin_of_safety_current?: number;
  safety_ratio_current?: number;
  
  // 成長率
  revenue_growth_yoy?: number;
  profit_growth_yoy?: number;
  
  // キャッシュフロー
  operating_cf?: number;
  investing_cf?: number;
  free_cash_flow?: number;
  
  // その他指標
  effective_tax_rate?: number;
  roe?: number;
  roa?: number;
  roic?: number;
  roic_moving_avg_calc?: number;
  roic_moving_avg?: number;
  
  // 資本コスト関連
  interest_rate?: number;
  debt_cost?: number;
  beta?: number;
  equity_cost?: number;
  theoretical_discount_rate?: number;
  
  // バリュエーション指標
  per?: number;
  pbr?: number;
  
  // メモ
  comment?: string;
}

export interface Company {
  id?: string;
  name: string;
  ticker?: string;
  sector?: string;
  market?: string;
  description?: string;
  created_at?: string;
  updated_at?: string;
}

export interface CompanyWithFinancials extends Company {
  financials: FinancialData[];
}

// 財務データのフィールド定義（表示用）
export const financialFields = [
  { key: 'year_period', label: '年期', category: 'basic', unit: '' },
  { key: 'revenue', label: '売上高', category: 'pl', unit: '百万円' },
  { key: 'net_income', label: '当期純利益', category: 'pl', unit: '百万円' },
  { key: 'operating_income', label: '営業利益', category: 'pl', unit: '百万円' },
  { key: 'interest_expense', label: '支払利息', category: 'pl', unit: '百万円' },
  { key: 'cash_and_equivalents', label: '現金及び等価物', category: 'bs', unit: '百万円' },
  { key: 'current_assets', label: '流動資産', category: 'bs', unit: '百万円' },
  { key: 'investments_and_other_assets', label: '投資その他の資産', category: 'bs', unit: '百万円' },
  { key: 'current_liabilities', label: '流動負債', category: 'bs', unit: '百万円' },
  { key: 'fixed_liabilities', label: '固定負債', category: 'bs', unit: '百万円' },
  { key: 'interest_bearing_debt', label: '有利子負債', category: 'bs', unit: '百万円' },
  { key: 'shareholders_equity', label: '株主資本', category: 'bs', unit: '百万円' },
  { key: 'net_assets', label: '純資産', category: 'bs', unit: '百万円' },
  { key: 'total_assets', label: '総資産', category: 'bs', unit: '百万円' },
  { key: 'shares_outstanding', label: '発行株式数', category: 'stock', unit: '千株' },
  { key: 'stock_price_end', label: '期末株価', category: 'stock', unit: '円' },
  { key: 'equity_ratio', label: '自己資本比率', category: 'ratio', unit: '%' },
  { key: 'net_profit_margin', label: '売上純利益率', category: 'ratio', unit: '%' },
  { key: 'operating_profit_margin', label: '売上営業利益率', category: 'ratio', unit: '%' },
  { key: 'current_business_value', label: '現状事業価値', category: 'valuation', unit: '円/株' },
  { key: 'current_asset_value', label: '現状資産価値', category: 'valuation', unit: '円/株' },
  { key: 'current_theoretical_stock_price', label: '現状理論株価', category: 'valuation', unit: '円' },
  { key: 'margin_of_safety_current', label: '安全域(現状)', category: 'valuation', unit: '円' },
  { key: 'safety_ratio_current', label: '安全率(現状)', category: 'valuation', unit: '%' },
  { key: 'revenue_growth_yoy', label: '前年比売上成長率', category: 'growth', unit: '%' },
  { key: 'profit_growth_yoy', label: '前年比利益成長率', category: 'growth', unit: '%' },
  { key: 'operating_cf', label: '営業CF', category: 'cf', unit: '百万円' },
  { key: 'investing_cf', label: '投資CF', category: 'cf', unit: '百万円' },
  { key: 'free_cash_flow', label: 'FCF', category: 'cf', unit: '百万円' },
  { key: 'effective_tax_rate', label: '実効税率', category: 'other', unit: '%' },
  { key: 'roe', label: 'ROE', category: 'other', unit: '%' },
  { key: 'roa', label: 'ROA', category: 'other', unit: '%' },
  { key: 'roic', label: 'ROIC', category: 'other', unit: '%' },
  { key: 'roic_moving_avg_calc', label: '移動平均計算用', category: 'other', unit: '' },
  { key: 'roic_moving_avg', label: '移動平均ROIC', category: 'other', unit: '%' },
  { key: 'interest_rate', label: '支払利息率', category: 'cost', unit: '%' },
  { key: 'debt_cost', label: '負債調達コスト', category: 'cost', unit: '%' },
  { key: 'beta', label: 'β値', category: 'cost', unit: '' },
  { key: 'equity_cost', label: '資本調達コスト', category: 'cost', unit: '%' },
  { key: 'theoretical_discount_rate', label: '理論割引率', category: 'cost', unit: '%' },
  { key: 'per', label: 'PER', category: 'valuation', unit: '倍' },
  { key: 'pbr', label: 'PBR', category: 'valuation', unit: '倍' },
  { key: 'comment', label: 'コメント', category: 'other', unit: '' },
] as const;

export type FinancialFieldKey = typeof financialFields[number]['key'];

