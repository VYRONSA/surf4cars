import type { DashboardShowcaseData } from "@/features/dealer-command-centre/types/dashboard.types";

export const DEALER_DASHBOARD_SHOWCASE: DashboardShowcaseData = {
  dealer: {
    name: "Atlantic Auto Collective",
    subscription: "Premium Pro",
    profileCompletion: 87,
    lastLogin: "Today, 08:42",
  },
  kpis: [
    { id: "stock", label: "Vehicles in Stock", value: "84", explanation: "Active inventory across all branches", icon: "Car", trend: { direction: "up", label: "+3 this week" } },
    { id: "live", label: "Live Listings", value: "76", explanation: "Published on SURF marketplace", icon: "Eye", trend: { direction: "up", label: "+2 today" } },
    { id: "featured", label: "Featured Listings", value: "12", explanation: "Boosted visibility placements", icon: "Sparkles", trend: { direction: "neutral", label: "2 expiring soon" } },
    { id: "sold", label: "Sold This Month", value: "9", explanation: "Completed sales in June", icon: "CheckCircle2", trend: { direction: "up", label: "+18% vs last month" } },
    { id: "leads", label: "New Leads Today", value: "7", explanation: "Enquiries received today", icon: "Users", trend: { direction: "up", label: "+4 vs yesterday" } },
    { id: "messages", label: "Unread Messages", value: "5", explanation: "Awaiting dealer response", icon: "MessageSquare", trend: { direction: "down", label: "2 urgent" } },
    { id: "test-drives", label: "Test Drives Booked", value: "4", explanation: "Scheduled this week", icon: "Calendar", trend: { direction: "up", label: "+1 today" } },
    { id: "response", label: "Avg Response Time", value: "42m", explanation: "Last 30 days average", icon: "Clock", trend: { direction: "down", label: "8m slower than target" } },
    { id: "profile-views", label: "Profile Views (30d)", value: "1,284", explanation: "Dealer profile impressions", icon: "Building2", trend: { direction: "up", label: "+12% vs prior period" } },
    { id: "vehicle-views", label: "Vehicle Views (30d)", value: "18,420", explanation: "Listing page views", icon: "BarChart3", trend: { direction: "up", label: "+9% vs prior period" } },
    { id: "days-stock", label: "Avg Days in Stock", value: "38", explanation: "Time to sell benchmark", icon: "Gauge", trend: { direction: "neutral", label: "Within target range" } },
    { id: "inventory-value", label: "Est. Inventory Value", value: "R 42.8M", explanation: "Total stock at list price", icon: "TrendingUp", trend: { direction: "up", label: "+R 1.2M this month" } },
  ],
  aiInsights: [
    { id: "1", message: "Your 2024 BMW X5 listing has received 42% more views than similar vehicles in Cape Town.", priority: "high" },
    { id: "2", message: "Reduce the price of the 2021 Ford Ranger Wildtrak by R8,000 to improve visibility in search results.", priority: "high" },
    { id: "3", message: "You have 5 enquiries awaiting follow-up — respond within 1 hour to improve conversion.", priority: "high" },
    { id: "4", message: "Your average response time is 8 minutes slower than similar premium dealerships.", priority: "medium" },
    { id: "5", message: "Vehicles photographed professionally receive 27% more enquiries on average.", priority: "low" },
  ],
  leads: [
    { id: "l1", buyer: "Thabo M.", vehicle: "2024 BMW X5 xDrive40i", date: "Today, 09:14", status: "new", nextAction: "Call within 1 hour" },
    { id: "l2", buyer: "Sarah K.", vehicle: "2023 Mercedes GLC 300d", date: "Today, 08:52", status: "follow-up", nextAction: "Send finance options" },
    { id: "l3", buyer: "James V.", vehicle: "2024 Toyota Hilux Raider", date: "Yesterday", status: "qualified", nextAction: "Book test drive" },
    { id: "l4", buyer: "Nadia P.", vehicle: "2023 Audi e-tron GT", date: "Yesterday", status: "contacted", nextAction: "Follow up on WhatsApp" },
    { id: "l5", buyer: "David L.", vehicle: "2022 Range Rover Sport", date: "2 days ago", status: "new", nextAction: "Send vehicle brochure" },
  ],
  inventory: [
    { id: "i1", title: "2024 BMW X5 xDrive40i", meta: "Added 2 days ago", category: "recent" },
    { id: "i2", title: "2021 Ford Ranger Wildtrak", meta: "Only 2 photos uploaded", category: "photos" },
    { id: "i3", title: "2023 Mercedes GLC 300d", meta: "18 views in 14 days", category: "low-views" },
    { id: "i4", title: "2022 Range Rover Sport", meta: "R 45,000 above market", category: "above-market" },
    { id: "i5", title: "2024 Toyota Hilux Raider", meta: "R 12,000 below market", category: "below-market" },
    { id: "i6", title: "2019 VW Polo GTI", meta: "Featured expires in 3 days", category: "expiring" },
  ],
  tasks: [
    { id: "t1", label: "Upload photos for Ford Ranger Wildtrak", completed: false, priority: "high" },
    { id: "t2", label: "Reply to 5 pending lead enquiries", completed: false, priority: "high" },
    { id: "t3", label: "Renew expiring featured listing — VW Polo GTI", completed: false, priority: "medium" },
    { id: "t4", label: "Complete dealer profile — add showroom photos", completed: false, priority: "medium" },
    { id: "t5", label: "Promote BMW X5 with weekend boost", completed: false, priority: "low" },
    { id: "t6", label: "Book inspection for incoming trade-in", completed: true, priority: "low" },
  ],
  quickActions: [
    { id: "add", label: "Add Vehicle", icon: "Plus", href: "/dealer/inventory/new" },
    { id: "inventory", label: "Manage Inventory", icon: "Car", href: "/dealer/inventory" },
    { id: "leads", label: "View Leads", icon: "Users", href: "/dealer/leads" },
    { id: "promo", label: "Create Promotion", icon: "Megaphone", href: "/dealer/marketing/campaigns" },
    { id: "price", label: "AI Price Check", icon: "Sparkles", href: "/dealer/ai/insights" },
    { id: "boost", label: "Boost Listing", icon: "TrendingUp", href: "/dealer/marketing/campaigns" },
    { id: "import", label: "Import Vehicles", icon: "Upload", href: "/dealer/inventory" },
  ],
  health: [
    { id: "rating", label: "Dealer Rating", value: "4.9 / 5", status: "good" },
    { id: "response", label: "Avg Response Time", value: "42 minutes", status: "warning" },
    { id: "verified", label: "Verified Status", value: "Verified Dealer", status: "good" },
    { id: "profile", label: "Profile Completeness", value: "87%", status: "warning" },
    { id: "satisfaction", label: "Customer Satisfaction", value: "94%", status: "good" },
  ],
  recommendations: [
    "Add professional photos to 3 listings with low engagement",
    "Respond to urgent leads before 11:00 to hit your SLA target",
    "Enable WhatsApp quick replies for faster buyer contact",
  ],
  activities: [
    { id: "a1", message: "2024 BMW X5 viewed 12 times in the last hour", timestamp: "10 min ago", type: "view" },
    { id: "a2", message: "New lead received for Mercedes GLC 300d", timestamp: "28 min ago", type: "lead" },
    { id: "a3", message: "Toyota Hilux saved by 3 buyers", timestamp: "1 hr ago", type: "save" },
    { id: "a4", message: "Range Rover Sport price updated to R 1,650,000", timestamp: "2 hrs ago", type: "price" },
    { id: "a5", message: "Weekend boost promotion ended for Audi e-tron GT", timestamp: "4 hrs ago", type: "promotion" },
    { id: "a6", message: "VW Polo GTI featured listing expires tomorrow", timestamp: "6 hrs ago", type: "expiry" },
  ],
  charts: {
    views: { id: "views", label: "Views", values: [420, 380, 510, 490, 620, 580, 710, 680, 740, 820, 790, 860] },
    enquiries: { id: "enquiries", label: "Enquiries", values: [12, 15, 11, 18, 14, 22, 19, 24, 21, 28, 26, 31] },
    conversions: { id: "conversions", label: "Conversions", values: [2, 3, 2, 4, 3, 5, 4, 6, 5, 7, 6, 9] },
    inventoryGrowth: { id: "inventory", label: "Inventory", values: [72, 74, 73, 76, 78, 77, 80, 81, 82, 83, 84, 84] },
    leadSources: [
      { label: "Search", value: 42 },
      { label: "Direct", value: 18 },
      { label: "Featured", value: 15 },
      { label: "Social", value: 12 },
      { label: "Referral", value: 8 },
      { label: "Other", value: 5 },
    ],
    dailyTraffic: { id: "traffic", label: "Daily Traffic", values: [180, 210, 195, 240, 220, 260, 285] },
    monthlySales: { id: "sales", label: "Monthly Sales", values: [5, 7, 6, 8, 7, 9, 8, 10, 9, 11, 9, 12] },
  },
} as const;

export function getDealerDashboardShowcase(): DashboardShowcaseData {
  return DEALER_DASHBOARD_SHOWCASE;
}
