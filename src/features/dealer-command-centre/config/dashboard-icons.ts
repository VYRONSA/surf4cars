import type { LucideIcon } from "lucide-react";

import {
  BarChart3,
  Building2,
  Calendar,
  Car,
  CheckCircle2,
  Clock,
  Eye,
  FileText,
  AlertTriangle,
  Gauge,
  Megaphone,
  MessageSquare,
  Plus,
  Sparkles,
  TrendingDown,
  TrendingUp,
  Upload,
  Users,
} from "@/components/ui/icons/registry";

export const DASHBOARD_ICON_MAP: Record<string, LucideIcon> = {
  Car,
  Eye,
  Sparkles,
  CheckCircle2,
  Users,
  MessageSquare,
  Calendar,
  Clock,
  Building2,
  BarChart3,
  Gauge,
  TrendingUp,
  Plus,
  Megaphone,
  Upload,
  TrendingDown,
  FileText,
  AlertTriangle,
};

export function resolveDashboardIcon(name: string): LucideIcon {
  return DASHBOARD_ICON_MAP[name] ?? BarChart3;
}
