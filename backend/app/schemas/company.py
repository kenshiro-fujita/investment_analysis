from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime


class FinancialData(BaseModel):
    """年度ごとの財務データ"""
    id: Optional[str] = None
    year_period: str  # 年期 (例: "2024/03", "2023/03")
    
    # 損益計算書
    revenue: Optional[float] = None  # 売上高
    net_income: Optional[float] = None  # 当期純利益
    operating_income: Optional[float] = None  # 営業利益
    interest_expense: Optional[float] = None  # 支払利息
    
    # 貸借対照表
    cash_and_equivalents: Optional[float] = None  # 現金及び等価物
    current_assets: Optional[float] = None  # 流動資産
    investments_and_other_assets: Optional[float] = None  # 投資その他の資産
    current_liabilities: Optional[float] = None  # 流動負債
    fixed_liabilities: Optional[float] = None  # 固定負債
    interest_bearing_debt: Optional[float] = None  # 有利子負債
    shareholders_equity: Optional[float] = None  # 株主資本
    net_assets: Optional[float] = None  # 純資産
    total_assets: Optional[float] = None  # 総資産
    
    # 株式情報
    shares_outstanding: Optional[float] = None  # 発行株式数
    stock_price_end: Optional[float] = None  # 期末株価
    
    # 財務指標（入力 or 自動計算）
    equity_ratio: Optional[float] = None  # 自己資本比率
    net_profit_margin: Optional[float] = None  # 売上純利益率
    operating_profit_margin: Optional[float] = None  # 売上営業利益率
    
    # バリュエーション
    current_business_value: Optional[float] = None  # 現状事業価値
    current_asset_value: Optional[float] = None  # 現状資産価値
    current_theoretical_stock_price: Optional[float] = None  # 現状理論株価
    margin_of_safety_current: Optional[float] = None  # 安全域(現状)
    safety_ratio_current: Optional[float] = None  # 安全率(現状)
    
    # 成長率
    revenue_growth_yoy: Optional[float] = None  # 前年比売上成長率
    profit_growth_yoy: Optional[float] = None  # 前年比利益成長率
    
    # キャッシュフロー
    operating_cf: Optional[float] = None  # 営業CF
    investing_cf: Optional[float] = None  # 投資CF
    free_cash_flow: Optional[float] = None  # FCF
    
    # その他指標
    effective_tax_rate: Optional[float] = None  # 実効税率
    roe: Optional[float] = None  # ROE
    roa: Optional[float] = None  # ROA
    roic: Optional[float] = None  # ROIC
    roic_moving_avg_calc: Optional[float] = None  # 移動平均計算用
    roic_moving_avg: Optional[float] = None  # 移動平均ROIC
    
    # 資本コスト関連
    interest_rate: Optional[float] = None  # 支払利息率
    debt_cost: Optional[float] = None  # 負債調達コスト
    beta: Optional[float] = None  # β値
    equity_cost: Optional[float] = None  # 資本調達コスト
    theoretical_discount_rate: Optional[float] = None  # 理論割引率
    
    # バリュエーション指標
    per: Optional[float] = None  # PER
    pbr: Optional[float] = None  # PBR
    
    # メモ
    comment: Optional[str] = None  # コメント


class Company(BaseModel):
    """企業情報"""
    id: Optional[str] = None
    name: str  # 企業名
    ticker: Optional[str] = None  # 銘柄コード
    sector: Optional[str] = None  # セクター
    market: Optional[str] = None  # 市場（東証プライム等）
    description: Optional[str] = None  # 概要
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None


class CompanyWithFinancials(Company):
    """財務データを含む企業情報"""
    financials: List[FinancialData] = []


class CompanyCreate(BaseModel):
    """企業作成リクエスト"""
    name: str
    ticker: Optional[str] = None
    sector: Optional[str] = None
    market: Optional[str] = None
    description: Optional[str] = None


class FinancialDataCreate(BaseModel):
    """財務データ作成リクエスト"""
    year_period: str
    revenue: Optional[float] = None
    net_income: Optional[float] = None
    operating_income: Optional[float] = None
    interest_expense: Optional[float] = None
    cash_and_equivalents: Optional[float] = None
    current_assets: Optional[float] = None
    investments_and_other_assets: Optional[float] = None
    current_liabilities: Optional[float] = None
    fixed_liabilities: Optional[float] = None
    interest_bearing_debt: Optional[float] = None
    shareholders_equity: Optional[float] = None
    net_assets: Optional[float] = None
    total_assets: Optional[float] = None
    shares_outstanding: Optional[float] = None
    stock_price_end: Optional[float] = None
    equity_ratio: Optional[float] = None
    net_profit_margin: Optional[float] = None
    operating_profit_margin: Optional[float] = None
    current_business_value: Optional[float] = None
    current_asset_value: Optional[float] = None
    current_theoretical_stock_price: Optional[float] = None
    margin_of_safety_current: Optional[float] = None
    safety_ratio_current: Optional[float] = None
    revenue_growth_yoy: Optional[float] = None
    profit_growth_yoy: Optional[float] = None
    operating_cf: Optional[float] = None
    investing_cf: Optional[float] = None
    free_cash_flow: Optional[float] = None
    effective_tax_rate: Optional[float] = None
    roe: Optional[float] = None
    roa: Optional[float] = None
    roic: Optional[float] = None
    roic_moving_avg_calc: Optional[float] = None
    roic_moving_avg: Optional[float] = None
    interest_rate: Optional[float] = None
    debt_cost: Optional[float] = None
    beta: Optional[float] = None
    equity_cost: Optional[float] = None
    theoretical_discount_rate: Optional[float] = None
    per: Optional[float] = None
    pbr: Optional[float] = None
    comment: Optional[str] = None

