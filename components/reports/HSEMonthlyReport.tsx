'use client'

import {
    Document,
    Page,
    Text,
    View,
    StyleSheet,
    Font
} from '@react-pdf/renderer'

// Register fonts (using default fonts for now)
// Font.register({ family: 'Inter', src: '/fonts/Inter-Regular.ttf' })

// PDF Styles
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
        alignItems: 'flex-start',
        marginBottom: 30,
        paddingBottom: 15,
        borderBottomWidth: 2,
        borderBottomColor: '#3b82f6'
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10
    },
    logo: {
        width: 40,
        height: 40,
        backgroundColor: '#3b82f6',
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center'
    },
    logoText: {
        color: '#ffffff',
        fontSize: 18,
        fontWeight: 'bold'
    },
    companyName: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#1e293b'
    },
    companySubtitle: {
        fontSize: 8,
        color: '#64748b'
    },
    headerRight: {
        textAlign: 'right'
    },
    reportTitle: {
        fontSize: 16,
        fontWeight: 'bold',
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
        gap: 15
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
        fontSize: 24,
        fontWeight: 'bold',
        color: '#1e293b'
    },
    summaryLabel: {
        fontSize: 9,
        color: '#64748b',
        marginTop: 4
    },
    table: {
        borderWidth: 1,
        borderColor: '#e2e8f0',
        borderRadius: 4
    },
    tableHeader: {
        flexDirection: 'row',
        backgroundColor: '#f1f5f9',
        borderBottomWidth: 1,
        borderBottomColor: '#e2e8f0',
        paddingVertical: 8,
        paddingHorizontal: 10
    },
    tableHeaderCell: {
        fontSize: 9,
        fontWeight: 'bold',
        color: '#475569'
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
        color: '#334155'
    },
    overdueItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 6,
        paddingHorizontal: 10,
        backgroundColor: '#fef2f2',
        borderRadius: 4,
        marginBottom: 6
    },
    overdueText: {
        fontSize: 9,
        color: '#dc2626'
    },
    progressBar: {
        width: 80,
        height: 8,
        backgroundColor: '#e2e8f0',
        borderRadius: 4,
        overflow: 'hidden'
    },
    progressFill: {
        height: '100%',
        borderRadius: 4
    },
    footer: {
        position: 'absolute',
        bottom: 30,
        left: 40,
        right: 40,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        paddingTop: 15,
        borderTopWidth: 1,
        borderTopColor: '#e2e8f0'
    },
    footerText: {
        fontSize: 8,
        color: '#94a3b8'
    },
    signatureLine: {
        width: 150,
        borderTopWidth: 1,
        borderTopColor: '#334155',
        paddingTop: 4
    },
    signatureLabel: {
        fontSize: 8,
        color: '#64748b',
        textAlign: 'center'
    },
    noData: {
        padding: 20,
        textAlign: 'center',
        color: '#64748b',
        fontSize: 10
    }
})

interface MonthData {
    plan: number
    actual: number
}

interface Program {
    id: number
    name: string
    plan_type: string
    months: Record<string, MonthData>
    progress: number
}

interface HSEMonthlyReportProps {
    programs: Program[]
    companyName?: string
    region: string
    base: string
    year: number
    month?: string
}

const MONTHS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec']
const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

export function HSEMonthlyReport({
    programs,
    companyName = 'HSE Management System',
    region,
    base,
    year,
    month
}: HSEMonthlyReportProps) {
    const currentDate = new Date()
    const currentMonthIndex = month ? MONTHS.indexOf(month.toLowerCase()) : currentDate.getMonth()
    const monthName = MONTH_NAMES[currentMonthIndex] || MONTH_NAMES[currentDate.getMonth()]

    // Calculate statistics
    const totalPrograms = programs.length
    const completedPrograms = programs.filter(p => p.progress === 100).length
    const avgProgress = totalPrograms > 0
        ? Math.round(programs.reduce((sum, p) => sum + p.progress, 0) / totalPrograms)
        : 0

    // Find overdue items (plan > 0, actual = 0 for current and past months)
    const overdueItems: { name: string; month: string }[] = []
    programs.forEach(prog => {
        MONTHS.slice(0, currentMonthIndex + 1).forEach((m, idx) => {
            const data = prog.months[m]
            if (data && data.plan > 0 && data.actual === 0) {
                overdueItems.push({
                    name: prog.name,
                    month: MONTH_NAMES[idx]
                })
            }
        })
    })

    const regionLabel = region === 'asia' ? 'Asia' : `Indonesia${base !== 'all' ? ` - ${base.charAt(0).toUpperCase() + base.slice(1)}` : ''}`
    const generatedDate = currentDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })

    return (
        <Document>
            <Page size="A4" style={styles.page}>
                {/* Header */}
                <View style={styles.header}>
                    <View style={styles.headerLeft}>
                        <View style={styles.logo}>
                            <Text style={styles.logoText}>HSE</Text>
                        </View>
                        <View>
                            <Text style={styles.companyName}>{companyName}</Text>
                            <Text style={styles.companySubtitle}>Health, Safety & Environment</Text>
                        </View>
                    </View>
                    <View style={styles.headerRight}>
                        <Text style={styles.reportTitle}>HSE MONTHLY REPORT</Text>
                        <Text style={styles.reportPeriod}>{monthName} {year} • {regionLabel}</Text>
                    </View>
                </View>

                {/* Executive Summary */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>📊 Executive Summary</Text>
                    <View style={styles.summaryGrid}>
                        <View style={styles.summaryCard}>
                            <Text style={styles.summaryValue}>{totalPrograms}</Text>
                            <Text style={styles.summaryLabel}>Total Programs</Text>
                        </View>
                        <View style={[styles.summaryCard, { borderColor: avgProgress >= 80 ? '#22c55e' : avgProgress >= 50 ? '#f59e0b' : '#ef4444' }]}>
                            <Text style={[styles.summaryValue, { color: avgProgress >= 80 ? '#22c55e' : avgProgress >= 50 ? '#f59e0b' : '#ef4444' }]}>
                                {avgProgress}%
                            </Text>
                            <Text style={styles.summaryLabel}>Avg. Completion</Text>
                        </View>
                        <View style={[styles.summaryCard, { borderColor: overdueItems.length > 0 ? '#ef4444' : '#22c55e' }]}>
                            <Text style={[styles.summaryValue, { color: overdueItems.length > 0 ? '#ef4444' : '#22c55e' }]}>
                                {overdueItems.length}
                            </Text>
                            <Text style={styles.summaryLabel}>Overdue Items</Text>
                        </View>
                    </View>
                </View>

                {/* Critical Items */}
                {overdueItems.length > 0 && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>⚠️ Critical Items (Overdue)</Text>
                        {overdueItems.slice(0, 8).map((item, idx) => (
                            <View key={idx} style={styles.overdueItem}>
                                <Text style={styles.overdueText}>• {item.name} - {item.month}</Text>
                            </View>
                        ))}
                        {overdueItems.length > 8 && (
                            <Text style={{ fontSize: 8, color: '#94a3b8', marginTop: 4 }}>
                                ... and {overdueItems.length - 8} more items
                            </Text>
                        )}
                    </View>
                )}

                {/* Progress Details */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>📋 Program Progress Details</Text>
                    <View style={styles.table}>
                        <View style={styles.tableHeader}>
                            <Text style={[styles.tableHeaderCell, { flex: 3 }]}>Program Name</Text>
                            <Text style={[styles.tableHeaderCell, { flex: 1, textAlign: 'center' }]}>Type</Text>
                            <Text style={[styles.tableHeaderCell, { flex: 1, textAlign: 'center' }]}>Progress</Text>
                            <Text style={[styles.tableHeaderCell, { flex: 1, textAlign: 'center' }]}>Status</Text>
                        </View>
                        {programs.slice(0, 15).map((prog, idx) => {
                            const progressColor = prog.progress === 100 ? '#22c55e' : prog.progress >= 50 ? '#f59e0b' : '#ef4444'
                            const statusLabel = prog.progress === 100 ? 'Complete' : prog.progress > 0 ? 'In Progress' : 'Not Started'
                            return (
                                <View key={prog.id} style={[styles.tableRow, { backgroundColor: idx % 2 === 0 ? '#ffffff' : '#fafafa' }]}>
                                    <Text style={[styles.tableCell, { flex: 3 }]}>
                                        {prog.name.substring(0, 40)}{prog.name.length > 40 ? '...' : ''}
                                    </Text>
                                    <Text style={[styles.tableCell, { flex: 1, textAlign: 'center' }]}>{prog.plan_type || '-'}</Text>
                                    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                                        <View style={styles.progressBar}>
                                            <View style={[styles.progressFill, { width: `${prog.progress}%`, backgroundColor: progressColor }]} />
                                        </View>
                                        <Text style={{ fontSize: 7, color: '#64748b', marginTop: 2 }}>{prog.progress}%</Text>
                                    </View>
                                    <Text style={[styles.tableCell, { flex: 1, textAlign: 'center', color: progressColor }]}>
                                        {statusLabel}
                                    </Text>
                                </View>
                            )
                        })}
                    </View>
                    {programs.length > 15 && (
                        <Text style={{ fontSize: 8, color: '#94a3b8', marginTop: 8, textAlign: 'center' }}>
                            Showing 15 of {programs.length} programs
                        </Text>
                    )}
                </View>

                {/* Footer */}
                <View style={styles.footer}>
                    <View>
                        <Text style={styles.footerText}>Generated by HSE Management System</Text>
                        <Text style={styles.footerText}>{generatedDate}</Text>
                    </View>
                    <View>
                        <View style={styles.signatureLine} />
                        <Text style={styles.signatureLabel}>Approved By</Text>
                    </View>
                </View>
            </Page>
        </Document>
    )
}
