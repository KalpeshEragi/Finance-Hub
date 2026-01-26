"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
    Lightbulb,
    Target,
    BookOpen,
    TrendingUp,
    Gift,
    Calculator,
    Newspaper,
    Users,
    ArrowRight,
    Sparkles,
    Zap,
    Trophy,
    ExternalLink,
    Clock,
    Star
} from "lucide-react"

// Mock data
const MONEY_TIPS = [
    { id: 1, title: "50/30/20 Rule", description: "Allocate 50% to needs, 30% to wants, and 20% to savings", category: "Budgeting" },
    { id: 2, title: "Automate Your Savings", description: "Set up automatic transfers to your savings account on payday", category: "Savings" },
    { id: 3, title: "Track Every Expense", description: "Small purchases add up. Track everything for a month to find leaks", category: "Tracking" },
    { id: 4, title: "Build an Emergency Fund", description: "Aim for 3-6 months of expenses before aggressive investing", category: "Safety" },
]

const SAVING_CHALLENGES = [
    { id: 1, title: "No-Spend Weekend", duration: "2 days", reward: "₹1,000+ saved", difficulty: "Easy", color: "bg-green-500" },
    { id: 2, title: "52-Week Challenge", duration: "1 year", reward: "₹1,37,800", difficulty: "Medium", color: "bg-blue-500" },
    { id: 3, title: "Round-Up Challenge", duration: "Monthly", reward: "₹500-2,000", difficulty: "Easy", color: "bg-purple-500" },
    { id: 4, title: "No Dining Out Month", duration: "30 days", reward: "₹5,000+", difficulty: "Hard", color: "bg-orange-500" },
]

const INVESTMENT_IDEAS = [
    { id: 1, title: "SIP in Index Funds", risk: "Low", returns: "12-15% p.a.", minAmount: "₹500/month" },
    { id: 2, title: "PPF Account", risk: "Very Low", returns: "7.1% p.a.", minAmount: "₹500/year" },
    { id: 3, title: "Gold ETFs", risk: "Medium", returns: "8-10% p.a.", minAmount: "₹1,000" },
    { id: 4, title: "NPS for Retirement", risk: "Low-Medium", returns: "9-12% p.a.", minAmount: "₹1,000/year" },
]

const CALCULATORS = [
    { id: 1, title: "EMI Calculator", description: "Calculate your loan EMI", icon: Calculator },
    { id: 2, title: "Tax Calculator", description: "Estimate your income tax", icon: Calculator },
    { id: 3, title: "SIP Returns", description: "Project your SIP growth", icon: TrendingUp },
    { id: 4, title: "Retirement Planner", description: "Plan for your golden years", icon: Target },
]

const FINANCE_NEWS = [
    { id: 1, title: "RBI keeps repo rate unchanged at 6.5%", source: "Economic Times", time: "2 hours ago", trending: true },
    { id: 2, title: "Sensex crosses 75,000 for the first time", source: "Mint", time: "4 hours ago", trending: true },
    { id: 3, title: "New tax regime benefits increased in Budget 2024", source: "LiveMint", time: "1 day ago", trending: false },
    { id: 4, title: "Gold prices surge amid global uncertainty", source: "Business Standard", time: "5 hours ago", trending: false },
]

const OFFERS = [
    { id: 1, title: "10% Cashback on Groceries", merchant: "BigBasket", expires: "Jan 31", color: "from-green-500 to-emerald-600" },
    { id: 2, title: "₹200 Off on First Investment", merchant: "Groww", expires: "Feb 15", color: "from-purple-500 to-violet-600" },
    { id: 3, title: "5% Reward Points on Bills", merchant: "HDFC Card", expires: "Ongoing", color: "from-blue-500 to-cyan-600" },
]

export default function ExplorePage() {
    const [activeTab, setActiveTab] = useState("tips")

    return (
        <div className="max-w-6xl mx-auto space-y-8 pb-10">
            {/* Hero Section */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/20 via-purple-500/10 to-blue-500/20 p-8 border border-primary/20">
                <div className="absolute top-4 right-4 opacity-20">
                    <Sparkles className="w-32 h-32 text-primary" />
                </div>
                <div className="relative z-10">
                    <Badge className="bg-primary/20 text-primary border-0 mb-4">
                        <Zap className="w-3 h-3 mr-1" /> Explore
                    </Badge>
                    <h1 className="text-3xl font-bold text-foreground mb-2">Discover Smart Money Moves</h1>
                    <p className="text-muted-foreground max-w-xl">
                        Tips, challenges, calculators, and insights to help you master your finances
                    </p>
                </div>
            </div>

            {/* Main Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-4 lg:grid-cols-8 gap-1 h-auto p-1 bg-secondary/50">
                    <TabsTrigger value="tips" className="text-xs py-2 px-2">
                        <Lightbulb className="w-3 h-3 mr-1" /> Tips
                    </TabsTrigger>
                    <TabsTrigger value="challenges" className="text-xs py-2 px-2">
                        <Target className="w-3 h-3 mr-1" /> Challenges
                    </TabsTrigger>
                    <TabsTrigger value="invest" className="text-xs py-2 px-2">
                        <TrendingUp className="w-3 h-3 mr-1" /> Invest
                    </TabsTrigger>
                    <TabsTrigger value="calculators" className="text-xs py-2 px-2">
                        <Calculator className="w-3 h-3 mr-1" /> Tools
                    </TabsTrigger>
                    <TabsTrigger value="news" className="text-xs py-2 px-2">
                        <Newspaper className="w-3 h-3 mr-1" /> News
                    </TabsTrigger>
                    <TabsTrigger value="offers" className="text-xs py-2 px-2">
                        <Gift className="w-3 h-3 mr-1" /> Offers
                    </TabsTrigger>
                    <TabsTrigger value="guides" className="text-xs py-2 px-2">
                        <BookOpen className="w-3 h-3 mr-1" /> Guides
                    </TabsTrigger>
                    <TabsTrigger value="community" className="text-xs py-2 px-2">
                        <Users className="w-3 h-3 mr-1" /> Community
                    </TabsTrigger>
                </TabsList>

                {/* Smart Money Tips */}
                <TabsContent value="tips" className="mt-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {MONEY_TIPS.map((tip) => (
                            <Card key={tip.id} className="bg-card border-border hover:border-primary/50 transition-all cursor-pointer group">
                                <CardContent className="p-6">
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-start gap-4">
                                            <div className="w-10 h-10 rounded-lg bg-amber-500/20 flex items-center justify-center shrink-0">
                                                <Lightbulb className="w-5 h-5 text-amber-500" />
                                            </div>
                                            <div>
                                                <Badge variant="outline" className="mb-2 text-xs">{tip.category}</Badge>
                                                <h3 className="font-semibold text-foreground">{tip.title}</h3>
                                                <p className="text-sm text-muted-foreground mt-1">{tip.description}</p>
                                            </div>
                                        </div>
                                        <ArrowRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </TabsContent>

                {/* Saving Challenges */}
                <TabsContent value="challenges" className="mt-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {SAVING_CHALLENGES.map((challenge) => (
                            <Card key={challenge.id} className="bg-card border-border overflow-hidden group hover:shadow-lg transition-all">
                                <div className={`h-1 ${challenge.color}`} />
                                <CardContent className="p-6">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-10 h-10 rounded-full ${challenge.color}/20 flex items-center justify-center`}>
                                                <Trophy className={`w-5 h-5 ${challenge.color.replace('bg-', 'text-')}`} />
                                            </div>
                                            <div>
                                                <h3 className="font-semibold text-foreground">{challenge.title}</h3>
                                                <p className="text-xs text-muted-foreground flex items-center gap-1">
                                                    <Clock className="w-3 h-3" /> {challenge.duration}
                                                </p>
                                            </div>
                                        </div>
                                        <Badge variant={challenge.difficulty === "Easy" ? "default" : challenge.difficulty === "Medium" ? "secondary" : "destructive"}>
                                            {challenge.difficulty}
                                        </Badge>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <Star className="w-4 h-4 text-amber-500" />
                                            <span className="text-sm font-medium text-foreground">{challenge.reward}</span>
                                        </div>
                                        <Button size="sm" variant="outline">Start Challenge</Button>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </TabsContent>

                {/* Investment Ideas */}
                <TabsContent value="invest" className="mt-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {INVESTMENT_IDEAS.map((idea) => (
                            <Card key={idea.id} className="bg-card border-border hover:border-primary/50 transition-all">
                                <CardContent className="p-6">
                                    <div className="flex items-center gap-4 mb-4">
                                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500/20 to-emerald-500/20 flex items-center justify-center">
                                            <TrendingUp className="w-6 h-6 text-green-500" />
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-foreground">{idea.title}</h3>
                                            <p className="text-xs text-muted-foreground">Min: {idea.minAmount}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between text-sm">
                                        <div>
                                            <span className="text-muted-foreground">Risk: </span>
                                            <span className={`font-medium ${idea.risk === "Very Low" ? "text-green-500" : idea.risk === "Low" ? "text-blue-500" : "text-amber-500"}`}>
                                                {idea.risk}
                                            </span>
                                        </div>
                                        <div>
                                            <span className="text-muted-foreground">Returns: </span>
                                            <span className="font-medium text-green-500">{idea.returns}</span>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </TabsContent>

                {/* Calculators */}
                <TabsContent value="calculators" className="mt-6">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {CALCULATORS.map((calc) => (
                            <Card key={calc.id} className="bg-card border-border hover:bg-secondary/30 transition-all cursor-pointer group">
                                <CardContent className="p-6 text-center">
                                    <div className="w-14 h-14 rounded-2xl bg-primary/20 flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                                        <calc.icon className="w-7 h-7 text-primary" />
                                    </div>
                                    <h3 className="font-semibold text-foreground mb-1">{calc.title}</h3>
                                    <p className="text-xs text-muted-foreground">{calc.description}</p>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </TabsContent>

                {/* Finance News */}
                <TabsContent value="news" className="mt-6">
                    <div className="space-y-3">
                        {FINANCE_NEWS.map((news) => (
                            <Card key={news.id} className="bg-card border-border hover:bg-secondary/20 transition-all cursor-pointer">
                                <CardContent className="p-4 flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center shrink-0">
                                            <Newspaper className="w-5 h-5 text-blue-500" />
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <h3 className="font-medium text-foreground">{news.title}</h3>
                                                {news.trending && <Badge className="bg-red-500/20 text-red-500 border-0 text-[10px]">Trending</Badge>}
                                            </div>
                                            <p className="text-xs text-muted-foreground">{news.source} • {news.time}</p>
                                        </div>
                                    </div>
                                    <ExternalLink className="w-4 h-4 text-muted-foreground" />
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </TabsContent>

                {/* Offers & Rewards */}
                <TabsContent value="offers" className="mt-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {OFFERS.map((offer) => (
                            <Card key={offer.id} className={`bg-gradient-to-br ${offer.color} border-0 text-white overflow-hidden`}>
                                <CardContent className="p-6">
                                    <Gift className="w-8 h-8 mb-4 opacity-80" />
                                    <h3 className="font-bold text-lg mb-1">{offer.title}</h3>
                                    <p className="text-sm opacity-80 mb-4">via {offer.merchant}</p>
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs opacity-70">Expires: {offer.expires}</span>
                                        <Button size="sm" variant="secondary" className="bg-white/20 hover:bg-white/30 border-0">
                                            Claim
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </TabsContent>

                {/* Finance Guides */}
                <TabsContent value="guides" className="mt-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {["Beginner's Guide to Investing", "Tax Saving Strategies", "Building Credit Score", "Retirement Planning 101", "Insurance Basics", "Debt Management"].map((guide, i) => (
                            <Card key={i} className="bg-card border-border hover:border-primary/50 transition-all cursor-pointer group">
                                <CardContent className="p-6">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-lg bg-indigo-500/20 flex items-center justify-center">
                                            <BookOpen className="w-5 h-5 text-indigo-500" />
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="font-medium text-foreground group-hover:text-primary transition-colors">{guide}</h3>
                                            <p className="text-xs text-muted-foreground">5 min read</p>
                                        </div>
                                        <ArrowRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </TabsContent>

                {/* Community */}
                <TabsContent value="community" className="mt-6">
                    <Card className="bg-card border-border">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Users className="w-5 h-5 text-primary" />
                                Community Tips
                            </CardTitle>
                            <CardDescription>Learn from fellow users and share your experiences</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {[
                                { user: "Rahul M.", tip: "I automated my savings and now save ₹10,000/month without even thinking about it!", likes: 42 },
                                { user: "Priya S.", tip: "Switched to no-cost EMI for big purchases - no interest, same monthly payments!", likes: 38 },
                                { user: "Amit K.", tip: "Using this app helped me track my subscriptions. Cancelled 3 I forgot about!", likes: 56 },
                            ].map((item, i) => (
                                <div key={i} className="p-4 rounded-lg bg-secondary/30 border border-border">
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <p className="text-sm text-foreground mb-2">"{item.tip}"</p>
                                            <p className="text-xs text-muted-foreground">— {item.user}</p>
                                        </div>
                                        <Badge variant="outline" className="shrink-0">
                                            ❤️ {item.likes}
                                        </Badge>
                                    </div>
                                </div>
                            ))}
                            <Button className="w-full" variant="outline">
                                Share Your Tip
                            </Button>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    )
}
