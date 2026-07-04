import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'
import { CATEGORY_COLORS } from '../store/constants'

const styles = StyleSheet.create({
  page: {
    padding: 0,
    fontFamily: 'Helvetica',
    fontSize: 10,
    color: '#1a1a1a',
  },
  header: {
    backgroundColor: '#6366F1',
    padding: 24,
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  headerSub: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 4,
  },
  body: {
    paddingHorizontal: 24,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  barRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  barLabel: {
    width: 60,
    fontSize: 9,
    color: '#555',
    textTransform: 'capitalize',
  },
  barTrack: {
    flex: 1,
    height: 18,
    backgroundColor: '#f0f0f0',
    borderRadius: 3,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 3,
  },
  barValue: {
    width: 40,
    fontSize: 9,
    textAlign: 'right',
    color: '#777',
  },
  timelineRow: {
    flexDirection: 'row',
    marginBottom: 6,
    alignItems: 'center',
  },
  timelineDate: {
    width: 80,
    fontSize: 8,
    color: '#555',
  },
  timelineTrack: {
    flex: 1,
    height: 20,
    backgroundColor: '#f5f5f5',
    borderRadius: 3,
    flexDirection: 'row',
    overflow: 'hidden',
  },
  timelineBlock: {
    height: '100%',
  },
  timelineHours: {
    width: 35,
    fontSize: 8,
    textAlign: 'right',
    color: '#999',
  },
  summaryGrid: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
    flexWrap: 'wrap',
  },
  summaryCard: {
    flex: 1,
    minWidth: 100,
    borderWidth: 1,
    borderColor: '#6366F1',
    borderStyle: 'solid',
    borderRadius: 4,
    padding: 12,
  },
  summaryValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#6366F1',
    marginBottom: 2,
  },
  summaryLabel: {
    fontSize: 8,
    color: '#888',
    textTransform: 'uppercase',
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 24,
    right: 24,
    fontSize: 8,
    color: '#bbb',
    textAlign: 'center',
  },
})

function getCategoryColor(cat) {
  return CATEGORY_COLORS[cat] || CATEGORY_COLORS.other
}

function formatDateStr(dateStr) {
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export default function VisualPDF({ blocks, dateFrom, dateTo, settings }) {
  const totalHours = blocks.reduce((s, b) => s + b.duration / 60, 0)

  const byDate = {}
  for (const block of blocks) {
    if (!byDate[block.date]) byDate[block.date] = []
    byDate[block.date].push(block)
  }
  const sortedDates = Object.keys(byDate).sort()
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

  const maxCatHours = Math.max(...Object.values(catHours), 1)

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>ChronoFlow</Text>
          <Text style={styles.headerSub}>
            {formatDateStr(dateFrom)} – {formatDateStr(dateTo)}
          </Text>
        </View>

        <View style={styles.body}>
          <Text style={styles.sectionTitle}>Category Breakdown</Text>
          {Object.entries(catHours)
            .sort(([, a], [, b]) => b - a)
            .map(([cat, hrs]) => (
              <View key={cat} style={styles.barRow}>
                <Text style={styles.barLabel}>{cat}</Text>
                <View style={styles.barTrack}>
                  <View
                    style={{
                      ...styles.barFill,
                      width: `${(hrs / maxCatHours) * 100}%`,
                      backgroundColor: getCategoryColor(cat),
                    }}
                  />
                </View>
                <Text style={styles.barValue}>{hrs.toFixed(1)}h</Text>
              </View>
            ))}

          <Text style={{ ...styles.sectionTitle, marginTop: 16 }}>Daily Timeline</Text>
          {sortedDates.map(date => {
            const dayBlocks = byDate[date]
            const dayTotal = dayBlocks.reduce((s, b) => s + b.duration / 60, 0)
            const maxWidth = Math.min(dayTotal / 24, 1)
            return (
              <View key={date} style={styles.timelineRow}>
                <Text style={styles.timelineDate}>{formatDateStr(date)}</Text>
                <View style={styles.timelineTrack}>
                  {dayBlocks.map((block, i) => {
                    const blockHours = block.duration / 60
                    const widthPct = (blockHours / 24) * 100
                    return (
                      <View
                        key={block.id || i}
                        style={{
                          ...styles.timelineBlock,
                          width: `${widthPct}%`,
                          backgroundColor: getCategoryColor(block.category),
                        }}
                      />
                    )
                  })}
                </View>
                <Text style={styles.timelineHours}>{dayTotal.toFixed(1)}h</Text>
              </View>
            )
          })}

          <Text style={{ ...styles.sectionTitle, marginTop: 16 }}>Summary</Text>
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
        </View>

        <Text style={styles.footer}>Generated by ChronoFlow</Text>
      </Page>
    </Document>
  )
}
