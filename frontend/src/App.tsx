import { useEffect, useState } from 'react';
import { api } from './api/client';
import type { Company, CompanyWithFinancials, FinancialData } from './types';
import { financialFields } from './types';
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
                      {f.year_period}
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
    initialData || { year_period: '' }
  );

  const handleChange = (key: string, value: string) => {
    if (key === 'year_period' || key === 'comment') {
      setFormData({ ...formData, [key]: value });
    } else {
      setFormData({ ...formData, [key]: value === '' ? undefined : parseFloat(value) });
    }
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
                  <div key={field.key} className="form-group">
                    <label>
                      {field.label}
                      {field.unit && <span className="unit">({field.unit})</span>}
                    </label>
                    {field.key === 'comment' ? (
                      <textarea
                        value={formData[field.key] || ''}
                        onChange={(e) => handleChange(field.key, e.target.value)}
                      />
                    ) : (
                      <input
                        type={field.key === 'year_period' ? 'text' : 'number'}
                        step="any"
                        value={formData[field.key as keyof FinancialData] ?? ''}
                        onChange={(e) => handleChange(field.key, e.target.value)}
                        placeholder={field.key === 'year_period' ? '例: 2024/03' : ''}
                        required={field.key === 'year_period'}
                      />
                    )}
                  </div>
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
