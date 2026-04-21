# Demo Setup

## Startup backend
cd startup-backend
source venv/bin/activate
python3 seed_demo_data.py
uvicorn app.main:app --reload

## Startup frontend
cd startup-frontend
npm run dev

## App URLs
Frontend: http://localhost:3000
Backend docs: http://localhost:8000/docs
Reporting: http://localhost:3000/reporting
