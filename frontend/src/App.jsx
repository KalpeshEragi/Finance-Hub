import './index.css'

function App() {
  return (
    <div className="app">
      {/* Navbar */}
      <nav className="navbar">
        <div className="logo">
          <span>K</span>ALPESH
        </div>
        <div className="nav-links">
          <a href="#home">HOME</a>
          <a href="#features">FEATURES</a>
          <a href="#help">HELP CENTRE</a>
        </div>
        <div className="nav-buttons">
          <button className="btn btn-outline">LOGIN</button>
          <button className="btn btn-primary">SIGN IN</button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="hero" id="home">
        <div className="hero-content">
          <div className="hero-text">
            <h1>One Platform to Track, Understand, and Improve Your Finances</h1>
            <div className="hero-logo">
              <span>K</span>ALPESH
            </div>
            <div className="hero-buttons">
              <button className="btn btn-primary">GET STARTED</button>
              <button className="btn btn-outline">EXPLORE FEATURES</button>
            </div>
          </div>
          <div className="hero-image">
            <img src="/Images/LandingPage/hero-dashboard.png" alt="Finance Dashboard" />
          </div>
        </div>
      </section>

      {/* What We Track Section */}
      <section className="track-section">
        <div className="container">
          <div className="section-title">WHAT WE TRACK</div>
          <div className="track-grid">
            {/* Top Row - 3 cards */}
            <div className="track-row">
              <div className="track-card">
                <h3>Income & Expenses</h3>
                <div className="track-icon">
                  <img src="/Images/LandingPage/income_expenses.png" alt="Income & Expenses" />
                </div>
              </div>
              <div className="track-card">
                <h3>All Transactions</h3>
                <div className="track-icon">
                  <img src="/Images/LandingPage/All transaction.png" alt="All Transactions" />
                </div>
              </div>
              <div className="track-card">
                <h3>UPI Apps</h3>
                <div className="track-icon">
                  <img src="/Images/LandingPage/upi_apps.png" alt="UPI Apps" />
                </div>
              </div>
            </div>
            {/* Bottom Row - 2 cards */}
            <div className="track-row">
              <div className="track-card">
                <h3>Bank Accounts</h3>
                <div className="track-icon">
                  <img src="/Images/LandingPage/bank_Accounts.png" alt="Bank Accounts" />
                </div>
              </div>
              <div className="track-card">
                <h3>Cards</h3>
                <div className="track-icon">
                  <img src="/Images/LandingPage/cards.png" alt="Cards" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Smart Categorization Section */}
      <section className="categorization-section" id="features">
        <div className="container">
          <div className="section-title">SMART CATEGORIZATION</div>
          <div className="category-grid">
            {/* Top Row - 4 items */}
            <div className="category-row">
              <div className="category-item">
                <div className="category-icon">
                  <img src="/Images/LandingPage/food.png" alt="Food" />
                </div>
                <div className="category-label">
                  <span>FOOD</span>
                </div>
              </div>
              <div className="category-item">
                <div className="category-icon">
                  <img src="/Images/LandingPage/education.png" alt="Education" />
                </div>
                <div className="category-label">
                  <span>EDUCATION</span>
                </div>
              </div>
              <div className="category-item">
                <div className="category-icon">
                  <img src="/Images/LandingPage/insurance.png" alt="Insurance" />
                </div>
                <div className="category-label">
                  <span>INSURANCE</span>
                </div>
              </div>
              <div className="category-item">
                <div className="category-icon">
                  <img src="/Images/LandingPage/travel.png" alt="Travel" />
                </div>
                <div className="category-label">
                  <span>TRAVEL</span>
                </div>
              </div>
            </div>
            {/* Bottom Row - 4 items */}
            <div className="category-row">
              <div className="category-item">
                <div className="category-icon">
                  <img src="/Images/LandingPage/health.png" alt="Health" />
                </div>
                <div className="category-label">
                  <span>HEALTH</span>
                </div>
              </div>
              <div className="category-item">
                <div className="category-icon">
                  <img src="/Images/LandingPage/shopping.png" alt="Shopping" />
                </div>
                <div className="category-label">
                  <span>SHOPPING</span>
                </div>
              </div>
              <div className="category-item">
                <div className="category-icon">
                  <img src="/Images/LandingPage/bank.png" alt="Bank" />
                </div>
                <div className="category-label">
                  <span>BANK</span>
                </div>
              </div>
              <div className="category-item">
                <div className="category-icon">
                  <img src="/Images/LandingPage/miscellaneous.png" alt="Miscellaneous" />
                </div>
                <div className="category-label">
                  <span>MISCELLANEOUS</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Financial Recommendations Section */}
      <section className="recommendations-section">
        <div className="container">
          <div className="section-title">FINANCIAL RECOMMENDATIONS</div>
          <div className="recommendations-card">
            <ul>
              <li>Budgeting suggestions based on spending patterns</li>
              <li>Saving recommendations based on income</li>
              <li>Credit score improvement tips using rule-based calculations</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Tax Compliance Section */}
      <section className="tax-section">
        <div className="container">
          <div className="section-title">TAX COMPLIANCE & PLANNING</div>
          <div className="tax-image">
            <img src="/Images/LandingPage/tax-compliance.png" alt="Tax Compliance Support" />
          </div>
        </div>
      </section>

      {/* Additional Financial Tools Section */}
      <section className="tools-section">
        <div className="container">
          <div className="section-title">ADDITIONAL FINANCIAL TOOLS</div>
          <div className="tools-grid">
            <div className="tool-card">
              <p>Goal-based savings planning</p>
            </div>
            <div className="tool-card">
              <p>Loan & EMI management</p>
            </div>
            <div className="tool-card">
              <p>Overspending alerts</p>
            </div>
            <div className="tool-card">
              <p>Investment tracking</p>
            </div>
            <div className="tool-card">
              <p>Simple financial analytics dashboard</p>
            </div>
            <div className="tool-card">
              <p>Expense splitting</p>
            </div>
          </div>
        </div>
      </section>

      {/* Unique Features Section */}
      <section className="features-section">
        <div className="container">
          <div className="section-title">UNIQUE FEATURES</div>
          <div className="features-grid">
            <div className="feature-card">
              <h3>Digital Financial Twin</h3>
              <p>A virtual representation of the user's financial behavior that helps simulate spending, saving, and decision impact.</p>
            </div>
            <div className="feature-card">
              <h3>Gamified & Personalized Goals</h3>
              <p>Users stay motivated through personalized goals and progress-based financial milestones.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="footer-content">
          <div className="footer-column">
            <h4>Company</h4>
            <ul>
              <li><a href="#">About Us</a></li>
              <li><a href="#">Why Choose us</a></li>
              <li><a href="#">Pricing</a></li>
              <li><a href="#">Testimonial</a></li>
            </ul>
          </div>
          <div className="footer-column">
            <h4>Resources</h4>
            <ul>
              <li><a href="#">Privacy Policy</a></li>
              <li><a href="#">Terms and Condition</a></li>
              <li><a href="#">Blog</a></li>
              <li><a href="#">Contact Us</a></li>
            </ul>
          </div>
          <div className="footer-column">
            <h4>Product</h4>
            <ul>
              <li><a href="#">Project management</a></li>
              <li><a href="#">Time tracker</a></li>
              <li><a href="#">Time schedule</a></li>
              <li><a href="#">Lead generate</a></li>
              <li><a href="#">Remote Collaboration</a></li>
            </ul>
          </div>
          <div className="footer-newsletter">
            <h3>Site Title</h3>
            <div className="newsletter-form">
              <input type="email" placeholder="Enter your Email" />
              <button className="btn btn-primary">Subscribe</button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default App
