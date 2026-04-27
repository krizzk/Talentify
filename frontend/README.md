This is a Next.js project bootstrapped with create-next-app.

## Getting Started

Install dependencies:

npm install

Set API base URL in .env.local:

NEXT_PUBLIC_API_URL=http://localhost:4000/api

Run the development server:

npm run dev

Open http://localhost:3000 with your browser.

The homepage will call NEXT_PUBLIC_API_URL + /health and show backend connection status.

## Notes

- In local development, backend runs on http://localhost:4000.
- In Docker + Nginx, use NEXT_PUBLIC_API_URL=/api so requests are proxied by Nginx.
