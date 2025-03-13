# Start the Python backend server
Start-Process python -ArgumentList "backend/detector.py" -NoNewWindow

# Start the Next.js frontend server
npm run dev 