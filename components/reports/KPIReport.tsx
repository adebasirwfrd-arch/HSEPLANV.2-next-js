'use client'

import {
    Document,
    Page,
    Text,
    View,
    StyleSheet
} from '@react-pdf/renderer'

const styles = StyleSheet.create({
    page: {
        padding: 40,
        fontSize: 10,
        fontFamily: 'Helvetica',
        backgroundColor: '#ffffff'
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 30,
        paddingBottom: 15,
        borderBottomWidth: 2,
        borderBottomColor: '#3b82f6'
    },
    companyName: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#3b82f6'
    },
    reportTitle: {
        fontSize: 14,
        color: '#1e293b'
    },
    reportPeriod: {
        fontSize: 10,
        color: '#64748b',
        marginTop: 4
    },
    section: {
        marginBottom: 20
    },
    sectionTitle: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#1e293b',
        marginBottom: 10,
        paddingBottom: 5,
        borderBottomWidth: 1,
        borderBottomColor: '#e2e8f0'
    },
    summaryGrid: {
        flexDirection: 'row',
        gap: 15,
        marginBottom: 20
    },
    summaryCard: {
        flex: 1,
        padding: 15,
        backgroundColor: '#f8fafc',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#e2e8f0'
    },
    summaryValue: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#3b82f6'
    },
    summaryLabel: {
        fontSize: 8,
        color: '#64748b',
        marginTop: 4,
        textTransform: 'uppercase'
    },
    table: {
        width: '100%',
        marginTop: 10
    },
    tableHeader: {
        flexDirection: 'row',
        backgroundColor: '#3b82f6',
        paddingVertical: 8,
        paddingHorizontal: 10,
        borderRadius: 4
    },
    tableHeaderCell: {
        fontSize: 8,
        fontWeight: 'bold',
        color: '#ffffff',
        flex: 1
    },
    tableRow: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderBottomColor: '#f1f5f9',
        paddingVertical: 8,
        paddingHorizontal: 10
    },
    tableCell: {
        fontSize: 9,
        color: '#334155',
        flex: 1
    },
    achievedRow: {
        backgroundColor: '#dcfce7'
    },
    atRiskRow: {
        backgroundColor: '#fef2f2'
    },
    footer: {
        position: 'absolute',
        bottom: 30,
        left: 40,
        right: 40,
        flexDirection: 'row',
        justifyContent: 'space-between',
        fontSize: 8,
        color: '#94a3b8'
    },
    noData: {
        padding: 20,
        textAlign: 'center',
        color: '#64748b',
        fontSize: 10
    }
})

interface KPIMetric {
    id: string
    icon: string
    name: string
    target: string
    result: string
    intent?: string
}

interface KPIYearData {
    year: number
    manHours: number
    metrics: KPIMetric[]
}

interface KPIReportProps {
    data: KPIYearData
}

function getStatus(target: string, result: string): 'achieved' | 'on-track' | 'at-risk' {
    const targetNum = parseFloat(target.replace(/[^0-9.-]/g, ''))
    const resultNum = parseFloat(result.replace(/[^0-9.-]/g, ''))

    if (isNaN(targetNum) || isNaN(resultNum)) return 'on-track'

    // For metrics where lower is better (like injury rates)
    if (target.includes('0') || target.toLowerCase().includes('zero')) {
        if (resultNum <= targetNum) return 'achieved'
        return 'at-risk'
    }

    // For percentage targets
    if (target.includes('%')) {
        if (resultNum >= targetNum) return 'achieved'
        if (resultNum >= targetNum * 0.8) return 'on-track'
        return 'at-risk'
    }

    if (resultNum >= targetNum) return 'achieved'
    if (resultNum >= targetNum * 0.8) return 'on-track'
    return 'at-risk'
}

export function KPIReport({ data }: KPIReportProps) {
    const achieved = data.metrics.filter(m => getStatus(m.target, m.result) === 'achieved').length
    const atRisk = data.metrics.filter(m => getStatus(m.target, m.result) === 'at-risk').length

    return (
        <Document>
            <Page size="A4" style={styles.page}>
                {/* Header */}
                <View style={styles.header}>
                    <View>
                        <Text style={styles.companyName}>HSE KPI Report</Text>
                        <Text style={styles.reportPeriod}>Year {data.year}</Text>
                    </View>
                    <View>
                        <Text style={styles.reportTitle}>Key Performance Indicators</Text>
                        <Text style={styles.reportPeriod}>
                            Generated: {new Date().toLocaleDateString()}
                        </Text>
                    </View>
                </View>

                {/* Summary Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Executive Summary</Text>
                    <View style={styles.summaryGrid}>
                        <View style={styles.summaryCard}>
                            <Text style={styles.summaryValue}>{data.manHours.toLocaleString()}</Text>
                            <Text style={styles.summaryLabel}>Total Man Hours</Text>
                        </View>
                        <View style={styles.summaryCard}>
                            <Text style={styles.summaryValue}>{data.metrics.length}</Text>
                            <Text style={styles.summaryLabel}>Total Metrics</Text>
                        </View>
                        <View style={styles.summaryCard}>
                            <Text style={[styles.summaryValue, { color: '#10b981' }]}>{achieved}</Text>
                            <Text style={styles.summaryLabel}>Achieved</Text>
                        </View>
                        <View style={styles.summaryCard}>
                            <Text style={[styles.summaryValue, { color: '#ef4444' }]}>{atRisk}</Text>
                            <Text style={styles.summaryLabel}>At Risk</Text>
                        </View>
                    </View>
                </View>

                {/* Metrics Table */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>KPI Metrics</Text>
                    <View style={styles.table}>
                        <View style={styles.tableHeader}>
                            <Text style={[styles.tableHeaderCell, { flex: 0.5 }]}>#</Text>
                            <Text style={[styles.tableHeaderCell, { flex: 2 }]}>Metric Name</Text>
                            <Text style={styles.tableHeaderCell}>Target</Text>
                            <Text style={styles.tableHeaderCell}>Result</Text>
                            <Text style={styles.tableHeaderCell}>Status</Text>
                        </View>
                        {data.metrics.length === 0 ? (
                            <Text style={styles.noData}>No metrics found</Text>
                        ) : (
                            data.metrics.map((metric, idx) => {
                                const status = getStatus(metric.target, metric.result)
                                const rowStyle = [
                                    styles.tableRow,
                                    status === 'achieved' ? styles.achievedRow : {},
                                    status === 'at-risk' ? styles.atRiskRow : {}
                                ]
                                return (
                                    <View key={metric.id} style={rowStyle}>
                                        <Text style={[styles.tableCell, { flex: 0.5 }]}>{idx + 1}</Text>
                                        <Text style={[styles.tableCell, { flex: 2 }]}>{metric.name}</Text>
                                        <Text style={styles.tableCell}>{metric.target}</Text>
                                        <Text style={styles.tableCell}>{metric.result}</Text>
                                        <Text style={styles.tableCell}>
                                            {status === 'achieved' ? '✓ Achieved' : status === 'at-risk' ? '⚠ At Risk' : '○ On Track'}
                                        </Text>
                                    </View>
                                )
                            })
                        )}
                    </View>
                </View>

                {/* Footer */}
                <View style={styles.footer}>
                    <Text>HSE Management System • Confidential</Text>
                    <Text>Page 1</Text>
                </View>
            </Page>
        </Document>
    )
}
