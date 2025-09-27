// src/screens/CacheManagementScreen.js
import React, { useState, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { ThemeContext } from '../theme/ThemeContext';
import { useData } from '../context/DataContext';
import CustomHeader from '../components/CustomHeader';

const CacheManagementScreen = ({ navigation }) => {
  const { theme } = useContext(ThemeContext);
  const { refreshAllData, refreshData, clearCache, getCacheInfo, loading } =
    useData();

  const [cacheInfo, setCacheInfo] = useState(null);

  const handleGetCacheInfo = async () => {
    const info = await getCacheInfo();
    setCacheInfo(info);
  };

  const handleClearAllCache = () => {
    Alert.alert(
      'Clear All Cache',
      'Are you sure you want to clear all cached data?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          onPress: async () => {
            await clearCache();
            Alert.alert('Success', 'All cache cleared successfully');
          },
        },
      ],
    );
  };

  const formatAge = age => {
    if (!age) return 'N/A';
    const hours = Math.floor(age / (1000 * 60 * 60));
    const minutes = Math.floor((age % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <CustomHeader title="Cache Management" navigation={navigation} />

      <ScrollView style={styles.content}>
        <TouchableOpacity
          style={[styles.button, { backgroundColor: theme.primary }]}
          onPress={handleGetCacheInfo}
        >
          <Text style={styles.buttonText}>Get Cache Info</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, { backgroundColor: theme.secondary }]}
          onPress={refreshAllData}
        >
          <Text style={styles.buttonText}>Refresh All Data</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, { backgroundColor: theme.error }]}
          onPress={handleClearAllCache}
        >
          <Text style={styles.buttonText}>Clear All Cache</Text>
        </TouchableOpacity>

        {cacheInfo && (
          <View style={[styles.infoContainer, { backgroundColor: theme.card }]}>
            <Text style={[styles.infoTitle, { color: theme.text }]}>
              Cache Information
            </Text>
            {Object.entries(cacheInfo).map(([key, info]) => (
              <View key={key} style={styles.infoItem}>
                <Text style={[styles.infoKey, { color: theme.text }]}>
                  {key}:
                </Text>
                <Text
                  style={[
                    styles.infoValue,
                    { color: info.isValid ? theme.success : theme.error },
                  ]}
                >
                  {info.exists
                    ? `Valid: ${info.isValid}, Age: ${formatAge(info.age)}`
                    : 'Not cached'}
                </Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  button: {
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 12,
  },
  buttonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 16,
  },
  infoContainer: {
    padding: 16,
    borderRadius: 8,
    marginTop: 16,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  infoItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  infoKey: {
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 12,
  },
});

export default CacheManagementScreen;
