# 中元普渡報名表

## 部署到 Render

1. **準備 Git 儲存庫**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   ```

2. **推送到 GitHub**
   - 在 GitHub 建立新儲存庫
   ```bash
   git remote add origin https://github.com/你的帳號/儲存庫名.git
   git branch -M main
   git push -u origin main
   ```

3. **在 Render 部署**
   - 前往 [render.com](https://render.com)
   - 點擊 "New +" → "Web Service"
   - 連接 GitHub 儲存庫
   - Render 會自動偵測到 `render.yaml` 設定

4. **設定環境變數**
   - 在 Render Dashboard 設定 `RAGIC_API_KEY`
   - 確保值與你的 `.env.local` 相同

## 環境變數

| 變數名稱 | 說明 | 必要 |
|---------|------|------|
| `RAGIC_API_KEY` | Ragic API 金鑰 | 是 |

## 技術棧

- **框架**: Next.js 14
- **語言**: TypeScript
- **樣式**: Tailwind CSS
- **部署**: Render
