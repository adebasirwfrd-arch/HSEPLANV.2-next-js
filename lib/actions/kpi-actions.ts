"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function getKPIYear(year: number) {
    const supabase = await createClient();

    // 1. Try to fetch the year
    const { data: existingYear, error: fetchError } = await supabase
        .from("hse_kpi_years")
        .select("*, hse_kpi_metrics(*)")
        .eq("year", year)
        .single();

    if (fetchError && fetchError.code !== "PGRST116") {
        console.error("Error fetching KPI year:", fetchError);
        return null;
    }

    // 2. If exists, return it
    if (existingYear) {
        return {
            yearData: existingYear,
            metrics: existingYear.hse_kpi_metrics || [],
        };
    }

    // 3. If not exists, CREATE it
    // We cast to 'any' to bypass strict TypeScript checks on Vercel
    const { data: newYear, error: insertError } = await supabase
        .from("hse_kpi_years")
        .insert([{ year, man_hours: 0 }] as any)
        .select()
        .single();

    if (insertError) {
        console.error("Error creating KPI year:", insertError);
        return null;
    }

    return { yearData: newYear, metrics: [] };
}

export async function updateManHours(year: number, hours: number) {
    const supabase = await createClient();

    const { error } = await supabase
        .from("hse_kpi_years")
        .update({ man_hours: hours } as any)
        .eq("year", year);

    if (error) throw new Error(error.message);
    revalidatePath("/kpi");
}

export async function saveMetric(year: number, metric: any) {
    const supabase = await createClient();

    // First get the year_id
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

    // If ID exists, it's an update, otherwise insert
    // We use upsert with 'as any' to handle the types
    const { error } = await supabase
        .from("hse_kpi_metrics")
        .upsert(metric.id ? { ...payload, id: metric.id } : payload as any)
        .select();

    if (error) throw new Error(error.message);
    revalidatePath("/kpi");
}

export async function deleteMetric(id: string) {
    const supabase = await createClient();
    const { error } = await supabase.from("hse_kpi_metrics").delete().eq("id", id);
    if (error) throw new Error(error.message);
    revalidatePath("/kpi");
}
