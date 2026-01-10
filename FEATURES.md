# 🎯 FedEx DCA Platform - Features Guide

Complete guide to all implemented features and how to use them.

---

## 📊 **1. DASHBOARDS**

### **FedEx Admin Dashboard** (`/fedex`)

**KPI Cards:**
- **Open Cases**: Count of active cases across all DCAs
- **Open Amount**: Total outstanding debt in ₹
- **Recovered Amount**: Total recovered across all cases
- **SLA Breaches**: Count of cases that breached SLA deadlines

**Charts:**
- **Ageing Analysis**: Bar chart showing cases by age buckets (0-30, 31-60, 61-90, 90+ days)
- **Status Distribution**: Pie chart showing case distribution by status

**Features:**
- Real-time data updates
- Click-through to filtered views
- Export capabilities

###**DCA Agent Dashboard** (`/dca`)

**KPI Cards:**
- Shows only cases assigned to your DCA (RLS enforced)
- Same metrics as FedEx dashboard but filtered

**Quick Actions:**
- View All Cases
- In Progress Cases
- SLA Breaches (urgent)

**Security:**
- ✅ DCA agents cannot see other DCAs' data
- ✅ Calculations done on filtered data only

---

## 📋 **2. CASE MANAGEMENT**

### **Case List** (`/fedex/cases` or `/dca/cases`)

**Features:**
- Sortable columns (amount, ageing, priority, status)
- Filter by status, DCA, ageing range
- Search by customer name or case reference
- SLA badges (color-coded: green/yellow/orange/red)
- Priority indicators

**SLA Visual Indicators:**
- 🟢 **On Track** - >24 hours remaining
- 🟡 **Due Soon** - <24 hours remaining
- 🟠 **Critical** - <4 hours remaining (pulsing animation)
- 🔴 **SLA Breach** - Already overdue

**Actions:**
- Click row to view details
- Bulk operations (FedEx only)
- Export to CSV

### **Case Details** (`/fedex/cases/[id]` or `/dca/cases/[id]`)

**Header:**
- Case ID and customer name
- SLA badge (real-time)
- Action buttons:
  - 🔄 **Change Status** (green button)
  - 🚨 **Escalate** (red button, FedEx only)
  - 🧠 **Score with AI** (purple button)

**SLA Timer Card:**
- Real-time countdown (updates every second)
- Color changes based on urgency
- Shows "Breached by X hours" if overdue

**Key Metrics:**
- Outstanding Amount (₹)
- Ageing (days)
- Recovery Probability (AI-predicted)
- Priority Score

**Information Sections:**
- Case Information (ID, reference, status, DCA)
- Customer Information (name, contact)
- AI Insights (probability, priority, reason codes)

**AI/ML Transparency Panel:**
- Toggle to show/hide detailed calculations
- Input data (amount, ageing, status)
- Activity stats (attempts, staleness, disputes, PTPs)
- Feature engineering (normalized values)
- Model weights × Features = Contributions
- Linear combination (z-score)
- Sigmoid activation function
- Priority score formula
- **Everything shown in real-time with explanations**

---

## 🔄 **3. STATUS CHANGE SYSTEM**

### **How to Change Status:**

1. Click **"Change Status"** button (green)
2. Modal opens showing:
   - Current status
   - Dropdown with **only valid next statuses** (SOP enforced)
3. Select new status
4. **Conditional Fields Appear:**

**For PTP (Promise to Pay):**
- Promise Date (date picker, min: today)
- Promise Amount (₹, required)

**For DISPUTE:**
- Dispute Reason (dropdown):
  - Service Quality Issue
  - Billing Error
  - Product Not Received
  - Damaged Goods
  - Unauthorized Charge
  - Other

**For RECOVERED:**
- Recovered Amount (₹, required)

5. Add notes (optional)
6. Click "Change Status"

### **Valid Transitions (SOP):**

```
NEW → VALIDATED
VALIDATED → ASSIGNED
ASSIGNED → IN_PROGRESS
IN_PROGRESS → PTP, DISPUTE, RECOVERED, ESCALATED
PTP → RECOVERED, DISPUTE
DISPUTE → RESOLVED
RESOLVED → CLOSED
ESCALATED → (any status - admin override)
```

### **Who Can Change Status:**
- ✅ **FedEx Admins**: All transitions on all cases
- ✅ **DCA Agents**: Valid transitions on assigned cases only
- ❌ **DCA Agents CANNOT**: Close, write off, or escalate cases

**Security:**
- All changes logged in audit trail
- Activity records created
- RLS enforces DCA isolation

---

## 🚨 **4. ESCALATION SYSTEM**

### **When to Escalate:**
- SLA Breach
- High Value Case (>₹1L)
- Customer Dispute (unresolved)
- Multiple Failed Attempts (>10)
- Legal Action Required

### **How to Escalate:**

1. Click **"Escalate"** button (red, FedEx only)
2. Select escalation reason from dropdown
3. Add additional details (for "Other")
4. Click "Escalate Case"

### **What Happens:**
- Status changes to `ESCALATED`
- Escalation timestamp recorded
- User who escalated is logged
- Audit trail created
- SLA record updated

**Restrictions:**
- Only FedEx admins can escalate
- DCA agents cannot escalate (but can see escalated cases)

---

## ⏰ **5. SLA MANAGEMENT**

### **SLA Timer Features:**

**Real-Time Countdown:**
- Updates every second
- Shows: "18h 45m" or "2d 14h" or "45m 30s"
- If breached: "Breached 5h 30m ago" (keeps counting)

**Color Coding:**
- Green background: Normal (>24h)
- Yellow background: Warning (<24h)
- Orange background: Critical (<4h)
- Red background: Breached

**Where Shown:**
- Case detail pages (large timer card)
- Case list (compact badges)
- Dashboards (breach counts)

### **Automatic SLA Tracking:**
- Set when case is created/assigned
- Monitored continuously
- Breaches flagged automatically
- Can trigger auto-escalation (configurable)

---

## 🧠 **6. AI/ML SCORING**

### **When Scoring Happens:**
- Automatically when case is created
- Manually by clicking "Score with AI" button
- After significant case updates

### **What Gets Scored:**

**Recovery Probability (0-100%):**
- Based on: ageing, amount, contact attempts, staleness, disputes, PTPs
- Higher probability = more likely to recover money
- Shown as percentage and progress bar

**Priority Score (0-10,000):**
- Formula: `amount × recovery_prob - 0.3 × ageing - 0.2 × staleness`
- Higher score = higher priority case
- Used to sort work queues

**Reason Codes (Top 3 factors):**
- Examples:
  - "High amount increases priority"
  - "Active PTP increases recovery chance"
  - "High ageing reduces recovery likelihood"
  - "Recent contact attempts show engagement"

### **Model Transparency:**

Click "Show Details" to see:
1. **Input Data**: Raw case data
2. **Activity Stats**: Calculated from case history
3. **Feature Engineering**: How data is normalized
4. **Model Weights**: Trained coefficients
5. **Contributions**: Weight × Feature for each factor
6. **Z-Score**: Linear combination result
7. **Sigmoid**: Probability transformation
8. **Priority**: Final scoring formula

**All calculations shown step-by-step with actual numbers!**

---

## 👥 **7. USER ROLES & PERMISSIONS**

### **FedEx Admin** (`fedex_admin`)

**Can:**
- ✅ View all cases across all DCAs
- ✅ Create new cases
- ✅ Assign cases to DCAs
- ✅ Change any case status
- ✅ Escalate cases
- ✅ Close/write off cases
- ✅ View all DCA performance metrics
- ✅ Access full dashboard with charts

**Cannot:**
- ❌ Delete cases (audit trail protection)

### **FedEx Agent** (`fedex_agent`)

**Can:**
- ✅ View all cases
- ✅ Add notes and comments
- ✅ View reports

**Cannot:**
- ❌ Create or delete cases
- ❌ Change critical status (escalate, close, write-off)

### **DCA Admin** (`dca_admin`)

**Can:**
- ✅ View their DCA's assigned cases only
- ✅ Change status (following SOP)
- ✅ Add notes and activities
- ✅ Upload evidence
- ✅ View their DCA's performance

**Cannot:**
- ❌ See other DCAs' cases
- ❌ Escalate cases
- ❌ Close or write off cases
- ❌ Change DCA assignment

### **DCA Agent** (`dca_agent`)

**Can:**
- ✅ View their DCA's assigned cases only
- ✅ Change status (following SOP)
- ✅ Log contact attempts
- ✅ Create PTPs
- ✅ Raise disputes
- ✅ Upload evidence
- ✅ Add notes

**Cannot:**
- ❌ See other DCAs' cases (RLS enforced)
- ❌ Escalate cases
- ❌ Close or assign cases
- ❌ See other DCAs' performance

---

## 🔐 **8. SECURITY FEATURES**

### **Row Level Security (RLS)**

**How it Works:**
- Policies defined at database level
- Applied automatically on every query
- Cannot be bypassed from client

**DCA Isolation:**
```sql
-- DCA agents can only SELECT their assigned cases
CREATE POLICY "DCA users can view their assigned cases"
ON cases FOR SELECT
USING (assigned_dca_id = current_user_dca_id());
```

**Test RLS:**
```sql
-- As DCA agent, try to query other DCA's cases
SELECT * FROM cases WHERE assigned_dca_id != current_user_dca_id();
-- Result: Empty (RLS blocks it)
```

### **Audit Trail:**
- Every status change logged
- User who made change recorded
- Before/after values stored
- Timestamps immutable
- Cannot be deleted

**View Audit:**
```sql
SELECT * FROM case_audit WHERE case_id = 'some-uuid'
ORDER BY created_at DESC;
```

### **Authentication:**
- Supabase Auth (JWT tokens)
- Email/password (can extend to OAuth)
- Session management
- Secure password hashing (bcrypt)

---

## 📈 **9. PERFORMANCE & ANALYTICS**

### **DCA Scorecard** (`/fedex/dcas`)

**Metrics per DCA:**
- Total Cases Assigned
- Cases Recovered
- Recovery Rate (%)
- Amount Recovered (₹)
- Amount Outstanding (₹)
- Avg Ageing (days)
- SLA Breach Count
- SLA Adherence Rate (%)

**Sorting & Filtering:**
- Sort by any metric
- Compare DCAs side-by-side
- Identify top/bottom performers

### **Charts & Visualizations:**

**Ageing Analysis:**
- Bar chart by buckets
- Shows case distribution
- Highlights problematic areas

**Status Distribution:**
- Pie chart
- Shows workflow progression
- Identifies bottlenecks

---

## 🚀 **10. QUICK START GUIDE**

### **For Hackathon Demo:**

**1. Login as FedEx Admin**
- URL: http://localhost:3000/login
- Email: `admin@fedex.com`
- Password: `password123`

**2. View Dashboard**
- See all 15 cases
- Check KPIs and charts

**3. Open a Case**
- Click any case from list
- See SLA timer counting down
- Click "Score with AI"
- Watch transparency panel update

**4. Change Status**
- Click "Change Status"
- Select "IN_PROGRESS"
- Add notes
- Submit

**5. Escalate a Case**
- Click "Escalate"
- Select "SLA Breach"
- Submit

**6. Login as DCA Agent**
- Logout
- Email: `agent@dca1.com`
- Password: `password123`

**7. View Your Dashboard**
- See only 5 cases (Premier Recovery)
- Check your KPIs

**8. Work on a Case**
- Click "Change Status"
- Select "PTP"
- Enter date: tomorrow
- Enter amount: ₹10,000
- Submit

**9. Verify Security**
- Try to access: `/dca/cases/c2000000...` (Apex case)
- Should see: "Case not found or you don't have access"
- **RLS working!**

---

## 🎯 **KEY HIGHLIGHTS FOR DEMO**

**Show These:**

1. **Real-time SLA Timer** - Watch it count down every second
2. **AI Transparency** - Toggle to show full calculation steps
3. **Status Validation** - Only valid transitions appear in dropdown
4. **RLS Security** - DCA can't see other DCA's cases
5. **Audit Trail** - Every change logged immutably
6. **Conditional Fields** - PTP requires date+amount, Dispute requires reason
7. **Color Coding** - Green→Yellow→Orange→Red as SLA approaches
8. **Auto-Calculation** - Dashboards compute KPIs in real-time
9. **Charts** - Ageing and status visualizations
10. **Professional UI** - Modern, clean, responsive design

---

## 📝 **TESTING CHECKLIST**

- [ ] Login as FedEx admin
- [ ] Dashboard shows all 15 cases with correct amounts
- [ ] SLA timer counts down in real-time
- [ ] Create a new case (auto-scores, auto-assigns)
- [ ] Change status following SOP transitions
- [ ] Escalate a case with reason
- [ ] Login as DCA agent
- [ ] Dashboard shows only 5 cases (Premier)
- [ ] Try to access another DCA's case (should block)
- [ ] Change status to PTP with date and amount
- [ ] Upload evidence file
- [ ] Logout and login as different DCA (Apex)
- [ ] See different set of cases (4 for Apex)

**All tests should pass! ✅**

---

## 💡 **PRO TIPS**

1. **Priority Queue**: Sort cases by priority_score DESC to work on highest-value cases first
2. **SLA Management**: Check dashboard daily for upcoming breaches
3. **AI Insights**: Use reason codes to understand case risk factors
4. **Bulk Actions**: Select multiple cases for batch status updates (FedEx only)
5. **Evidence**: Always upload supporting documents for disputes and recoveries
6. **Notes**: Add detailed notes for audit trail and handovers
7. **PTP Tracking**: Set calendar reminders for PTP due dates
8. **Escalation**: Don't hesitate to escalate complex cases early

---

**Built for production. Ready to scale. Demo-ready! 🚀**
