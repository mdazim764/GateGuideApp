import React, { useState, useContext } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ThemeContext } from '../../theme/ThemeContext';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const LoginScreen = ({ navigation }) => {
  const { theme } = useContext(ThemeContext);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setLoading(true);
    // Mock login - would connect to backend later
    setTimeout(() => {
      setLoading(false);
      navigation.replace('Main');
    }, 1500);
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background,
    },
    scrollContent: {
      flexGrow: 1,
      justifyContent: 'center',
      padding: 24,
    },
    logoContainer: {
      alignItems: 'center',
      marginBottom: 40,
    },
    logo: {
      width: 120,
      height: 120,
      marginBottom: 16,
    },
    appName: {
      fontSize: 28,
      fontWeight: 'bold',
      color: theme.primary,
      marginBottom: 8,
    },
    appTagline: {
      fontSize: 16,
      color: theme.text,
      textAlign: 'center',
    },
    inputContainer: {
      marginBottom: 24,
    },
    inputLabel: {
      fontSize: 16,
      fontWeight: '500',
      color: theme.text,
      marginBottom: 8,
    },
    input: {
      backgroundColor: `${theme.text}10`,
      borderRadius: 8,
      padding: 16,
      color: theme.text,
      fontSize: 16,
    },
    passwordContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: `${theme.text}10`,
      borderRadius: 8,
    },
    passwordInput: {
      flex: 1,
      padding: 16,
      color: theme.text,
      fontSize: 16,
    },
    eyeIcon: {
      padding: 16,
    },
    forgotPassword: {
      alignSelf: 'flex-end',
      marginTop: 8,
      color: theme.primary,
      fontSize: 14,
    },
    loginButton: {
      backgroundColor: theme.primary,
      borderRadius: 8,
      padding: 16,
      alignItems: 'center',
      marginTop: 24,
    },
    loginButtonText: {
      color: '#FFFFFF',
      fontSize: 18,
      fontWeight: 'bold',
    },
    orContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginVertical: 24,
    },
    orLine: {
      flex: 1,
      height: 1,
      backgroundColor: `${theme.text}30`,
    },
    orText: {
      color: theme.text,
      marginHorizontal: 16,
    },
    signupContainer: {
      flexDirection: 'row',
      justifyContent: 'center',
      marginTop: 16,
    },
    signupText: {
      color: theme.text,
      fontSize: 16,
    },
    signupLink: {
      color: theme.primary,
      fontSize: 16,
      fontWeight: '500',
      marginLeft: 4,
    },
  });

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.logoContainer}>
            {/* Replace with your app logo */}
            <View 
              style={{
                width: 120, 
                height: 120, 
                backgroundColor: theme.primary, 
                borderRadius: 60,
                justifyContent: 'center',
                alignItems: 'center'
              }}
            >
              <Icon name="gate" size={80} color="#FFFFFF" />
            </View>
            <Text style={styles.appName}>GATE Guide</Text>
            <Text style={styles.appTagline}>Your Personal GATE Exam Assistant</Text>
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Email</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your email"
              placeholderTextColor={`${theme.text}50`}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Password</Text>
            <View style={styles.passwordContainer}>
              <TextInput
                style={styles.passwordInput}
                placeholder="Enter your password"
                placeholderTextColor={`${theme.text}50`}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
              />
              <TouchableOpacity 
                style={styles.eyeIcon}
                onPress={() => setShowPassword(!showPassword)}
              >
                <Icon 
                  name={showPassword ? 'eye-off' : 'eye'} 
                  size={24} 
                  color={theme.text} 
                />
              </TouchableOpacity>
            </View>
            <TouchableOpacity onPress={() => {}}>
              <Text style={styles.forgotPassword}>Forgot Password?</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity 
            style={styles.loginButton}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <Text style={styles.loginButtonText}>Log In</Text>
            )}
          </TouchableOpacity>

          <View style={styles.signupContainer}>
            <Text style={styles.signupText}>Don't have an account?</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Register')}>
              <Text style={styles.signupLink}>Sign Up</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default LoginScreen;