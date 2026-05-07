# 🤖 AI Booking Feature - Complete Guide

## Overview
The AI Booking feature enables patients to describe their symptoms to an AI assistant, which automatically:
- Analyzes the symptoms using Google Gemini AI
- Identifies the appropriate medical specialty
- Finds the best available doctor
- Recommends an appointment slot
- Confirms and creates the appointment

---

## How to Book an Appointment with AI

### Step 1: Access AI Booking
1. **Log in** to your patient account
2. Click **Patient Portal** (or navigate to `/patient-portal`)
3. In the sidebar, click **"AI Booking"** (or go to `/patient-portal/ai-booking`)

### Step 2: Describe Your Symptoms
- In the text area, describe your symptoms in natural language
- **Examples:**
  - "I have a fever and severe headache"
  - "I've been having chest pain for 3 days"
  - "My throat hurts and I have difficulty swallowing"
  - "I twisted my ankle while playing football"

### Step 3: AI Analysis
1. Click the **"Analyze"** button
2. The system will:
   - Send your symptoms to Google Gemini AI
   - Analyze and categorize your condition
   - Identify relevant medical specialties
   - Assess urgency level (normal, urgent, emergency)
   - Run safety checks

### Step 4: Review Suggestion
The AI will display:
- **Suggested Doctor:** Name and specialization
- **Available Slot:** Exact date and time for the appointment
- **Analysis Details:** JSON showing:
  - Identified symptoms
  - Severity (low, medium, high)
  - Recommended department
  - Urgency level (normal, urgent, emergency)

### Step 5: Confirm Booking
1. Review the suggestion carefully
2. If satisfied, click **"Confirm Booking"**
3. The system will:
   - Reserve the slot (atomic transaction prevents double-booking)
   - Create an appointment in your records
   - Display success confirmation

### Step 6: Next Steps
- Check your **"Appointments"** page to view the confirmed booking
- You'll receive notifications about the appointment
- Join the consultation at the scheduled time

---

## API Endpoints

### POST /api/ai-booking
Analyzes symptoms and suggests a doctor + slot.

**Request:**
```json
{
  "message": "I have a fever and headache",
  "userId": "user-uuid" // optional if authenticated
}
```

**Response (Success):**
```json
{
  "success": true,
  "data": {
    "message": "Doctor John Smith available at May 6, 2026, 2:30 PM. Confirm?",
    "doctor": {
      "id": "doctor-uuid",
      "userId": "user-uuid",
      "name": "Dr. John Smith",
      "specialization": "General Medicine",
      "slot": {
        "id": "slot-uuid",
        "dateTime": "2026-05-06T14:30:00Z",
        "isBooked": false
      }
    },
    "slot": {
      "id": "slot-uuid",
      "dateTime": "2026-05-06T14:30:00Z",
      "isBooked": false
    },
    "aiData": {
      "symptoms": ["fever", "headache"],
      "severity": "medium",
      "department": "General Medicine",
      "urgency": "normal"
    }
  }
}
```

**Response (Error):**
```json
{
  "success": false,
  "message": "No available doctor slot found for the suggested department",
  "aiData": { /* analysis data */ }
}
```

---

### POST /api/confirm-booking
Creates and confirms the appointment.

**Request:**
```json
{
  "userId": "patient-uuid",
  "doctorId": "doctor-profile-uuid",
  "slotId": "slot-uuid",
  "symptoms": "I have a fever and headache" // optional, stored as reason
}
```

**Response (Success):**
```json
{
  "success": true,
  "message": "Appointment booked successfully",
  "data": {
    "id": "appointment-uuid",
    "patient_id": "patient-uuid",
    "doctor_id": "doctor-uuid",
    "slotId": "slot-uuid",
    "appointment_date": "2026-05-06",
    "appointment_time": "02:30 PM",
    "reason": "I have a fever and headache",
    "status": "CONFIRMED",
    // ... other appointment details
  }
}
```

**Response (Error):**
```json
{
  "success": false,
  "message": "Slot is already booked" // or other error
}
```

---

## AI Analysis Logic

### Symptom Processing
The AI analyzes your symptom description and extracts:
- **Symptoms:** Clinical representation of your described symptoms
- **Severity:** Low, Medium, or High based on symptom description
- **Department:** Recommended medical specialty (Cardiology, Orthopedics, etc.)
- **Urgency:** Normal, Urgent, or Emergency

### Emergency Detection
The system flags as **EMERGENCY** if you mention:
- Chest pain or difficulty breathing
- Fainting or loss of consciousness
- Stroke symptoms (facial drooping, arm weakness, speech difficulty)
- Severe bleeding
- Severe allergic reactions

### Doctor Matching
The system finds doctors by:
1. Filtering for verified, available doctors
2. Matching specialty/sub-specialty to the recommended department
3. Prioritizing doctors with available slots in the next days
4. Sorting by earliest available time

---

## Database Schema

### Slot Model
```prisma
model Slot {
  id        String      @id @default(uuid()) @db.Uuid
  doctorId  String      @map("doctor_id") @db.Uuid
  dateTime  DateTime    @map("date_time")
  isBooked  Boolean     @default(false) @map("is_booked")
  createdAt DateTime    @default(now()) @map("created_at")
  updatedAt DateTime    @updatedAt @map("updated_at")

  doctor       DoctorProfile @relation(fields: [doctorId], references: [id], onDelete: Cascade)
  appointments Appointment[]

  @@index([doctorId])
  @@index([dateTime])
  @@index([isBooked])
  @@map("slots")
}
```

### Appointment Model (Updated)
```prisma
model Appointment {
  id              String    @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  patient_id      String    @db.Uuid
  doctor_id       String    @db.Uuid
  slotId          String?   @map("slot_id") @db.Uuid
  slot            Slot?     @relation(fields: [slotId], references: [id])
  appointment_date DateTime @db.Date
  appointment_time String
  reason          String?
  status          String    @default("PENDING")
  // ... other fields
  
  @@index([slotId])
  @@map("appointments")
}
```

---

## Configuration

### Required Environment Variables (Backend)
```
GEMINI_API_KEY=<your-google-generative-ai-key>
GEMINI_MODEL=gemini-1.5-flash  # optional, defaults to gemini-1.5-flash
```

### Optional Environment Variables
```
GENERATIVE_API_KEY=<alternative-key-name>  # fallback if GEMINI_API_KEY not set
```

---

## Error Handling

### Common Errors and Solutions

| Error | Cause | Solution |
|-------|-------|----------|
| "Please describe your symptoms first" | Empty symptom text | Enter your symptoms |
| "Unable to analyze symptoms" | Gemini API not responding | Check GEMINI_API_KEY, try again |
| "No available doctor slot found" | No doctors with available slots | Try again later or use regular booking |
| "Slot is already booked" | Race condition or slot taken | Rare race condition, confirm was rejected |
| "userId, doctorId, and slotId are required" | Missing data in request | Ensure AI analysis completed before confirming |

---

## Safety Features

### Validation
✅ Patient role verification  
✅ Symptom message validation  
✅ Safety check against harmful/inappropriate messages  
✅ Doctor availability verification  
✅ Slot availability verification  
✅ Atomic transaction for slot booking (prevents double-booking)

---

## Frontend Components

### AIBooking.jsx
Located at: `frontend/src/components/AIBooking.jsx`

**Key Features:**
- Symptom input textarea
- Real-time loading states
- AI response display with doctor/slot info
- JSON debug view of AI analysis
- Success/error notifications via toast
- "Go Back" navigation

**Dependencies:**
- axios (API calls)
- react-toastify (notifications)
- react-router-dom (navigation)
- AppContext (user data, token, backend URL)

---

## Testing the Feature

### Manual Test Flow
1. **Login** as a patient
2. Navigate to `/patient-portal/ai-booking`
3. Enter symptom: *"I have fever and cough"*
4. Click **"Analyze"**
5. Verify AI response displays doctor and slot info
6. Click **"Confirm Booking"**
7. Verify success message

### Test Cases
- ✅ Valid symptom description
- ✅ No doctors available (should show error)
- ✅ Race condition (two confirmations on same slot)
- ✅ Missing authentication
- ✅ Invalid token

---

## Performance Considerations

### API Response Times
- **AI Analysis:** ~2-5 seconds (depends on Gemini API)
- **Doctor Matching:** <100ms
- **Booking Confirmation:** <500ms

### Database Indexes
Slot queries optimized with indexes on:
- `doctorId` (filter by doctor)
- `dateTime` (sort by appointment time)
- `isBooked` (filter available slots)

### Atomic Transaction
Appointment creation uses database transaction to prevent:
- Double-booking same slot
- Race conditions between analysis and confirmation

---

## Future Enhancements

💡 **Potential Improvements:**
- [ ] Slot availability calendar view
- [ ] Multiple doctor suggestions with rankings
- [ ] Integration with video consultation
- [ ] Pre-consultation questionnaire
- [ ] Appointment reminders via SMS/email
- [ ] Multi-language symptom analysis
- [ ] Real-time availability updates

---

## Support

For issues or questions:
1. Check the **Error Handling** section above
2. Verify Gemini API key is configured
3. Check backend logs for Gemini API errors
4. Ensure doctor slots exist in database
5. Contact support team with error details

---

**Last Updated:** May 6, 2026  
**Version:** 1.0 - Initial Release
