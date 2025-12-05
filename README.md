# Investment Analyzer 📊

企業の財務分析・投資管理ツール

## 機能

- 📝 企業の登録・管理
- 📈 財務データの入力・表示
- 💹 各種財務指標の管理

## 技術スタック

### フロントエンド
- React + TypeScript
- Vite

### バックエンド
- Python (FastAPI)
- JSON ファイルベースのデータ保存

## セットアップ

### バックエンド

```bash
cd backend

# 仮想環境を作成（推奨）
python3 -m venv venv
source venv/bin/activate

# 依存関係をインストール
pip install -r requirements.txt

# サーバーを起動
uvicorn app.main:app --reload --port 8080
```

バックエンドは http://localhost:8080 で起動します。

### フロントエンド

```bash
cd frontend
npm install
npm run dev
```

フロントエンドは http://localhost:5173 で起動します。

## API ドキュメント

サーバー起動後、以下でSwagger UIを確認できます：
- http://localhost:8080/docs

## 今後の予定

- [ ] 株価の自動取得（yfinance連携）
- [ ] チャート表示
- [ ] 投資履歴の記録
- [ ] ポートフォリオ管理

