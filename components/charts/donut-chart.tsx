"use client"

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts"

interface DonutChartProps {
    data: Array<{
        name: string
        value: number
        color: string
    }>
    innerRadius?: number
    outerRadius?: number
    centerLabel?: string
    centerValue?: string | number
    height?: number
}

export function DonutChart({
    data,
    innerRadius = 60,
    outerRadius = 80,
    centerLabel,
    centerValue,
    height = 200
}: DonutChartProps) {
    return (
        <div className="relative">
            <ResponsiveContainer width="100%" height={height}>
                <PieChart>
                    <Pie
                        data={data}
                        cx="50%"
                        cy="50%"
                        innerRadius={innerRadius}
                        outerRadius={outerRadius}
                        paddingAngle={4}
                        dataKey="value"
                        stroke="none"
                        animationDuration={1200}
                        animationEasing="ease-out"
                    >
                        {data.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                    </Pie>
                    <Tooltip
                        content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                                return (
                                    <div className="px-3 py-2 rounded-lg shadow-lg border border-white/20" style={{ background: 'var(--glass-white)' }}>
                                        <p className="text-sm font-medium text-[var(--text-primary)]">{payload[0].name}</p>
                                        <p className="text-sm text-[var(--accent-blue)]">{payload[0].value}</p>
                                    </div>
                                )
                            }
                            return null
                        }}
                    />
                </PieChart>
            </ResponsiveContainer>
            {centerLabel && centerValue && (
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-2xl font-bold text-[var(--text-primary)]">{centerValue}</span>
                    <span className="text-xs text-[var(--text-muted)]">{centerLabel}</span>
                </div>
            )}
        </div>
    )
}
