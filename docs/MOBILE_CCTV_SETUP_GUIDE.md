# NIRIKSHAN Platform — Mobile Phone Live CCTV Camera Integration Guide

This guide explains how to use an Android mobile phone as a live CCTV surveillance camera for the NIRIKSHAN Platform over local Wi-Fi without needing physical CCTV hardware.

---

## 1. Prerequisites & Wi-Fi Connection

1. **Same Local Network**: Connect your **Android smartphone** and your **computer running NIRIKSHAN** to the **same Wi-Fi router** (or enable a **Mobile Hotspot** on your phone and connect your PC to it).
2. **IP Camera App**: Install any standard IP camera app on your Android phone from Google Play Store.
   - Recommended: **[IP Webcam](https://play.google.com/store/apps/details?id=com.pas.webcam)** (by Pavel Khlebovich)
   - Alternative: **DroidCam Webcam & OBS**, **IP Camera Lite**, or any app outputting HTTP MJPEG.

---

## 2. Starting the Camera on Your Android Phone

1. Open the **IP Webcam** app on your phone.
2. (Optional) Under **Video preferences**, you can set resolution (e.g. `1280x720` or `1920x1080` for smooth streaming).
3. Scroll down to the bottom of the main screen and tap **"Start server"**.
4. The camera will activate, and an IP address will appear on the phone screen, for example:
   ```text
   http://192.168.1.105:8080
   ```
5. Your live stream video URL is:
   ```text
   http://<YOUR_PHONE_IP>:8080/video
   ```
   *(e.g., `http://192.168.1.105:8080/video`)*

---

## 3. Configuring the Stream URL in NIRIKSHAN

You have two convenient ways to set your phone's IP address:

### Method A: Directly from the Web Dashboard (Easiest & Dynamic)
1. Open the NIRIKSHAN dashboard at `http://localhost:5173/`.
2. Go to the **"CCTV & Surprise VC Matrix"** tab.
3. At the top of the camera grid, you will see the **"Live Mobile Camera Integration"** banner with a **"Change Phone IP"** button.
4. Click **"Change Phone IP"**, paste your phone's stream URL (e.g., `http://192.168.1.105:8080/video`), and click **Save**.
5. Alternatively, click **"Live Stream"** on any camera card (or the **"CAM-MOB-001 Mobile Phone Live Feed"** card). If offline or to change URL, click the **"Mobile Cam URL"** (gear icon) in the modal header, enter your URL, and click **"Save & Reconnect"**.
6. The URL updates instantly in both your browser and the backend without needing to restart any servers!

### Method B: In the `.env` Configuration File
1. Open the root `.env` file in the project:
   ```bash
   d:\SHI\Nirikshan-Smart-real-time-monitoring-inspection-platform\.env
   ```
2. Locate the line:
   ```env
   MOBILE_CCTV_STREAM_URL=http://192.168.1.100:8080/video
   ```
3. Replace `192.168.1.100:8080` with your phone's actual IP address and port:
   ```env
   MOBILE_CCTV_STREAM_URL=http://192.168.1.105:8080/video
   ```

---

## 4. Preserved CCTV Features & Capabilities

When streaming from your mobile camera, all platform intelligence remains fully active:
- **Live Real-Time Video**: Streams live MJPEG video with sub-second latency.
- **AI Computer Vision Overlay**: Bounding boxes for registered beneficiaries and instructors with live confidence scores.
- **AI Analytics Toggle**: Easily switch analytics HUD on and off.
- **OSD Telemetry HUD**: Live recording indicator, timestamp (UTC+05:30), resolution, and token verification.
- **Cryptographic Evidence Hashing**: Click **"Snapshot"** to capture a verified frame and generate a SHA-256 tamper-evident hash stored in the audit ledger.
- **Surprise VC Verification**: Conduct unannounced video checks using the live mobile feed as visual ground truth.

---

## 5. Troubleshooting & Connection Notes

| Issue | Cause | Solution |
| :--- | :--- | :--- |
| **Camera Stream Offline / Connection Error** | Phone app server stopped or wrong IP | Verify that **"Start server"** was pressed in the app and that the IP address in NIRIKSHAN matches the one on the phone screen. |
| **Connection Timed Out** | Different Wi-Fi networks / AP Isolation | Ensure both PC and phone are on the exact same Wi-Fi SSID. If on a university/office network with client isolation, turn on your phone's Wi-Fi hotspot and connect your laptop to it. |
| **Black screen in browser** | Missing `/video` path | IP Webcam requires `/video` (e.g. `http://192.168.1.X:8080/video`). If only `http://192.168.1.X:8080` is entered, the app serves an HTML web page rather than the raw MJPEG stream. |
| **CORS / Mixed Content** | Direct browser cross-origin restriction | NIRIKSHAN includes a built-in backend proxy at `/api/v1/cctv/mobile-stream?url=...` that forwards the stream from your phone through the Node backend, bypassing browser network restrictions. |
