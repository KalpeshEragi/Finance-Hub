"use client"

import { useEffect, useState } from "react"
import { LivePerformanceCard } from "@/components/investments/live-performance-card"
import { PortfolioSummaryCard } from "@/components/investments/portfolio-summary-card"
import { HoldingsList } from "@/components/investments/holdings-list"
import { MarketIndices } from "@/components/investments/market-indices"
import { MutualFundsCard } from "@/components/investments/mutual-funds-card"
import { AddAssetDialog } from "@/components/investments/add-asset-dialog"
import { getInvestments, type InvestmentHolding, type InvestmentSummary } from "@/lib/api/investments"
import { useToast } from "@/components/ui/use-toast"
import { Loader2, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function InvestmentsPage() {
  const [holdings, setHoldings] = useState<InvestmentHolding[]>([])
  const [summary, setSummary] = useState<InvestmentSummary>({
    totalInvested: 0,
    currentValue: 0,
    totalReturns: 0,
    returnsPercentage: 0
  })
  const [isLoading, setIsLoading] = useState(true)
  const [isAddAssetOpen, setIsAddAssetOpen] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    fetchInvestments()
  }, [])

  const fetchInvestments = async () => {
    setIsLoading(true)
    try {
      const result = await getInvestments()
      if (result?.success && result?.data) {
        setHoldings(result.data.holdings ?? [])
        setSummary(result.data.summary ?? {
          totalInvested: 0,
          currentValue: 0,
          totalReturns: 0,
          returnsPercentage: 0
        })
      }
    } catch (error: any) {
      setHoldings([])
      setSummary({
        totalInvested: 0,
        currentValue: 0,
        totalReturns: 0,
        returnsPercentage: 0
      })
      toast({
        title: "Error fetching investments",
        description: error.message || "Something went wrong",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      {/* Add Asset Dialog */}
      <AddAssetDialog
        open={isAddAssetOpen}
        onOpenChange={setIsAddAssetOpen}
        onSuccess={fetchInvestments}
      />

      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Investments</h1>
          <p className="text-sm text-muted-foreground">Track your portfolio performance and market movements</p>
        </div>
        <div className="flex gap-2">
          {isLoading && <Loader2 className="w-5 h-5 animate-spin text-muted-foreground self-center" />}
          <Button onClick={() => setIsAddAssetOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Asset
          </Button>
        </div>
      </div>

      {/* Market Indices Ticker */}
      <MarketIndices />

      {/* Live Performance Collage */}
      <LivePerformanceCard />

      {/* Portfolio Summary & Mutual Funds */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        <PortfolioSummaryCard summary={summary} holdings={holdings} />
        <MutualFundsCard holdings={holdings} />
      </div>

      {/* Holdings List */}
      <HoldingsList holdings={holdings} isLoading={isLoading} />
    </>
  )
}
