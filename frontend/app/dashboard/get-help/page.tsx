"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion"
import {
    Search,
    MessageCircle,
    Mail,
    FileText,
    ExternalLink,
    LifeBuoy,
    BookOpen,
    ChevronRight,
    Star,
    Send,
    CheckCircle2,
    Loader2
} from "lucide-react"

const FAQS = [
    {
        question: "How do I link a new bank account?",
        answer: "Go to the 'Connect Bank' section in the sidebar. Select your bank from the list, enter your account details securely, and verify via OTP to link it instantly."
    },
    {
        question: "Is my financial data secure?",
        answer: "Yes, we use bank-grade 256-bit encryption to protect your data. We never store your banking credentials and only have read-only access to your transaction history."
    },
    {
        question: "How does the security score work?",
        answer: "Your security score is calculated based on enabled protection features: Two-Factor Authentication (33%), Hiding Balances (33%), and Login Alerts (34%). Enabling all ensures a 100% score."
    },
    {
        question: "Can I export my transaction history?",
        answer: "Currently, you can view your detailed history in the 'Transactions' tab. We are working on a PDF/CSV export feature which will be available in the next update."
    },
    {
        question: "What happens if I lose my device?",
        answer: "You should immediately log in from another device and go to 'Security'. Use the 'Sign out all devices' option to secure your account. You can also change your password for added safety."
    }
]

export default function GetHelpPage() {
    const [searchQuery, setSearchQuery] = useState("")
    const [activeTab, setActiveTab] = useState("faq")

    // Feedback state
    const [rating, setRating] = useState(0)
    const [hoverRating, setHoverRating] = useState(0)
    const [feedbackText, setFeedbackText] = useState("")
    const [feedbackCategory, setFeedbackCategory] = useState("general")
    const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false)
    const [feedbackSubmitted, setFeedbackSubmitted] = useState(false)

    const filteredFaqs = FAQS.filter(faq =>
        faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
        faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
    )

    const handleFeedbackSubmit = () => {
        if (rating === 0) return
        setIsSubmittingFeedback(true)
        setTimeout(() => {
            setIsSubmittingFeedback(false)
            setFeedbackSubmitted(true)
            // Reset after showing success (optional)
            // setTimeout(() => { setFeedbackSubmitted(false); setRating(0); setFeedbackText("") }, 3000)
        }, 1500)
    }

    return (
        <div className="max-w-4xl mx-auto space-y-8 pb-10">
            {/* Header Section */}
            <div className="text-center space-y-4 py-8">
                <h1 className="text-3xl font-bold text-foreground">How can we help you?</h1>
                <p className="text-muted-foreground max-w-xl mx-auto">
                    Search our knowledge base, ask our support team, or share your feedback to help us improve.
                </p>

                <div className="relative max-w-lg mx-auto mt-6">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input
                        placeholder="Search for answers..."
                        className="pl-10 h-12 bg-secondary/50 border-border text-lg shadow-sm focus-visible:ring-primary"
                        value={searchQuery}
                        onChange={(e) => {
                            setSearchQuery(e.target.value)
                            if (e.target.value && activeTab !== "faq") setActiveTab("faq")
                        }}
                    />
                </div>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full max-w-md mx-auto grid-cols-3 mb-8">
                    <TabsTrigger value="faq">FAQ</TabsTrigger>
                    <TabsTrigger value="support">Support</TabsTrigger>
                    <TabsTrigger value="feedback">Feedback</TabsTrigger>
                </TabsList>

                {/* FAQ Tab */}
                <TabsContent value="faq" className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="md:col-span-2 space-y-6">
                            <Card className="bg-card border-border">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <BookOpen className="w-5 h-5 text-primary" />
                                        Frequently Asked Questions
                                    </CardTitle>
                                    <CardDescription>
                                        Quick answers to common questions
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    {filteredFaqs.length > 0 ? (
                                        <Accordion type="single" collapsible className="w-full">
                                            {filteredFaqs.map((faq, index) => (
                                                <AccordionItem key={index} value={`item-${index}`}>
                                                    <AccordionTrigger className="text-left font-medium hover:text-primary transition-colors">
                                                        {faq.question}
                                                    </AccordionTrigger>
                                                    <AccordionContent className="text-muted-foreground leading-relaxed">
                                                        {faq.answer}
                                                    </AccordionContent>
                                                </AccordionItem>
                                            ))}
                                        </Accordion>
                                    ) : (
                                        <div className="text-center py-12 text-muted-foreground">
                                            <Search className="w-12 h-12 mx-auto opacity-20 mb-3" />
                                            No results found for "{searchQuery}"
                                        </div>
                                    )}
                                </CardContent>
                            </Card>

                            {/* Documentation Links */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <Card className="bg-card border-border hover:bg-secondary/20 transition-all cursor-pointer group border-l-4 border-l-blue-500">
                                    <CardContent className="p-6 flex items-start gap-4">
                                        <div className="p-3 rounded-lg bg-blue-500/10 group-hover:bg-blue-500/20 transition-colors">
                                            <FileText className="w-6 h-6 text-blue-500" />
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-foreground flex items-center gap-1">
                                                User Guide <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity -translate-x-1 group-hover:translate-x-0" />
                                            </h3>
                                            <p className="text-sm text-muted-foreground mt-1">
                                                Detailed documentation on how to use all features.
                                            </p>
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card className="bg-card border-border hover:bg-secondary/20 transition-all cursor-pointer group border-l-4 border-l-emerald-500">
                                    <CardContent className="p-6 flex items-start gap-4">
                                        <div className="p-3 rounded-lg bg-emerald-500/10 group-hover:bg-emerald-500/20 transition-colors">
                                            <LifeBuoy className="w-6 h-6 text-emerald-500" />
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-foreground flex items-center gap-1">
                                                Troubleshooting <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity -translate-x-1 group-hover:translate-x-0" />
                                            </h3>
                                            <p className="text-sm text-muted-foreground mt-1">
                                                Solutions to common issues and error messages.
                                            </p>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        </div>

                        {/* Support Sidebar */}
                        <div className="md:col-span-1 space-y-6">
                            <Card className="bg-gradient-to-br from-primary/10 to-secondary border-primary/20">
                                <CardContent className="p-6">
                                    <h3 className="font-semibold text-foreground mb-2 flex items-center gap-2">
                                        <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                                        Pro Tip
                                    </h3>
                                    <p className="text-sm text-muted-foreground leading-relaxed">
                                        Did you know? Use the search bar above to quickly find answers without browsing through lists.
                                    </p>
                                </CardContent>
                            </Card>

                            <Card className="bg-card border-border">
                                <CardHeader>
                                    <CardTitle className="text-base">Popular Topics</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-2">
                                    {["Account Security", "Linking Banks", "Budgeting", "Rewards Program"].map((topic) => (
                                        <Button key={topic} variant="outline" className="w-full justify-start font-normal text-muted-foreground hover:text-foreground">
                                            {topic}
                                        </Button>
                                    ))}
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </TabsContent>

                {/* Support Tab */}
                <TabsContent value="support" className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
                        <Card className="bg-card border-border hover:border-primary/50 transition-colors cursor-pointer group">
                            <CardContent className="p-8 flex flex-col items-center text-center space-y-4">
                                <div className="w-16 h-16 rounded-full bg-blue-500/10 flex items-center justify-center group-hover:bg-blue-500/20 transition-colors">
                                    <MessageCircle className="w-8 h-8 text-blue-500" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-foreground">Live Chat</h3>
                                    <p className="text-muted-foreground mt-2">Connect with an agent instantly.</p>
                                    <p className="text-sm text-muted-foreground mt-1">Wait time: ~2 mins</p>
                                </div>
                                <Button className="w-full max-w-xs gap-2">
                                    Start Chat <MessageCircle className="w-4 h-4" />
                                </Button>
                            </CardContent>
                        </Card>

                        <Card className="bg-card border-border hover:border-primary/50 transition-colors cursor-pointer group">
                            <CardContent className="p-8 flex flex-col items-center text-center space-y-4">
                                <div className="w-16 h-16 rounded-full bg-purple-500/10 flex items-center justify-center group-hover:bg-purple-500/20 transition-colors">
                                    <Mail className="w-8 h-8 text-purple-500" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-foreground">Email Support</h3>
                                    <p className="text-muted-foreground mt-2">Send us a detailed message.</p>
                                    <p className="text-sm text-muted-foreground mt-1">Response: ~24 hrs</p>
                                </div>
                                <Button variant="outline" className="w-full max-w-xs gap-2">
                                    Send Email <Mail className="w-4 h-4" />
                                </Button>
                            </CardContent>
                        </Card>

                        <Card className="bg-card border-border hover:border-primary/50 transition-colors cursor-pointer group md:col-span-2">
                            <CardContent className="p-8 flex items-center justify-between gap-6">
                                <div className="flex items-center gap-6">
                                    <div className="w-16 h-16 rounded-full bg-orange-500/10 flex items-center justify-center group-hover:bg-orange-500/20 transition-colors">
                                        <ExternalLink className="w-8 h-8 text-orange-500" />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold text-foreground">Community Forum</h3>
                                        <p className="text-muted-foreground mt-1">Join the discussion with other users and experts.</p>
                                    </div>
                                </div>
                                <Button variant="ghost" className="hidden sm:flex gap-2">
                                    Visit Forum <ChevronRight className="w-4 h-4" />
                                </Button>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                {/* Feedback Tab */}
                <TabsContent value="feedback" className="max-w-2xl mx-auto">
                    <Card className="bg-card border-border">
                        <CardHeader>
                            <CardTitle className="text-center">Rate your experience</CardTitle>
                            <CardDescription className="text-center">
                                Your feedback helps us improve the platform for everyone
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {feedbackSubmitted ? (
                                <div className="text-center py-12 space-y-4">
                                    <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <CheckCircle2 className="w-10 h-10 text-green-500" />
                                    </div>
                                    <h3 className="text-2xl font-bold text-foreground">Thank You!</h3>
                                    <p className="text-muted-foreground">Your feedback has been submitted successfully.</p>
                                    <Button variant="outline" className="mt-6" onClick={() => {
                                        setFeedbackSubmitted(false)
                                        setRating(0)
                                        setFeedbackText("")
                                    }}>
                                        Submit more feedback
                                    </Button>
                                </div>
                            ) : (
                                <div className="space-y-8">
                                    <div className="flex justify-center gap-2">
                                        {[1, 2, 3, 4, 5].map((star) => (
                                            <button
                                                key={star}
                                                className="p-1 transition-transform hover:scale-110 focus:outline-none"
                                                onMouseEnter={() => setHoverRating(star)}
                                                onMouseLeave={() => setHoverRating(0)}
                                                onClick={() => setRating(star)}
                                            >
                                                <Star
                                                    className={`w-10 h-10 transition-colors ${(hoverRating || rating) >= star
                                                            ? "text-amber-400 fill-amber-400"
                                                            : "text-muted-foreground/30"
                                                        }`}
                                                />
                                            </button>
                                        ))}
                                    </div>

                                    <div className="space-y-4">
                                        <div className="grid grid-cols-3 gap-3">
                                            {['Bug Report', 'Feature Request', 'General'].map((cat) => (
                                                <button
                                                    key={cat}
                                                    onClick={() => setFeedbackCategory(cat.toLowerCase())}
                                                    className={`py-2 px-3 rounded-lg text-sm font-medium border transition-all ${feedbackCategory === cat.toLowerCase()
                                                            ? "bg-primary/20 border-primary text-primary"
                                                            : "bg-secondary/50 border-border text-muted-foreground hover:bg-secondary"
                                                        }`}
                                                >
                                                    {cat}
                                                </button>
                                            ))}
                                        </div>

                                        <Textarea
                                            placeholder="Tell us more about your experience..."
                                            className="min-h-[150px] bg-secondary/50 border-border resize-none text-base"
                                            value={feedbackText}
                                            onChange={(e) => setFeedbackText(e.target.value)}
                                        />
                                    </div>

                                    <Button
                                        className="w-full h-12 text-base gap-2"
                                        onClick={handleFeedbackSubmit}
                                        disabled={rating === 0 || isSubmittingFeedback}
                                    >
                                        {isSubmittingFeedback ? (
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                        ) : (
                                            <>
                                                Submit Feedback <Send className="w-4 h-4" />
                                            </>
                                        )}
                                    </Button>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    )
}
