import io
import os
import cv2
import numpy as np
from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Dict, Any, Optional
from pydantic import BaseModel

app = FastAPI(title="AI Attendance Verification & Face Analytics Service")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

MODELS_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "models")
YUNET_PATH = os.path.join(MODELS_DIR, "face_detection_yunet_2023mar.onnx")
SFACE_PATH = os.path.join(MODELS_DIR, "face_recognition_sface_2021dec.onnx")

MIN_FACE_PX = 30          # ignore tiny faces
MIN_DET_SCORE = 0.45
BLUR_LIMIT = 50.0         # Laplacian variance limit
MIN_BRIGHTNESS = 45.0
MAX_BRIGHTNESS = 225.0

# Initialize OpenCV Face Detector and Face Recognizer
yunet_detector = None
sface_recognizer = None

if os.path.exists(YUNET_PATH) and os.path.exists(SFACE_PATH):
    try:
        yunet_detector = cv2.FaceDetectorYN_create(YUNET_PATH, "", (320, 320), MIN_DET_SCORE, 0.3, 5000)
        sface_recognizer = cv2.FaceRecognizerSF_create(SFACE_PATH, "")
        print("✓ OpenCV YuNet Face Detector & SFace Feature Recognizer loaded successfully.")
    except Exception as e:
        print(f"Warning: Failed to load ONNX models: {e}")

def blur_score(img: np.ndarray) -> float:
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    return float(cv2.Laplacian(gray, cv2.CV_64F).var())

def fallback_feature_extractor(face_crop: np.ndarray) -> List[float]:
    """
    Fallback feature extractor using spatial gradient histogram (128-D L2-normalized).
    """
    if face_crop.size == 0:
        return [0.0] * 128
    resized = cv2.resize(face_crop, (64, 64))
    gray = cv2.cvtColor(resized, cv2.COLOR_BGR2GRAY)
    gx = cv2.Sobel(gray, cv2.CV_32F, 1, 0, ksize=3)
    gy = cv2.Sobel(gray, cv2.CV_32F, 0, 1, ksize=3)
    mag, ang = cv2.cartToPolar(gx, gy, angleInDegrees=True)
    
    hist_list = []
    for cy in range(4):
        for cx in range(4):
            sub_mag = mag[cy*16:(cy+1)*16, cx*16:(cx+1)*16]
            sub_ang = ang[cy*16:(cy+1)*16, cx*16:(cx+1)*16]
            bin_hist = np.zeros(8, dtype=np.float32)
            for b in range(8):
                bin_mask = (sub_ang >= b * 45) & (sub_ang < (b + 1) * 45)
                bin_hist[b] = np.sum(sub_mag[bin_mask])
            hist_list.extend(bin_hist.tolist())
    
    emb = np.array(hist_list, dtype=np.float32)
    norm = np.linalg.norm(emb)
    if norm > 1e-6:
        emb = emb / norm
    return emb.tolist()

@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "service": "AI Face Verification Service (YuNet + SFace)",
        "modelsLoaded": yunet_detector is not None and sface_recognizer is not None,
        "config": {
            "minFacePx": MIN_FACE_PX,
            "minDetScore": MIN_DET_SCORE,
            "blurLimit": BLUR_LIMIT,
            "minBrightness": MIN_BRIGHTNESS,
            "maxBrightness": MAX_BRIGHTNESS
        }
    }

@app.post("/analyze")
async def analyze(image: UploadFile = File(...)):
    """
    Quality check + Face detection + Normalized Embeddings extraction.
    """
    try:
        data = np.frombuffer(await image.read(), np.uint8)
        img = cv2.imdecode(data, cv2.IMREAD_COLOR)

        if img is None:
            raise HTTPException(status_code=400, detail="Could not decode image.")

        h, w = img.shape[:2]
        b_score = blur_score(img)
        brightness = float(img.mean())

        # Evaluate quality metrics
        is_blur_ok = b_score >= BLUR_LIMIT
        is_bright_ok = MIN_BRIGHTNESS <= brightness <= MAX_BRIGHTNESS
        is_res_ok = w >= 240 and h >= 240

        quality_ok = is_blur_ok and is_bright_ok and is_res_ok
        reasons = []
        if not is_blur_ok:
            reasons.append(f"Image is too blurry (blur index: {b_score:.1f}, minimum required: {BLUR_LIMIT})")
        if brightness < MIN_BRIGHTNESS:
            reasons.append(f"Image is too dark (brightness: {brightness:.1f}, minimum: {MIN_BRIGHTNESS})")
        elif brightness > MAX_BRIGHTNESS:
            reasons.append(f"Image is overexposed (brightness: {brightness:.1f}, maximum: {MAX_BRIGHTNESS})")
        if not is_res_ok:
            reasons.append(f"Resolution is too low ({w}x{h}, minimum: 240x240)")

        quality = {
            "blur": float(b_score),
            "brightness": float(brightness),
            "width": int(w),
            "height": int(h),
            "ok": bool(quality_ok),
            "reason": "; ".join(reasons) if reasons else "Good quality"
        }

        faces = []

        if yunet_detector is not None and sface_recognizer is not None:
            yunet_detector.setInputSize((w, h))
            _, detected_faces = yunet_detector.detect(img)
            
            if detected_faces is not None:
                for f_data in detected_faces:
                    score = float(f_data[14])
                    box_w = float(f_data[2])
                    box_h = float(f_data[3])
                    
                    if score < MIN_DET_SCORE or box_w < MIN_FACE_PX or box_h < MIN_FACE_PX:
                        continue
                    
                    x1 = float(max(0, f_data[0]))
                    y1 = float(max(0, f_data[1]))
                    x2 = float(min(w, x1 + box_w))
                    y2 = float(min(h, y1 + box_h))
                    
                    try:
                        aligned = sface_recognizer.alignCrop(img, f_data)
                        emb = sface_recognizer.feature(aligned)
                        # Normalize embedding
                        norm_emb = emb.flatten()
                        norm = np.linalg.norm(norm_emb)
                        if norm > 1e-6:
                            norm_emb = norm_emb / norm
                        emb_list = norm_emb.tolist()
                    except Exception:
                        face_crop = img[int(y1):int(y2), int(x1):int(x2)]
                        emb_list = fallback_feature_extractor(face_crop)

                    faces.append({
                        "bbox": [x1, y1, x2, y2],
                        "score": round(score, 4),
                        "embedding": emb_list,
                        "width": round(box_w, 1),
                        "height": round(box_h, 1)
                    })

        return {
            "quality": quality,
            "faceCount": len(faces),
            "faces": faces
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")


class DedupeRequest(BaseModel):
    allFaces: List[Dict[str, Any]]
    threshold: Optional[float] = 0.48

@app.post("/deduplicate")
def deduplicate(req: DedupeRequest):
    """
    De-duplicates faces across multiple photos in a single attendance session.
    Embeddings are unit-normalized, so dot product represents cosine similarity.
    """
    unique = []
    threshold = req.threshold or 0.48
    
    for f in req.allFaces:
        emb = f.get("embedding")
        if not emb:
            continue
        e = np.array(emb, dtype=np.float32)
        
        # Check if e is close to any already chosen unique face
        is_dup = False
        for u in unique:
            u_emb = np.array(u["embedding"], dtype=np.float32)
            cos_sim = float(np.dot(e, u_emb))
            if cos_sim > threshold:
                is_dup = True
                break
        
        if not is_dup:
            unique.append(f)
            
    return {
        "totalInputFaces": len(req.allFaces),
        "uniqueFaceCount": len(unique),
        "uniqueFaces": unique
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8001)
