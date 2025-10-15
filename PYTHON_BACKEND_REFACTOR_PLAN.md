# Python Backend Refactoring Plan

## Overview

This document provides a comprehensive, step-by-step plan to replace the current Node.js/Express backend with a Python/FastAPI backend while maintaining 100% compatibility with the React/Next.js frontend.

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Technology Stack](#technology-stack)
3. [Project Structure](#project-structure)
4. [Implementation Phases](#implementation-phases)
5. [Migration Checklist](#migration-checklist)
6. [Testing Strategy](#testing-strategy)
7. [Deployment Strategy](#deployment-strategy)
8. [Rollback Plan](#rollback-plan)

---

## 1. Prerequisites

### 1.1 Environment Setup

```bash
# Python 3.11+ required
python --version

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install fastapi uvicorn python-multipart python-jose[cryptography] passlib[bcrypt] motor odmantic pydantic-settings openai httpx pytest pytest-asyncio
```

### 1.2 Dependencies

Create `requirements.txt`:

```txt
# Core Framework
fastapi==0.109.0
uvicorn[standard]==0.27.0
python-multipart==0.0.6

# Database
motor==3.3.2
odmantic==1.0.0
pymongo==4.6.1

# Authentication & Security
python-jose[cryptography]==3.3.0
passlib[bcrypt]==1.7.4
python-dotenv==1.0.0

# AI & External APIs
openai==1.10.0
httpx==0.26.0

# Validation & Serialization
pydantic==2.5.3
pydantic-settings==2.1.0
email-validator==2.1.0

# Testing
pytest==7.4.4
pytest-asyncio==0.23.3
httpx==0.26.0  # For testing async requests

# Development
black==24.1.1
flake8==7.0.0
mypy==1.8.0
```

### 1.3 Development Tools

```bash
# Install development dependencies
pip install -r requirements.txt
pip install -r requirements-dev.txt

# Set up pre-commit hooks (optional but recommended)
pip install pre-commit
pre-commit install
```

---

## 2. Technology Stack

### 2.1 Core Technologies

| Component | Technology | Version | Purpose |
|-----------|-----------|---------|---------|
| Framework | FastAPI | 0.109+ | Web framework |
| ASGI Server | Uvicorn | 0.27+ | Application server |
| Database | MongoDB | 6.0+ | Data storage |
| ODM | Odmantic | 1.0+ | Object-Document Mapper |
| Auth | python-jose | 3.3+ | JWT handling |
| Password | passlib | 1.7+ | Password hashing |
| AI | OpenAI SDK | 1.10+ | AI integration |
| HTTP Client | httpx | 0.26+ | External API calls |
| Validation | Pydantic | 2.5+ | Data validation |
| Testing | pytest | 7.4+ | Testing framework |

### 2.2 Why FastAPI?

**Advantages over Flask:**
- ✅ Automatic API documentation (OpenAPI/Swagger)
- ✅ Built-in data validation with Pydantic
- ✅ Async/await support (comparable to Node.js)
- ✅ Type hints and IDE support
- ✅ High performance (comparable to Node.js/Go)
- ✅ Dependency injection system
- ✅ Modern Python features

**Comparison with Node.js/Express:**

| Feature | Node.js/Express | Python/FastAPI |
|---------|----------------|----------------|
| Performance | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| Type Safety | ⭐⭐⭐ (with TS) | ⭐⭐⭐⭐⭐ |
| Documentation | ⭐⭐ (manual) | ⭐⭐⭐⭐⭐ (auto) |
| Async Support | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| Learning Curve | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| Ecosystem | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| AI/ML Integration | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ |

---

## 3. Project Structure

### 3.1 Directory Layout

```
backend-python/
├── app/
│   ├── __init__.py
│   ├── main.py                 # FastAPI application entry point
│   ├── config.py               # Configuration and settings
│   ├── database.py             # Database connection
│   │
│   ├── models/                 # Database models (Odmantic)
│   │   ├── __init__.py
│   │   ├── user.py
│   │   ├── consultation.py
│   │   ├── transcript.py
│   │   ├── note.py
│   │   ├── prompt.py
│   │   └── token.py
│   │
│   ├── schemas/                # Pydantic schemas for validation
│   │   ├── __init__.py
│   │   ├── user.py
│   │   ├── consultation.py
│   │   ├── transcript.py
│   │   ├── note.py
│   │   └── common.py
│   │
│   ├── routers/                # API routes
│   │   ├── __init__.py
│   │   ├── users.py
│   │   ├── consultations.py
│   │   ├── transcripts.py
│   │   ├── notes.py
│   │   ├── prompts.py
│   │   ├── ai.py
│   │   └── health.py
│   │
│   ├── services/               # Business logic layer
│   │   ├── __init__.py
│   │   ├── user_service.py
│   │   ├── consultation_service.py
│   │   ├── transcript_service.py
│   │   ├── note_service.py
│   │   ├── prompt_service.py
│   │   ├── ai_service.py
│   │   └── nhs_service.py
│   │
│   ├── core/                   # Core utilities
│   │   ├── __init__.py
│   │   ├── security.py         # JWT, password hashing
│   │   ├── deps.py             # FastAPI dependencies
│   │   └── exceptions.py       # Custom exceptions
│   │
│   └── utils/                  # Helper functions
│       ├── __init__.py
│       ├── logger.py
│       └── validators.py
│
├── tests/                      # Test suite
│   ├── __init__.py
│   ├── conftest.py
│   ├── test_users.py
│   ├── test_consultations.py
│   ├── test_transcripts.py
│   └── test_ai.py
│
├── alembic/                    # Database migrations (if needed)
│   └── versions/
│
├── .env.example                # Environment variables template
├── .gitignore
├── requirements.txt            # Production dependencies
├── requirements-dev.txt        # Development dependencies
├── Dockerfile                  # Docker configuration
├── docker-compose.yml          # Docker Compose for local dev
├── pytest.ini                  # Pytest configuration
├── .flake8                     # Linting configuration
├── pyproject.toml              # Black, mypy configuration
└── README.md                   # Documentation
```

### 3.2 Key Files Overview

#### `app/main.py` - Application Entry Point
```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.database import init_db
from app.routers import users, consultations, notes, ai

app = FastAPI(
    title="Scribe API",
    description="Medical consultation transcription and summarization API",
    version="2.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(users.router, prefix="/api/v1/users", tags=["users"])
app.include_router(consultations.router, prefix="/api/v1/consultations", tags=["consultations"])
app.include_router(notes.router, prefix="/api/v1/notes", tags=["notes"])
app.include_router(ai.router, prefix="/api/v1/ai", tags=["ai"])

@app.on_event("startup")
async def startup_event():
    await init_db()

@app.get("/")
async def root():
    return {"message": "Welcome to Scribe API v2.0"}

@app.get("/health")
async def health_check():
    return {"status": "healthy"}
```

#### `app/config.py` - Configuration
```python
from pydantic_settings import BaseSettings
from typing import List

class Settings(BaseSettings):
    # Application
    APP_NAME: str = "Scribe API"
    VERSION: str = "2.0.0"
    DEBUG: bool = False
    
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
    
    # NHS API
    NHS_CLIENT_ID: str
    NHS_CLIENT_SECRET: str
    
    # CORS
    ALLOWED_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://localhost:3001",
        "https://scribe-project-nextjs.vercel.app"
    ]
    
    class Config:
        env_file = ".env"
        case_sensitive = True

settings = Settings()
```

#### `app/database.py` - Database Connection
```python
from motor.motor_asyncio import AsyncIOMotorClient
from odmantic import AIOEngine
from app.config import settings

class Database:
    client: AsyncIOMotorClient = None
    engine: AIOEngine = None

db = Database()

async def init_db():
    """Initialize database connection"""
    db.client = AsyncIOMotorClient(settings.MONGODB_URL)
    db.engine = AIOEngine(motor_client=db.client, database=settings.DATABASE_NAME)
    print(f"Connected to MongoDB: {settings.DATABASE_NAME}")

async def close_db():
    """Close database connection"""
    db.client.close()
    print("Closed MongoDB connection")

def get_engine() -> AIOEngine:
    """Dependency to get database engine"""
    return db.engine
```

---

## 4. Implementation Phases

### Phase 1: Foundation Setup (Week 1)

#### Step 1.1: Project Initialization
```bash
# Create project directory
mkdir backend-python
cd backend-python

# Initialize git
git init

# Create virtual environment
python -m venv venv
source venv/bin/activate

# Install dependencies
pip install fastapi uvicorn motor odmantic python-jose passlib
```

#### Step 1.2: Core Configuration
```python
# app/config.py
# Copy settings from Node.js .env
# Ensure JWT_SECRET_KEY matches Node.js tokenSecretKey
```

#### Step 1.3: Database Connection
```python
# app/database.py
# Connect to same MongoDB instance as Node.js
# Use same database name
```

#### Step 1.4: Basic Application Structure
```python
# app/main.py
# Set up FastAPI app with CORS
# Match CORS settings from Node.js
```

**Deliverables:**
- ✅ Working FastAPI application
- ✅ Database connection verified
- ✅ Environment configuration
- ✅ CORS configured

---

### Phase 2: Authentication & User Management (Week 2)

#### Step 2.1: Security Module
```python
# app/core/security.py
from passlib.context import CryptContext
from jose import JWTError, jwt
from datetime import datetime, timedelta
from app.config import settings

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify password against hash"""
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    """Hash password using bcrypt"""
    return pwd_context.hash(password)

def create_access_token(data: dict) -> str:
    """Create JWT access token"""
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)
    return encoded_jwt

def verify_token(token: str) -> dict:
    """Verify and decode JWT token"""
    try:
        payload = jwt.decode(token, settings.JWT_SECRET_KEY, algorithms=[settings.JWT_ALGORITHM])
        return payload
    except JWTError:
        return None
```

#### Step 2.2: User Model
```python
# app/models/user.py
from odmantic import Model, Field
from typing import Optional, List
from datetime import datetime
from bson import ObjectId

class User(Model):
    username: str = Field(...)
    email: str = Field(unique=True, index=True)
    password: str = Field(...)  # hashed
    role: str = Field(...)  # "patient" or "clinician"
    
    prompts: List[ObjectId] = Field(default_factory=list)
    notes: List[ObjectId] = Field(default_factory=list)
    transcripts: List[ObjectId] = Field(default_factory=list)
    
    created_at: datetime = Field(default_factory=datetime.utcnow)
    
    class Config:
        collection = "users"
```

#### Step 2.3: User Schemas
```python
# app/schemas/user.py
from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from datetime import datetime

class UserRegister(BaseModel):
    username: str = Field(..., min_length=3, max_length=50)
    email: EmailStr
    password: str = Field(..., min_length=8)
    role: str = Field(..., pattern="^(patient|clinician)$")

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: str
    username: str
    email: str
    role: str
    created_at: datetime

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse
```

#### Step 2.4: Authentication Dependency
```python
# app/core/deps.py
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from app.core.security import verify_token
from app.database import get_engine
from app.models.user import User
from odmantic import AIOEngine

security = HTTPBearer()

async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    engine: AIOEngine = Depends(get_engine)
) -> User:
    """Get current authenticated user"""
    token = credentials.credentials
    
    # Check if token is blacklisted
    from app.models.token import BlackToken
    blacklisted = await engine.find_one(BlackToken, BlackToken.token == token)
    if blacklisted:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Session logged out. Please log in again."
        )
    
    # Verify token
    payload = verify_token(token)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials"
        )
    
    # Get user from database
    user_id = payload.get("userID")
    user = await engine.find_one(User, User.id == ObjectId(user_id))
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found"
        )
    
    return user
```

#### Step 2.5: User Routes
```python
# app/routers/users.py
from fastapi import APIRouter, Depends, HTTPException, status
from app.schemas.user import UserRegister, UserLogin, UserResponse, TokenResponse
from app.models.user import User
from app.models.token import BlackToken
from app.core.security import verify_password, get_password_hash, create_access_token
from app.core.deps import get_current_user
from app.database import get_engine
from odmantic import AIOEngine

router = APIRouter()

@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register(
    user_data: UserRegister,
    engine: AIOEngine = Depends(get_engine)
):
    """Register new user"""
    # Check if user exists
    existing_user = await engine.find_one(User, User.email == user_data.email)
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User already exists"
        )
    
    # Create new user
    user = User(
        username=user_data.username,
        email=user_data.email,
        password=get_password_hash(user_data.password),
        role=user_data.role
    )
    await engine.save(user)
    
    return UserResponse(
        id=str(user.id),
        username=user.username,
        email=user.email,
        role=user.role,
        created_at=user.created_at
    )

@router.post("/login", response_model=TokenResponse)
async def login(
    credentials: UserLogin,
    engine: AIOEngine = Depends(get_engine)
):
    """User login"""
    # Find user
    user = await engine.find_one(User, User.email == credentials.email)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password"
        )
    
    # Verify password
    if not verify_password(credentials.password, user.password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password"
        )
    
    # Create access token
    access_token = create_access_token(
        data={"userID": str(user.id), "author": user.username}
    )
    
    return TokenResponse(
        access_token=access_token,
        user=UserResponse(
            id=str(user.id),
            username=user.username,
            email=user.email,
            role=user.role,
            created_at=user.created_at
        )
    )

@router.post("/logout")
async def logout(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    engine: AIOEngine = Depends(get_engine)
):
    """User logout - blacklist token"""
    token = credentials.credentials
    
    # Add token to blacklist
    black_token = BlackToken(token=token)
    await engine.save(black_token)
    
    return {"message": "User logged out successfully"}

@router.get("/profile", response_model=UserResponse)
async def get_profile(current_user: User = Depends(get_current_user)):
    """Get current user profile"""
    return UserResponse(
        id=str(current_user.id),
        username=current_user.username,
        email=current_user.email,
        role=current_user.role,
        created_at=current_user.created_at
    )
```

**Deliverables:**
- ✅ User registration endpoint
- ✅ User login with JWT
- ✅ User logout with token blacklisting
- ✅ User profile endpoint
- ✅ Password hashing (bcrypt)
- ✅ JWT authentication middleware

---

### Phase 3: Core Models & Services (Week 3-4)

#### Step 3.1: Consultation Model & Routes
```python
# app/models/consultation.py
from odmantic import Model, Field
from typing import Optional, List
from datetime import datetime
from bson import ObjectId

class Consultation(Model):
    clinician: ObjectId = Field(...)
    patient: dict = Field(...)
    transcript: Optional[ObjectId] = None
    notes: List[ObjectId] = Field(default_factory=list)
    
    started_at: datetime = Field(default_factory=datetime.utcnow)
    ended_at: Optional[datetime] = None
    status: str = Field(default="active")  # "active" or "ended"
    
    class Config:
        collection = "consultations"
```

```python
# app/services/consultation_service.py
from app.models.consultation import Consultation
from app.models.transcript import Transcript
from odmantic import AIOEngine
from bson import ObjectId

class ConsultationService:
    def __init__(self, engine: AIOEngine):
        self.engine = engine
    
    async def start_consultation(self, clinician_id: ObjectId, patient_data: dict):
        """Start new consultation"""
        # Create consultation
        consultation = Consultation(
            clinician=clinician_id,
            patient=patient_data
        )
        await self.engine.save(consultation)
        
        # Create transcript
        transcript = Transcript(
            consultation=consultation.id,
            clinician=clinician_id,
            transcript_text=""
        )
        await self.engine.save(transcript)
        
        # Update consultation with transcript
        consultation.transcript = transcript.id
        await self.engine.save(consultation)
        
        return consultation, transcript
    
    async def end_consultation(self, consultation_id: ObjectId, summary: str):
        """End consultation"""
        consultation = await self.engine.find_one(
            Consultation, 
            Consultation.id == consultation_id
        )
        if not consultation:
            raise ValueError("Consultation not found")
        
        consultation.status = "ended"
        consultation.ended_at = datetime.utcnow()
        await self.engine.save(consultation)
        
        return consultation
```

#### Step 3.2: Transcript Model & Routes
```python
# app/models/transcript.py
from odmantic import Model, Field
from typing import Optional
from datetime import datetime
from bson import ObjectId

class Transcript(Model):
    clinician: ObjectId = Field(...)
    consultation: ObjectId = Field(...)
    transcript_text: str = Field(default="")
    summary: Optional[dict] = None
    prompt_used: Optional[ObjectId] = None
    
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: Optional[datetime] = None
    
    class Config:
        collection = "transcripts"
```

#### Step 3.3: Notes Model & Routes
```python
# app/models/note.py
from odmantic import Model, Field
from datetime import datetime
from bson import ObjectId

class Note(Model):
    clinician: ObjectId = Field(...)
    transcript: ObjectId = Field(...)
    consultation: ObjectId = Field(...)
    body: str = Field(...)
    
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    class Config:
        collection = "notes"
```

#### Step 3.4: Prompts Model & Routes
```python
# app/models/prompt.py
from odmantic import Model, Field
from typing import List, Optional
from datetime import datetime
from bson import ObjectId

class Prompt(Model):
    prompt_name: str = Field(...)
    prompt_text: str = Field(...)
    is_shareable: bool = Field(default=False)
    is_deleted: bool = Field(default=False)
    
    clinician: ObjectId = Field(...)
    transcript_ids: List[ObjectId] = Field(default_factory=list)
    
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: Optional[datetime] = None
    
    class Config:
        collection = "prompts"
```

**Deliverables:**
- ✅ All database models created
- ✅ CRUD operations for each model
- ✅ Business logic in service layer
- ✅ API routes for all resources

---

### Phase 4: AI Integration (Week 5)

#### Step 4.1: OpenAI Service
```python
# app/services/ai_service.py
from openai import AsyncOpenAI
from app.config import settings
from typing import List, Optional

class AIService:
    def __init__(self):
        self.client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)
    
    async def search_medical_info(self, query: str) -> str:
        """Search medical information using OpenAI"""
        response = await self.client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {
                    "role": "system",
                    "content": "You are a helpful medical research assistant. Provide concise, safe, and factual medical information. Do not give personal diagnosis."
                },
                {"role": "user", "content": query}
            ]
        )
        return response.choices[0].message.content
    
    async def generate_soap_summary(self, transcript_text: str, prompt: Optional[str] = None) -> str:
        """Generate SOAP summary from transcript"""
        system_prompt = prompt or (
            "You are a helpful medical assistant. Summarize the consultation transcript "
            "into SOAP format (Subjective, Objective, Assessment, Plan). "
            "Be concise, factual, and professional."
        )
        
        response = await self.client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": transcript_text}
            ]
        )
        return response.choices[0].message.content.strip()
    
    async def analyze_images(self, prompt: str, images: List[str]) -> str:
        """Analyze images with text prompt"""
        content = [
            {"type": "text", "text": prompt}
        ]
        
        for image_url in images:
            content.append({
                "type": "image_url",
                "image_url": {"url": image_url}
            })
        
        response = await self.client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {
                    "role": "system",
                    "content": (
                        "You are a helpful and expert UK based medical AI, "
                        "explaining things to a medical professional. "
                        "Tailor your answers to a UK audience and the NHS guidelines."
                    )
                },
                {"role": "user", "content": content}
            ]
        )
        return response.choices[0].message.content
```

#### Step 4.2: NHS API Service
```python
# app/services/nhs_service.py
import httpx
from app.config import settings
from typing import List, Dict

class NHSService:
    def __init__(self):
        self.auth_url = "https://ontology.nhs.uk/authorisation/auth/realms/nhs-digital-terminology/protocol/openid-connect/token"
        self.api_url = "https://ontology.nhs.uk/production1/fhir/ValueSet/$expand"
    
    async def get_auth_token(self) -> str:
        """Get NHS API authentication token"""
        async with httpx.AsyncClient() as client:
            response = await client.post(
                self.auth_url,
                data={
                    "grant_type": "client_credentials",
                    "client_id": settings.NHS_CLIENT_ID,
                    "client_secret": settings.NHS_CLIENT_SECRET
                },
                headers={"Content-Type": "application/x-www-form-urlencoded"}
            )
            return response.json()["access_token"]
    
    async def search_clinical_codes(self, term: str) -> List[Dict]:
        """Search SNOMED CT clinical codes"""
        token = await self.get_auth_token()
        
        async with httpx.AsyncClient() as client:
            response = await client.get(
                self.api_url,
                params={
                    "url": "http://snomed.info/sct/83821000000107/version/20240508?fhir_vs=isa/138875005",
                    "filter": term,
                    "count": 10
                },
                headers={"Authorization": f"Bearer {token}"}
            )
            
            data = response.json()
            if data.get("expansion", {}).get("total", 0) > 0:
                return [
                    {
                        "name": item["display"],
                        "code": item["code"],
                        "url": item["system"]
                    }
                    for item in data["expansion"]["contains"]
                ]
            return []
```

**Deliverables:**
- ✅ OpenAI integration
- ✅ Medical search endpoint
- ✅ SOAP summary generation
- ✅ Image analysis
- ✅ NHS API integration
- ✅ Clinical codes search

---

### Phase 5: Testing & Documentation (Week 6)

#### Step 5.1: Unit Tests
```python
# tests/test_users.py
import pytest
from httpx import AsyncClient
from app.main import app

@pytest.mark.asyncio
async def test_register_user():
    async with AsyncClient(app=app, base_url="http://test") as client:
        response = await client.post(
            "/api/v1/users/register",
            json={
                "username": "testuser",
                "email": "test@example.com",
                "password": "testpass123",
                "role": "clinician"
            }
        )
        assert response.status_code == 201
        assert response.json()["email"] == "test@example.com"

@pytest.mark.asyncio
async def test_login_user():
    async with AsyncClient(app=app, base_url="http://test") as client:
        # First register
        await client.post(
            "/api/v1/users/register",
            json={
                "username": "testuser",
                "email": "test@example.com",
                "password": "testpass123",
                "role": "clinician"
            }
        )
        
        # Then login
        response = await client.post(
            "/api/v1/users/login",
            json={
                "email": "test@example.com",
                "password": "testpass123"
            }
        )
        assert response.status_code == 200
        assert "access_token" in response.json()
```

#### Step 5.2: Integration Tests
```python
# tests/test_consultations.py
import pytest
from httpx import AsyncClient
from app.main import app

@pytest.mark.asyncio
async def test_start_consultation():
    async with AsyncClient(app=app, base_url="http://test") as client:
        # Login first
        login_response = await client.post(
            "/api/v1/users/login",
            json={"email": "test@example.com", "password": "testpass123"}
        )
        token = login_response.json()["access_token"]
        
        # Start consultation
        response = await client.post(
            "/api/v1/consultations/start",
            headers={"Authorization": f"Bearer {token}"},
            json={
                "patient_data": {"name": "John Doe", "age": 45}
            }
        )
        assert response.status_code == 200
        assert response.json()["status"] == "active"
```

#### Step 5.3: API Documentation
FastAPI automatically generates OpenAPI documentation at:
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`
- OpenAPI JSON: `http://localhost:8000/openapi.json`

**Deliverables:**
- ✅ Comprehensive test suite
- ✅ 80%+ code coverage
- ✅ Automatic API documentation
- ✅ README with setup instructions

---

### Phase 6: Deployment & Migration (Week 7-8)

#### Step 6.1: Dockerization
```dockerfile
# Dockerfile
FROM python:3.11-slim

WORKDIR /app

# Install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application
COPY ./app ./app

# Expose port
EXPOSE 8000

# Run application
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

```yaml
# docker-compose.yml
version: '3.8'

services:
  api:
    build: .
    ports:
      - "8000:8000"
    environment:
      - MONGODB_URL=mongodb://mongo:27017
      - JWT_SECRET_KEY=${JWT_SECRET_KEY}
      - OPENAI_API_KEY=${OPENAI_API_KEY}
    depends_on:
      - mongo
    volumes:
      - ./app:/app/app
  
  mongo:
    image: mongo:6.0
    ports:
      - "27017:27017"
    volumes:
      - mongo_data:/data/db

volumes:
  mongo_data:
```

#### Step 6.2: Deployment Strategy

**Option 1: Parallel Deployment with API Gateway**
```nginx
# nginx.conf
upstream nodejs_backend {
    server nodejs:3000;
}

upstream python_backend {
    server python:8000;
}

server {
    listen 80;
    
    # Route to Python (new endpoints)
    location /api/v2/ {
        proxy_pass http://python_backend;
    }
    
    # Route to Node.js (legacy endpoints)
    location /api/ {
        proxy_pass http://nodejs_backend;
    }
    
    # Gradually migrate endpoints
    location /api/v1/users {
        proxy_pass http://python_backend;
    }
}
```

**Option 2: Feature Flag Based Routing**
```python
# Use environment variable to toggle backends
if os.getenv("USE_PYTHON_BACKEND", "false") == "true":
    # Route to Python
    pass
else:
    # Route to Node.js
    pass
```

**Deliverables:**
- ✅ Docker configuration
- ✅ Deployment scripts
- ✅ API Gateway setup
- ✅ Migration strategy documented

---

## 5. Migration Checklist

### Pre-Migration Checklist

- [ ] All Node.js tests passing
- [ ] API documentation complete
- [ ] Environment variables documented
- [ ] Database backup created
- [ ] Staging environment ready

### Python Backend Checklist

- [ ] All dependencies installed
- [ ] Database connection verified
- [ ] All models implemented
- [ ] All routes implemented
- [ ] Authentication working
- [ ] JWT tokens compatible
- [ ] All tests passing (>80% coverage)
- [ ] OpenAI integration working
- [ ] NHS API integration working
- [ ] API documentation generated
- [ ] Error handling standardized
- [ ] Logging configured
- [ ] Docker images built

### Migration Checklist

- [ ] Deploy Python backend to staging
- [ ] Configure API Gateway
- [ ] Route 10% traffic to Python
- [ ] Monitor errors and performance
- [ ] Route 25% traffic to Python
- [ ] Route 50% traffic to Python
- [ ] Route 75% traffic to Python
- [ ] Route 100% traffic to Python
- [ ] Monitor for 1 week
- [ ] Decommission Node.js backend
- [ ] Update documentation
- [ ] Team training complete

### Post-Migration Checklist

- [ ] All endpoints working
- [ ] Performance benchmarks met
- [ ] No increase in error rates
- [ ] Frontend compatibility verified
- [ ] Mobile app compatibility verified
- [ ] Third-party integrations working
- [ ] Monitoring dashboards updated
- [ ] Backup procedures tested
- [ ] Disaster recovery plan tested

---

## 6. Testing Strategy

### 6.1 Test Categories

#### Unit Tests
```python
# Test individual functions
- Password hashing
- Token generation
- Data validation
- Business logic
```

#### Integration Tests
```python
# Test API endpoints
- User registration flow
- Login/logout flow
- Consultation CRUD
- AI integration
```

#### Compatibility Tests
```python
# Test compatibility with Node.js
- JWT token verification
- Database queries
- Response format
- Error handling
```

#### Performance Tests
```python
# Test performance
- Response time < 200ms
- Concurrent requests
- Database query optimization
- Memory usage
```

### 6.2 Test Automation

```yaml
# .github/workflows/test.yml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Set up Python
        uses: actions/setup-python@v4
        with:
          python-version: '3.11'
      - name: Install dependencies
        run: |
          pip install -r requirements.txt
          pip install -r requirements-dev.txt
      - name: Run tests
        run: pytest --cov=app --cov-report=xml
      - name: Upload coverage
        uses: codecov/codecov-action@v3
```

---

## 7. Deployment Strategy

### 7.1 Gradual Rollout Plan

**Week 1: Deploy to Staging**
- Deploy Python backend to staging environment
- Test all endpoints manually
- Run automated test suite
- Performance benchmarking

**Week 2: 10% Traffic**
- Deploy to production
- Configure API Gateway to route 10% traffic to Python
- Monitor errors, performance, and logs
- Collect metrics

**Week 3: 25% Traffic**
- Increase traffic to 25%
- Continue monitoring
- Address any issues

**Week 4: 50% Traffic**
- Increase traffic to 50%
- Comprehensive monitoring
- Performance comparison

**Week 5: 75% Traffic**
- Increase traffic to 75%
- Prepare for full cutover

**Week 6: 100% Traffic**
- Route all traffic to Python
- Monitor closely for 1 week

**Week 7: Decommission Node.js**
- Archive Node.js codebase
- Update documentation
- Team celebration! 🎉

### 7.2 Monitoring & Metrics

**Key Metrics to Track:**
- Response time (p50, p95, p99)
- Error rate
- Request volume
- Database query performance
- Memory usage
- CPU usage
- Active connections

**Tools:**
- Application: Sentry or DataDog
- Infrastructure: Prometheus + Grafana
- Logs: ELK Stack or CloudWatch

---

## 8. Rollback Plan

### 8.1 Rollback Triggers

**Automatic Rollback:**
- Error rate > 5%
- Response time > 2x baseline
- 5xx errors > 1%
- Health check failures

**Manual Rollback:**
- Critical bug discovered
- Data integrity issues
- Security vulnerability

### 8.2 Rollback Procedure

1. **Immediate:**
   ```bash
   # Redirect all traffic back to Node.js
   kubectl set image deployment/api api=nodejs-backend:latest
   # or
   # Update API Gateway routing rules
   ```

2. **Investigate:**
   - Check logs
   - Review errors
   - Analyze metrics
   - Identify root cause

3. **Fix & Redeploy:**
   - Fix the issue
   - Test thoroughly
   - Gradual rollout again

### 8.3 Data Rollback

Since both backends use the same database:
- No data migration needed
- No rollback needed
- Data remains consistent

---

## 9. Success Criteria

### 9.1 Technical Success Criteria

- ✅ All API endpoints working
- ✅ 100% feature parity with Node.js
- ✅ Response time ≤ Node.js baseline
- ✅ Error rate ≤ 0.1%
- ✅ Test coverage > 80%
- ✅ Zero data loss
- ✅ Zero downtime migration

### 9.2 Business Success Criteria

- ✅ No customer complaints
- ✅ No increase in support tickets
- ✅ Improved developer productivity
- ✅ Faster feature development
- ✅ Better code maintainability

---

## 10. Estimated Timeline & Effort

### 10.1 Development Timeline

| Phase | Duration | Effort (Dev Days) |
|-------|----------|------------------|
| Phase 1: Foundation | 1 week | 5 days |
| Phase 2: Auth & Users | 1 week | 5 days |
| Phase 3: Core Models | 2 weeks | 10 days |
| Phase 4: AI Integration | 1 week | 5 days |
| Phase 5: Testing | 1 week | 5 days |
| Phase 6: Deployment | 2 weeks | 10 days |
| **Total** | **8 weeks** | **40 days** |

### 10.2 Resource Requirements

**Team:**
- 2 Backend Developers (Python/FastAPI)
- 1 DevOps Engineer
- 1 QA Engineer
- 1 Technical Lead (part-time)

**Infrastructure:**
- Staging environment
- Production environment
- API Gateway (Nginx/Traefik)
- Monitoring tools
- CI/CD pipeline

---

## 11. Risks & Mitigation

### 11.1 High-Priority Risks

| Risk | Impact | Probability | Mitigation |
|------|--------|------------|------------|
| JWT incompatibility | High | Low | Use same secret, algorithm, payload structure |
| Data corruption | Critical | Very Low | Same database, no migration |
| Frontend breaks | High | Medium | API contract tests, versioning |
| Performance issues | Medium | Low | Load testing, benchmarking |
| Team learning curve | Medium | Medium | Training, documentation |

### 11.2 Risk Mitigation Strategies

**Technical Risks:**
- Comprehensive testing
- Gradual rollout
- Feature flags
- Easy rollback mechanism

**Business Risks:**
- Stakeholder communication
- User communication
- Support team preparation
- Documentation

---

## 12. Conclusion

This refactoring plan provides a comprehensive, step-by-step approach to migrating from Node.js to Python/FastAPI while maintaining 100% compatibility with the existing frontend and database.

**Key Advantages:**
- ✅ Type safety with Pydantic
- ✅ Auto-generated documentation
- ✅ Better testing frameworks
- ✅ Improved maintainability
- ✅ Same or better performance
- ✅ Zero data migration needed
- ✅ Gradual, low-risk migration

**Next Steps:**
1. Review and approve this plan
2. Set up development environment
3. Begin Phase 1: Foundation Setup
4. Follow the checklist and timeline
5. Monitor progress and adjust as needed

**Success Factors:**
- Clear API contract
- Comprehensive testing
- Gradual rollout
- Continuous monitoring
- Team collaboration

---

**Document Version:** 1.0  
**Last Updated:** October 15, 2025  
**Author:** Backend Refactoring Team  
**Status:** Ready for Implementation
