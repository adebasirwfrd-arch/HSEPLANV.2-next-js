"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import {
    getKPIYear,
    updateManHours,
    saveMetric,
    deleteMetric,
    type KPIData,
    type KPIMetric,
} from "@/lib/actions/kpi-actions"

/**
 * Hook for fetching KPI data for a specific year
 */
export function useKPIData(year: number) {
    return useQuery<KPIData | null>({
        queryKey: ["kpi", year],
        queryFn: () => getKPIYear(year),
        staleTime: 1000 * 60 * 5, // 5 minutes
    })
}

/**
 * Hook for updating man hours
 */
export function useUpdateManHours() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: ({ year, hours }: { year: number; hours: number }) =>
            updateManHours(year, hours),
        onSuccess: (_, variables) => {
            // Invalidate the specific year's data
            queryClient.invalidateQueries({ queryKey: ["kpi", variables.year] })
        },
        onError: (error) => {
            console.error("Failed to update man hours:", error)
        },
    })
}

/**
 * Hook for saving a metric (create or update)
 */
export function useSaveMetric() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: ({
            year,
            metric,
        }: {
            year: number
            metric: {
                id?: string
                name: string
                target: number
                result: number
                icon?: string
            }
        }) => saveMetric(year, metric),
        onSuccess: () => {
            // Invalidate all KPI queries to refresh data
            queryClient.invalidateQueries({ queryKey: ["kpi"] })
        },
        onError: (error) => {
            console.error("Failed to save metric:", error)
        },
    })
}

/**
 * Hook for deleting a metric
 */
export function useDeleteMetric() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (id: string) => deleteMetric(id),
        onSuccess: () => {
            // Invalidate all KPI queries to refresh data
            queryClient.invalidateQueries({ queryKey: ["kpi"] })
        },
        onError: (error) => {
            console.error("Failed to delete metric:", error)
        },
    })
}

/**
 * Combined hook for all KPI operations
 */
export function useKPI(year: number) {
    const { data, isLoading, error, refetch } = useKPIData(year)
    const updateManHoursMutation = useUpdateManHours()
    const saveMetricMutation = useSaveMetric()
    const deleteMetricMutation = useDeleteMetric()

    return {
        // Data
        id: data?.id || null,
        year: data?.year || year,
        manHours: data?.man_hours || 0,
        metrics: data?.metrics || [],
        isLoading,
        error,

        // Actions
        refetch,

        updateManHours: (hours: number) =>
            updateManHoursMutation.mutateAsync({ year, hours }),

        saveMetric: (metric: {
            id?: string
            name: string
            target: number
            result: number
            icon?: string
        }) => saveMetricMutation.mutateAsync({ year, metric }),

        deleteMetric: (id: string) =>
            deleteMetricMutation.mutateAsync(id),

        // Mutation states
        isUpdating:
            updateManHoursMutation.isPending ||
            saveMetricMutation.isPending ||
            deleteMetricMutation.isPending,
    }
}

// Re-export types for convenience
export type { KPIData, KPIMetric }
