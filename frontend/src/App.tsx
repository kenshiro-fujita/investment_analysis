import { useEffect, useState } from 'react';
import { api } from './api/client';
import type { Company, CompanyWithFinancials, FinancialData } from './types';
import { financialFields } from './types';
import { AutoCalcField } from './components/AutoCalcField';
import './App.css';

type View = 'list' | 'detail' | 'financial-form';

function App() {
  const [view, setView] = useState<View>('list');
  const [companies, setCompanies] = useState<Company[]>([]);
  const [selectedCompany, setSelectedCompany] = useState<CompanyWithFinancials | null>(null);
  const [editingFinancial, setEditingFinancial] = useState<FinancialData | null>(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // 新規企業フォーム
  const [showCompanyForm, setShowCompanyForm] = useState(false);
  const [companyForm, setCompanyForm] = useState({ name: '', ticker: '', sector: '', market: '', description: '' });

  useEffect(() => {
    loadCompanies();
  }, []);

  async function loadCompanies() {
    try {
      const data = await api.getCompanies();
      setCompanies(data);
    } catch (error) {
      showToast('企業一覧の読み込みに失敗しました', 'error');
    } finally {
      setLoading(false);
    }
  }

  async function loadCompanyDetail(id: string) {
    try {
      const data = await api.getCompany(id);
      setSelectedCompany(data);
      setView('detail');
    } catch (error) {
      showToast('企業情報の読み込みに失敗しました', 'error');
    }
  }

  async function handleCreateCompany(e: React.FormEvent) {
    e.preventDefault();
    try {
      await api.createCompany(companyForm);
      showToast('企業を登録しました', 'success');
      setShowCompanyForm(false);
      setCompanyForm({ name: '', ticker: '', sector: '', market: '', description: '' });
      loadCompanies();
    } catch (error) {
      showToast('企業の登録に失敗しました', 'error');
    }
  }

  async function handleDeleteCompany(id: string) {
    if (!confirm('この企業を削除しますか？')) return;
    try {
      await api.deleteCompany(id);
      showToast('企業を削除しました', 'success');
      loadCompanies();
      if (selectedCompany?.id === id) {
        setSelectedCompany(null);
        setView('list');
      }
    } catch (error) {
      showToast('削除に失敗しました', 'error');
    }
  }

  async function handleSaveFinancial(data: FinancialData) {
    if (!selectedCompany?.id) return;
    
    try {
      if (editingFinancial?.id) {
        await api.updateFinancial(selectedCompany.id, editingFinancial.id, data);
        showToast('財務データを更新しました', 'success');
      } else {
        await api.createFinancial(selectedCompany.id, data);
        showToast('財務データを追加しました', 'success');
      }
      await loadCompanyDetail(selectedCompany.id);
      setView('detail');
      setEditingFinancial(null);
    } catch (error) {
      showToast('保存に失敗しました', 'error');
    }
  }

  async function handleDeleteFinancial(financialId: string) {
    if (!selectedCompany?.id || !confirm('この財務データを削除しますか？')) return;
    try {
      await api.deleteFinancial(selectedCompany.id, financialId);
      showToast('財務データを削除しました', 'success');
      loadCompanyDetail(selectedCompany.id);
    } catch (error) {
      showToast('削除に失敗しました', 'error');
    }
  }

  function showToast(message: string, type: 'success' | 'error') {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
        <p>読み込み中...</p>
      </div>
    );
  }

  return (
    <div className="app">
      <header className="header">
        <h1 className="logo" onClick={() => { setView('list'); setSelectedCompany(null); }}>
          📊 Investment Analyzer
        </h1>
      </header>

      <main className="main">
        {view === 'list' && (
          <CompanyList
            companies={companies}
            onSelect={loadCompanyDetail}
            onDelete={handleDeleteCompany}
            onAdd={() => setShowCompanyForm(true)}
          />
        )}

        {view === 'detail' && selectedCompany && (
          <CompanyDetail
            company={selectedCompany}
            onBack={() => setView('list')}
            onAddFinancial={() => { setEditingFinancial(null); setView('financial-form'); }}
            onEditFinancial={(f) => { setEditingFinancial(f); setView('financial-form'); }}
            onDeleteFinancial={handleDeleteFinancial}
          />
        )}

        {view === 'financial-form' && selectedCompany && (
          <FinancialForm
            companyName={selectedCompany.name}
            initialData={editingFinancial}
            onSave={handleSaveFinancial}
            onCancel={() => { setView('detail'); setEditingFinancial(null); }}
          />
        )}
      </main>

      {/* 企業追加モーダル */}
      {showCompanyForm && (
        <div className="modal-overlay">
          <div className="modal">
            <h2>新規企業を登録</h2>
            <form onSubmit={handleCreateCompany}>
              <div className="form-group">
                <label>企業名 *</label>
                <input
                  type="text"
                  value={companyForm.name}
                  onChange={(e) => setCompanyForm({ ...companyForm, name: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>銘柄コード</label>
                <input
                  type="text"
                  value={companyForm.ticker}
                  onChange={(e) => setCompanyForm({ ...companyForm, ticker: e.target.value })}
                  placeholder="例: 7203"
                />
              </div>
              <div className="form-group">
                <label>セクター</label>
                <input
                  type="text"
                  value={companyForm.sector}
                  onChange={(e) => setCompanyForm({ ...companyForm, sector: e.target.value })}
                  placeholder="例: 自動車"
                />
              </div>
              <div className="form-group">
                <label>市場</label>
                <input
                  type="text"
                  value={companyForm.market}
                  onChange={(e) => setCompanyForm({ ...companyForm, market: e.target.value })}
                  placeholder="例: 東証プライム"
                />
              </div>
              <div className="form-group">
                <label>概要</label>
                <textarea
                  value={companyForm.description}
                  onChange={(e) => setCompanyForm({ ...companyForm, description: e.target.value })}
                />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowCompanyForm(false)}>
                  キャンセル
                </button>
                <button type="submit" className="btn-primary">登録</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {toast && (
        <div className={`toast toast-${toast.type}`}>{toast.message}</div>
      )}
    </div>
  );
}

// 企業一覧コンポーネント
function CompanyList({
  companies,
  onSelect,
  onDelete,
  onAdd,
}: {
  companies: Company[];
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  onAdd: () => void;
}) {
  return (
    <div className="company-list">
      <div className="section-header">
        <h2>企業一覧</h2>
        <button className="btn-primary" onClick={onAdd}>+ 企業を追加</button>
      </div>
      
      {companies.length === 0 ? (
        <div className="empty-state">
          <p>まだ企業が登録されていません</p>
          <button className="btn-primary" onClick={onAdd}>最初の企業を登録</button>
        </div>
      ) : (
        <div className="company-grid">
          {companies.map((company) => (
            <div key={company.id} className="company-card" onClick={() => onSelect(company.id!)}>
              <div className="company-card-header">
                <h3>{company.name}</h3>
                {company.ticker && <span className="ticker">{company.ticker}</span>}
              </div>
              <div className="company-card-body">
                {company.sector && <span className="tag">{company.sector}</span>}
                {company.market && <span className="tag">{company.market}</span>}
              </div>
              <button
                className="delete-btn"
                onClick={(e) => { e.stopPropagation(); onDelete(company.id!); }}
              >
                🗑️
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// 企業詳細コンポーネント
function CompanyDetail({
  company,
  onBack,
  onAddFinancial,
  onEditFinancial,
  onDeleteFinancial,
}: {
  company: CompanyWithFinancials;
  onBack: () => void;
  onAddFinancial: () => void;
  onEditFinancial: (f: FinancialData) => void;
  onDeleteFinancial: (id: string) => void;
}) {
  const sortedFinancials = [...company.financials].sort((a, b) => 
    b.year_period.localeCompare(a.year_period)
  );

  return (
    <div className="company-detail">
      <button className="back-btn" onClick={onBack}>← 一覧に戻る</button>
      
      <div className="company-header">
        <div>
          <h2>{company.name}</h2>
          <div className="company-meta">
            {company.ticker && <span className="ticker">{company.ticker}</span>}
            {company.sector && <span className="tag">{company.sector}</span>}
            {company.market && <span className="tag">{company.market}</span>}
          </div>
          {company.description && <p className="description">{company.description}</p>}
        </div>
        <button className="btn-primary" onClick={onAddFinancial}>+ 財務データを追加</button>
      </div>

      <div className="financials-section">
        <h3>財務データ</h3>
        {sortedFinancials.length === 0 ? (
          <div className="empty-state">
            <p>財務データがありません</p>
          </div>
        ) : (
          <div className="financials-table-container">
            <table className="financials-table">
              <thead>
                <tr>
                  <th className="sticky-col">項目</th>
                  {sortedFinancials.map((f) => (
                    <th key={f.id}>
                      {formatYearPeriod(f.year_period)}
                      <div className="th-actions">
                        <button onClick={() => onEditFinancial(f)}>✏️</button>
                        <button onClick={() => onDeleteFinancial(f.id!)}>🗑️</button>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {financialFields.filter(f => f.key !== 'year_period').map((field) => (
                  <tr key={field.key}>
                    <td className="sticky-col">{field.label}</td>
                    {sortedFinancials.map((f) => (
                      <td key={f.id}>
                        {formatValue(f[field.key as keyof FinancialData], field.unit)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// 自動計算フィールドの定義
const autoCalculatedFields = [
  'equity_ratio',
  'net_profit_margin',
  'operating_profit_margin',
  'current_business_value',
  'current_asset_value',
  'current_theoretical_stock_price',
  'margin_of_safety_current',
  'safety_ratio_current',
  'free_cash_flow',
  'roe',
  'roa',
  'roic',
  'roic_moving_avg_calc',
  'interest_rate',
  'equity_cost',
  'theoretical_discount_rate',
  'per',
  'pbr',
  'revenue_growth_yoy',
  'profit_growth_yoy',
];

// 小数点以下2桁に丸める（3桁目で四捨五入）
function roundToTwo(num: number): number {
  return Math.round(num * 100) / 100;
}

// 自動計算ロジック
function calculateAutoFields(data: FinancialData): FinancialData {
  const updated = { ...data };
  
  // 自己資本比率 = 純資産 ÷ 総資産 × 100
  if (data.net_assets !== undefined && data.total_assets !== undefined && data.total_assets !== 0) {
    updated.equity_ratio = roundToTwo((data.net_assets / data.total_assets) * 100);
  } else {
    updated.equity_ratio = undefined;
  }
  
  // 売上純利益率 = 当期純利益 ÷ 売上高 × 100
  if (data.net_income !== undefined && data.revenue !== undefined && data.revenue !== 0) {
    updated.net_profit_margin = roundToTwo((data.net_income / data.revenue) * 100);
  } else {
    updated.net_profit_margin = undefined;
  }
  
  // 売上営業利益率 = 営業利益 ÷ 売上高 × 100
  if (data.operating_income !== undefined && data.revenue !== undefined && data.revenue !== 0) {
    updated.operating_profit_margin = roundToTwo((data.operating_income / data.revenue) * 100);
  } else {
    updated.operating_profit_margin = undefined;
  }
  
  // 現状事業価値（一株あたりの営業利益×10）= 営業利益 ÷ 発行株式数 × 10
  // 営業利益は百万円、発行株式数は千株なので、×1000×10で円/株になる
  // 小数点で四捨五入（整数）
  if (data.operating_income !== undefined && data.shares_outstanding !== undefined && data.shares_outstanding !== 0) {
    updated.current_business_value = Math.round((data.operating_income * 10000) / data.shares_outstanding);
  } else {
    updated.current_business_value = undefined;
  }
  
  // 現状資産価値 = (流動資産 - 流動負債×1.2 + 投資その他の財産 - 固定負債) ÷ 発行株式数
  // 単位は百万円と千株なので、×1000で円/株になる
  // 小数点で四捨五入（整数）
  if (
    data.current_assets !== undefined &&
    data.current_liabilities !== undefined &&
    data.investments_and_other_assets !== undefined &&
    data.fixed_liabilities !== undefined &&
    data.shares_outstanding !== undefined &&
    data.shares_outstanding !== 0
  ) {
    const assetValue = data.current_assets - data.current_liabilities * 1.2 + data.investments_and_other_assets - data.fixed_liabilities;
    updated.current_asset_value = Math.round((assetValue * 1000) / data.shares_outstanding);
  } else {
    updated.current_asset_value = undefined;
  }
  
  // 現状理論株価 = 現状事業価値 + 現状資産価値（整数）
  if (updated.current_business_value !== undefined && updated.current_asset_value !== undefined) {
    updated.current_theoretical_stock_price = Math.round(updated.current_business_value + updated.current_asset_value);
  } else {
    updated.current_theoretical_stock_price = undefined;
  }
  
  // 安全域(現状) = 現状理論株価 - 期末株価（整数）
  if (updated.current_theoretical_stock_price !== undefined && data.stock_price_end !== undefined && data.stock_price_end > 0) {
    updated.margin_of_safety_current = Math.round(updated.current_theoretical_stock_price - data.stock_price_end);
  } else {
    updated.margin_of_safety_current = undefined;
  }
  
  // 安全率(現状) = 安全域 ÷ 期末株価 × 100（%表示）
  if (updated.margin_of_safety_current !== undefined && data.stock_price_end !== undefined && data.stock_price_end > 0) {
    updated.safety_ratio_current = roundToTwo((updated.margin_of_safety_current / data.stock_price_end) * 100);
  } else {
    updated.safety_ratio_current = undefined;
  }
  
  // FCF = 営業CF - 投資CF
  if (data.operating_cf !== undefined && data.investing_cf !== undefined) {
    updated.free_cash_flow = roundToTwo(data.operating_cf - data.investing_cf);
  } else {
    updated.free_cash_flow = undefined;
  }
  
  // ROE = 当期純利益 ÷ 純資産 × 100
  if (data.net_income !== undefined && data.net_assets !== undefined && data.net_assets !== 0) {
    updated.roe = roundToTwo((data.net_income / data.net_assets) * 100);
  } else {
    updated.roe = undefined;
  }
  
  // ROA = 当期純利益 ÷ 総資産 × 100
  if (data.net_income !== undefined && data.total_assets !== undefined && data.total_assets !== 0) {
    updated.roa = roundToTwo((data.net_income / data.total_assets) * 100);
  } else {
    updated.roa = undefined;
  }
  
  // ROIC = {営業利益 × (1-実効税率)} ÷ (有利子負債 + 株主資本) × 100
  if (
    data.operating_income !== undefined &&
    data.effective_tax_rate !== undefined &&
    data.interest_bearing_debt !== undefined &&
    data.shareholders_equity !== undefined &&
    (data.interest_bearing_debt + data.shareholders_equity) !== 0
  ) {
    const nopat = data.operating_income * (1 - data.effective_tax_rate / 100);
    const investedCapital = data.interest_bearing_debt + data.shareholders_equity;
    updated.roic = roundToTwo((nopat / investedCapital) * 100);
  } else {
    updated.roic = undefined;
  }
  
  // 移動平均計算用 = 固定で76.80%
  updated.roic_moving_avg_calc = 76.80;
  
  // 支払利息率 = 支払利息 ÷ 有利子負債 × 100
  if (data.interest_expense !== undefined && data.interest_bearing_debt !== undefined && data.interest_bearing_debt !== 0) {
    updated.interest_rate = roundToTwo((data.interest_expense / data.interest_bearing_debt) * 100);
  } else {
    updated.interest_rate = undefined;
  }
  
  // 資本調達コスト = 0.04% + β値 × (5.5% - 0.04%) = 0.04 + β × 5.46
  if (data.beta !== undefined) {
    updated.equity_cost = roundToTwo(0.04 + data.beta * 5.46);
  } else {
    updated.equity_cost = undefined;
  }
  
  // 理論割引率 = (1-自己資本比率)*負債調達コスト + 自己資本比率*資本調達コスト
  // 自己資本比率とコストは%表示なので、計算時は/100して、結果を*100で%に戻す
  if (updated.equity_ratio !== undefined && data.debt_cost !== undefined && updated.equity_cost !== undefined) {
    const equityRatioDecimal = updated.equity_ratio / 100;
    const debtCostDecimal = data.debt_cost / 100;
    const equityCostDecimal = updated.equity_cost / 100;
    updated.theoretical_discount_rate = roundToTwo(
      ((1 - equityRatioDecimal) * debtCostDecimal + equityRatioDecimal * equityCostDecimal) * 100
    );
  } else {
    updated.theoretical_discount_rate = undefined;
  }
  
  // PER = (期末株価 × 発行株式数) / (当期純利益 × 1000)
  // 期末株価が非上場(-1)の場合は計算しない
  if (
    data.stock_price_end !== undefined &&
    data.stock_price_end > 0 &&
    data.shares_outstanding !== undefined &&
    data.net_income !== undefined &&
    data.net_income !== 0
  ) {
    updated.per = roundToTwo((data.stock_price_end * data.shares_outstanding) / (data.net_income * 1000));
  } else {
    updated.per = undefined;
  }
  
  // PBR = (期末株価 × 発行株式数) / (純資産 × 1000)
  if (
    data.stock_price_end !== undefined &&
    data.stock_price_end > 0 &&
    data.shares_outstanding !== undefined &&
    data.net_assets !== undefined &&
    data.net_assets !== 0
  ) {
    updated.pbr = roundToTwo((data.stock_price_end * data.shares_outstanding) / (data.net_assets * 1000));
  } else {
    updated.pbr = undefined;
  }
  
  // 前年比売上成長率・前年比利益成長率は前年度データが必要なため、現時点ではundefined
  // TODO: 前年度データを参照して計算する
  updated.revenue_growth_yoy = undefined;
  updated.profit_growth_yoy = undefined;
  
  return updated;
}

// 財務データ入力フォーム
function FinancialForm({
  companyName,
  initialData,
  onSave,
  onCancel,
}: {
  companyName: string;
  initialData: FinancialData | null;
  onSave: (data: FinancialData) => void;
  onCancel: () => void;
}) {
  const [formData, setFormData] = useState<FinancialData>(
    calculateAutoFields(initialData || { year_period: '' })
  );
  const [isUnlisted, setIsUnlisted] = useState(initialData?.stock_price_end === -1);

  const handleChange = (key: string, value: string) => {
    let newData: FinancialData;
    if (key === 'year_period' || key === 'comment') {
      newData = { ...formData, [key]: value };
    } else {
      newData = { ...formData, [key]: value === '' ? undefined : parseFloat(value) };
    }
    // 自動計算を実行
    setFormData(calculateAutoFields(newData));
  };

  const handleUnlistedChange = (checked: boolean) => {
    setIsUnlisted(checked);
    const newData = { ...formData, stock_price_end: checked ? -1 : undefined };
    setFormData(calculateAutoFields(newData));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  const categories = [
    { id: 'basic', label: '基本情報' },
    { id: 'pl', label: '損益計算書' },
    { id: 'bs', label: '貸借対照表' },
    { id: 'stock', label: '株式情報' },
    { id: 'ratio', label: '財務指標' },
    { id: 'valuation', label: 'バリュエーション' },
    { id: 'growth', label: '成長率' },
    { id: 'cf', label: 'キャッシュフロー' },
    { id: 'cost', label: '資本コスト' },
    { id: 'other', label: 'その他' },
  ];

  return (
    <div className="financial-form">
      <h2>{companyName} - {initialData ? '財務データを編集' : '財務データを追加'}</h2>
      
      <form onSubmit={handleSubmit}>
        {categories.map((cat) => {
          const fields = financialFields.filter((f) => f.category === cat.id);
          if (fields.length === 0) return null;
          
          return (
            <div key={cat.id} className="form-category">
              <h3>{cat.label}</h3>
              <div className="form-grid">
                {fields.map((field) => (
                  autoCalculatedFields.includes(field.key) ? (
                    <AutoCalcField
                      key={field.key}
                      label={field.label}
                      value={formData[field.key as keyof FinancialData] as number | undefined}
                      unit={field.unit}
                      noDataText={
                        (field.key === 'revenue_growth_yoy' || field.key === 'profit_growth_yoy')
                          ? 'データ無し'
                          : undefined
                      }
                    />
                  ) : field.key === 'stock_price_end' ? (
                    <div key={field.key} className="form-group">
                      <label>{field.label}</label>
                      <div className="stock-price-input">
                        <label className="unlisted-checkbox">
                          <input
                            type="checkbox"
                            checked={isUnlisted}
                            onChange={(e) => handleUnlistedChange(e.target.checked)}
                          />
                          <span>非上場</span>
                        </label>
                        {!isUnlisted && (
                          <div className="input-with-unit">
                            <input
                              type="number"
                              step="any"
                              value={formData.stock_price_end ?? ''}
                              onChange={(e) => handleChange('stock_price_end', e.target.value)}
                            />
                            <span className="input-unit">{field.unit}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : field.key === 'year_period' ? (
                    <div key={field.key} className="form-group">
                      <label>{field.label}</label>
                      <div className="year-period-input">
                        <input
                          type="month"
                          value={formData.year_period || ''}
                          onChange={(e) => handleChange('year_period', e.target.value)}
                          required
                        />
                        <span className="year-period-suffix">末</span>
                      </div>
                    </div>
                  ) : (
                    <div key={field.key} className="form-group">
                      <label>{field.label}</label>
                      {field.key === 'comment' ? (
                        <textarea
                          value={formData[field.key] || ''}
                          onChange={(e) => handleChange(field.key, e.target.value)}
                        />
                      ) : (
                        <div className="input-with-unit">
                          <input
                            type="number"
                            step="any"
                            value={formData[field.key as keyof FinancialData] ?? ''}
                            onChange={(e) => handleChange(field.key, e.target.value)}
                          />
                          {field.unit && <span className="input-unit">{field.unit}</span>}
                        </div>
                      )}
                    </div>
                  )
                ))}
              </div>
            </div>
          );
        })}

        <div className="form-actions">
          <button type="button" className="btn-secondary" onClick={onCancel}>
            キャンセル
          </button>
          <button type="submit" className="btn-primary">保存</button>
        </div>
      </form>
    </div>
  );
}

// 年期を「2024年3月末」形式に変換
function formatYearPeriod(yearPeriod: string): string {
  // "2024-03" または "2024/03" 形式を想定
  const match = yearPeriod.match(/^(\d{4})[-\/](\d{2})$/);
  if (match) {
    const year = match[1];
    const month = parseInt(match[2], 10);
    return `${year}年${month}月末`;
  }
  // マッチしない場合はそのまま表示 + 末
  return yearPeriod + '末';
}

function formatValue(value: unknown, unit?: string): string {
  if (value === null || value === undefined || value === '') return '-';
  if (typeof value === 'string') return value;
  if (typeof value === 'number') {
    if (unit === '%' || unit === '倍') {
      return value.toFixed(2);
    }
    return value.toLocaleString();
  }
  return String(value);
}

export default App;
