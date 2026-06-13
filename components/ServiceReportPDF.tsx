import React from 'react';
import { Page, Text, View, Document, StyleSheet, Font, Image } from '@react-pdf/renderer';
import { Program, Slot } from '../types';

// Register standard fonts
Font.register({
  family: 'Inter',
  fonts: [
    { src: 'https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-regular-webfont.ttf', fontWeight: 400 },
    { src: 'https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-bold-webfont.ttf', fontWeight: 700 },
    { src: 'https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-black-webfont.ttf', fontWeight: 900 }
  ]
});

const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontFamily: 'Inter',
    backgroundColor: '#ffffff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    paddingBottom: 20,
  },
  titleWrapper: {
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: 900,
    color: '#0f172a',
    textTransform: 'uppercase',
  },
  subtitle: {
    fontSize: 10,
    color: '#64748b',
    marginTop: 4,
  },
  metaBadge: {
    backgroundColor: '#f8fafc',
    padding: '4 10',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  metaText: {
    fontSize: 8,
    fontWeight: 700,
    color: '#475569',
    textTransform: 'uppercase',
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30,
  },
  statCard: {
    width: '23%',
    backgroundColor: '#ffffff',
    padding: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  statHeader: {
    fontSize: 8,
    fontWeight: 700,
    color: '#64748b',
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 900,
    color: '#0f172a',
  },
  statVariancePos: {
    fontSize: 24,
    fontWeight: 900,
    color: '#f59e0b', // amber-500
  },
  statVarianceNeg: {
    fontSize: 24,
    fontWeight: 900,
    color: '#10b981', // emerald-500
  },
  statOverruns: {
    fontSize: 24,
    fontWeight: 900,
    color: '#f43f5e', // rose-500
  },
  statEfficiency: {
    fontSize: 24,
    fontWeight: 900,
    color: '#6366f1', // indigo-500
  },
  statSubtext: {
    fontSize: 8,
    color: '#94a3b8',
    marginTop: 4,
  },
  table: {
    width: 'auto',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 4,
    marginBottom: 30,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f8fafc',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    padding: '8 0',
  },
  tableHeaderCell: {
    fontSize: 8,
    fontWeight: 700,
    color: '#64748b',
    textTransform: 'uppercase',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    padding: '8 0',
    minHeight: 30,
    alignItems: 'center',
  },
  tableRowAlternate: {
    backgroundColor: '#f8fafc',
  },
  cellMain: {
    width: '40%',
    paddingLeft: 10,
  },
  cellNum: {
    width: '20%',
  },
  cellDataHeader: {
    fontSize: 10,
    fontWeight: 700,
    color: '#0f172a',
  },
  cellDataSub: {
    fontSize: 8,
    color: '#64748b',
    marginTop: 2,
  },
  cellDataNum: {
    fontSize: 10,
    color: '#64748b',
  },
  cellDataNumBold: {
    fontSize: 10,
    fontWeight: 700,
    color: '#0f172a',
  },
  badge: {
    padding: '2 6',
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  badgeText: {
    fontSize: 8,
    fontWeight: 900,
  },
  badgePos: {
    backgroundColor: '#ffe4e6',
  },
  badgePosText: {
    color: '#e11d48',
  },
  badgeNeg: {
    backgroundColor: '#d1fae5',
  },
  badgeNegText: {
    color: '#059669',
  },
  badgeNeutral: {
    backgroundColor: '#f1f5f9',
  },
  badgeNeutralText: {
    color: '#64748b',
  },
  badgeTextNA: {
    fontSize: 8,
    color: '#cbd5e1',
  },
  insightWrapper: {
    backgroundColor: '#6366f1',
    borderRadius: 8,
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 'auto',
  },
  insightContent: {
    width: '70%',
  },
  insightTitle: {
    fontSize: 14,
    fontWeight: 900,
    color: '#ffffff',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  insightText: {
    fontSize: 9,
    color: '#ffffff',
    opacity: 0.9,
    lineHeight: 1.4,
  },
  insightBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    padding: 10,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  insightBadgeLabel: {
    fontSize: 6,
    fontWeight: 700,
    color: '#ffffff',
    opacity: 0.6,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  insightBadgeBrand: {
    fontSize: 12,
    fontWeight: 900,
    color: '#ffffff',
    textTransform: 'uppercase',
  },
  pageNumber: {
    position: 'absolute',
    fontSize: 8,
    bottom: 30,
    left: 0,
    right: 0,
    textAlign: 'center',
    color: '#94a3b8',
  }
});

interface ServiceReportPDFProps {
  program: Program;
  stats: {
    items: (Slot & { plannedVal: number; actualVal: number; variance: number })[];
    totalPlanned: number;
    totalActual: number;
    totalVariance: number;
    overruns: number;
    efficiency: number;
  };
  logoUrl?: string;
}

const ServiceReportPDF: React.FC<ServiceReportPDFProps> = ({ program, stats, logoUrl }) => {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header} fixed>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
            {logoUrl ? (
              <Image src={logoUrl} style={{ width: 32, height: 32, borderRadius: 4, objectFit: 'contain' }} />
            ) : null}
            <View style={styles.titleWrapper}>
              <Text style={styles.title}>Service Report</Text>
              <Text style={styles.subtitle}>Performance analytics for "{program.title}"</Text>
            </View>
          </View>
          <View style={styles.metaBadge}>
            <Text style={styles.metaText}>{program.date} • {program.startTime}</Text>
          </View>
        </View>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statHeader}>Total Actual</Text>
            <Text style={styles.statValue}>{stats.totalActual}m</Text>
            <Text style={styles.statSubtext}>Planned: {stats.totalPlanned}m</Text>
          </View>
          
          <View style={styles.statCard}>
            <Text style={styles.statHeader}>Variance</Text>
            <Text style={stats.totalVariance > 0 ? styles.statVariancePos : styles.statVarianceNeg}>
              {stats.totalVariance > 0 ? `+${stats.totalVariance}` : stats.totalVariance}m
            </Text>
            <Text style={styles.statSubtext}>
              {stats.totalVariance > 0 ? 'Over original budget' : 'Under original budget'}
            </Text>
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statHeader}>Overruns</Text>
            <Text style={styles.statOverruns}>{stats.overruns}</Text>
            <Text style={styles.statSubtext}>Sessions exceeded time</Text>
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statHeader}>Efficiency</Text>
            <Text style={styles.statEfficiency}>{stats.efficiency}%</Text>
            <Text style={styles.statSubtext}>Time accuracy score</Text>
          </View>
        </View>

        {/* Table */}
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderCell, styles.cellMain]}>Session / Speaker</Text>
            <Text style={[styles.tableHeaderCell, styles.cellNum]}>Planned</Text>
            <Text style={[styles.tableHeaderCell, styles.cellNum]}>Actual</Text>
            <Text style={[styles.tableHeaderCell, styles.cellNum]}>Variance</Text>
          </View>

          {stats.items.map((item, idx) => (
            <View key={idx} wrap={false}>
              <View style={[styles.tableRow, idx % 2 === 0 ? {} : styles.tableRowAlternate]}>
                <View style={styles.cellMain}>
                  <Text style={styles.cellDataHeader}>{item.title}</Text>
                  <Text style={styles.cellDataSub}>{item.speaker || 'No Speaker'}</Text>
                </View>
                <View style={styles.cellNum}>
                  <Text style={styles.cellDataNum}>{item.plannedVal}m</Text>
                </View>
                <View style={styles.cellNum}>
                  <Text style={styles.cellDataNumBold}>{item.actualVal > 0 ? `${item.actualVal}m` : '---'}</Text>
                </View>
                <View style={styles.cellNum}>
                  {item.actualVal > 0 ? (
                    <View style={[
                      styles.badge, 
                      item.variance > 0 ? styles.badgePos : item.variance < 0 ? styles.badgeNeg : styles.badgeNeutral
                    ]}>
                      <Text style={[
                        styles.badgeText,
                        item.variance > 0 ? styles.badgePosText : item.variance < 0 ? styles.badgeNegText : styles.badgeNeutralText
                      ]}>
                        {item.variance > 0 ? `+${item.variance}` : item.variance}m
                      </Text>
                    </View>
                  ) : (
                    <Text style={styles.badgeTextNA}>N/A</Text>
                  )}
                </View>
              </View>
            </View>
          ))}
        </View>

        {/* Footer Insight */}
        <View style={styles.insightWrapper} wrap={false}>
          <View style={styles.insightContent}>
            <Text style={styles.insightTitle}>Production Insight</Text>
            <Text style={styles.insightText}>
              {stats.totalVariance > 5
                ? "Your event drifted significantly off-schedule. Consider adding 'Buffer' slots or re-evaluating slot durations for this type of session in Gemini AI."
                : stats.totalVariance < -5
                  ? "The event finished quite early. You may have additional time for Q&A or audience engagement next time."
                  : "Excellent pacing! This service was delivered almost exactly as planned. Your team is highly synchronized."
              }
            </Text>
          </View>
          <View style={styles.insightBadge}>
            <Text style={styles.insightBadgeLabel}>Generated by</Text>
            <Text style={styles.insightBadgeBrand}>Kairon Analytics</Text>
          </View>
        </View>

        {/* Global Page Numbers */}
        <Text style={styles.pageNumber} render={({ pageNumber, totalPages }) => (
          `Page ${pageNumber} of ${totalPages}`
        )} fixed />
      </Page>
    </Document>
  );
};

export default ServiceReportPDF;
