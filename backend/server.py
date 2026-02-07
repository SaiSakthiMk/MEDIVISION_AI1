from fastapi import FastAPI, APIRouter, HTTPException, Depends, UploadFile, File, Form
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
import base64
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional
import uuid
from datetime import datetime, timezone
import jwt
import bcrypt
from PIL import Image
import io

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# JWT Configuration
JWT_SECRET = os.environ.get('JWT_SECRET', 'medivision_secret')
JWT_ALGORITHM = "HS256"

# Create the main app
app = FastAPI(title="MediVision AI")

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Security
security = HTTPBearer()

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# ================== Models ==================

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    name: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    email: str
    name: str
    created_at: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse

class ScanCreate(BaseModel):
    scan_type: str  # xray, mri, ct_scan
    file_name: str

class ScanResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    user_id: str
    scan_type: str
    file_name: str
    image_base64: Optional[str] = None
    status: str
    doctor_view: Optional[dict] = None
    patient_view: Optional[dict] = None
    created_at: str

class AnalysisRequest(BaseModel):
    scan_id: str

# ================== Auth Helpers ==================

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))

def create_token(user_id: str, email: str) -> str:
    payload = {
        "user_id": user_id,
        "email": email,
        "exp": datetime.now(timezone.utc).timestamp() + 86400 * 7  # 7 days
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        token = credentials.credentials
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user = await db.users.find_one({"id": payload["user_id"]}, {"_id": 0})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

# ================== Image Processing ==================

def preprocess_image(image_bytes: bytes) -> bytes:
    """Normalize image size using PIL"""
    try:
        image = Image.open(io.BytesIO(image_bytes))
        # Convert to RGB if necessary
        if image.mode in ('RGBA', 'P'):
            image = image.convert('RGB')
        # Resize to max 1024x1024 while maintaining aspect ratio
        max_size = (1024, 1024)
        image.thumbnail(max_size, Image.Resampling.LANCZOS)
        # Save to bytes
        buffer = io.BytesIO()
        image.save(buffer, format='JPEG', quality=85)
        return buffer.getvalue()
    except Exception as e:
        logger.error(f"Image preprocessing error: {e}")
        return image_bytes

async def analyze_with_gemini(image_base64: str, scan_type: str) -> dict:
    """Analyze medical image using Gemini 1.5 Flash"""
    try:
        from emergentintegrations.llm.chat import LlmChat, UserMessage, ImageContent
        
        api_key = os.environ.get('EMERGENT_LLM_KEY')
        if not api_key:
            raise Exception("EMERGENT_LLM_KEY not configured")
        
        # System message for medical analysis
        system_message = """You are an advanced medical imaging AI assistant. Analyze the provided medical image and provide a comprehensive diagnostic report.

IMPORTANT: You are providing educational analysis only. This is NOT a medical diagnosis and should not replace professional medical advice.

Provide your analysis in the following JSON format:
{
    "doctor_view": {
        "summary": "Technical summary of findings",
        "findings": ["List of detailed medical findings"],
        "observations": ["Technical observations about the image"],
        "recommendations": ["Recommended follow-up actions"],
        "confidence_level": "High/Medium/Low",
        "areas_of_concern": ["Specific areas requiring attention"]
    },
    "patient_view": {
        "summary": "Simple explanation of what was found",
        "findings": ["Easy to understand findings"],
        "what_it_means": "Plain language explanation",
        "next_steps": ["Simple recommended actions"],
        "reassurance": "Supportive message for the patient"
    }
}"""

        chat = LlmChat(
            api_key=api_key,
            session_id=f"medivision_{uuid.uuid4()}",
            system_message=system_message
        ).with_model("gemini", "gemini-2.0-flash")
        
        # Create image content
        image_content = ImageContent(image_base64=image_base64)
        
        # Create message with image
        user_message = UserMessage(
            text=f"Please analyze this {scan_type.replace('_', ' ').upper()} medical image and provide a comprehensive diagnostic report in the specified JSON format.",
            image_contents=[image_content]
        )
        
        response = await chat.send_message(user_message)
        
        # Parse the JSON response
        import json
        import re
        
        # Try to extract JSON from the response
        json_match = re.search(r'\{[\s\S]*\}', response)
        if json_match:
            result = json.loads(json_match.group())
            return result
        else:
            # Fallback structure
            return {
                "doctor_view": {
                    "summary": response[:500] if len(response) > 500 else response,
                    "findings": ["Analysis completed"],
                    "observations": ["Image processed successfully"],
                    "recommendations": ["Consult with a medical professional for detailed interpretation"],
                    "confidence_level": "Medium",
                    "areas_of_concern": []
                },
                "patient_view": {
                    "summary": "Your scan has been analyzed.",
                    "findings": ["The AI has reviewed your image"],
                    "what_it_means": "Please consult with your doctor for a detailed explanation.",
                    "next_steps": ["Schedule a follow-up with your healthcare provider"],
                    "reassurance": "Remember, this is an AI-assisted analysis. Your doctor will provide the final interpretation."
                }
            }
            
    except Exception as e:
        logger.error(f"Gemini analysis error: {e}")
        raise HTTPException(status_code=500, detail=f"AI analysis failed: {str(e)}")

# ================== Auth Routes ==================

@api_router.post("/auth/register", response_model=TokenResponse)
async def register(user_data: UserCreate):
    # Check if user exists
    existing = await db.users.find_one({"email": user_data.email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Create user
    user_id = str(uuid.uuid4())
    user_doc = {
        "id": user_id,
        "email": user_data.email,
        "name": user_data.name,
        "password_hash": hash_password(user_data.password),
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.users.insert_one(user_doc)
    
    # Log developer activity
    await db.developer_logs.insert_one({
        "id": str(uuid.uuid4()),
        "action": "user_registered",
        "user_id": user_id,
        "timestamp": datetime.now(timezone.utc).isoformat()
    })
    
    token = create_token(user_id, user_data.email)
    
    return TokenResponse(
        access_token=token,
        user=UserResponse(
            id=user_id,
            email=user_data.email,
            name=user_data.name,
            created_at=user_doc["created_at"]
        )
    )

@api_router.post("/auth/login", response_model=TokenResponse)
async def login(credentials: UserLogin):
    user = await db.users.find_one({"email": credentials.email}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    if not verify_password(credentials.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    token = create_token(user["id"], user["email"])
    
    return TokenResponse(
        access_token=token,
        user=UserResponse(
            id=user["id"],
            email=user["email"],
            name=user["name"],
            created_at=user["created_at"]
        )
    )

@api_router.get("/auth/me", response_model=UserResponse)
async def get_me(current_user: dict = Depends(get_current_user)):
    return UserResponse(
        id=current_user["id"],
        email=current_user["email"],
        name=current_user["name"],
        created_at=current_user["created_at"]
    )

# ================== Scan Routes ==================

@api_router.post("/process-medical-image", response_model=ScanResponse)
async def process_medical_image(
    file: UploadFile = File(...),
    scan_type: str = Form(...),
    current_user: dict = Depends(get_current_user)
):
    # Validate file type
    allowed_types = ["image/jpeg", "image/png", "image/webp"]
    if file.content_type not in allowed_types:
        raise HTTPException(status_code=400, detail="Only JPEG, PNG, and WEBP images are allowed")
    
    # Read and preprocess image
    image_bytes = await file.read()
    processed_bytes = preprocess_image(image_bytes)
    image_base64 = base64.b64encode(processed_bytes).decode('utf-8')
    
    # Create scan record
    scan_id = str(uuid.uuid4())
    scan_doc = {
        "id": scan_id,
        "user_id": current_user["id"],
        "scan_type": scan_type,
        "file_name": file.filename,
        "image_base64": image_base64,
        "status": "processing",
        "doctor_view": None,
        "patient_view": None,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.scans.insert_one(scan_doc)
    
    # Analyze with Gemini
    try:
        analysis = await analyze_with_gemini(image_base64, scan_type)
        
        # Update scan with results
        await db.scans.update_one(
            {"id": scan_id},
            {"$set": {
                "status": "completed",
                "doctor_view": analysis.get("doctor_view"),
                "patient_view": analysis.get("patient_view")
            }}
        )
        
        # Log analysis
        await db.developer_logs.insert_one({
            "id": str(uuid.uuid4()),
            "action": "scan_analyzed",
            "scan_id": scan_id,
            "user_id": current_user["id"],
            "scan_type": scan_type,
            "timestamp": datetime.now(timezone.utc).isoformat()
        })
        
        scan_doc["status"] = "completed"
        scan_doc["doctor_view"] = analysis.get("doctor_view")
        scan_doc["patient_view"] = analysis.get("patient_view")
        
    except Exception as e:
        logger.error(f"Analysis failed: {e}")
        await db.scans.update_one(
            {"id": scan_id},
            {"$set": {"status": "failed"}}
        )
        scan_doc["status"] = "failed"
    
    return ScanResponse(**{k: v for k, v in scan_doc.items() if k != "_id"})

@api_router.get("/scans", response_model=List[ScanResponse])
async def get_scans(current_user: dict = Depends(get_current_user)):
    scans = await db.scans.find(
        {"user_id": current_user["id"]},
        {"_id": 0}
    ).sort("created_at", -1).to_list(100)
    
    return [ScanResponse(**scan) for scan in scans]

@api_router.get("/scans/{scan_id}", response_model=ScanResponse)
async def get_scan(scan_id: str, current_user: dict = Depends(get_current_user)):
    scan = await db.scans.find_one(
        {"id": scan_id, "user_id": current_user["id"]},
        {"_id": 0}
    )
    
    if not scan:
        raise HTTPException(status_code=404, detail="Scan not found")
    
    return ScanResponse(**scan)

@api_router.delete("/scans/{scan_id}")
async def delete_scan(scan_id: str, current_user: dict = Depends(get_current_user)):
    result = await db.scans.delete_one({
        "id": scan_id,
        "user_id": current_user["id"]
    })
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Scan not found")
    
    return {"message": "Scan deleted successfully"}

# ================== Stats Route ==================

@api_router.get("/stats")
async def get_stats(current_user: dict = Depends(get_current_user)):
    total_scans = await db.scans.count_documents({"user_id": current_user["id"]})
    completed_scans = await db.scans.count_documents({
        "user_id": current_user["id"],
        "status": "completed"
    })
    
    # Get scan type distribution
    pipeline = [
        {"$match": {"user_id": current_user["id"]}},
        {"$group": {"_id": "$scan_type", "count": {"$sum": 1}}}
    ]
    type_dist = await db.scans.aggregate(pipeline).to_list(10)
    
    return {
        "total_scans": total_scans,
        "completed_scans": completed_scans,
        "scan_types": {item["_id"]: item["count"] for item in type_dist}
    }

# ================== Health Check ==================

@api_router.get("/")
async def root():
    return {"message": "MediVision AI API", "status": "healthy"}

@api_router.get("/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.now(timezone.utc).isoformat()}

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
