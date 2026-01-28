# Phase 5: Building Risk Profile Classification Layer

## Overview:
Risk Profile Classification answers one simple question:
How much financial risk can this user safely handle right now?

#It does not mean:
- How bold they want to be
- Which stocks they like
- How much return they expect

#It means:
- How stable and disciplined their money behavior is.



## Here is the simple version of the process:

We already have a ledgerSnapshot.
We do not calculate new data here — we only interpret signals.

# The system looks at 4 behaviors/inputs:
1️⃣ Income stability:
Stable monthly income → safer to take risk
Irregular income → safer to stay conservative
2️⃣ Investment consistency:
Investing regularly → higher tolerance
Random or one-time investments → lower tolerance
3️⃣ Spending volatility:
Predictable spending → safer
Wild month-to-month spending → risky
4️⃣ Savings rate:
Saving regularly → buffer exists
Low savings → little shock absorption

# Deterministic classification logic (example)
#Stability-Focused
- Unstable income OR
- Low savings OR
- High spending volatility

#Growth-Ready
- Stable income
- Some savings
- Average consistency

#Growth-Optimized
- Stable income
- High savings rate
- Consistent investing
- Controlled spending

#NOTE: The tags are assigned purely from the user’s financial behavior + ledger signals, using deterministic rules — not preferences, not market data, not guesses.

Provide a proper implementation plan for this phase.



#NOTE: I have provided the simple version of the process. I want you to consider every aspect which are relevant based on what is given as input.

#MOST IMPORTANT NODE:
DO NOT DISTURB THE PROJECT STRUCTURE AS OUR TEAM IS COLLABORATING ON THE SAME GITHUB REPOSITORY. ALSO, PROVIDE EFFICIENT AND CLEAN CODE FOR ACCURATE AND CORRECT OUTPUT.