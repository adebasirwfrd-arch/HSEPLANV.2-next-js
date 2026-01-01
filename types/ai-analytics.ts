// AI Analytics Types for HSE Dashboard Insights

export interface DashboardSnapshot {
    otp: {
        compliance: number;
        overdueCount: number;
        criticalItems: string[]; // Names of top 3 overdue items
    };
    matrix: {
        compliance: number;
        totalPrograms: number;
    };
    kpi: {
        manHours: number;
        trir: number;
        incidents: number;
    };
    tasks: {
        open: number;
        completed: number;
    };
    llIndicators: {
        ratio: string; // e.g. "1:5"
    };
}

export interface AIAnalysisResult {
    summary: string; // 1 sentence executive summary
    risk: string; // The biggest risk identified
    actions: string[]; // 3 bullet points of strategic actions
    score: number; // 0-100 health score
    tone: 'good' | 'warning' | 'critical';
}
