MOST IMPORTANT NODE:
DO NOT DISTURB THE PROJECT STRUCTURE AS OUR TEAM IS COLLABORATING ON THE SAME GITHUB REPOSITORY. ALSO, PROVIDE EFFICIENT AND CLEAN CODE FOR ACCURATE AND CORRECT OUTPUT.

# What we are building:
Investment Agent workflow in short:
User adds investments
        ↓
Transactions recorded (ledger)
        ↓
Investment Agent analyzes behavior
        ↓
Risk & readiness assessment
        ↓
Simple recommendations (or warning)
        ↓
Virtual Twin simulates better path


PHASE 1:
### 'Add Asset' button and assests form based on types 

## 🧱 Asset Types You Should Support (Hackathon-Perfect)
Only support **4 asset types**. Anything more is noise.
1.  **Index / Mutual Fund (SIP)** 
2.  **Stocks** 
3.  **PPF / Government Scheme**
4.  **Other**
    
## 🧾 Common Fields (For ALL Asset Types)

These common fields always exist:

| Field | Why |
| --- | --- |
| Asset Type (dropdown) | Controls form logic |
| Asset Name (search/select or text) | Identify investment |
| Invested Amount (₹) | Ledger entry |
| Investment Date | Time series |
| Investment Mode | SIP / Lump Sum |

These are enough to create:
Transaction { category: Investment }

NOTE: BASED ON THE SELECT ASSET TYPE, THE RESPECTIVE ASSET FORM INPUT WILL BE DISPLAYED.

## 🧠 Dynamic Fields (Based on Asset Type)

### 1️⃣ Index Fund / Mutual Fund
**Required Fields**
* Fund Name (dropdown or text) (input field)
* Amount (input field)
* Start Date (for SIP) (calender)
* SIP Frequency (Weekly, Monthly (default), yearly) (dropdown)

❌ No NAV
❌ No units
❌ No returns

Why?  
The Investment Agent **does not need NAV** — it cares about behavior.

### 2️⃣ Stocks (Direct Equity)
**Required Fields**
*  Stock Name (Input field)
*  Buy Amount (₹) (Input field)
*  Buy Date (calender)
*  Quantity (input field with increase and decrease)
    
❌ No price prediction  
❌ No live price fetch

This keeps it honest and simple.

### 3️⃣ PPF / Government Schemes
**Required Fields**
*  Scheme Type (PPF / NPS / EPF, ELSS) (dropdown)
*  Contribution Amount (input field)
*  Contribution Date (calender)
*  Lock-in info (static text)
    
PPF is treated as:
> “Long-term safe investment”
No calculations needed.

### 4️⃣ Other 
**Required Fields**
* Asset Name (input field)
* Amount  (input field)
* Buy Date (calender)
    
This prevents blocking edge cases.


## 🔁 What Happens After Submit (Backend)

Think backend architecture accordingly based on what input we are currently taking
(NOTE: It'll update later as we will be taking more inputs later)

No portfolio mutation.  
No holdings table update.
Ledger first. Always.

## 🧠 Why this works perfectly with Investment Agent
The agent needs:
*  Consistency 
*  Allocation 
*  Risk exposure 
*  Discipline
    
## 🧪 UX Tip (Very Important)
Add a small line below submit button for each asset type form:
> “This helps us understand your investment behavior. We don’t execute trades.”
This builds trust instantly.




