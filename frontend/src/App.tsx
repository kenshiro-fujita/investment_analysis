import { useEffect, useState, useCallback } from 'react';
import { api } from './api/client';
import type { Company, CompanyWithFinancials, FinancialData } from './types';
import { financialFields } from './types';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';

// カスタム凡例コンポーネント（左軸・右軸で2行に分ける）
function CustomLegend({ payload, leftAxisKeys }: { payload?: Array<{ value: string; color: string }>; leftAxisKeys: string[] }) {
  if (!payload) return null;
  const leftItems = payload.filter(p => leftAxisKeys.includes(p.value));
  const rightItems = payload.filter(p => !leftAxisKeys.includes(p.value));
  
  return (
    <div className="custom-legend">
      <div className="legend-row">
        {leftItems.map((entry, index) => (
          <span key={`left-${index}`} className="legend-item">
            <span className="legend-color" style={{ backgroundColor: entry.color }} />
            {entry.value}
          </span>
        ))}
      </div>
      {rightItems.length > 0 && (
        <div className="legend-row legend-row-right">
          {rightItems.map((entry, index) => (
            <span key={`right-${index}`} className="legend-item">
              <span className="legend-color" style={{ backgroundColor: entry.color }} />
              {entry.value}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
import './App.css';

type View = 'list' | 'detail';

function App() {
  const [view, setView] = useState<View>('list');
  const [companies, setCompanies] = useState<Company[]>([]);
  const [selectedCompany, setSelectedCompany] = useState<CompanyWithFinancials | null>(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // 新規企業フォーム
  const [showCompanyForm, setShowCompanyForm] = useState(false);
  const [companyForm, setCompanyForm] = useState({ name: '', ticker: '', sector: '', market: '', description: '', financial_analysis: '' });
  
  // 企業編集フォーム
  const [showEditCompanyForm, setShowEditCompanyForm] = useState(false);
  const [editCompanyForm, setEditCompanyForm] = useState({ name: '', ticker: '', sector: '', market: '', description: '', financial_analysis: '' });

  // ROIC詳細モーダル
  const [roicDetailModal, setRoicDetailModal] = useState<{ yearPeriod: string; detail: RoicCalcDetail } | null>(null);

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
      setCompanyForm({ name: '', ticker: '', sector: '', market: '', description: '', financial_analysis: '' });
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

  function handleOpenEditCompany() {
    if (!selectedCompany) return;
    setEditCompanyForm({
      name: selectedCompany.name || '',
      ticker: selectedCompany.ticker || '',
      sector: selectedCompany.sector || '',
      market: selectedCompany.market || '',
      description: selectedCompany.description || '',
      financial_analysis: selectedCompany.financial_analysis || '',
    });
    setShowEditCompanyForm(true);
  }

  async function handleUpdateCompany(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedCompany?.id) return;
    try {
      await api.updateCompany(selectedCompany.id, editCompanyForm);
      showToast('企業情報を更新しました', 'success');
      setShowEditCompanyForm(false);
      // 更新後の情報を再取得
      const updated = await api.getCompany(selectedCompany.id);
      setSelectedCompany(updated);
      loadCompanies();
    } catch (error) {
      showToast('更新に失敗しました', 'error');
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
            onUpdate={(updated) => setSelectedCompany(updated)}
            onEditCompany={handleOpenEditCompany}
            showToast={showToast}
            onShowRoicDetail={(yearPeriod, detail) => setRoicDetailModal({ yearPeriod, detail })}
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
              <div className="form-group">
                <label>財務分析結果</label>
                <textarea
                  value={companyForm.financial_analysis}
                  onChange={(e) => setCompanyForm({ ...companyForm, financial_analysis: e.target.value })}
                  rows={5}
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

      {/* 企業編集モーダル */}
      {showEditCompanyForm && (
        <div className="modal-overlay">
          <div className="modal">
            <h2>企業情報を編集</h2>
            <form onSubmit={handleUpdateCompany}>
              <div className="form-group">
                <label>企業名 *</label>
                <input
                  type="text"
                  value={editCompanyForm.name}
                  onChange={(e) => setEditCompanyForm({ ...editCompanyForm, name: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>銘柄コード</label>
                <input
                  type="text"
                  value={editCompanyForm.ticker}
                  onChange={(e) => setEditCompanyForm({ ...editCompanyForm, ticker: e.target.value })}
                  placeholder="例: 7203"
                />
              </div>
              <div className="form-group">
                <label>セクター</label>
                <input
                  type="text"
                  value={editCompanyForm.sector}
                  onChange={(e) => setEditCompanyForm({ ...editCompanyForm, sector: e.target.value })}
                  placeholder="例: 自動車"
                />
              </div>
              <div className="form-group">
                <label>市場</label>
                <input
                  type="text"
                  value={editCompanyForm.market}
                  onChange={(e) => setEditCompanyForm({ ...editCompanyForm, market: e.target.value })}
                  placeholder="例: 東証プライム"
                />
              </div>
              <div className="form-group">
                <label>概要</label>
                <textarea
                  value={editCompanyForm.description}
                  onChange={(e) => setEditCompanyForm({ ...editCompanyForm, description: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>財務分析結果</label>
                <textarea
                  value={editCompanyForm.financial_analysis}
                  onChange={(e) => setEditCompanyForm({ ...editCompanyForm, financial_analysis: e.target.value })}
                  rows={5}
                />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowEditCompanyForm(false)}>
                  キャンセル
                </button>
                <button type="submit" className="btn-primary">更新</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {toast && (
        <div className={`toast toast-${toast.type}`}>{toast.message}</div>
      )}

      {/* 移動平均ROIC計算詳細モーダル */}
      {roicDetailModal && (
        <div className="modal-overlay" onClick={() => setRoicDetailModal(null)}>
          <div className="modal roic-detail-modal" onClick={(e) => e.stopPropagation()}>
            <h2>移動平均ROIC 計算詳細</h2>
            <p className="roic-target-year">対象年度: {roicDetailModal.yearPeriod}末</p>
            
            <div className="roic-formula-section">
              <h3>計算式</h3>
              <div className="roic-formula">
                移動平均ROIC = Σ(営業利益 × 移動平均計算用) ÷ Σ(有利子負債 + 株主資本) × 100
              </div>
            </div>

            <div className="roic-detail-section">
              <h3>各年度のデータ（過去最大5年）</h3>
              <table className="roic-detail-table">
                <thead>
                  <tr>
                    <th>年度</th>
                    <th>営業利益</th>
                    <th>×</th>
                    <th>移動平均計算用</th>
                    <th>=</th>
                    <th>分子部分</th>
                    <th>有利子負債</th>
                    <th>+</th>
                    <th>株主資本</th>
                    <th>=</th>
                    <th>分母部分</th>
                  </tr>
                </thead>
                <tbody>
                  {roicDetailModal.detail.targetYears.map((y) => (
                    <tr key={y.year_period}>
                      <td>{y.year_period}末</td>
                      <td>{y.operating_income.toLocaleString()}</td>
                      <td>×</td>
                      <td>{(y.roic_moving_avg_calc / 100).toFixed(4)}</td>
                      <td>=</td>
                      <td className="highlight">{y.numeratorPart.toLocaleString(undefined, { maximumFractionDigits: 2 })}</td>
                      <td>{y.interest_bearing_debt.toLocaleString()}</td>
                      <td>+</td>
                      <td>{y.shareholders_equity.toLocaleString()}</td>
                      <td>=</td>
                      <td className="highlight">{y.denominatorPart.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <td colSpan={5}><strong>合計</strong></td>
                    <td className="highlight"><strong>{roicDetailModal.detail.totalNumerator.toLocaleString(undefined, { maximumFractionDigits: 2 })}</strong></td>
                    <td colSpan={4}></td>
                    <td className="highlight"><strong>{roicDetailModal.detail.totalDenominator.toLocaleString()}</strong></td>
                  </tr>
                </tfoot>
              </table>
            </div>

            <div className="roic-calculation-section">
              <h3>最終計算</h3>
              <div className="roic-final-calc">
                <span>{roicDetailModal.detail.totalNumerator.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
                <span> ÷ </span>
                <span>{roicDetailModal.detail.totalDenominator.toLocaleString()}</span>
                <span> × 100 = </span>
                <strong>{roicDetailModal.detail.result.toFixed(2)}%</strong>
              </div>
            </div>

            <div className="modal-actions">
              <button className="btn-primary" onClick={() => setRoicDetailModal(null)}>閉じる</button>
            </div>
          </div>
        </div>
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
  const [searchQuery, setSearchQuery] = useState('');

  // 検索クエリで企業をフィルタ
  const filteredCompanies = companies.filter((company) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    const nameMatch = company.name.toLowerCase().includes(query);
    const tickerMatch = company.ticker?.toLowerCase().includes(query);
    return nameMatch || tickerMatch;
  });

  return (
    <div className="company-list">
      <div className="section-header">
        <h2>企業一覧</h2>
        <button className="btn-primary" onClick={onAdd}>+ 企業を追加</button>
      </div>

      {/* 検索バー */}
      <div className="search-bar">
        <input
          type="text"
          className="search-input"
          placeholder="🔍 企業名または証券コードで検索..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          maxLength={50}
        />
        {searchQuery && (
          <button className="search-clear" onClick={() => setSearchQuery('')}>
            ✕
          </button>
        )}
      </div>
      
      {companies.length === 0 ? (
        <div className="empty-state">
          <p>まだ企業が登録されていません</p>
          <button className="btn-primary" onClick={onAdd}>最初の企業を登録</button>
        </div>
      ) : filteredCompanies.length === 0 ? (
        <div className="empty-state">
          <p>一致する企業が見つかりません</p>
        </div>
      ) : (
        <div className="company-grid">
          {filteredCompanies.map((company) => (
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

// 移動平均ROIC計算詳細の型
interface RoicCalcDetail {
  targetYears: {
    year_period: string;
    operating_income: number;
    roic_moving_avg_calc: number;
    interest_bearing_debt: number;
    shareholders_equity: number;
    numeratorPart: number;
    denominatorPart: number;
  }[];
  totalNumerator: number;
  totalDenominator: number;
  result: number;
}

// 移動平均ROIC計算詳細を取得する関数
function getRoicMovingAvgDetail(data: FinancialData, allFinancials: FinancialData[]): RoicCalcDetail | null {
  if (!data.year_period) return null;
  
  const sortedAll = [...allFinancials].sort((a, b) => a.year_period.localeCompare(b.year_period));
  const currentIndex = sortedAll.findIndex(f => f.year_period === data.year_period);
  
  if (currentIndex < 0) return null;
  
  const startIndex = Math.max(0, currentIndex - 4);
  const targetData = sortedAll.slice(startIndex, currentIndex + 1);
  
  // 必要なデータがあるものをフィルタ（roic_moving_avg_calcは固定値76.80%を使用）
  const validData = targetData.filter(f => 
    f.operating_income !== undefined &&
    f.interest_bearing_debt !== undefined &&
    f.shareholders_equity !== undefined
  );
  
  if (validData.length === 0) return null;
  
  const targetYears = validData.map(f => {
    const roicCalc = f.roic_moving_avg_calc ?? 76.80; // デフォルト値
    return {
      year_period: f.year_period,
      operating_income: f.operating_income!,
      roic_moving_avg_calc: roicCalc,
      interest_bearing_debt: f.interest_bearing_debt!,
      shareholders_equity: f.shareholders_equity!,
      numeratorPart: f.operating_income! * (roicCalc / 100),
      denominatorPart: f.interest_bearing_debt! + f.shareholders_equity!,
    };
  });
  
  const totalNumerator = targetYears.reduce((sum, y) => sum + y.numeratorPart, 0);
  const totalDenominator = targetYears.reduce((sum, y) => sum + y.denominatorPart, 0);
  const result = totalDenominator !== 0 ? (totalNumerator / totalDenominator) * 100 : 0;
  
  return {
    targetYears,
    totalNumerator,
    totalDenominator,
    result,
  };
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
  'roic_moving_avg',
  'interest_rate',
  'equity_cost',
  'theoretical_discount_rate',
  'per',
  'pbr',
  'revenue_growth_yoy',
  'profit_growth_yoy',
];

// 計算式の定義
const calculationFormulas: Record<string, string> = {
  equity_ratio: '純資産 ÷ 総資産 × 100',
  net_profit_margin: '当期純利益 ÷ 売上高 × 100',
  operating_profit_margin: '営業利益 ÷ 売上高 × 100',
  current_business_value: '営業利益 ÷ 発行株式数 × 10000',
  current_asset_value: '(流動資産 - 流動負債×1.2 + 投資その他の財産 - 固定負債) ÷ 発行株式数 × 1000',
  current_theoretical_stock_price: '現状事業価値 + 現状資産価値',
  margin_of_safety_current: '現状理論株価 - 期末株価',
  safety_ratio_current: '安全域 ÷ 期末株価 × 100',
  free_cash_flow: '営業CF + 投資CF',
  roe: '当期純利益 ÷ 純資産 × 100',
  roa: '当期純利益 ÷ 総資産 × 100',
  roic: '営業利益 × (1 - 実効税率) ÷ (有利子負債 + 株主資本) × 100',
  roic_moving_avg_calc: '固定値: 76.80%',
  roic_moving_avg: 'Σ(営業利益×移動平均計算用) ÷ Σ(有利子負債+株主資本) × 100 [過去最大5年]',
  interest_rate: '支払利息 ÷ 有利子負債 × 100',
  equity_cost: '0.04 + β値 × 5.46',
  theoretical_discount_rate: '(1 - 自己資本比率) × 負債調達コスト + 自己資本比率 × 資本調達コスト',
  per: '(期末株価 × 発行株式数) ÷ (当期純利益 × 1000)',
  pbr: '(期末株価 × 発行株式数) ÷ (純資産 × 1000)',
  revenue_growth_yoy: '(当年度売上高 ÷ 前年度売上高) - 1',
  profit_growth_yoy: '(当年度純利益 ÷ 前年度純利益) - 1',
};

// 小数点以下2桁に丸める（3桁目で四捨五入）
function roundToTwo(num: number): number {
  return Math.round(num * 100) / 100;
}

// 自動計算ロジック
function calculateAutoFields(data: FinancialData, allFinancials?: FinancialData[]): FinancialData {
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
  
  // 現状事業価値（一株あたりの営業利益×10）
  if (data.operating_income !== undefined && data.shares_outstanding !== undefined && data.shares_outstanding !== 0) {
    updated.current_business_value = Math.round((data.operating_income * 10000) / data.shares_outstanding);
  } else {
    updated.current_business_value = undefined;
  }
  
  // 現状資産価値
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
  
  // 現状理論株価
  if (updated.current_business_value !== undefined && updated.current_asset_value !== undefined) {
    updated.current_theoretical_stock_price = Math.round(updated.current_business_value + updated.current_asset_value);
  } else {
    updated.current_theoretical_stock_price = undefined;
  }
  
  // 安全域(現状)
  if (updated.current_theoretical_stock_price !== undefined && data.stock_price_end !== undefined && data.stock_price_end > 0) {
    updated.margin_of_safety_current = Math.round(updated.current_theoretical_stock_price - data.stock_price_end);
  } else {
    updated.margin_of_safety_current = undefined;
  }
  
  // 安全率(現状)
  if (updated.margin_of_safety_current !== undefined && data.stock_price_end !== undefined && data.stock_price_end > 0) {
    updated.safety_ratio_current = roundToTwo((updated.margin_of_safety_current / data.stock_price_end) * 100);
  } else {
    updated.safety_ratio_current = undefined;
  }
  
  // FCF = 営業CF + 投資CF
  if (data.operating_cf !== undefined && data.investing_cf !== undefined) {
    updated.free_cash_flow = roundToTwo(data.operating_cf + data.investing_cf);
  } else {
    updated.free_cash_flow = undefined;
  }
  
  // ROE
  if (data.net_income !== undefined && data.net_assets !== undefined && data.net_assets !== 0) {
    updated.roe = roundToTwo((data.net_income / data.net_assets) * 100);
  } else {
    updated.roe = undefined;
  }
  
  // ROA
  if (data.net_income !== undefined && data.total_assets !== undefined && data.total_assets !== 0) {
    updated.roa = roundToTwo((data.net_income / data.total_assets) * 100);
  } else {
    updated.roa = undefined;
  }
  
  // ROIC
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
  
  // 移動平均計算用
  updated.roic_moving_avg_calc = 76.80;
  
  // 移動平均ROIC（過去最大5年間）
  if (allFinancials && data.year_period) {
    // 年期でソート（古い順）
    const sortedAll = [...allFinancials].sort((a, b) => a.year_period.localeCompare(b.year_period));
    
    // 現在のデータのインデックスを取得
    const currentIndex = sortedAll.findIndex(f => f.year_period === data.year_period);
    
    if (currentIndex >= 0) {
      // 過去最大5年分のデータを取得（自分を含む）
      const startIndex = Math.max(0, currentIndex - 4);
      const targetData = sortedAll.slice(startIndex, currentIndex + 1);
      
      // 有効なデータのみでフィルタリング
      const validData = targetData.filter(f => 
        f.operating_income !== undefined &&
        f.roic_moving_avg_calc !== undefined &&
        f.interest_bearing_debt !== undefined &&
        f.shareholders_equity !== undefined
      );
      
      if (validData.length > 0) {
        // 分子: Σ(営業利益 × 移動平均計算用)
        // 移動平均計算用は%なので/100して使う
        const numerator = validData.reduce((sum, f) => {
          return sum + (f.operating_income! * (f.roic_moving_avg_calc! / 100));
        }, 0);
        
        // 分母: Σ(有利子負債 + 株主資本)
        const denominator = validData.reduce((sum, f) => {
          return sum + (f.interest_bearing_debt! + f.shareholders_equity!);
        }, 0);
        
        if (denominator !== 0) {
          updated.roic_moving_avg = roundToTwo((numerator / denominator) * 100);
        } else {
          updated.roic_moving_avg = undefined;
        }
      } else {
        updated.roic_moving_avg = undefined;
      }
    } else {
      updated.roic_moving_avg = undefined;
    }
  } else {
    updated.roic_moving_avg = undefined;
  }
  
  // 支払利息率
  if (data.interest_expense !== undefined && data.interest_bearing_debt !== undefined && data.interest_bearing_debt !== 0) {
    updated.interest_rate = roundToTwo((data.interest_expense / data.interest_bearing_debt) * 100);
  } else {
    updated.interest_rate = undefined;
  }
  
  // 資本調達コスト
  if (data.beta !== undefined) {
    updated.equity_cost = roundToTwo(0.04 + data.beta * 5.46);
  } else {
    updated.equity_cost = undefined;
  }
  
  // 理論割引率
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
  
  // PER
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
  
  // PBR
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
  
  // 前年比売上成長率・前年比利益成長率
  if (allFinancials && data.year_period) {
    const sortedAll = [...allFinancials].sort((a, b) => a.year_period.localeCompare(b.year_period));
    const currentIndex = sortedAll.findIndex(f => f.year_period === data.year_period);
    
    if (currentIndex > 0) {
      const prevData = sortedAll[currentIndex - 1];
      
      // 前年比売上成長率 = (当年度売上高 / 前年度売上高) - 1
      // 前年度がマイナスで今年度がプラスの場合は符号を反転
      if (data.revenue !== undefined && prevData.revenue !== undefined && prevData.revenue !== 0) {
        let growthRate = ((data.revenue / prevData.revenue) - 1) * 100;
        if (prevData.revenue < 0 && data.revenue > 0) {
          growthRate = Math.abs(growthRate);
        }
        updated.revenue_growth_yoy = roundToTwo(growthRate);
      } else {
        updated.revenue_growth_yoy = undefined;
      }
      
      // 前年比利益成長率 = (当年度純利益 / 前年度純利益) - 1
      // 前年度がマイナスで今年度がプラスの場合は符号を反転
      if (data.net_income !== undefined && prevData.net_income !== undefined && prevData.net_income !== 0) {
        let growthRate = ((data.net_income / prevData.net_income) - 1) * 100;
        if (prevData.net_income < 0 && data.net_income > 0) {
          growthRate = Math.abs(growthRate);
        }
        updated.profit_growth_yoy = roundToTwo(growthRate);
      } else {
        updated.profit_growth_yoy = undefined;
      }
    } else {
      // 前年度データがない場合
      updated.revenue_growth_yoy = undefined;
      updated.profit_growth_yoy = undefined;
    }
  } else {
    updated.revenue_growth_yoy = undefined;
    updated.profit_growth_yoy = undefined;
  }
  
  return updated;
}

// 企業詳細コンポーネント
function CompanyDetail({
  company,
  onBack,
  onUpdate,
  onEditCompany,
  showToast,
  onShowRoicDetail,
}: {
  company: CompanyWithFinancials;
  onBack: () => void;
  onUpdate: (company: CompanyWithFinancials) => void;
  onEditCompany: () => void;
  showToast: (message: string, type: 'success' | 'error') => void;
  onShowRoicDetail: (yearPeriod: string, detail: RoicCalcDetail) => void;
}) {
  // 全データに対して自動計算を実行（移動平均ROIC等のため）
  const recalculateAll = (financials: FinancialData[]): FinancialData[] => {
    return financials.map(f => calculateAutoFields(f, financials));
  };
  
  const [localFinancials, setLocalFinancials] = useState<FinancialData[]>(
    recalculateAll(company.financials)
  );
  // 年期でソート（古い順＝新しい年度が右側に来る）
  const sortedFinancials = [...localFinancials].sort((a, b) => 
    a.year_period.localeCompare(b.year_period)
  );

  const handleAddYear = async () => {
    // 既存の最新年度より1年後を設定（右側に追加される）
    let newYearPeriod: string;
    if (sortedFinancials.length > 0) {
      const latestPeriod = sortedFinancials[sortedFinancials.length - 1].year_period; // 古い順ソートなので末尾が最新
      const match = latestPeriod.match(/^(\d{4})-(\d{2})$/);
      if (match) {
        const nextYear = parseInt(match[1]) + 1;
        newYearPeriod = `${nextYear}-${match[2]}`;
      } else {
        const currentYear = new Date().getFullYear();
        const currentMonth = String(new Date().getMonth() + 1).padStart(2, '0');
        newYearPeriod = `${currentYear}-${currentMonth}`;
      }
    } else {
      const currentYear = new Date().getFullYear();
      const currentMonth = String(new Date().getMonth() + 1).padStart(2, '0');
      newYearPeriod = `${currentYear}-${currentMonth}`;
    }
    
    try {
      const newFinancial = await api.createFinancial(company.id!, { year_period: newYearPeriod });
      const updatedFinancials = recalculateAll([...localFinancials, newFinancial]);
      setLocalFinancials(updatedFinancials);
      onUpdate({ ...company, financials: updatedFinancials });
      showToast('年度を追加しました', 'success');
    } catch {
      showToast('追加に失敗しました', 'error');
    }
  };

  const handleDeleteYear = async (financialId: string) => {
    if (!confirm('この年度のデータを削除しますか？')) return;
    try {
      await api.deleteFinancial(company.id!, financialId);
      const newFinancials = localFinancials.filter(f => f.id !== financialId);
      setLocalFinancials(newFinancials);
      onUpdate({ ...company, financials: newFinancials });
      showToast('削除しました', 'success');
    } catch {
      showToast('削除に失敗しました', 'error');
    }
  };

  // 入力中のフィールドを追跡するstate
  const [editingCell, setEditingCell] = useState<{ id: string; key: string; value: string } | null>(null);

  const handleCellChange = useCallback((financialId: string, key: string, value: string) => {
    // 入力中の値を追跡（ピリオドで終わる場合など、parseFloatで失われる情報を保持）
    if (value.endsWith('.') || value.endsWith('-') || value === '-' || value.match(/\.\d*0$/)) {
      setEditingCell({ id: financialId, key, value });
    } else {
      setEditingCell(null);
    }

    setLocalFinancials(prev => {
      const updated = prev.map(f => {
        if (f.id !== financialId) return f;
        
        let newData: FinancialData;
        if (key === 'year_period' || key === 'comment') {
          newData = { ...f, [key]: value };
        } else if (key === 'stock_price_end_unlisted') {
          // 非上場チェックボックス
          newData = { ...f, stock_price_end: value === 'true' ? -1 : undefined };
        } else {
          // 入力中は文字列のまま保持し、フォーカスが外れた時にparseFloat
          const numValue = value === '' ? undefined : parseFloat(value);
          newData = { ...f, [key]: isNaN(numValue as number) ? undefined : numValue };
        }
        return newData;
      });
      // 全データを再計算（移動平均ROIC等のため）
      return updated.map(f => calculateAutoFields(f, updated));
    });
  }, []);

  // フォーカスが外れた時に自動保存
  const handleAutoSave = useCallback(async () => {
    setEditingCell(null);
    try {
      for (const financial of localFinancials) {
        if (financial.id) {
          await api.updateFinancial(company.id!, financial.id, financial);
        }
      }
      onUpdate({ ...company, financials: localFinancials });
    } catch {
      showToast('自動保存に失敗しました', 'error');
    }
  }, [localFinancials, company, onUpdate]);

  return (
    <div className="company-detail">
      <button className="back-btn" onClick={onBack}>← 一覧に戻る</button>
      
      <div className="company-header">
        <div>
          <div className="company-title-row">
            <h2>{company.name}</h2>
            <button className="edit-company-btn" onClick={onEditCompany} title="企業情報を編集">
              ✏️
            </button>
            <div className="header-actions">
              <button className="btn-primary" onClick={handleAddYear}>+ 年度を追加</button>
            </div>
          </div>
          <div className="company-meta">
            {company.ticker && <span className="ticker">{company.ticker}</span>}
            {company.sector && <span className="tag">{company.sector}</span>}
            {company.market && <span className="tag">{company.market}</span>}
          </div>
          {company.description && <p className="description">{company.description}</p>}
          {company.financial_analysis && (
            <div className="financial-analysis">
              <h4>財務分析結果</h4>
              <p>{company.financial_analysis}</p>
            </div>
          )}
        </div>
      </div>

      <div className="financials-section">
        <h3>財務データ</h3>
        <div className="financials-table-container">
          <table className="financials-table editable">
            <thead>
              <tr>
                <th className="sticky-col">年期</th>
                {sortedFinancials.map((f) => (
                  <th key={f.id}>
                    <input
                      type="month"
                      className="year-input"
                      value={f.year_period || ''}
                      onChange={(e) => handleCellChange(f.id!, 'year_period', e.target.value)}
                      onBlur={handleAutoSave}
                    />
                    <span className="year-suffix">末</span>
                    <button 
                      className="delete-year-btn"
                      onClick={() => handleDeleteYear(f.id!)}
                      title="この年度を削除"
                    >
                      ×
                    </button>
                  </th>
                ))}
                {sortedFinancials.length === 0 && (
                  <th className="empty-col">
                    <span>年度を追加してください</span>
                  </th>
                )}
              </tr>
            </thead>
            <tbody>
              {financialFields.filter(f => f.key !== 'year_period').map((field) => (
                <tr key={field.key} className={`${autoCalculatedFields.includes(field.key) ? 'auto-calc-row' : ''} ${field.key === 'roic' || field.key === 'roic_moving_avg' ? 'roic-highlight' : ''}`}>
                  <td className="sticky-col">
                    {field.label}
                    {field.unit && <span className="field-unit">({field.unit})</span>}
                  </td>
                  {sortedFinancials.map((f) => (
                    <td key={f.id}>
                      {field.key === 'roic_moving_avg' ? (
                        <button 
                          type="button"
                          className="auto-value roic-clickable" 
                          data-formula={calculationFormulas[field.key] || ''}
                          onClick={() => {
                            const detail = getRoicMovingAvgDetail(f, localFinancials);
                            if (detail) {
                              onShowRoicDetail(f.year_period, detail);
                            } else {
                              alert('計算に必要なデータが不足しています（営業利益、有利子負債、株主資本が必要です）');
                            }
                          }}
                        >
                          <span className="auto-value-number">
                            {formatValue(f[field.key as keyof FinancialData], field.unit)}
                          </span>
                          <span className="auto-value-badge">クリックで詳細</span>
                        </button>
                      ) : autoCalculatedFields.includes(field.key) ? (
                        <div className="auto-value" data-formula={calculationFormulas[field.key] || ''}>
                          <span className="auto-value-number">
                            {formatValue(f[field.key as keyof FinancialData], field.unit)}
                          </span>
                          <span className="auto-value-badge">自動計算</span>
                        </div>
                      ) : field.key === 'stock_price_end' ? (
                        <div className="stock-cell">
                          <label className="unlisted-label">
                            <input
                              type="checkbox"
                              checked={f.stock_price_end === -1}
                              onChange={(e) => {
                                handleCellChange(f.id!, 'stock_price_end_unlisted', String(e.target.checked));
                                setTimeout(handleAutoSave, 100);
                              }}
                            />
                            <span>非上場</span>
                          </label>
                          {f.stock_price_end !== -1 && (
                            <input
                              type="text"
                              className="cell-input"
                              value={editingCell?.id === f.id && editingCell?.key === field.key ? editingCell.value : formatInputValue(f.stock_price_end)}
                              onChange={(e) => handleCellChange(f.id!, field.key, e.target.value.replace(/[^0-9.\-]/g, ''))}
                              onBlur={handleAutoSave}
                            />
                          )}
                        </div>
                      ) : field.key === 'comment' ? (
                        <textarea
                          className="cell-textarea"
                          value={f.comment || ''}
                          onChange={(e) => handleCellChange(f.id!, field.key, e.target.value)}
                          onBlur={handleAutoSave}
                        />
                      ) : (
                        <input
                          type="text"
                          className="cell-input"
                          value={editingCell?.id === f.id && editingCell?.key === field.key ? editingCell.value : formatInputValue(f[field.key as keyof FinancialData])}
                          onChange={(e) => handleCellChange(f.id!, field.key, e.target.value.replace(/[^0-9.\-]/g, ''))}
                          onBlur={handleAutoSave}
                        />
                      )}
                    </td>
                  ))}
                  {sortedFinancials.length === 0 && <td className="empty-col">-</td>}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* グラフセクション */}
      {sortedFinancials.length > 0 && (
        <div className="charts-section">
          <h3>推移グラフ</h3>
          
          {/* グラフ1: 売上・利益・FCF + 成長率 */}
          <div className="chart-container">
            <h4>売上・利益・FCF / 成長率</h4>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={sortedFinancials.map(f => ({
                name: f.year_period,
                売上高: f.revenue ?? null,
                当期純利益: f.net_income ?? null,
                営業利益: f.operating_income ?? null,
                FCF: f.free_cash_flow ?? null,
                前年比売上成長率: typeof f.revenue_growth_yoy === 'number' ? f.revenue_growth_yoy : null,
                前年比利益成長率: typeof f.profit_growth_yoy === 'number' ? f.profit_growth_yoy : null,
              }))}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis dataKey="name" stroke="#888" tick={{ fill: '#888', fontSize: 12 }} />
                <YAxis yAxisId="left" stroke="#888" tick={{ fill: '#888', fontSize: 12 }} tickFormatter={(v) => v.toLocaleString()} />
                <YAxis yAxisId="right" orientation="right" stroke="#90e0ef" tick={{ fill: '#90e0ef', fontSize: 12 }} domain={['auto', 'auto']} tickCount={6} tickFormatter={(v) => `${v}%`} />
                <Tooltip 
                  contentStyle={{ background: '#1a1a2e', border: '1px solid #333' }} 
                  formatter={(value: number, name: string) => {
                    if (name === '前年比売上成長率' || name === '前年比利益成長率') {
                      return [`${value?.toFixed(2)}%`, name];
                    }
                    return [`${value?.toLocaleString()} 百万円`, name];
                  }}
                />
                <Legend content={<CustomLegend leftAxisKeys={['売上高', '当期純利益', '営業利益', 'FCF']} />} />
                <Line yAxisId="left" type="monotone" dataKey="売上高" stroke="#00d4aa" strokeWidth={2} dot={{ fill: '#00d4aa' }} connectNulls />
                <Line yAxisId="left" type="monotone" dataKey="当期純利益" stroke="#00b4d8" strokeWidth={2} dot={{ fill: '#00b4d8' }} connectNulls />
                <Line yAxisId="left" type="monotone" dataKey="営業利益" stroke="#f72585" strokeWidth={2} dot={{ fill: '#f72585' }} connectNulls />
                <Line yAxisId="left" type="monotone" dataKey="FCF" stroke="#ffd60a" strokeWidth={2} dot={{ fill: '#ffd60a' }} connectNulls />
                <Line yAxisId="right" type="monotone" dataKey="前年比売上成長率" stroke="#90e0ef" strokeWidth={2} strokeDasharray="5 5" dot={{ fill: '#90e0ef' }} connectNulls />
                <Line yAxisId="right" type="monotone" dataKey="前年比利益成長率" stroke="#cdb4db" strokeWidth={2} strokeDasharray="5 5" dot={{ fill: '#cdb4db' }} connectNulls />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* グラフ2: ROIC・ROE + PER・PBR */}
          <div className="chart-container">
            <h4>ROIC・ROE / PER・PBR</h4>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={sortedFinancials.map(f => ({
                name: f.year_period,
                ROIC: f.roic,
                ROE: f.roe,
                移動平均ROIC: f.roic_moving_avg,
                PER: f.per,
                PBR: f.pbr,
              }))}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis dataKey="name" stroke="#888" tick={{ fill: '#888', fontSize: 12 }} />
                <YAxis yAxisId="left" stroke="#888" tick={{ fill: '#888', fontSize: 12 }} unit="%" />
                <YAxis yAxisId="right" orientation="right" stroke="#888" tick={{ fill: '#888', fontSize: 12 }} unit="倍" />
                <Tooltip 
                  contentStyle={{ background: '#1a1a2e', border: '1px solid #333' }} 
                  formatter={(value: number, name: string) => {
                    if (name === 'PER' || name === 'PBR') {
                      return [`${value?.toFixed(2)} 倍`, name];
                    }
                    return [`${value?.toFixed(2)}%`, name];
                  }}
                />
                <Legend content={<CustomLegend leftAxisKeys={['ROIC', '移動平均ROIC', 'ROE']} />} />
                <Line yAxisId="left" type="monotone" dataKey="ROIC" stroke="#00d4aa" strokeWidth={2} dot={{ fill: '#00d4aa' }} />
                <Line yAxisId="left" type="monotone" dataKey="移動平均ROIC" stroke="#00ffaa" strokeWidth={3} dot={{ fill: '#00ffaa' }} />
                <Line yAxisId="left" type="monotone" dataKey="ROE" stroke="#00b4d8" strokeWidth={2} dot={{ fill: '#00b4d8' }} />
                <Line yAxisId="right" type="monotone" dataKey="PER" stroke="#f72585" strokeWidth={2} strokeDasharray="5 5" dot={{ fill: '#f72585' }} />
                <Line yAxisId="right" type="monotone" dataKey="PBR" stroke="#ffd60a" strokeWidth={2} strokeDasharray="5 5" dot={{ fill: '#ffd60a' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* グラフ3: 理論株価・期末株価 + 安全率 */}
          <div className="chart-container">
            <h4>理論株価・期末株価 / 安全率</h4>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={sortedFinancials.map(f => ({
                name: f.year_period,
                現状理論株価: f.current_theoretical_stock_price,
                期末株価: f.stock_price_end && f.stock_price_end > 0 ? f.stock_price_end : null,
                安全率: f.safety_ratio_current,
              }))}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis dataKey="name" stroke="#888" tick={{ fill: '#888', fontSize: 12 }} />
                <YAxis yAxisId="left" stroke="#888" tick={{ fill: '#888', fontSize: 12 }} unit="円" />
                <YAxis yAxisId="right" orientation="right" stroke="#888" tick={{ fill: '#888', fontSize: 12 }} unit="%" />
                <Tooltip 
                  contentStyle={{ background: '#1a1a2e', border: '1px solid #333' }} 
                  formatter={(value: number, name: string) => {
                    if (name === '安全率') {
                      return [`${value?.toFixed(2)}%`, name];
                    }
                    return [`${value?.toLocaleString()} 円`, name];
                  }}
                />
                <Legend content={<CustomLegend leftAxisKeys={['現状理論株価', '期末株価']} />} />
                <Line yAxisId="left" type="monotone" dataKey="現状理論株価" stroke="#00d4aa" strokeWidth={2} dot={{ fill: '#00d4aa' }} />
                <Line yAxisId="left" type="monotone" dataKey="期末株価" stroke="#f72585" strokeWidth={2} dot={{ fill: '#f72585' }} />
                <Line yAxisId="right" type="monotone" dataKey="安全率" stroke="#ffd60a" strokeWidth={2} strokeDasharray="5 5" dot={{ fill: '#ffd60a' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}

// 入力フィールド用のフォーマット（3桁ごとにコンマ）
function formatInputValue(value: unknown): string {
  if (value === null || value === undefined || value === '') return '';
  if (typeof value === 'number') {
    if (isNaN(value) || !isFinite(value)) return '';
    return value.toLocaleString();
  }
  return String(value);
}

function formatValue(value: unknown, unit?: string): string {
  if (value === null || value === undefined || value === '') return '-';
  if (typeof value === 'string') return value;
  if (typeof value === 'number') {
    if (isNaN(value) || !isFinite(value)) return 'データ無し';
    if (unit === '%' || unit === '倍') {
      return value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }
    return value.toLocaleString();
  }
  return String(value);
}

export default App;
