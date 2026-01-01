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
    highPriority: {
        color: '#ef4444',
        fontWeight: 'bold'
    },
    mediumPriority: {
        color: '#f59e0b'
    },
    lowPriority: {
        color: '#10b981'
    },
    completedRow: {
        backgroundColor: '#dcfce7'
    },
    overdueRow: {
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

interface Task {
    id: string | number
    title: string
    assignee?: string
    priority?: 'high' | 'medium' | 'low'
    dueDate?: string
    status?: 'pending' | 'in-progress' | 'completed' | 'overdue'
    description?: string
}

interface TasksReportProps {
    tasks: Task[]
}

export function TasksReport({ tasks }: TasksReportProps) {
    const completed = tasks.filter(t => t.status === 'completed').length
    const overdue = tasks.filter(t => t.status === 'overdue').length
    const highPriority = tasks.filter(t => t.priority === 'high').length

    return (
        <Document>
            <Page size="A4" style={styles.page}>
                {/* Header */}
                <View style={styles.header}>
                    <View>
                        <Text style={styles.companyName}>HSE Tasks Report</Text>
                        <Text style={styles.reportPeriod}>Task Management</Text>
                    </View>
                    <View>
                        <Text style={styles.reportTitle}>Active Tasks</Text>
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
                            <Text style={styles.summaryValue}>{tasks.length}</Text>
                            <Text style={styles.summaryLabel}>Total Tasks</Text>
                        </View>
                        <View style={styles.summaryCard}>
                            <Text style={[styles.summaryValue, { color: '#10b981' }]}>{completed}</Text>
                            <Text style={styles.summaryLabel}>Completed</Text>
                        </View>
                        <View style={styles.summaryCard}>
                            <Text style={[styles.summaryValue, { color: '#ef4444' }]}>{overdue}</Text>
                            <Text style={styles.summaryLabel}>Overdue</Text>
                        </View>
                        <View style={styles.summaryCard}>
                            <Text style={[styles.summaryValue, { color: '#f59e0b' }]}>{highPriority}</Text>
                            <Text style={styles.summaryLabel}>High Priority</Text>
                        </View>
                    </View>
                </View>

                {/* Tasks Table */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Task Details</Text>
                    <View style={styles.table}>
                        <View style={styles.tableHeader}>
                            <Text style={[styles.tableHeaderCell, { flex: 0.5 }]}>#</Text>
                            <Text style={[styles.tableHeaderCell, { flex: 2 }]}>Task Name</Text>
                            <Text style={styles.tableHeaderCell}>Assignee</Text>
                            <Text style={styles.tableHeaderCell}>Priority</Text>
                            <Text style={styles.tableHeaderCell}>Due Date</Text>
                            <Text style={styles.tableHeaderCell}>Status</Text>
                        </View>
                        {tasks.length === 0 ? (
                            <Text style={styles.noData}>No tasks found</Text>
                        ) : (
                            tasks.slice(0, 25).map((task, idx) => {
                                const rowStyle = [
                                    styles.tableRow,
                                    task.status === 'completed' ? styles.completedRow : {},
                                    task.status === 'overdue' ? styles.overdueRow : {}
                                ]
                                const priorityStyle = [
                                    styles.tableCell,
                                    task.priority === 'high' ? styles.highPriority : {},
                                    task.priority === 'medium' ? styles.mediumPriority : {},
                                    task.priority === 'low' ? styles.lowPriority : {}
                                ]
                                return (
                                    <View key={task.id} style={rowStyle}>
                                        <Text style={[styles.tableCell, { flex: 0.5 }]}>{idx + 1}</Text>
                                        <Text style={[styles.tableCell, { flex: 2 }]}>{task.title}</Text>
                                        <Text style={styles.tableCell}>{task.assignee || '-'}</Text>
                                        <Text style={priorityStyle}>
                                            {task.priority?.toUpperCase() || '-'}
                                        </Text>
                                        <Text style={styles.tableCell}>{task.dueDate || '-'}</Text>
                                        <Text style={styles.tableCell}>{task.status || '-'}</Text>
                                    </View>
                                )
                            })
                        )}
                        {tasks.length > 25 && (
                            <Text style={styles.noData}>... and {tasks.length - 25} more tasks</Text>
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
