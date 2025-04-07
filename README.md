# Business Lead Management System

A modern web application for managing business leads with a clean, user-friendly interface.

## Features

- User authentication and authorization
- Business lead submission and management
- Advanced filtering and search capabilities
- Real-time status updates
- Responsive design
- Modern UI/UX

## Tech Stack

- React 18
- Vite
- Tailwind CSS
- React Router
- date-fns
- PropTypes

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/business-lead-management-system.git
cd business-lead-management-system
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the root directory:
```env
VITE_API_BASE_URL=http://127.0.0.1:8000/api
VITE_APP_NAME=Business Lead Management System
VITE_APP_VERSION=1.0.0
```

4. Start the development server:
```bash
npm run dev
```

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
- `npm run format` - Format code with Prettier
- `npm run test` - Run tests
- `npm run coverage` - Generate test coverage report

## Project Structure

```
src/
├── components/     # Reusable UI components
├── constants/      # Application constants
├── context/        # React context providers
├── hooks/          # Custom React hooks
├── pages/          # Page components
├── services/       # API services
├── utils/          # Utility functions
└── App.jsx         # Main application component
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- [React](https://reactjs.org/)
- [Vite](https://vitejs.dev/)
- [Tailwind CSS](https://tailwindcss.com/)
- [date-fns](https://date-fns.org/)
