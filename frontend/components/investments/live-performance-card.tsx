"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { TrendingUp, TrendingDown, BarChart3, Loader2, Search } from "lucide-react"
import { cn } from "@/lib/utils"
import { Area, AreaChart, ResponsiveContainer } from "recharts"
import { Switch } from "@/components/ui/switch"
import { type InvestmentHolding } from "@/lib/api/investments"
import { getLiveStockData, type LiveStockData } from "@/lib/api/stocks"

// =============================================================================
// TYPES
// =============================================================================

interface StockData {
  symbol: string
  name: string
  change: number
  price: number
  data: { value: number }[]
}

// =============================================================================
// TRENDING STOCKS (Default fallback data)
// =============================================================================

const TRENDING_STOCKS: StockData[] = [
  {
    symbol: "RELIANCE",
    name: "Reliance Industries",
    change: 2.34,
    price: 2610,
    data: [
      { value: 2450 }, { value: 2480 }, { value: 2465 }, { value: 2510 },
      { value: 2495 }, { value: 2530 }, { value: 2520 }, { value: 2555 },
      { value: 2540 }, { value: 2580 }, { value: 2565 }, { value: 2610 },
    ],
  },
  {
    symbol: "TCS",
    name: "Tata Consultancy",
    change: 1.87,
    price: 3340,
    data: [
      { value: 3200 }, { value: 3180 }, { value: 3220 }, { value: 3250 },
      { value: 3235 }, { value: 3270 }, { value: 3255 }, { value: 3290 },
      { value: 3275 }, { value: 3310 }, { value: 3295 }, { value: 3340 },
    ],
  },
  {
    symbol: "INFY",
    name: "Infosys",
    change: -1.23,
    price: 1510,
    data: [
      { value: 1580 }, { value: 1560 }, { value: 1575 }, { value: 1550 },
      { value: 1565 }, { value: 1540 }, { value: 1555 }, { value: 1530 },
      { value: 1545 }, { value: 1520 }, { value: 1535 }, { value: 1510 },
    ],
  },
  {
    symbol: "HDFCBANK",
    name: "HDFC Bank",
    change: 0.95,
    price: 1680,
    data: [
      { value: 1620 }, { value: 1615 }, { value: 1630 }, { value: 1640 },
      { value: 1635 }, { value: 1650 }, { value: 1645 }, { value: 1660 },
      { value: 1655 }, { value: 1670 }, { value: 1665 }, { value: 1680 },
    ],
  },
  {
    symbol: "ICICIBANK",
    name: "ICICI Bank",
    change: 1.56,
    price: 1040,
    data: [
      { value: 980 }, { value: 985 }, { value: 990 }, { value: 1000 },
      { value: 995 }, { value: 1010 }, { value: 1005 }, { value: 1020 },
      { value: 1015 }, { value: 1030 }, { value: 1025 }, { value: 1040 },
    ],
  },
  {
    symbol: "TATAMOTORS",
    name: "Tata Motors",
    change: 3.12,
    price: 785,
    data: [
      { value: 680 }, { value: 695 }, { value: 710 }, { value: 725 },
      { value: 715 }, { value: 740 }, { value: 730 }, { value: 755 },
      { value: 745 }, { value: 770 }, { value: 760 }, { value: 785 },
    ],
  },
  {
    symbol: "WIPRO",
    name: "Wipro",
    change: -2.15,
    price: 420,
    data: [
      { value: 480 }, { value: 470 }, { value: 475 }, { value: 460 },
      { value: 465 }, { value: 450 }, { value: 455 }, { value: 440 },
      { value: 445 }, { value: 430 }, { value: 435 }, { value: 420 },
    ],
  },
  {
    symbol: "SBIN",
    name: "State Bank of India",
    change: -0.78,
    price: 595,
    data: [
      { value: 620 }, { value: 615 }, { value: 625 }, { value: 610 },
      { value: 620 }, { value: 608 }, { value: 615 }, { value: 605 },
      { value: 612 }, { value: 600 }, { value: 608 }, { value: 595 },
    ],
  },
]

// =============================================================================
// STOCK CARD COMPONENT
// =============================================================================

function StockCard({ stock }: { stock: StockData }) {
  const isPositive = stock.change >= 0
  const chartColor = isPositive ? "#10b981" : "#ef4444"
  const gradientId = `gradient-${stock.symbol}`

  return (
    <Card className="bg-card border-border hover:border-primary/30 transition-all cursor-pointer group">
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-2">
          <div>
            <p className="font-semibold text-foreground text-sm">{stock.symbol}</p>
            <p className="text-xs text-muted-foreground truncate max-w-[100px]">{stock.name}</p>
          </div>
        </div>

        <div className="h-[60px] my-3">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={stock.data}>
              <defs>
                <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={chartColor} stopOpacity={0.3} />
                  <stop offset="100%" stopColor={chartColor} stopOpacity={0} />
                </linearGradient>
              </defs>
              <Area type="monotone" dataKey="value" stroke={chartColor} strokeWidth={2} fill={`url(#${gradientId})`} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-foreground">₹{stock.price.toLocaleString()}</span>
          <div
            className={cn(
              "inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium",
              isPositive ? "bg-emerald-500/20 text-emerald-400" : "bg-red-500/20 text-red-400",
            )}
          >
            {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            {isPositive ? "+" : ""}
            {stock.change.toFixed(2)}%
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

interface LivePerformanceCardProps {
  holdings?: InvestmentHolding[]
}

export function LivePerformanceCard({ holdings = [] }: LivePerformanceCardProps) {
  const [showTrending, setShowTrending] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [liveStocks, setLiveStocks] = useState<StockData[]>([])
  const [fetchError, setFetchError] = useState(false)

  // Fetch live stock data on mount
  useEffect(() => {
    async function fetchLiveData() {
      setIsLoading(true)
      try {
        const response = await getLiveStockData()
        if (response?.success && response?.data?.stocks) {
          // Convert API response to StockData format
          const stocks: StockData[] = response.data.stocks.map(s => ({
            symbol: s.symbol,
            name: s.name,
            price: s.price,
            change: s.change,
            data: s.data,
          }))
          setLiveStocks(stocks)
          setFetchError(false)
        } else {
          setFetchError(true)
        }
      } catch (err) {
        console.error('Failed to fetch live stock data:', err)
        setFetchError(true)
      } finally {
        setIsLoading(false)
      }
    }

    fetchLiveData()

    // Refresh every 5 minutes
    const interval = setInterval(fetchLiveData, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [])

  // Convert user holdings (stocks only) to StockData format
  const userStocks: StockData[] = holdings
    .filter(h => h.type === 'stock')
    .map(h => {
      const change = h.averagePrice > 0
        ? ((h.currentPrice - h.averagePrice) / h.averagePrice) * 100
        : 0

      // Generate chart data based on price movement
      const baseValue = h.averagePrice
      const endValue = h.currentPrice
      const data = Array.from({ length: 12 }, (_, i) => ({
        value: baseValue + ((endValue - baseValue) * (i / 11))
      }))

      return {
        symbol: h.symbol || h.name.substring(0, 8).toUpperCase(),
        name: h.name,
        change,
        price: h.currentPrice,
        data
      }
    })

  const hasUserStocks = userStocks.length > 0

  // Use live data if available, otherwise fallback to static
  const trendingStocks = liveStocks.length > 0 ? liveStocks : TRENDING_STOCKS

  // Determine which stocks to display
  // If user has stocks AND showTrending is false -> show user stocks
  // If user has stocks AND showTrending is true -> show trending
  // If user has NO stocks -> always show trending (toggle disabled)
  const baseStocks = (!hasUserStocks || showTrending) ? trendingStocks : userStocks
  const displayingTrending = !hasUserStocks || showTrending

  // Filter stocks based on search query
  const displayStocks = baseStocks.filter(stock =>
    stock.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
    stock.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <Card className="bg-card border-border mb-4">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Live Performance of Your Stocks / Trending Stocks
              {liveStocks.length > 0 && (
                <span className="ml-2 px-2 py-0.5 text-[10px] font-medium rounded-full bg-green-500/10 text-green-500 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                  LIVE
                </span>
              )}
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-1">
              {hasUserStocks
                ? "Toggle to switch to Trending Stocks"
                : "Add stocks to your portfolio to see their live performance"
              }
              {liveStocks.length > 0 && displayingTrending && (
                <span className="ml-2 opacity-60">• Data from Alpha Vantage</span>
              )}
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Search Bar */}
            <div className="relative w-44">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <Input
                placeholder="Search stocks..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 h-8 text-xs bg-secondary border-border"
              />
            </div>

            {/* Toggle Switch - Only visible if user has stocks */}
            {hasUserStocks && (
              <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-secondary/80 border border-border">
                <span className={cn(
                  "text-xs font-medium transition-colors",
                  !showTrending ? "text-primary" : "text-muted-foreground"
                )}>
                  My Stocks
                </span>
                <Switch
                  checked={showTrending}
                  onCheckedChange={setShowTrending}
                  className="data-[state=checked]:bg-primary data-[state=unchecked]:bg-muted-foreground/40 h-5 w-10"
                />
                <span className={cn(
                  "text-xs font-medium transition-colors",
                  showTrending ? "text-primary" : "text-muted-foreground"
                )}>
                  Trending
                </span>
              </div>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : displayStocks.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground text-sm">
            {searchQuery ? "No stocks match your search" : "No stocks to display"}
          </div>
        ) : (
          /* Vertical scrollable grid */
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 max-h-[320px] overflow-y-auto pr-1 custom-scrollbar">
            {displayStocks.map((stock) => (
              <StockCard key={stock.symbol} stock={stock} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
