from fastapi import APIRouter, HTTPException
from typing import List, Dict
import uuid
from datetime import datetime
import json
import os

from app.schemas.company import (
    Company, CompanyCreate, CompanyWithFinancials,
    FinancialData, FinancialDataCreate
)

router = APIRouter(prefix="/api/companies", tags=["companies"])

# データ保存用ファイルパス
DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "data")
COMPANIES_FILE = os.path.join(DATA_DIR, "companies.json")

# インメモリストレージ（永続化はJSONファイル）
companies_db: Dict[str, CompanyWithFinancials] = {}


def load_data():
    """JSONファイルからデータを読み込む"""
    global companies_db
    if os.path.exists(COMPANIES_FILE):
        with open(COMPANIES_FILE, "r", encoding="utf-8") as f:
            data = json.load(f)
            for company_id, company_data in data.items():
                companies_db[company_id] = CompanyWithFinancials(**company_data)


def save_data():
    """データをJSONファイルに保存"""
    os.makedirs(DATA_DIR, exist_ok=True)
    with open(COMPANIES_FILE, "w", encoding="utf-8") as f:
        data = {k: v.model_dump(mode="json") for k, v in companies_db.items()}
        json.dump(data, f, ensure_ascii=False, indent=2, default=str)


# 起動時にデータを読み込む
load_data()


@router.get("", response_model=List[Company])
async def list_companies():
    """企業一覧を取得"""
    return list(companies_db.values())


@router.post("", response_model=Company)
async def create_company(company: CompanyCreate):
    """新しい企業を作成"""
    company_id = str(uuid.uuid4())
    now = datetime.now()
    
    new_company = CompanyWithFinancials(
        id=company_id,
        name=company.name,
        ticker=company.ticker,
        sector=company.sector,
        market=company.market,
        description=company.description,
        created_at=now,
        updated_at=now,
        financials=[]
    )
    
    companies_db[company_id] = new_company
    save_data()
    
    return new_company


@router.get("/{company_id}", response_model=CompanyWithFinancials)
async def get_company(company_id: str):
    """企業詳細を取得（財務データ含む）"""
    if company_id not in companies_db:
        raise HTTPException(status_code=404, detail="Company not found")
    return companies_db[company_id]


@router.put("/{company_id}", response_model=Company)
async def update_company(company_id: str, company: CompanyCreate):
    """企業情報を更新"""
    if company_id not in companies_db:
        raise HTTPException(status_code=404, detail="Company not found")
    
    existing = companies_db[company_id]
    existing.name = company.name
    existing.ticker = company.ticker
    existing.sector = company.sector
    existing.market = company.market
    existing.description = company.description
    existing.updated_at = datetime.now()
    
    save_data()
    return existing


@router.delete("/{company_id}")
async def delete_company(company_id: str):
    """企業を削除"""
    if company_id not in companies_db:
        raise HTTPException(status_code=404, detail="Company not found")
    
    del companies_db[company_id]
    save_data()
    return {"message": "Company deleted"}


# 財務データ関連のエンドポイント

@router.get("/{company_id}/financials", response_model=List[FinancialData])
async def list_financials(company_id: str):
    """企業の財務データ一覧を取得"""
    if company_id not in companies_db:
        raise HTTPException(status_code=404, detail="Company not found")
    return companies_db[company_id].financials


@router.post("/{company_id}/financials", response_model=FinancialData)
async def create_financial(company_id: str, financial: FinancialDataCreate):
    """財務データを追加"""
    if company_id not in companies_db:
        raise HTTPException(status_code=404, detail="Company not found")
    
    financial_id = str(uuid.uuid4())
    
    new_financial = FinancialData(
        id=financial_id,
        **financial.model_dump()
    )
    
    companies_db[company_id].financials.append(new_financial)
    companies_db[company_id].updated_at = datetime.now()
    save_data()
    
    return new_financial


@router.put("/{company_id}/financials/{financial_id}", response_model=FinancialData)
async def update_financial(company_id: str, financial_id: str, financial: FinancialDataCreate):
    """財務データを更新"""
    if company_id not in companies_db:
        raise HTTPException(status_code=404, detail="Company not found")
    
    company = companies_db[company_id]
    for i, f in enumerate(company.financials):
        if f.id == financial_id:
            updated = FinancialData(id=financial_id, **financial.model_dump())
            company.financials[i] = updated
            company.updated_at = datetime.now()
            save_data()
            return updated
    
    raise HTTPException(status_code=404, detail="Financial data not found")


@router.delete("/{company_id}/financials/{financial_id}")
async def delete_financial(company_id: str, financial_id: str):
    """財務データを削除"""
    if company_id not in companies_db:
        raise HTTPException(status_code=404, detail="Company not found")
    
    company = companies_db[company_id]
    for i, f in enumerate(company.financials):
        if f.id == financial_id:
            company.financials.pop(i)
            company.updated_at = datetime.now()
            save_data()
            return {"message": "Financial data deleted"}
    
    raise HTTPException(status_code=404, detail="Financial data not found")

