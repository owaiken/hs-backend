# 🧠 HypeBot Runner (Puppeteer + Supabase)

This is the backend automation engine for the Hypebeast Drop Bot platform.

It polls tasks from Supabase, runs headless browser sessions using Puppeteer, checks for product availability, and auto-checks out limited-edition items. Task statuses and purchases are synced back to Supabase for real-time updates on the Lovable.dev frontend.

---

## 🚀 Features

- ✅ Polls `tasks` table every 30s
- ✅ Launches Puppeteer sessions with stealth mode
- ✅ Updates task status: `pending → running → success/failed`
- ✅ Logs purchase results in `purchases` table
- ✅ Designed to run on RunPod, Railway, or VPS

---

## 🛠 Setup

### 1. Clone the repo

```bash
git clone https://github.com/your-username/hypebot-runner.git
cd hypebot-runner
