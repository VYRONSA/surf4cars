import type { BusinessIntelligenceSectionId } from "@/features/operations/config/business-intelligence-sections";

export interface ExecutiveKpi {
  readonly id: string;
  readonly label: string;
  readonly value: string;
  readonly detail: string;
  readonly availability: "live" | "coming-soon";
}

export interface GrowthTrendRow {
  readonly id: string;
  readonly metric: string;
  readonly daily: string;
  readonly weekly: string;
  readonly monthly: string;
  readonly quarterly: string;
  readonly annual: string;
  readonly availability: "live" | "coming-soon";
  readonly detail: string;
}

export interface ExecutiveModuleSnapshot {
  readonly id: string;
  readonly module: string;
  readonly health: string;
  readonly growthSignal: string;
  readonly operationalSignal: string;
  readonly availability: "live" | "coming-soon";
}

export interface ExecutiveAiInsight {
  readonly id: string;
  readonly label: string;
  readonly value: string;
  readonly detail: string;
  readonly availability: "live" | "coming-soon";
}

export interface ExecutiveForecastExtension {
  readonly id: string;
  readonly label: string;
  readonly status: "framework" | "coming-soon";
  readonly detail: string;
  readonly extensionPoint: string;
}

export interface ExecutiveReportRow {
  readonly id: string;
  readonly name: string;
  readonly status: "ready" | "coming-soon";
  readonly source: string;
  readonly detail: string;
}

export interface ExecutiveTimelineItem {
  readonly id: string;
  readonly eventName: string;
  readonly source: string;
  readonly actorType: string;
  readonly detail: string;
  readonly createdAt: string;
}

export interface ExecutiveAuditItem {
  readonly id: string;
  readonly action: string;
  readonly source: string;
  readonly actorType: string;
  readonly createdAt: string;
}

export interface BusinessIntelligenceWorkspaceData {
  readonly generatedAt: string;
  readonly sectionId: BusinessIntelligenceSectionId;
  readonly executiveKpis: readonly ExecutiveKpi[];
  readonly growthTrends: readonly GrowthTrendRow[];
  readonly moduleSnapshots: readonly ExecutiveModuleSnapshot[];
  readonly aiInsights: readonly ExecutiveAiInsight[];
  readonly forecasts: readonly ExecutiveForecastExtension[];
  readonly reports: readonly ExecutiveReportRow[];
  readonly timeline: readonly ExecutiveTimelineItem[];
  readonly audit: readonly ExecutiveAuditItem[];
  readonly sourceReadiness: readonly {
    readonly id: string;
    readonly label: string;
    readonly mode: "live" | "manual" | "coming-soon";
    readonly detail: string;
  }[];
}

export type BusinessIntelligenceActionType = "export-report" | "refresh-snapshot" | "acknowledge-risk";

export interface BusinessIntelligenceActionInput {
  readonly action: BusinessIntelligenceActionType;
  readonly referenceId?: string;
  readonly note?: string;
  readonly actorId?: string;
  readonly actorName?: string;
}