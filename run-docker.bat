@echo off
echo 🍃 Vilvom Application Docker Setup
echo ===================================

REM Check if Docker is running
docker info >nul 2>&1
if errorlevel 1 (
    echo ❌ Docker is not running. Please start Docker Desktop first.
    pause
    exit /b 1
)

echo ✅ Docker is running

REM Create backend .env if it doesn't exist
if not exist "backend\.env" (
    echo 📝 Creating backend/.env file...
    (
        echo # Database Configuration
        echo DATABASE_URL=mongodb+srv://mukilan:mukilan@cluster0.c5yb5jt.mongodb.net/?retryWrites=true^&w=majority^&appName=Cluster0
        echo DATABASE_NAME=vilvom_db
        echo.
        echo # JWT Configuration
        echo JWT_SECRET=vilvom-super-secure-jwt-secret-key-2024-change-in-production
        echo JWT_EXPIRES_IN=7d
        echo.
        echo # API Gateway Configuration
        echo API_GATEWAY_PORT=5000
        echo.
        echo # Environment
        echo NODE_ENV=development
        echo LOG_LEVEL=debug
    ) > "backend\.env"
    echo ⚠️  Please update backend/.env with your actual MongoDB credentials!
)

echo 🚀 Starting Vilvom services...
echo.
echo Services will be available at:
echo - Metro Bundler: http://localhost:8081
echo - Backend API: http://localhost:5000
echo - API Docs: http://localhost:5000/api/docs
echo - Tea Leaf Model: http://localhost:8000
echo - MongoDB: localhost:27017
echo.
echo Press Ctrl+C to stop all services
echo.

docker-compose up --build