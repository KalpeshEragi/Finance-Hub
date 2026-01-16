import { LivePerformanceCard } from "@/components/investments/live-performance-card"
import { PortfolioSummaryCard } from "@/components/investments/portfolio-summary-card"
import { HoldingsList } from "@/components/investments/holdings-list"
import { MarketIndices } from "@/components/investments/market-indices"
import { MutualFundsCard } from "@/components/investments/mutual-funds-card"

export default function InvestmentsPage() {
  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-foreground">Investments</h1>
        <p className="text-sm text-muted-foreground">Track your portfolio performance and market movements</p>
      </div>

      {/* Market Indices Ticker */}
      <MarketIndices />

      {/* Live Performance Collage */}
      <LivePerformanceCard />

      {/* Portfolio Summary & Mutual Funds */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        <PortfolioSummaryCard />
        <MutualFundsCard />
      </div>

      {/* Holdings List */}
      <HoldingsList />
    </>
  )
}
