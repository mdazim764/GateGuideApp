import React, { useContext, useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
  Alert,
  Share,
  Platform,
} from 'react-native';
import { ThemeContext } from '../theme/ThemeContext';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import CustomHeader from '../components/CustomHeader';
import api from '../services/api';
import * as FileSystem from 'react-native-fs';

const { width } = Dimensions.get('window');

// Chart bar component
const ChartBar = ({ value, maxValue, label, color, theme }) => {
  const percentage = (value / maxValue) * 100;
  return (
    <View style={styles.chartBarContainer}>
      <View style={styles.barLabelContainer}>
        <Text style={[styles.barValue, { color: theme.text }]}>{value}</Text>
      </View>
      <View style={[styles.barBackground, { backgroundColor: `${color}30` }]}>
        <View
          style={[
            styles.barFill,
            {
              backgroundColor: color,
              height: `${percentage}%`,
            },
          ]}
        />
      </View>
      <Text style={[styles.barLabel, { color: theme.text }]}>{label}</Text>
    </View>
  );
};

const AnalyticsScreen = ({ navigation }) => {
  const { theme } = useContext(ThemeContext);
  const [selectedTimeframe, setSelectedTimeframe] = useState('week'); // 'week', 'month', 'year'
  const [analyticsData, setAnalyticsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [exportLoading, setExportLoading] = useState(false);

  // Fetch analytics data whenever timeframe changes
  useEffect(() => {
    fetchAnalytics();
  }, [selectedTimeframe]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await api.analytics.getAnalytics(selectedTimeframe);

      console.log('Analytics data:', response.data);
      setAnalyticsData(response.data);
    } catch (error) {
      console.error('Error fetching analytics:', error);
      setError('Failed to load analytics data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleExportData = async () => {
    try {
      setExportLoading(true);

      // Call the export API
      const response = await api.analytics.exportAnalyticsData(
        selectedTimeframe,
        'json',
      );

      // Share the data
      const exportData = JSON.stringify(response.data, null, 2);

      if (Platform.OS === 'ios') {
        // On iOS, directly share the JSON data
        await Share.share({
          title: `GATE Guide Analytics - ${
            selectedTimeframe.charAt(0).toUpperCase() +
            selectedTimeframe.slice(1)
          }`,
          message: exportData,
        });
      } else {
        // On Android, save to file then share
        const path = `${
          FileSystem.CachesDirectoryPath
        }/gate_analytics_${selectedTimeframe}_${Date.now()}.json`;
        await FileSystem.writeFile(path, exportData, 'utf8');

        await Share.share({
          title: `GATE Guide Analytics - ${
            selectedTimeframe.charAt(0).toUpperCase() +
            selectedTimeframe.slice(1)
          }`,
          url: `file://${path}`,
        });
      }
    } catch (error) {
      console.error('Error exporting data:', error);
      Alert.alert(
        'Export Failed',
        'Unable to export analytics data. Please try again.',
      );
    } finally {
      setExportLoading(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: theme.background }]}
      >
        <CustomHeader
          title="Analytics"
          navigation={navigation}
          onBack={() => navigation.goBack()}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={[styles.loadingText, { color: theme.text }]}>
            Loading analytics data...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: theme.background }]}
      >
        <CustomHeader
          title="Analytics"
          navigation={navigation}
          onBack={() => navigation.goBack()}
        />
        <View style={styles.errorContainer}>
          <Icon name="alert-circle-outline" size={64} color={theme.error} />
          <Text style={[styles.errorText, { color: theme.error }]}>
            {error}
          </Text>
          <TouchableOpacity
            style={[styles.retryButton, { backgroundColor: theme.primary }]}
            onPress={fetchAnalytics}
          >
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // If no data is available yet
  if (!analyticsData) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: theme.background }]}
      >
        <CustomHeader
          title="Analytics"
          navigation={navigation}
          onBack={() => navigation.goBack()}
        />
        <View style={styles.noDataContainer}>
          <Icon
            name="chart-timeline-variant"
            size={64}
            color={`${theme.text}40`}
          />
          <Text style={[styles.noDataText, { color: theme.textSecondary }]}>
            No analytics data available for this period
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // Extract data from API response
  const { summaryMetrics, studyTimeDistribution, subjectBreakdown, insights } =
    analyticsData;

  // Calculate max study hours for the chart
  const maxStudyHours = Math.max(...(studyTimeDistribution?.data || [0]));

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.background }]}
    >
      <CustomHeader
        title="Analytics"
        navigation={navigation}
        onBack={() => navigation.goBack()}
      />
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        {/* Timeframe Selector */}
        <View
          style={[styles.timeframeSelector, { backgroundColor: theme.card }]}
        >
          {['week', 'month', 'year'].map(tf => (
            <TouchableOpacity
              key={tf}
              style={[
                styles.timeframeButton,
                selectedTimeframe === tf && {
                  backgroundColor: `${theme.primary}20`,
                },
              ]}
              onPress={() => setSelectedTimeframe(tf)}
            >
              <Text
                style={[
                  styles.timeframeText,
                  {
                    color:
                      selectedTimeframe === tf ? theme.primary : theme.text,
                  },
                ]}
              >
                {tf.charAt(0).toUpperCase() + tf.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <View style={[styles.statCard, { backgroundColor: theme.card }]}>
            <View
              style={[
                styles.statIconBox,
                { backgroundColor: `${theme.primary}20` },
              ]}
            >
              <Icon name="clock-outline" size={24} color={theme.primary} />
            </View>
            <Text style={[styles.statValue, { color: theme.text }]}>
              {summaryMetrics?.hoursStudied || 0}
            </Text>
            <Text style={[styles.statLabel, { color: theme.textSecondary }]}>
              Hours Studied
            </Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: theme.card }]}>
            <View
              style={[
                styles.statIconBox,
                { backgroundColor: `${theme.primary}20` },
              ]}
            >
              <Icon name="calendar-check" size={24} color={theme.primary} />
            </View>
            <Text style={[styles.statValue, { color: theme.text }]}>
              {summaryMetrics?.daysActive || 0}
            </Text>
            <Text style={[styles.statLabel, { color: theme.textSecondary }]}>
              Days Active
            </Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: theme.card }]}>
            <View
              style={[
                styles.statIconBox,
                { backgroundColor: `${theme.primary}20` },
              ]}
            >
              <Icon name="notebook-check" size={24} color={theme.primary} />
            </View>
            <Text style={[styles.statValue, { color: theme.text }]}>
              {summaryMetrics?.quizzesTaken || 0}
            </Text>
            <Text style={[styles.statLabel, { color: theme.textSecondary }]}>
              Quizzes Taken
            </Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: theme.card }]}>
            <View
              style={[
                styles.statIconBox,
                { backgroundColor: `${theme.primary}20` },
              ]}
            >
              <Icon name="percent" size={24} color={theme.primary} />
            </View>
            <Text style={[styles.statValue, { color: theme.text }]}>
              {summaryMetrics?.averageScore || 0}%
            </Text>
            <Text style={[styles.statLabel, { color: theme.textSecondary }]}>
              Average Score
            </Text>
          </View>
        </View>

        {/* Study Time Distribution */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>
              Study Time Distribution
            </Text>
            <TouchableOpacity>
              <Text style={{ color: theme.primary }}>Details</Text>
            </TouchableOpacity>
          </View>
          <View
            style={[styles.chartContainer, { backgroundColor: theme.card }]}
          >
            <View style={styles.barChart}>
              {studyTimeDistribution?.labels?.map((label, index) => (
                <ChartBar
                  key={index}
                  value={studyTimeDistribution.data[index] || 0}
                  maxValue={maxStudyHours || 1}
                  label={label}
                  color={theme.primary}
                  theme={theme}
                />
              ))}
            </View>
          </View>
        </View>

        {/* Subject Breakdown */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>
              Subject Breakdown
            </Text>
            <TouchableOpacity>
              <Text style={{ color: theme.primary }}>Details</Text>
            </TouchableOpacity>
          </View>
          <View
            style={[styles.subjectBreakdown, { backgroundColor: theme.card }]}
          >
            {subjectBreakdown?.map((item, index) => (
              <View key={item.id} style={styles.subjectItem}>
                <View style={styles.subjectInfo}>
                  <View
                    style={[
                      styles.subjectColorDot,
                      {
                        backgroundColor:
                          item.color ||
                          [
                            theme.primary,
                            '#FF9800',
                            '#4CAF50',
                            '#2196F3',
                            '#9C27B0',
                          ][index % 5],
                      },
                    ]}
                  />
                  <Text style={[styles.subjectName, { color: theme.text }]}>
                    {item.name}
                  </Text>
                </View>
                <View style={styles.subjectPercentageContainer}>
                  <View
                    style={[
                      styles.subjectPercentageBar,
                      { backgroundColor: `${theme.primary}20` },
                    ]}
                  >
                    <View
                      style={[
                        styles.subjectPercentageFill,
                        {
                          backgroundColor:
                            item.color ||
                            [
                              theme.primary,
                              '#FF9800',
                              '#4CAF50',
                              '#2196F3',
                              '#9C27B0',
                            ][index % 5],
                          width: `${item.percentage}%`,
                        },
                      ]}
                    />
                  </View>
                  <Text
                    style={[
                      styles.subjectPercentageText,
                      { color: theme.text },
                    ]}
                  >
                    {item.percentage}%
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Performance Insights */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>
              Performance Insights
            </Text>
            <TouchableOpacity>
              <Text style={{ color: theme.primary }}>All Insights</Text>
            </TouchableOpacity>
          </View>
          <View
            style={[styles.insightsContainer, { backgroundColor: theme.card }]}
          >
            {insights?.map((insight, index) => (
              <View key={index} style={styles.insightItem}>
                <Icon
                  name={
                    insight.icon ||
                    (insight.type === 'strength'
                      ? 'trending-up'
                      : insight.type === 'warning'
                      ? 'alert'
                      : 'information')
                  }
                  size={24}
                  color={
                    insight.type === 'strength'
                      ? '#4CAF50'
                      : insight.type === 'warning'
                      ? '#FF5722'
                      : '#FFC107'
                  }
                />
                <Text style={[styles.insightText, { color: theme.text }]}>
                  {insight.message}
                </Text>
              </View>
            ))}

            {(!insights || insights.length === 0) && (
              <View style={styles.insightItem}>
                <Icon name="information" size={24} color="#2196F3" />
                <Text style={[styles.insightText, { color: theme.text }]}>
                  Continue studying to generate personalized insights.
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Export Button */}
        <TouchableOpacity
          style={[
            styles.exportButton,
            {
              backgroundColor: exportLoading
                ? `${theme.primary}80`
                : theme.primary,
            },
          ]}
          onPress={handleExportData}
          disabled={exportLoading}
        >
          {exportLoading ? (
            <View style={styles.buttonInnerContainer}>
              <ActivityIndicator color="#fff" size="small" />
              <Text style={styles.exportButtonText}>Exporting...</Text>
            </View>
          ) : (
            <View style={styles.buttonInnerContainer}>
              <Icon
                name="export"
                size={20}
                color="#fff"
                style={styles.exportIcon}
              />
              <Text style={styles.exportButtonText}>Export Data</Text>
            </View>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    elevation: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  timeframeSelector: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginVertical: 16,
    marginHorizontal: 16,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    paddingVertical: 8,
  },
  timeframeButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    marginHorizontal: 4,
  },
  timeframeText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    padding: 16,
  },
  statCard: {
    width: '48%',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    elevation: 2,
    alignItems: 'center',
  },
  statIconBox: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  statLabel: {
    fontSize: 14,
    color: '#777',
  },
  sectionContainer: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  chartContainer: {
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 2,
    padding: 16,
    marginHorizontal: 16,
    backgroundColor: '#fff',
  },
  barChart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingVertical: 8,
    paddingHorizontal: 4,
    minHeight: 120,
    justifyContent: 'space-around',
  },
  chartBarContainer: {
    width: 32,
    alignItems: 'center',
  },
  barLabelContainer: {
    position: 'absolute',
    bottom: '100%',
    alignItems: 'center',
  },
  barValue: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#333',
  },
  barBackground: {
    width: '100%',
    height: 80,
    borderRadius: 6,
    backgroundColor: '#f0f0f0',
    overflow: 'hidden',
    marginBottom: 4,
  },
  barFill: {
    width: '100%',
    borderRadius: 6,
    position: 'absolute',
    bottom: 0,
  },
  barLabel: {
    fontSize: 12,
    marginTop: 4,
    color: '#333',
  },
  subjectBreakdown: {
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#fff',
    elevation: 2,
    marginHorizontal: 16,
  },
  subjectItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderColor: '#eee',
  },
  subjectInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  subjectColorDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    marginRight: 10,
  },
  subjectName: {
    fontSize: 16,
    color: '#333',
  },
  subjectPercentageContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: 100,
  },
  subjectPercentageBar: {
    height: 8,
    borderRadius: 4,
    width: 60,
    backgroundColor: '#e0e0e0',
    overflow: 'hidden',
    marginRight: 8,
  },
  subjectPercentageFill: {
    height: '100%',
    borderRadius: 4,
    position: 'absolute',
    top: 0,
  },
  subjectPercentageText: {
    fontSize: 14,
    color: '#333',
    fontWeight: 'bold',
  },
  insightsContainer: {
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#fff',
    elevation: 2,
    marginHorizontal: 16,
  },
  insightItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  insightText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#333',
    flex: 1,
  },
  exportButton: {
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    margin: 16,
    marginBottom: 32,
    elevation: 2,
  },
  exportButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  buttonInnerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  exportIcon: {
    marginRight: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    marginTop: 16,
    marginBottom: 24,
    fontSize: 16,
    textAlign: 'center',
  },
  retryButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  noDataContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  noDataText: {
    marginTop: 16,
    fontSize: 16,
    textAlign: 'center',
  },
});

export default AnalyticsScreen;
