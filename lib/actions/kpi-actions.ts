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

    // Cast the entire from() call to any to bypass strict type inference
    const { data: existingYear, error: fetchError } = await (supabase
        .from("hse_kpi_years") as any)
        .select("*, hse_kpi_metrics(*)")
        .eq("year", year)
        .single();

    if (fetchError && fetchError.code !== "PGRST116") {
        console.error("Error fetching KPI:", fetchError);
        return null;
    }

    if (existingYear) {
        return {
            id: existingYear.id,
            year: existingYear.year,
            man_hours: existingYear.man_hours,
            metrics: existingYear.hse_kpi_metrics || [],
        } as KPIData;
    }

    // Create if not exists
    const { data: newYear, error: insertError } = await (supabase
        .from("hse_kpi_years") as any)
        .insert([{ year, man_hours: 0 }])
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

    // Cast entire from() to any to bypass 'never' type
    await (supabase.from("hse_kpi_years") as any)
        .update({ man_hours: hours })
        .eq("year", year);

    revalidatePath("/kpi");
}

export async function saveMetric(year: number, metric: any) {
    const supabase = await createClient();

    // Get Year ID
    const { data: yearData } = await (supabase
        .from("hse_kpi_years") as any)
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

    // Upsert Metric - cast from() to any
    const { error } = await (supabase.from("hse_kpi_metrics") as any)
        .upsert(metric.id ? { ...payload, id: metric.id } : payload)
        .select();

    if (error) throw new Error(error.message);
    revalidatePath("/kpi");
}

export async function deleteMetric(id: string) {
    const supabase = await createClient();

    // Cast from() to any
    await (supabase.from("hse_kpi_metrics") as any)
        .delete()
        .eq("id", id);

    revalidatePath("/kpi");
}
