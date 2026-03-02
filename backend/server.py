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
from PIL import Image, ImageFilter, ImageStat
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
    """Analyze medical image using OpenAI vision models with local fallback."""
    _local_xray_model = getattr(analyze_with_gemini, "_local_xray_model", None)

    def analyze_locally_with_ml(image_b64: str, scan_kind: str) -> dict:
        """
        Local ML inference for chest X-ray using torchxrayvision DenseNet.
        Requires: torch, numpy, scikit-image, torchxrayvision
        """
        if scan_kind.lower() != "xray":
            raise RuntimeError("Local ML model currently supports xray only.")

        import numpy as np
        import torch
        from skimage.transform import resize
        import torchxrayvision as xrv

        nonlocal _local_xray_model
        if _local_xray_model is None:
            _local_xray_model = xrv.models.DenseNet(weights="densenet121-res224-all")
            _local_xray_model.eval()
            setattr(analyze_with_gemini, "_local_xray_model", _local_xray_model)

        image_bytes = base64.b64decode(image_b64)
        image = Image.open(io.BytesIO(image_bytes)).convert("L")
        img = np.array(image).astype(np.float32) / 255.0
        img = resize(img, (224, 224), anti_aliasing=True, preserve_range=True).astype(np.float32)
        img = img[None, None, :, :]  # [B,C,H,W]

        with torch.no_grad():
            preds = _local_xray_model(torch.from_numpy(img))
            probs = torch.sigmoid(preds)[0].cpu().numpy()

        pathologies = _local_xray_model.pathologies
        top_idx = np.argsort(probs)[::-1][:5]
        top_items = [(pathologies[i], float(probs[i])) for i in top_idx if probs[i] >= 0.20]

        if not top_items:
            top_items = [("No high-probability abnormality detected by local model", 0.0)]

        findings = [f"{name}: probability {prob:.2f}" for name, prob in top_items]
        likely = [name for name, prob in top_items if prob >= 0.35 and "No high-probability" not in name]
        likely_text = ", ".join(likely) if likely else "No strong abnormality signal"

        return {
            "doctor_view": {
                "summary": "Local DenseNet chest X-ray model inference completed.",
                "findings": findings,
                "observations": [
                    "Model: torchxrayvision DenseNet121 (res224, all pathologies)",
                    f"Top likely patterns: {likely_text}",
                ],
                "recommendations": [
                    "Validate with clinical context and radiologist review.",
                    "Use confirmatory imaging/labs if clinically indicated."
                ],
                "confidence_level": "Medium",
                "areas_of_concern": likely
            },
            "patient_view": {
                "summary": "Your X-ray was analyzed by a local machine-learning model.",
                "findings": [f"Most likely patterns found: {likely_text}."],
                "what_it_means": "This is an AI screening result and not a final diagnosis.",
                "next_steps": [
                    "Share this report with your doctor/radiologist.",
                    "Follow medical advice for confirmation tests."
                ],
                "reassurance": "Only your doctor can confirm diagnosis."
            }
        }

    def analyze_locally_with_pil(image_b64: str, scan_kind: str) -> dict:
        """Lightweight local vision analysis that does not require external APIs."""
        image_bytes = base64.b64decode(image_b64)
        image = Image.open(io.BytesIO(image_bytes)).convert("L")
        width, height = image.size
        pixel_count = max(1, width * height)

        stats = ImageStat.Stat(image)
        mean_brightness = float(stats.mean[0])
        std_dev = float(stats.stddev[0])

        # Edge-density proxy for structural complexity.
        edges = image.filter(ImageFilter.FIND_EDGES)
        edge_pixels = sum(1 for px in edges.getdata() if px > 30)
        edge_density = edge_pixels / pixel_count

        findings = [
            f"Analyzed locally using image-statistics pipeline ({scan_kind.replace('_', ' ').upper()}).",
            f"Mean grayscale brightness: {mean_brightness:.1f}/255.",
            f"Contrast estimate (std dev): {std_dev:.1f}.",
            f"Edge-density estimate: {edge_density:.3f}.",
        ]

        quality_notes = []
        if mean_brightness < 45:
            quality_notes.append("Image appears underexposed (dark).")
        elif mean_brightness > 210:
            quality_notes.append("Image appears overexposed (bright).")
        else:
            quality_notes.append("Exposure appears within a usable range.")

        if std_dev < 25:
            quality_notes.append("Low contrast may hide subtle findings.")
        else:
            quality_notes.append("Contrast appears moderate-to-good.")

        if edge_density < 0.05:
            quality_notes.append("Low structural edge content; verify image sharpness.")
        elif edge_density > 0.20:
            quality_notes.append("High structural detail is present.")

        confidence = "Low" if std_dev < 20 else ("Medium" if std_dev < 40 else "Medium")

        return {
            "doctor_view": {
                "summary": "Local on-device image quality and structure analysis completed.",
                "findings": findings,
                "observations": quality_notes,
                "recommendations": [
                    "Treat this as preliminary technical screening, not diagnosis.",
                    "Correlate with clinical history and radiologist interpretation.",
                    "If quality is poor, reacquire scan at higher clarity."
                ],
                "confidence_level": confidence,
                "areas_of_concern": []
            },
            "patient_view": {
                "summary": "Your image was analyzed locally on this system.",
                "findings": [
                    "The system checked image clarity, brightness, and structure.",
                    "This helps detect whether the scan quality is suitable for review."
                ],
                "what_it_means": "This result is a technical pre-screen and does not replace a doctor’s diagnosis.",
                "next_steps": [
                    "Share the report with a doctor/radiologist.",
                    "If advised, upload a clearer image for better review."
                ],
                "reassurance": "You now have a real local analysis result instead of a placeholder response."
            }
        }

    try:
        if os.environ.get("MOCK_AI", "").lower() in ("1", "true", "yes"):
            try:
                if os.environ.get("USE_LOCAL_ML", "true").lower() in ("1", "true", "yes"):
                    return analyze_locally_with_ml(image_base64, scan_type)
            except Exception as ml_err:
                logger.warning(f"Local ML unavailable, falling back to basic analysis: {ml_err}")
            return analyze_locally_with_pil(image_base64, scan_type)

        from openai import OpenAI
        import json
        import re

        api_key = os.environ.get('OPENAI_API_KEY')
        if not api_key:
            try:
                if os.environ.get("USE_LOCAL_ML", "true").lower() in ("1", "true", "yes"):
                    return analyze_locally_with_ml(image_base64, scan_type)
            except Exception as ml_err:
                logger.warning(f"Local ML unavailable, falling back to basic analysis: {ml_err}")
            return analyze_locally_with_pil(image_base64, scan_type)

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

        prompt = (
            f"{system_message}\n\n"
            f"Please analyze this {scan_type.replace('_', ' ').upper()} medical image "
            "and provide the report strictly in the JSON format above."
        )

        client = OpenAI(api_key=api_key)
        model_name = os.environ.get("OPENAI_VISION_MODEL", "gpt-4.1-mini")
        response = client.responses.create(
            model=model_name,
            input=[
                {
                    "role": "user",
                    "content": [
                        {"type": "input_text", "text": prompt},
                        {
                            "type": "input_image",
                            "image_url": f"data:image/jpeg;base64,{image_base64}",
                        },
                    ],
                }
            ],
        )
        response_text = response.output_text or ""

        json_match = re.search(r'\{[\s\S]*\}', response_text)
        if json_match:
            return json.loads(json_match.group())

        return {
            "doctor_view": {
                "summary": response_text[:500] if len(response_text) > 500 else response_text,
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
        logger.error(f"Cloud AI analysis error, switching to local fallback: {e}")
        try:
            if os.environ.get("USE_LOCAL_ML", "true").lower() in ("1", "true", "yes"):
                return analyze_locally_with_ml(image_base64, scan_type)
        except Exception as ml_err:
            logger.warning(f"Local ML unavailable, falling back to basic analysis: {ml_err}")
        return analyze_locally_with_pil(image_base64, scan_type)

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
        raise HTTPException(status_code=500, detail=f"AI analysis failed: {str(e)}")
    
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
