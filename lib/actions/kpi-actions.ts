"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export interface KPIMetric {
    id: string;
    name: string;
    target: number;
    result: number;
    icon?: string;
}

export interface KPIData {
    id: number;
    year: number;
    man_hours: number;
    metrics: KPIMetric[];
}

export async function getKPIYear(year: number) {
    const supabase = await createClient();

    // 1. Try to fetch
    const { data: existingYear, error: fetchError } = await supabase
        .from("hse_kpi_years")
        .select("*, hse_kpi_metrics(*)")
        .eq("year", year)
        .single();

    if (fetchError && fetchError.code !== "PGRST116") {
        console.error("Error fetching KPI:", fetchError);
        return null;
    }

    // 2. If exists, return formatted
    if (existingYear) {
        return {
            id: existingYear.id,
            year: existingYear.year,
            man_hours: existingYear.man_hours,
            metrics: existingYear.hse_kpi_metrics || [],
        } as KPIData;
    }

    // 3. Create if not exists (using 'any' to bypass strict Vercel types)
    const { data: newYear, error: insertError } = await supabase
        .from("hse_kpi_years")
        .insert([{ year, man_hours: 0 }] as any)
        .select()
        .single();

    if (insertError) {
        console.error("Error creating KPI year:", insertError);
        return null;
    }

    return {
        id: newYear.id,
        year: newYear.year,
        man_hours: newYear.man_hours,
        metrics: [],
    } as KPIData;
}

export async function updateManHours(year: number, hours: number) {
    const supabase = await createClient();
    await supabase
        .from("hse_kpi_years")
        .update({ man_hours: hours } as any)
        .eq("year", year);
    revalidatePath("/kpi");
}

export async function saveMetric(year: number, metric: any) {
    const supabase = await createClient();

    // Get Year ID
    const { data: yearData } = await supabase
        .from("hse_kpi_years")
        .select("id")
        .eq("year", year)
        .single();

    if (!yearData) throw new Error("Year not found");

    const payload = {
        year_id: yearData.id,
        name: metric.name,
        target: metric.target,
        result: metric.result,
        icon: metric.icon,
    };

    // Upsert Metric
    const { error } = await supabase
        .from("hse_kpi_metrics")
        .upsert(metric.id ? { ...payload, id: metric.id } : payload as any)
        .select();

    if (error) throw new Error(error.message);
    revalidatePath("/kpi");
}

export async function deleteMetric(id: string) {
    const supabase = await createClient();
    await supabase.from("hse_kpi_metrics").delete().eq("id", id);
    revalidatePath("/kpi");
}
