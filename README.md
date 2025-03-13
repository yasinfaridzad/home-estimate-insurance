# HomeScan Insurance Estimator

A Next.js application that uses computer vision to scan household items and estimate their insurance value.

## Features

- Item recognition using TensorFlow.js
- Real-time camera scanning
- Insurance value estimation
- PDF report generation
- User authentication with Google
- Responsive design with Tailwind CSS

## Setup

1. Clone the repository:
```bash
git clone https://github.com/yasinfaridzad/home-estimate-insurance.git
cd home-estimate-insurance
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file with the following variables:
```
DATABASE_URL="file:./dev.db"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key"
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
```

4. Run the development server:
```bash
npm run dev
```

5. Open [http://localhost:3010](http://localhost:3010) in your browser.

## Technologies Used

- Next.js 14
- TypeScript
- TensorFlow.js
- NextAuth.js
- Tailwind CSS
- Prisma
- PDFKit 
