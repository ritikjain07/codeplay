# CodePlay 🚀

A collaborative coding platform that allows multiple developers to work together in real-time with AI assistance.

## Features ✨

- **Real-time Collaboration**: Multiple developers can work on the same project simultaneously
- **AI Assistant**: Integrated AI help for coding assistance and debugging
- **Multiple Project Views**: 
  - Original: Full-featured interface
  - Improved: Better organized and modular
  - Simple: Clean and minimal interface
- **WebContainer Integration**: Run projects directly in the browser
- **File Management**: Create, edit, delete, and organize project files
- **Team Management**: Add collaborators and manage project access
- **Real-time Chat**: Communicate with team members while coding

## Tech Stack 🛠️

### Frontend
- **React 18** with Hooks
- **Tailwind CSS** for styling
- **React Router** for navigation
- **Axios** for HTTP requests
- **Socket.io** for real-time communication
- **WebContainer** for in-browser code execution
- **React Icons** for UI icons
- **Markdown** support for AI responses

### Backend
- **Node.js** with Express
- **MongoDB** with Mongoose
- **Socket.io** for real-time features
- **JWT** for authentication
- **bcrypt** for password hashing
- **Redis** for session management

## Project Structure 📁

```
codeplay/
├── backend/
│   ├── controllers/
│   ├── models/
│   ├── routes/
│   ├── services/
│   ├── middleware/
│   └── db/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── screens/
│   │   ├── context/
│   │   ├── config/
│   │   └── routes/
│   └── public/
└── README.md
```

## Setup Instructions 🔧

### Prerequisites
- Node.js (v16 or higher)
- MongoDB Atlas account
- Redis Cloud account (or local Redis)

### Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file with the following variables:
```env
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
REDIS_HOST=your_redis_host
REDIS_PORT=your_redis_port
REDIS_PASSWORD=your_redis_password
PORT=5000
```

4. Start the backend server:
```bash
npm start
```

### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file:
```env
VITE_API_URL=http://localhost:5000
```

4. Start the development server:
```bash
npm run dev
```

## Usage 🎯

1. **Register/Login**: Create an account or sign in
2. **Create Project**: Click "Create New Project" on the dashboard
3. **Choose View**: Select from Original, Improved, or Simple project interface
4. **Code Together**: Invite collaborators and start coding in real-time
5. **AI Assistance**: Use the chat feature to get AI help
6. **Run Projects**: Execute your code directly in the browser

## Project Views 👀

### Original View
- Full-featured interface with all capabilities
- Complex layout with multiple panels
- Advanced file management and settings

### Improved View
- Better organized component structure
- Cleaner UI with improved performance
- Modular design for easier maintenance

### Simple View
- Minimal, clean interface
- Tabbed sidebar (Files, Chat, Team)
- Focus on core functionality
- Perfect for beginners

## Contributing 🤝

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Environment Variables 🔐

### Backend
- `MONGODB_URI`: MongoDB connection string
- `JWT_SECRET`: Secret key for JWT tokens
- `REDIS_HOST`: Redis server host
- `REDIS_PORT`: Redis server port
- `REDIS_PASSWORD`: Redis server password
- `PORT`: Server port (default: 5000)

### Frontend
- `VITE_API_URL`: Backend API URL

## License 📄

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments 🙏

- Built with modern web technologies
- Inspired by collaborative coding platforms
- Special thanks to the open-source community

---

**Happy Coding!** 🎉