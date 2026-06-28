import { getInventoryVehiclesSync } from "@/services/vehicle-engine";
import type { InventoryShowcaseData, InventoryVehicle } from "@/features/inventory/types/inventory.types";

export const INVENTORY_SHOWCASE: InventoryShowcaseData = {
  kpis: [
    { id: "total", label: "Total Vehicles", value: "84", explanation: "All stock across branches", icon: "Car", trend: { direction: "up", label: "+3 this week" } },
    { id: "live", label: "Live Listings", value: "76", explanation: "Published on marketplace", icon: "Eye", trend: { direction: "up", label: "+2 today" } },
    { id: "draft", label: "Draft Listings", value: "5", explanation: "Awaiting publication", icon: "FileText", trend: { direction: "neutral", label: "2 ready to publish" } },
    { id: "featured", label: "Featured Listings", value: "12", explanation: "Boosted visibility", icon: "Sparkles", trend: { direction: "neutral", label: "3 expiring soon" } },
    { id: "days", label: "Avg Days in Stock", value: "38", explanation: "Time to sell benchmark", icon: "Clock", trend: { direction: "down", label: "4 days vs last month" } },
    { id: "avg-price", label: "Average Selling Price", value: "R 685K", explanation: "Mean list price", icon: "TrendingUp", trend: { direction: "up", label: "+2.1% vs last month" } },
    { id: "value", label: "Total Inventory Value", value: "R 42.8M", explanation: "At current list prices", icon: "BarChart3", trend: { direction: "up", label: "+R 1.2M" } },
    { id: "attention", label: "Requiring Attention", value: "19", explanation: "Low score or stale listings", icon: "AlertTriangle", trend: { direction: "down", label: "5 resolved this week" } },
  ],
  alerts: [
    { id: "a1", message: "12 vehicles have had no enquiries in 30 days.", severity: "high" },
    { id: "a2", message: "7 listings need better photos.", severity: "high" },
    { id: "a3", message: "4 vehicles are priced above market.", severity: "medium" },
    { id: "a4", message: "3 listings expire this week.", severity: "medium" },
    { id: "a5", message: "Professional photos could improve enquiries by up to 27%.", severity: "info" },
    { id: "a6", message: "Your average listing score is 82%.", severity: "info" },
  ],
  vehicles: getInventoryVehiclesSync(),
  recommendedActions: [
    { id: "r1", label: "Replace photos — Ford Ranger Wildtrak", vehicleId: "inv-6", priority: "high" },
    { id: "r2", label: "Reduce price — VW Polo GTI by R8,000", vehicleId: "inv-7", priority: "high" },
    { id: "r3", label: "Renew featured listing — VW Polo GTI", vehicleId: "inv-7", priority: "high" },
    { id: "r4", label: "Complete missing specs — Isuzu D-Max", vehicleId: "inv-8", priority: "medium" },
    { id: "r5", label: "Boost listing — BMW X5", vehicleId: "inv-1", priority: "low" },
    { id: "r6", label: "Share Range Rover Sport to social media", vehicleId: "inv-3", priority: "low" },
  ],
  charts: {
    views: { id: "views", label: "Views", values: [420, 480, 510, 590, 620, 680, 720, 780, 810, 860, 890, 920] },
    enquiries: { id: "enquiries", label: "Enquiries", values: [8, 10, 9, 12, 14, 11, 15, 18, 16, 20, 22, 24] },
    conversion: { id: "conversion", label: "Conversion", values: [2, 2, 3, 3, 4, 3, 5, 4, 6, 5, 7, 8] },
    daysInStock: { id: "days", label: "Avg Days in Stock", values: [42, 41, 40, 39, 40, 38, 37, 38, 39, 38, 37, 38] },
    priceTrends: { id: "price", label: "Avg List Price (index)", values: [100, 101, 100, 102, 101, 103, 102, 104, 103, 105, 104, 106] },
    topPerformers: [
      { title: "2024 BMW X5 xDrive40i", views: 842 },
      { title: "2024 Toyota Hilux Raider", views: 620 },
      { title: "2023 Mercedes GLC 300d", views: 420 },
    ],
    slowMovers: [
      { title: "2019 VW Polo GTI", days: 67 },
      { title: "2021 Ford Ranger Wildtrak", days: 52 },
      { title: "2022 Range Rover Sport", days: 45 },
    ],
  },
} as const;

export function getInventoryShowcase(): InventoryShowcaseData {
  return INVENTORY_SHOWCASE;
}

export function getInventoryVehicleById(id: string): InventoryVehicle | undefined {
  return INVENTORY_SHOWCASE.vehicles.find((v) => v.id === id);
}
