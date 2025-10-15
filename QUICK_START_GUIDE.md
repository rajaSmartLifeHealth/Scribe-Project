# Quick Start Implementation Guide

This guide provides immediate, actionable steps to improve the backend, whether you choose Node.js improvements or Python migration.

## 🚀 Option 1: Improve Node.js Backend (Recommended for Quick Wins)

### Step 1: Fix Critical Bugs (30 minutes)

#### Fix 1: BlackToken Query Bug
**File:** `backend/middleware/auth.middleware.js`

**Change line 13:**
```javascript
// ❌ WRONG (MySQL syntax in MongoDB)
const blacklisted = await BlackTokenModel.findOne({ where: { blackToken: token } });

// ✅ CORRECT
const blacklisted = await BlackTokenModel.findOne({ blackToken: token });
```

#### Fix 2: Consistent JWT Secret
**File:** `backend/middleware/auth.middleware.js`

**Change line 19:**
```javascript
// ❌ WRONG (fallback secret is insecure)
const decoded = jwt.verify(token, process.env.JWT_SECRET || "masai");

// ✅ CORRECT
const decoded = jwt.verify(token, process.env.JWT_SECRET);
// Add error if JWT_SECRET is not set
if (!process.env.JWT_SECRET) {
  throw new Error("JWT_SECRET environment variable is not set");
}
```

#### Fix 3: Standardize Error Responses
**File:** `backend/utils/response.js` (create new file)

```javascript
// backend/utils/response.js
const successResponse = (res, data, message = "Success", statusCode = 200) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data
  });
};

const errorResponse = (res, message, statusCode = 500, errors = null) => {
  const response = {
    success: false,
    message
  };
  
  if (errors && process.env.NODE_ENV === 'development') {
    response.errors = errors;
  }
  
  return res.status(statusCode).json(response);
};

module.exports = { successResponse, errorResponse };
```

**Update routes to use it:**
```javascript
const { successResponse, errorResponse } = require('../utils/response');

// Example in user.routes.js
userRouter.post('/login', async(req, res) => {
  try {
    // ... login logic
    return successResponse(res, { token, user }, "Login successful");
  } catch (error) {
    return errorResponse(res, "Login failed", 401, error.message);
  }
});
```

### Step 2: Add Input Validation (1 hour)

#### Install Validator
```bash
cd backend
npm install express-validator
```

#### Create Validation Middleware
**File:** `backend/middleware/validation.middleware.js`

```javascript
const { body, validationResult } = require('express-validator');

const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors: errors.array()
    });
  }
  next();
};

// User validation rules
const registerValidation = [
  body('username')
    .trim()
    .isLength({ min: 3, max: 50 })
    .withMessage('Username must be 3-50 characters'),
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Invalid email address'),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain uppercase, lowercase, and number'),
  body('role')
    .isIn(['patient', 'clinician'])
    .withMessage('Role must be patient or clinician'),
  validateRequest
];

const loginValidation = [
  body('email').isEmail().withMessage('Invalid email'),
  body('password').notEmpty().withMessage('Password is required'),
  validateRequest
];

module.exports = {
  registerValidation,
  loginValidation,
  validateRequest
};
```

#### Update Routes
**File:** `backend/routes/user.routes.js`

```javascript
const { registerValidation, loginValidation } = require('../middleware/validation.middleware');

// Add validation middleware
userRouter.post('/register', registerValidation, async(req, res) => {
  // ... existing code
});

userRouter.post('/login', loginValidation, async(req, res) => {
  // ... existing code
});
```

### Step 3: Add API Documentation (2 hours)

#### Install Swagger
```bash
npm install swagger-jsdoc swagger-ui-express
```

#### Configure Swagger
**File:** `backend/config/swagger.js`

```javascript
const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Scribe API',
      version: '1.0.0',
      description: 'Medical consultation transcription and summarization API',
    },
    servers: [
      {
        url: 'http://localhost:8080',
        description: 'Development server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
  },
  apis: ['./routes/*.js'], // Path to API routes
};

const specs = swaggerJsdoc(options);
module.exports = specs;
```

#### Add to Main App
**File:** `backend/index.js`

```javascript
const swaggerUi = require('swagger-ui-express');
const swaggerSpecs = require('./config/swagger');

// Add after other middleware
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpecs));

// Add health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});
```

#### Document Endpoints
**Example in `backend/routes/user.routes.js`:**

```javascript
/**
 * @swagger
 * /users/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - email
 *               - password
 *               - role
 *             properties:
 *               username:
 *                 type: string
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 format: password
 *               role:
 *                 type: string
 *                 enum: [patient, clinician]
 *     responses:
 *       201:
 *         description: User registered successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: User already exists
 */
userRouter.post('/register', registerValidation, async(req, res) => {
  // ... existing code
});
```

### Step 4: Add Testing (3-4 hours)

#### Install Testing Dependencies
```bash
npm install --save-dev jest supertest mongodb-memory-server
```

#### Configure Jest
**File:** `backend/jest.config.js`

```javascript
module.exports = {
  testEnvironment: 'node',
  coverageDirectory: 'coverage',
  collectCoverageFrom: [
    'routes/**/*.js',
    'models/**/*.js',
    'middleware/**/*.js',
    '!**/node_modules/**'
  ],
  testMatch: ['**/__tests__/**/*.js', '**/*.test.js'],
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js']
};
```

#### Create Test Setup
**File:** `backend/tests/setup.js`

```javascript
const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');

let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

afterEach(async () => {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany();
  }
});
```

#### Create Tests
**File:** `backend/tests/user.test.js`

```javascript
const request = require('supertest');
const app = require('../index'); // Export app from index.js
const { UserModel } = require('../models/user.model');

describe('User Authentication', () => {
  describe('POST /users/register', () => {
    it('should register a new user', async () => {
      const res = await request(app)
        .post('/users/register')
        .send({
          username: 'testuser',
          email: 'test@example.com',
          password: 'Test123456',
          role: 'clinician'
        });
      
      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
    });

    it('should not register duplicate email', async () => {
      // First registration
      await request(app)
        .post('/users/register')
        .send({
          username: 'testuser',
          email: 'test@example.com',
          password: 'Test123456',
          role: 'clinician'
        });

      // Duplicate attempt
      const res = await request(app)
        .post('/users/register')
        .send({
          username: 'testuser2',
          email: 'test@example.com',
          password: 'Test123456',
          role: 'clinician'
        });
      
      expect(res.statusCode).toBe(401);
    });

    it('should validate required fields', async () => {
      const res = await request(app)
        .post('/users/register')
        .send({
          username: 'testuser'
          // Missing email, password, role
        });
      
      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe('POST /users/login', () => {
    beforeEach(async () => {
      // Register a user first
      await request(app)
        .post('/users/register')
        .send({
          username: 'testuser',
          email: 'test@example.com',
          password: 'Test123456',
          role: 'clinician'
        });
    });

    it('should login with correct credentials', async () => {
      const res = await request(app)
        .post('/users/login')
        .send({
          email: 'test@example.com',
          password: 'Test123456'
        });
      
      expect(res.statusCode).toBe(200);
      expect(res.body.data).toHaveProperty('token');
    });

    it('should not login with incorrect password', async () => {
      const res = await request(app)
        .post('/users/login')
        .send({
          email: 'test@example.com',
          password: 'wrongpassword'
        });
      
      expect(res.statusCode).toBe(401);
    });
  });
});
```

#### Update package.json
```json
{
  "scripts": {
    "start": "nodemon index.js",
    "dev": "nodemon index.js",
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage"
  }
}
```

#### Run Tests
```bash
npm test
npm run test:coverage
```

### Step 5: Environment Configuration (30 minutes)

#### Create .env.example
**File:** `backend/.env.example`

```bash
# Server Configuration
PORT=8080
NODE_ENV=development

# Database
MONGODB_URL=mongodb://localhost:27017/scribe

# Authentication
JWT_SECRET=your-secret-key-here
JWT_EXPIRES_IN=1h

# OpenAI
OPENAI_API_KEY=your-openai-api-key

# NHS API
NHS_CLIENT_ID=your-nhs-client-id
NHS_CLIENT_SECRET=your-nhs-client-secret

# CORS
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001,https://scribe-project-nextjs.vercel.app
```

#### Update README
**File:** `backend/README.md`

```markdown
# Scribe Backend API

Medical consultation transcription and summarization API built with Node.js and Express.

## Setup

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Copy environment variables:
   ```bash
   cp .env.example .env
   ```

4. Update `.env` with your values

5. Run the server:
   ```bash
   npm run dev
   ```

## API Documentation

Once running, visit: http://localhost:8080/api-docs

## Testing

```bash
npm test              # Run tests
npm run test:watch    # Watch mode
npm run test:coverage # Coverage report
```

## Environment Variables

See `.env.example` for required variables.
```

---

## 🐍 Option 2: Start Python Backend (For Migration)

### Step 1: Set Up Python Environment (30 minutes)

```bash
# Create project directory
mkdir backend-python
cd backend-python

# Create virtual environment
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Create requirements.txt
cat > requirements.txt << EOF
fastapi==0.109.0
uvicorn[standard]==0.27.0
motor==3.3.2
odmantic==1.0.0
python-jose[cryptography]==3.3.0
passlib[bcrypt]==1.7.4
python-dotenv==1.0.0
openai==1.10.0
httpx==0.26.0
pydantic==2.5.3
pydantic-settings==2.1.0
email-validator==2.1.0
EOF

# Install dependencies
pip install -r requirements.txt

# Create requirements-dev.txt
cat > requirements-dev.txt << EOF
pytest==7.4.4
pytest-asyncio==0.23.3
httpx==0.26.0
black==24.1.1
flake8==7.0.0
mypy==1.8.0
EOF

pip install -r requirements-dev.txt
```

### Step 2: Create Project Structure (1 hour)

```bash
# Create directory structure
mkdir -p app/{routers,models,services,core,utils}
touch app/__init__.py
touch app/{routers,models,services,core,utils}/__init__.py

# Create main files
touch app/main.py
touch app/config.py
touch app/database.py
```

### Step 3: Basic Application Setup (2 hours)

#### Config
**File:** `app/config.py`

```python
from pydantic_settings import BaseSettings
from typing import List

class Settings(BaseSettings):
    # Application
    APP_NAME: str = "Scribe API"
    VERSION: str = "2.0.0"
    
    # Server
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    
    # Database
    MONGODB_URL: str
    DATABASE_NAME: str = "scribe"
    
    # Security
    JWT_SECRET_KEY: str
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    
    # OpenAI
    OPENAI_API_KEY: str
    
    # CORS
    ALLOWED_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://localhost:3001",
        "https://scribe-project-nextjs.vercel.app"
    ]
    
    class Config:
        env_file = ".env"

settings = Settings()
```

#### Database
**File:** `app/database.py`

```python
from motor.motor_asyncio import AsyncIOMotorClient
from odmantic import AIOEngine
from app.config import settings

class Database:
    client: AsyncIOMotorClient = None
    engine: AIOEngine = None

db = Database()

async def init_db():
    db.client = AsyncIOMotorClient(settings.MONGODB_URL)
    db.engine = AIOEngine(
        motor_client=db.client,
        database=settings.DATABASE_NAME
    )
    print(f"✅ Connected to MongoDB: {settings.DATABASE_NAME}")

async def close_db():
    db.client.close()
    print("Closed MongoDB connection")

def get_engine() -> AIOEngine:
    return db.engine
```

#### Main App
**File:** `app/main.py`

```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.database import init_db, close_db

app = FastAPI(
    title=settings.APP_NAME,
    description="Medical consultation transcription API",
    version=settings.VERSION,
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def startup_event():
    await init_db()

@app.on_event("shutdown")
async def shutdown_event():
    await close_db()

@app.get("/")
async def root():
    return {"message": f"Welcome to {settings.APP_NAME} v{settings.VERSION}"}

@app.get("/health")
async def health():
    return {"status": "healthy"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=True
    )
```

### Step 4: Run the Server (5 minutes)

```bash
# Create .env file
cat > .env << EOF
MONGODB_URL=mongodb://localhost:27017
DATABASE_NAME=scribe
JWT_SECRET_KEY=your-secret-key-here
OPENAI_API_KEY=your-openai-key-here
EOF

# Run the server
python app/main.py

# Or use uvicorn directly
uvicorn app.main:app --reload
```

Visit:
- API: http://localhost:8000
- Swagger Docs: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

---

## 📋 Checklist

### Node.js Improvements (3-4 weeks)
- [ ] Fix BlackToken query bug
- [ ] Fix JWT secret handling
- [ ] Add standardized error responses
- [ ] Install and configure express-validator
- [ ] Add validation to all endpoints
- [ ] Install and configure Swagger
- [ ] Document all API endpoints
- [ ] Set up Jest testing
- [ ] Write unit tests for all routes
- [ ] Achieve 80%+ code coverage
- [ ] Create .env.example file
- [ ] Update README with setup instructions
- [ ] Add health check endpoint
- [ ] Configure CI/CD for testing

### Python Migration (8 weeks)
- [ ] Set up Python virtual environment
- [ ] Install FastAPI and dependencies
- [ ] Create project structure
- [ ] Configure database connection
- [ ] Implement authentication (JWT)
- [ ] Create all data models
- [ ] Implement user routes
- [ ] Implement consultation routes
- [ ] Implement transcript routes
- [ ] Implement notes routes
- [ ] Implement prompts routes
- [ ] Integrate OpenAI API
- [ ] Integrate NHS API
- [ ] Write comprehensive tests
- [ ] Set up Docker containers
- [ ] Configure API Gateway
- [ ] Deploy to staging
- [ ] Gradual production rollout
- [ ] Monitor and optimize

---

## 🎯 Next Steps

1. **Decide:** Choose Node.js improvements or Python migration
2. **Schedule:** Plan development timeline
3. **Assign:** Allocate team resources
4. **Start:** Begin with highest priority items
5. **Review:** Regular progress check-ins

## 📚 Resources

- [Express Validator Docs](https://express-validator.github.io/docs/)
- [Swagger/OpenAPI](https://swagger.io/docs/)
- [Jest Testing](https://jestjs.io/docs/getting-started)
- [FastAPI Tutorial](https://fastapi.tiangolo.com/tutorial/)
- [Odmantic Guide](https://art049.github.io/odmantic/)

---

**Good luck! 🚀**
