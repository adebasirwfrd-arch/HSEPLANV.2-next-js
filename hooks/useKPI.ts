"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import {
    getKPIYear,
    updateManHours,
    saveMetric,
    deleteMetric,
    getKPIYears,
    type KPIData,
    type KPIMetric,
} from "@/lib/actions/kpi-actions"

/**
 * Hook for fetching KPI data for a specific year
 */
export function useKPIData(year: number) {
    return useQuery<KPIData>({
        queryKey: ["kpi", year],
        queryFn: () => getKPIYear(year),
        staleTime: 1000 * 60 * 5, // 5 minutes
    })
}

/**
 * Hook for fetching all available KPI years
 */
export function useKPIYears() {
    return useQuery<number[]>({
        queryKey: ["kpi-years"],
        queryFn: () => getKPIYears(),
        staleTime: 1000 * 60 * 10, // 10 minutes
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
        onSuccess: (_, variables) => {
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
    const queryClient = useQueryClient()
    const { data, isLoading, error, refetch } = useKPIData(year)
    const updateManHoursMutation = useUpdateManHours()
    const saveMetricMutation = useSaveMetric()
    const deleteMetricMutation = useDeleteMetric()

    return {
        // Data
        yearData: data?.yearData || null,
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
