"use server"

import { createClient } from "@/lib/supabase/server"

// Types
export interface KPIYear {
    id: number
    year: number
    man_hours: number
    created_at: string
}

export interface KPIMetric {
    id: string
    year_id: number
    name: string
    target: number
    result: number
    icon: string | null
    created_at: string
}

export interface KPIData {
    yearData: KPIYear | null
    metrics: KPIMetric[]
}

/**
 * Get KPI data for a specific year
 * Creates the year if it doesn't exist (idempotent)
 */
export async function getKPIYear(year: number): Promise<KPIData> {
    const supabase = await createClient()

    // Try to fetch the year
    let { data: yearData, error: yearError } = await supabase
        .from("hse_kpi_years")
        .select("*")
        .eq("year", year)
        .single()

    // If year doesn't exist, create it
    if (yearError && yearError.code === "PGRST116") {
        const { data: newYear, error: insertError } = await supabase
            .from("hse_kpi_years")
            .insert({ year, man_hours: 0 })
            .select()
            .single()

        if (insertError) {
            console.error("Error creating KPI year:", insertError)
            return { yearData: null, metrics: [] }
        }

        yearData = newYear
    } else if (yearError) {
        console.error("Error fetching KPI year:", yearError)
        return { yearData: null, metrics: [] }
    }

    // Fetch all metrics for this year
    const { data: metrics, error: metricsError } = await supabase
        .from("hse_kpi_metrics")
        .select("*")
        .eq("year_id", yearData?.id)
        .order("created_at", { ascending: true })

    if (metricsError) {
        console.error("Error fetching KPI metrics:", metricsError)
        return { yearData, metrics: [] }
    }

    return {
        yearData,
        metrics: metrics || [],
    }
}

/**
 * Update man hours for a specific year
 */
export async function updateManHours(
    year: number,
    hours: number
): Promise<{ success: boolean; error?: string }> {
    const supabase = await createClient()

    const { error } = await supabase
        .from("hse_kpi_years")
        .update({ man_hours: hours })
        .eq("year", year)

    if (error) {
        console.error("Error updating man hours:", error)
        return { success: false, error: error.message }
    }

    return { success: true }
}

/**
 * Save or update a metric (UPSERT)
 */
export async function saveMetric(
    year: number,
    metric: {
        id?: string
        name: string
        target: number
        result: number
        icon?: string
    }
): Promise<{ success: boolean; metric?: KPIMetric; error?: string }> {
    const supabase = await createClient()

    // Get year_id first
    const { data: yearData, error: yearError } = await supabase
        .from("hse_kpi_years")
        .select("id")
        .eq("year", year)
        .single()

    if (yearError || !yearData) {
        // Create the year if it doesn't exist
        const { data: newYear, error: insertYearError } = await supabase
            .from("hse_kpi_years")
            .insert({ year, man_hours: 0 })
            .select("id")
            .single()

        if (insertYearError) {
            return { success: false, error: "Failed to create year" }
        }

        yearData.id = newYear.id
    }

    if (metric.id) {
        // Update existing metric
        const { data, error } = await supabase
            .from("hse_kpi_metrics")
            .update({
                name: metric.name,
                target: metric.target,
                result: metric.result,
                icon: metric.icon || null,
            })
            .eq("id", metric.id)
            .select()
            .single()

        if (error) {
            console.error("Error updating metric:", error)
            return { success: false, error: error.message }
        }

        return { success: true, metric: data }
    } else {
        // Insert new metric
        const { data, error } = await supabase
            .from("hse_kpi_metrics")
            .insert({
                year_id: yearData.id,
                name: metric.name,
                target: metric.target,
                result: metric.result,
                icon: metric.icon || null,
            })
            .select()
            .single()

        if (error) {
            console.error("Error inserting metric:", error)
            return { success: false, error: error.message }
        }

        return { success: true, metric: data }
    }
}

/**
 * Delete a metric by ID
 */
export async function deleteMetric(
    id: string
): Promise<{ success: boolean; error?: string }> {
    const supabase = await createClient()

    const { error } = await supabase
        .from("hse_kpi_metrics")
        .delete()
        .eq("id", id)

    if (error) {
        console.error("Error deleting metric:", error)
        return { success: false, error: error.message }
    }

    return { success: true }
}

/**
 * Get all available years
 */
export async function getKPIYears(): Promise<number[]> {
    const supabase = await createClient()

    const { data, error } = await supabase
        .from("hse_kpi_years")
        .select("year")
        .order("year", { ascending: false })

    if (error) {
        console.error("Error fetching KPI years:", error)
        return []
    }

    return data?.map((row) => row.year) || []
}
