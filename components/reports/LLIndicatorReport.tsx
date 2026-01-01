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
        borderBottomColor: '#e74c3c'
    },
    companyName: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#e74c3c'
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
    laggingTitle: {
        backgroundColor: '#fee2e2',
        color: '#dc2626',
        padding: 8,
        borderRadius: 4,
        marginBottom: 10
    },
    leadingTitle: {
        backgroundColor: '#dcfce7',
        color: '#16a34a',
        padding: 8,
        borderRadius: 4,
        marginBottom: 10
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
        backgroundColor: '#64748b',
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
    notAchievedRow: {
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

interface LLIndicator {
    id: number
    icon?: string
    name: string
    target: string
    actual: string
    intent?: string
}

interface LLYearData {
    year: number
    lagging: LLIndicator[]
    leading: LLIndicator[]
}

interface LLIndicatorReportProps {
    data: LLYearData
}

function getStatus(target: string, actual: string): 'achieved' | 'not-achieved' | 'on-track' {
    const targetNum = parseFloat(target.replace(/[^0-9.-]/g, ''))
    const actualNum = parseFloat(actual.replace(/[^0-9.-]/g, ''))

    if (isNaN(targetNum) || isNaN(actualNum)) return 'on-track'
    if (actualNum >= targetNum) return 'achieved'
    return 'not-achieved'
}

export function LLIndicatorReport({ data }: LLIndicatorReportProps) {
    const laggingAchieved = data.lagging.filter(i => getStatus(i.target, i.actual) === 'achieved').length
    const leadingAchieved = data.leading.filter(i => getStatus(i.target, i.actual) === 'achieved').length
    const totalIndicators = data.lagging.length + data.leading.length

    return (
        <Document>
            <Page size="A4" orientation="landscape" style={styles.page}>
                {/* Header */}
                <View style={styles.header}>
                    <View>
                        <Text style={styles.companyName}>LL Indicator Report</Text>
                        <Text style={styles.reportPeriod}>Year {data.year}</Text>
                    </View>
                    <View>
                        <Text style={styles.reportTitle}>Lagging & Leading Indicators</Text>
                        <Text style={styles.reportPeriod}>
                            Generated: {new Date().toLocaleDateString()}
                        </Text>
                    </View>
                </View>

                {/* Summary Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Summary</Text>
                    <View style={styles.summaryGrid}>
                        <View style={styles.summaryCard}>
                            <Text style={styles.summaryValue}>{totalIndicators}</Text>
                            <Text style={styles.summaryLabel}>Total Indicators</Text>
                        </View>
                        <View style={styles.summaryCard}>
                            <Text style={[styles.summaryValue, { color: '#dc2626' }]}>{data.lagging.length}</Text>
                            <Text style={styles.summaryLabel}>Lagging</Text>
                        </View>
                        <View style={styles.summaryCard}>
                            <Text style={[styles.summaryValue, { color: '#16a34a' }]}>{data.leading.length}</Text>
                            <Text style={styles.summaryLabel}>Leading</Text>
                        </View>
                        <View style={styles.summaryCard}>
                            <Text style={[styles.summaryValue, { color: '#10b981' }]}>{laggingAchieved + leadingAchieved}</Text>
                            <Text style={styles.summaryLabel}>Achieved</Text>
                        </View>
                    </View>
                </View>

                {/* Lagging Indicators */}
                <View style={styles.section}>
                    <Text style={styles.laggingTitle}>⚠️ LAGGING INDICATORS ({data.lagging.length})</Text>
                    <View style={styles.table}>
                        <View style={[styles.tableHeader, { backgroundColor: '#dc2626' }]}>
                            <Text style={[styles.tableHeaderCell, { flex: 0.5 }]}>#</Text>
                            <Text style={[styles.tableHeaderCell, { flex: 2 }]}>Indicator</Text>
                            <Text style={styles.tableHeaderCell}>Target</Text>
                            <Text style={styles.tableHeaderCell}>Actual</Text>
                            <Text style={styles.tableHeaderCell}>Status</Text>
                            <Text style={[styles.tableHeaderCell, { flex: 2 }]}>Intent</Text>
                        </View>
                        {data.lagging.length === 0 ? (
                            <Text style={styles.noData}>No lagging indicators</Text>
                        ) : (
                            data.lagging.map((indicator, idx) => {
                                const status = getStatus(indicator.target, indicator.actual)
                                const rowStyle = [
                                    styles.tableRow,
                                    status === 'achieved' ? styles.achievedRow : {},
                                    status === 'not-achieved' ? styles.notAchievedRow : {}
                                ]
                                return (
                                    <View key={indicator.id} style={rowStyle}>
                                        <Text style={[styles.tableCell, { flex: 0.5 }]}>{idx + 1}</Text>
                                        <Text style={[styles.tableCell, { flex: 2 }]}>{indicator.name}</Text>
                                        <Text style={styles.tableCell}>{indicator.target}</Text>
                                        <Text style={styles.tableCell}>{indicator.actual}</Text>
                                        <Text style={styles.tableCell}>
                                            {status === 'achieved' ? '✓' : '✗'}
                                        </Text>
                                        <Text style={[styles.tableCell, { flex: 2 }]}>{indicator.intent || '-'}</Text>
                                    </View>
                                )
                            })
                        )}
                    </View>
                </View>

                {/* Leading Indicators */}
                <View style={styles.section}>
                    <Text style={styles.leadingTitle}>✅ LEADING INDICATORS ({data.leading.length})</Text>
                    <View style={styles.table}>
                        <View style={[styles.tableHeader, { backgroundColor: '#16a34a' }]}>
                            <Text style={[styles.tableHeaderCell, { flex: 0.5 }]}>#</Text>
                            <Text style={[styles.tableHeaderCell, { flex: 2 }]}>Indicator</Text>
                            <Text style={styles.tableHeaderCell}>Target</Text>
                            <Text style={styles.tableHeaderCell}>Actual</Text>
                            <Text style={styles.tableHeaderCell}>Status</Text>
                            <Text style={[styles.tableHeaderCell, { flex: 2 }]}>Intent</Text>
                        </View>
                        {data.leading.length === 0 ? (
                            <Text style={styles.noData}>No leading indicators</Text>
                        ) : (
                            data.leading.map((indicator, idx) => {
                                const status = getStatus(indicator.target, indicator.actual)
                                const rowStyle = [
                                    styles.tableRow,
                                    status === 'achieved' ? styles.achievedRow : {},
                                    status === 'not-achieved' ? styles.notAchievedRow : {}
                                ]
                                return (
                                    <View key={indicator.id} style={rowStyle}>
                                        <Text style={[styles.tableCell, { flex: 0.5 }]}>{idx + 1}</Text>
                                        <Text style={[styles.tableCell, { flex: 2 }]}>{indicator.name}</Text>
                                        <Text style={styles.tableCell}>{indicator.target}</Text>
                                        <Text style={styles.tableCell}>{indicator.actual}</Text>
                                        <Text style={styles.tableCell}>
                                            {status === 'achieved' ? '✓' : '✗'}
                                        </Text>
                                        <Text style={[styles.tableCell, { flex: 2 }]}>{indicator.intent || '-'}</Text>
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
