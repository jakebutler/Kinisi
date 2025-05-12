# Kinisi - AI-Powered Exercise Program Generator

Kinisi is a mobile-responsive web application that builds personalized, adaptive exercise programs using user input and generative AI. The platform guides users through an intake survey, generates a personalized assessment, and creates a tailored exercise program with scheduling.

## Features

- User authentication (email/password)
- Intake survey with dynamic form generation
- AI-generated personalized assessments
- Custom exercise program generation
- Session scheduling with calendar integration
- Chat-based feedback for program refinement

## Tech Stack

- **Frontend**: Next.js 14 with TypeScript
- **Styling**: Tailwind CSS
- **Authentication**: Supabase Auth
- **Database**: Supabase PostgreSQL
- **AI/LLM**: OpenAI GPT-4
- **Deployment**: Netlify

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Supabase account
- OpenAI API key

### Local Development

1. Clone the repository:
   ```bash
   git clone https://github.com/jakebutler/Kinisi.git
   cd Kinisi/kinisi-app
   ```

2. Install dependencies:
   ```bash
   npm install
   # or
   yarn
   ```

3. Set up environment variables:
   Create a `.env.local` file in the root directory with:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. Run the development server:
   ```bash
   npm run dev
   # or
   yarn dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
kinisi-app/
├── app/                    # App Router
│   ├── login/              # Login page
│   ├── register/           # Registration page
│   ├── forgot-password/    # Password reset
│   └── dashboard/          # Protected dashboard
├── components/             # Reusable components
│   ├── context/            # React context providers
│   └── ui/                 # UI components
├── public/                 # Static files
└── utils/                  # Utility functions
```

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is private and confidential. Unauthorized copying, distribution, or modification is prohibited.