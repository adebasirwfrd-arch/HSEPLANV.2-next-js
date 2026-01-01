'use client'

import {
    Document,
    Page,
    Text,
    View,
    StyleSheet
} from '@react-pdf/renderer'

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
        marginBottom: 30,
        paddingBottom: 15,
        borderBottomWidth: 2,
        borderBottomColor: '#16a085'
    },
    logo: {
        flexDirection: 'column'
    },
    companyName: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#16a085'
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
        fontSize: 24,
        fontWeight: 'bold',
        color: '#16a085'
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
        backgroundColor: '#16a085',
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
    progressBar: {
        height: 8,
        backgroundColor: '#e2e8f0',
        borderRadius: 4,
        width: 60
    },
    progressFill: {
        height: 8,
        borderRadius: 4
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

interface MonthData {
    plan: number
    actual: number
}

interface MatrixProgram {
    id: number
    name: string
    reference?: string
    plan_type: string
    months: Record<string, MonthData>
    progress?: number
}

interface MatrixReportProps {
    programs: MatrixProgram[]
    category: string
    base: string
    year: number
}

const MONTHS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec']
const CATEGORY_LABELS: Record<string, string> = {
    audit: 'Audit',
    training: 'Training',
    drill: 'Emergency Drill',
    meeting: 'Meeting'
}

export function MatrixReport({
    programs,
    category,
    base,
    year
}: MatrixReportProps) {
    // Calculate statistics
    const totalPrograms = programs.length
    const completed = programs.filter(p => (p.progress ?? 0) === 100).length
    const inProgress = programs.filter(p => {
        const prog = p.progress ?? 0
        return prog > 0 && prog < 100
    }).length
    const avgProgress = totalPrograms > 0
        ? Math.round(programs.reduce((sum, p) => sum + (p.progress ?? 0), 0) / totalPrograms)
        : 0

    // Calculate total plan and actual
    const totals = programs.reduce((acc, prog) => {
        MONTHS.forEach(month => {
            const data = prog.months[month] || { plan: 0, actual: 0 }
            acc.plan += data.plan
            acc.actual += data.actual
        })
        return acc
    }, { plan: 0, actual: 0 })

    const categoryLabel = CATEGORY_LABELS[category] || category
    const baseLabel = base === 'all' ? 'All Bases' : base.charAt(0).toUpperCase() + base.slice(1)

    return (
        <Document>
            <Page size="A4" orientation="landscape" style={styles.page}>
                {/* Header */}
                <View style={styles.header}>
                    <View style={styles.logo}>
                        <Text style={styles.companyName}>HSE Matrix Report</Text>
                        <Text style={styles.reportPeriod}>
                            {categoryLabel} • {baseLabel} • {year}
                        </Text>
                    </View>
                    <View>
                        <Text style={styles.reportTitle}>{categoryLabel}</Text>
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
                            <Text style={styles.summaryValue}>{totalPrograms}</Text>
                            <Text style={styles.summaryLabel}>Total Programs</Text>
                        </View>
                        <View style={styles.summaryCard}>
                            <Text style={[styles.summaryValue, { color: '#10b981' }]}>{completed}</Text>
                            <Text style={styles.summaryLabel}>Completed</Text>
                        </View>
                        <View style={styles.summaryCard}>
                            <Text style={[styles.summaryValue, { color: '#f59e0b' }]}>{inProgress}</Text>
                            <Text style={styles.summaryLabel}>In Progress</Text>
                        </View>
                        <View style={styles.summaryCard}>
                            <Text style={[styles.summaryValue, { color: '#3b82f6' }]}>{avgProgress}%</Text>
                            <Text style={styles.summaryLabel}>Avg Progress</Text>
                        </View>
                        <View style={styles.summaryCard}>
                            <Text style={styles.summaryValue}>{totals.actual}/{totals.plan}</Text>
                            <Text style={styles.summaryLabel}>Total Actual/Plan</Text>
                        </View>
                    </View>
                </View>

                {/* Programs Table */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Program Details</Text>
                    <View style={styles.table}>
                        <View style={styles.tableHeader}>
                            <Text style={[styles.tableHeaderCell, { flex: 0.5 }]}>#</Text>
                            <Text style={[styles.tableHeaderCell, { flex: 2 }]}>Program Name</Text>
                            <Text style={styles.tableHeaderCell}>Reference</Text>
                            <Text style={styles.tableHeaderCell}>Plan Type</Text>
                            <Text style={styles.tableHeaderCell}>Total Plan</Text>
                            <Text style={styles.tableHeaderCell}>Total Actual</Text>
                            <Text style={styles.tableHeaderCell}>Progress</Text>
                        </View>
                        {programs.length === 0 ? (
                            <Text style={styles.noData}>No programs found</Text>
                        ) : (
                            programs.slice(0, 20).map((prog, idx) => {
                                const totalPlan = MONTHS.reduce((sum, m) => sum + (prog.months[m]?.plan || 0), 0)
                                const totalActual = MONTHS.reduce((sum, m) => sum + (prog.months[m]?.actual || 0), 0)
                                const progress = prog.progress ?? (totalPlan > 0 ? Math.round((totalActual / totalPlan) * 100) : 0)

                                return (
                                    <View key={prog.id} style={[styles.tableRow, idx % 2 === 0 ? { backgroundColor: '#f8fafc' } : {}]}>
                                        <Text style={[styles.tableCell, { flex: 0.5 }]}>{idx + 1}</Text>
                                        <Text style={[styles.tableCell, { flex: 2 }]}>{prog.name}</Text>
                                        <Text style={styles.tableCell}>{prog.reference || '-'}</Text>
                                        <Text style={styles.tableCell}>{prog.plan_type}</Text>
                                        <Text style={styles.tableCell}>{totalPlan}</Text>
                                        <Text style={styles.tableCell}>{totalActual}</Text>
                                        <Text style={styles.tableCell}>{progress}%</Text>
                                    </View>
                                )
                            })
                        )}
                        {programs.length > 20 && (
                            <Text style={styles.noData}>... and {programs.length - 20} more programs</Text>
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
