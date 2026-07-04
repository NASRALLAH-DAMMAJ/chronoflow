import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'
import { CATEGORY_COLORS } from '../store/constants'

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: 'Helvetica',
    fontSize: 10,
    color: '#1a1a1a',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 11,
    color: '#666',
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    marginBottom: 8,
    marginTop: 8,
  },
  table: {
    width: '100%',
    marginBottom: 16,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
    borderBottomStyle: 'solid',
    paddingVertical: 4,
  },
  tableHeader: {
    flexDirection: 'row',
    borderBottomWidth: 2,
    borderBottomColor: '#333',
    borderBottomStyle: 'solid',
    paddingVertical: 4,
    fontWeight: 'bold',
    fontSize: 9,
  },
  dateCol: { width: '20%' },
  hoursCol: { width: '12%' },
  catsCol: { width: '68%' },
  summaryGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  summaryCard: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderStyle: 'solid',
    padding: 10,
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  summaryLabel: {
    fontSize: 8,
    color: '#888',
    textTransform: 'uppercase',
  },
  catBadge: {
    fontSize: 8,
    padding: '1px 4px',
    marginRight: 4,
    marginBottom: 2,
  },
  catRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    fontSize: 8,
    color: '#aaa',
    textAlign: 'center',
  },
})

function getCategoryColor(cat) {
  return CATEGORY_COLORS[cat] || CATEGORY_COLORS.other
}

function formatDateStr(dateStr) {
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function formatMinutesToTime(m) {
  const h = Math.floor(((m % 1440) + 1440) % 1440 / 60)
  const min = ((m % 1440) + 1440) % 1440 % 60
  return `${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}`
}

export default function ReportPDF({ blocks, dateFrom, dateTo, settings }) {
  const byDate = {}
  for (const block of blocks) {
    if (!byDate[block.date]) byDate[block.date] = []
    byDate[block.date].push(block)
  }

  const sortedDates = Object.keys(byDate).sort()

  const totalHours = blocks.reduce((s, b) => s + b.duration / 60, 0)
  const daysCount = sortedDates.length
  const avgHours = daysCount > 0 ? totalHours / daysCount : 0
  const catHours = {}
  for (const block of blocks) {
    catHours[block.category] = (catHours[block.category] || 0) + block.duration / 60
  }
  let topCategory = 'none'
  let topHours = 0
  for (const [cat, hrs] of Object.entries(catHours)) {
    if (hrs > topHours) {
      topHours = hrs
      topCategory = cat
    }
  }

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>ChronoFlow Report</Text>
        <Text style={styles.subtitle}>
          {formatDateStr(dateFrom)} – {formatDateStr(dateTo)}
        </Text>

        <Text style={styles.sectionTitle}>Daily Breakdown</Text>
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={styles.dateCol}>Date</Text>
            <Text style={styles.hoursCol}>Hours</Text>
            <Text style={styles.catsCol}>Categories</Text>
          </View>
          {sortedDates.map(date => {
            const dayBlocks = byDate[date]
            const dayTotal = dayBlocks.reduce((s, b) => s + b.duration / 60, 0)
            const cats = [...new Set(dayBlocks.map(b => b.category))]
            return (
              <View key={date} style={styles.tableRow}>
                <Text style={styles.dateCol}>{formatDateStr(date)}</Text>
                <Text style={styles.hoursCol}>{dayTotal.toFixed(1)}</Text>
                <View style={{ ...styles.catsCol, ...styles.catRow }}>
                  {cats.map(c => (
                    <Text key={c} style={{ ...styles.catBadge, color: getCategoryColor(c) }}>
                      {c}
                    </Text>
                  ))}
                </View>
              </View>
            )
          })}
        </View>

        <Text style={styles.sectionTitle}>Summary</Text>
        <View style={styles.summaryGrid}>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryValue}>{totalHours.toFixed(1)}</Text>
            <Text style={styles.summaryLabel}>Total Hours</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryValue}>{avgHours.toFixed(1)}</Text>
            <Text style={styles.summaryLabel}>Avg Hours/Day</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryValue}>{topCategory}</Text>
            <Text style={styles.summaryLabel}>Top Category</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryValue}>{daysCount}</Text>
            <Text style={styles.summaryLabel}>Days Tracked</Text>
          </View>
        </View>

        {settings && (
          <>
            <Text style={styles.sectionTitle}>Sleep Targets</Text>
            <Text>Bedtime: {formatMinutesToTime(settings.sleep_start)}</Text>
            <Text>Wake time: {formatMinutesToTime(settings.sleep_end)}</Text>
          </>
        )}

        <Text style={styles.footer}>Generated by ChronoFlow</Text>
      </Page>
    </Document>
  )
}
