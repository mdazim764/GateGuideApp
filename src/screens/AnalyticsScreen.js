import React, { useContext, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { ThemeContext } from '../theme/ThemeContext';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const { width } = Dimensions.get('window');

// Simple chart bar component
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
              height: `${percentage}%` 
            }
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
  
  // Mock data
  const studyData = {
    week: {
      totalHours: 18,
      daysActive: 5,
      quizzesTaken: 8,
      averageScore: 72,
      dailyStudy: [
        { day: 'Mon', hours: 3 },
        { day: 'Tue', hours: 4.5 },
        { day: 'Wed', hours: 2 },
        { day: 'Thu', hours: 3.5 },
        { day: 'Fri', hours: 1 },
        { day: 'Sat', hours: 4 },
        { day: 'Sun', hours: 0 },
      ],
      subjectBreakdown: [
        { subject: 'OS', percentage: 30 },
        { subject: 'DBMS', percentage: 25 },
        { subject: 'CN', percentage: 20 },
        { subject: 'DS', percentage: 15 },
        { subject: 'Others', percentage: 10 },
      ],
    },
    month: {
      totalHours: 64,
      daysActive: 22,
      quizzesTaken: 24,
      averageScore: 76,
      dailyStudy: [
        { day: 'Week 1', hours: 18 },
        { day: 'Week 2', hours: 14 },
        { day: 'Week 3', hours: 20 },
        { day: 'Week 4', hours: 12 },
      ],
      subjectBreakdown: [
        { subject: 'OS', percentage: 28 },
        { subject: 'DBMS', percentage: 22 },
        { subject: 'CN', percentage: 25 },
        { subject: 'DS', percentage: 18 },
        { subject: 'Others', percentage: 7 },
      ],
    },
    year: {
      totalHours: 720,
      daysActive: 240,
      quizzesTaken: 104,
      averageScore: 82,
      dailyStudy: [
        { day: 'Jan', hours: 50 },
        { day: 'Feb', hours: 65 },
        { day: 'Mar', hours: 55 },
        { day: 'Apr', hours: 48 },
        { day: 'May', hours: 60 },
        { day: 'Jun', hours: 70 },
        { day: 'Jul', hours: 72 },
        { day: 'Aug', hours: 68 },
        { day: 'Sep', hours: 65 },
        { day: 'Oct', hours: 60 },
        { day: 'Nov', hours: 55 },
        { day: 'Dec', hours: 52 },
      ],
      subjectBreakdown: [
        { subject: 'OS', percentage: 25 },
        { subject: 'DBMS', percentage: 20 },
        { subject: 'CN', percentage: 22 },
        { subject: 'DS', percentage: 18 },
        { subject: 'Others', percentage: 15 },
      ],
    },
  };
  
  const data = studyData[selectedTimeframe];
  const maxStudyHours = Math.max(...data.dailyStudy.map(item => item.hours));
  
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-left" size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Analytics</Text>
        <TouchableOpacity>
          <Icon name="export-variant" size={24} color={theme.text} />
        </TouchableOpacity>
      </View>
      
      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.timeframeSelector}>
          <TouchableOpacity
            style={[
              styles.timeframeButton,
              selectedTimeframe === 'week' && { backgroundColor: `${theme.primary}20` }
            ]}
            onPress={() => setSelectedTimeframe('week')}
          >
            <Text
              style={[
                styles.timeframeText,
                { color: selectedTimeframe === 'week' ? theme.primary : theme.text }
              ]}
            >
              Week
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.timeframeButton,
              selectedTimeframe === 'month' && { backgroundColor: `${theme.primary}20` }
            ]}
            onPress={() => setSelectedTimeframe('month')}
          >
            <Text
              style={[
                styles.timeframeText,
                { color: selectedTimeframe === 'month' ? theme.primary : theme.text }
              ]}
            >
              Month
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.timeframeButton,
              selectedTimeframe === 'year' && { backgroundColor: `${theme.primary}20` }
            ]}
            onPress={() => setSelectedTimeframe('year')}
          >
            <Text
              style={[
                styles.timeframeText,
                { color: selectedTimeframe === 'year' ? theme.primary : theme.text }
              ]}
            >
              Year
            </Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.statsGrid}>
          <View style={[styles.statCard, { backgroundColor: theme.card }]}>
            <View style={[styles.statIconBox, { backgroundColor: `${theme.primary}20` }]}>
              <Icon name="clock-outline" size={24} color={theme.primary} />
            </View>
            <Text style={styles.statValue}>{data.totalHours}</Text>
            <Text style={styles.statLabel}>Hours Studied</Text>
          </View>
          
          <View style={[styles.statCard, { backgroundColor: theme.card }]}>
            <View style={[styles.statIconBox, { backgroundColor: `${theme.primary}20` }]}>
              <Icon name="calendar-check" size={24} color={theme.primary} />
            </View>
            <Text style={styles.statValue}>{data.daysActive}</Text>
            <Text style={styles.statLabel}>Days Active</Text>
          </View>
          
          <View style={[styles.statCard, { backgroundColor: theme.card }]}>
            <View style={[styles.statIconBox, { backgroundColor: `${theme.primary}20` }]}>
              <Icon name="notebook-check" size={24} color={theme.primary} />
            </View>
            <Text style={styles.statValue}>{data.quizzesTaken}</Text>
            <Text style={styles.statLabel}>Quizzes Taken</Text>
          </View>
          
          <View style={[styles.statCard, { backgroundColor: theme.card }]}>
            <View style={[styles.statIconBox, { backgroundColor: `${theme.primary}20` }]}>
              <Icon name="percent" size={24} color={theme.primary} />
            </View>
            <Text style={styles.statValue}>{data.averageScore}%</Text>
            <Text style={styles.statLabel}>Average Score</Text>
          </View>
        </View>
        
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>
              Study Time Distribution
            </Text>
            <TouchableOpacity>
              <Text style={{ color: theme.primary }}>Details</Text>
            </TouchableOpacity>
          </View>
          
          <View style={[styles.chartContainer, { backgroundColor: theme.card }]}>
            <View style={styles.barChart}>
              {data.dailyStudy.map((item, index) => (
                <ChartBar
                  key={index}
                  value={item.hours}
                  maxValue={maxStudyHours}
                  label={item.day}
                  color={theme.primary}
                  theme={theme}
                />
              ))}
            </View>
          </View>
        </View>
        
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>
              Subject Breakdown
            </Text>
            <TouchableOpacity>
              <Text style={{ color: theme.primary }}>Details</Text>
            </TouchableOpacity>
          </View>
          
          <View style={[styles.subjectBreakdown, { backgroundColor: theme.card }]}>
            {data.subjectBreakdown.map((item, index) => (
              <View key={index} style={styles.subjectItem}>
                <View style={styles.subjectInfo}>
                  <View 
                    style={[
                      styles.subjectColorDot, 
                      { 
                        backgroundColor: [
                          theme.primary, 
                          '#FF9800', 
                          '#4CAF50', 
                          '#2196F3', 
                          '#9C27B0'
                        ][index % 5] 
                      }
                    ]} 
                  />
                  <Text style={[styles.subjectName, { color: theme.text }]}>
                    {item.subject}
                  </Text>
                </View>
                <View style={styles.subjectPercentageContainer}>
                  <View 
                    style={[
                      styles.subjectPercentageBar,
                      { backgroundColor: `${theme.primary}20` }
                    ]}
                  >
                    <View 
                      style={[
                        styles.subjectPercentageFill,
                        { 
                          backgroundColor: [
                            theme.primary, 
                            '#FF9800', 
                            '#4CAF50', 
                            '#2196F3', 
                            '#9C27B0'
                          ][index % 5],
                          width: `${item.percentage}%`
                        }
                      ]}
                    />
                  </View>
                  <Text style={[styles.subjectPercentageText, { color: theme.text }]}>
                    {item.percentage}%
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </View>
        
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>
              Performance Insights
            </Text>
            <TouchableOpacity>
              <Text style={{ color: theme.primary }}>All Insights</Text>
            </TouchableOpacity>
          </View>
          
          <View style={[styles.insightsContainer, { backgroundColor: theme.card }]}>
            <View style={styles.insightItem}>
              <Icon name="trending-up" size={24} color="#4CAF50" />
              <Text style={[styles.insightText, { color: theme.text }]}>
                Your study time increased by 12% compared to last {selectedTimeframe}.
              </Text>
            </View>
            <View style={styles.insightItem}>
              <Icon name="star" size={24} color="#FFC107" />
              <Text style={[styles.insightText, { color: theme.text }]}>
                Your strongest subject is Operating Systems with 85% quiz score.
              </Text>
            </View>
            <View style={styles.insightItem}>
              <Icon name="alert" size={24} color="#FF5722" />
              <Text style={[styles.insightText, { color: theme.text }]}>
                Computer Networks needs more attention with only 65% quiz score.
              </Text>
            </View>
          </View>
        </View>
        
        <TouchableOpacity 
          style={[styles.exportButton, { backgroundColor: theme.primary }]}
          onPress={() => {/* Export logic */}}
        >
          <Text style={styles.exportButtonText}>Export Data</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
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
  scrollView: {
    flex: 1,
  },
  timeframeSelector: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderColor: '#ddd',
  },
  timeframeButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
  },
  timeframeText: {
    fontSize: 16,
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
    borderRadius: 8,
    marginBottom: 16,
    elevation: 2,
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
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  chartContainer: {
    borderRadius: 8,
    overflow: 'hidden',
    elevation: 2,
  },
  barChart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  chartBarContainer: {
    width: 30,
    alignItems: 'center',
    marginRight: 8,
  },
  barLabelContainer: {
    position: 'absolute',
    bottom: 100%,
    alignItems: 'center',
  },
  barValue: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  barBackground: {
    width: 100%,
    height: 100%,
    borderRadius: 4,
    backgroundColor: '#f0f0f0',
    overflow: 'hidden',
  },
  barFill: {
    width: 100%,
    borderRadius: 4,
    position: 'absolute',
    bottom: 0,
  },
  barLabel: {
    fontSize: 12,
    marginTop: 4,
  },
  subjectBreakdown: {
    padding: 16,
    borderRadius: 8,
    backgroundColor: '#f9f9f9',
    elevation: 2,
  },
  subjectItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  subjectInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  subjectColorDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  subjectName: {
    fontSize: 16,
    color: '#333',
  },
  subjectPercentageContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  subjectPercentageBar: {
    height: 8,
    borderRadius: 4,
    width: 100%,
    backgroundColor: '#e0e0e0',
    overflow: 'hidden',
    marginRight: 8,
  },
  subjectPercentageFill: {
    height: 100%,
    borderRadius: 4,
    position: 'absolute',
    top: 0,
  },
  subjectPercentageText: {
    fontSize: 14,
    color: '#333',
  },
  insightsContainer: {
    padding: 16,
    borderRadius: 8,
    backgroundColor: '#f9f9f9',
    elevation: 2,
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
  },
  exportButton: {
    backgroundColor: '#007bff',
    borderRadius: 4,
    paddingVertical: 12,
    alignItems: 'center',
    margin: 16,
  },
  exportButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default AnalyticsScreen;