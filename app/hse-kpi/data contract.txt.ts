The user has set up the OpenAI API Key.Now we need to implement the backend logic.

Please perform the following steps:

1. ** Install SDK **: Run`npm install openai`(if not already installed).

2. ** Create Types Definition(`types/ai-analytics.ts`) **:
    Define the structure for the data we will send to AI.
    ```typescript
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
    ```

3. ** Create API Route(`app/api/ai-insight/route.ts`) **:
- Initialize`OpenAI` client.
    - Create a POST handler that receives`data: DashboardSnapshot`.
    - ** System Prompt **:
"You are a Senior HSE Manager. Analyze this safety dashboard data (JSON).
Context:
- OTP Compliance: ${ data.otp.compliance }%
    - KPI TRIR: ${ data.kpi.trir }
- Open Tasks: ${ data.tasks.open }
       
       Return a JSON response(strictly matching AIAnalysisResult interface) containing:
- An executive summary.
       - The single most critical risk based on the data(e.g.if compliance is low but tasks are high).
       - 3 specific, actionable recommendations.
       - A safety health score(0 - 100)."
    - Use`response_format: { type: "json_object" }` if using a model that supports it, or instruct strict JSON in prompt.

Please provide the code for `types/ai-analytics.ts` and`app/api/ai-insight/route.ts`.