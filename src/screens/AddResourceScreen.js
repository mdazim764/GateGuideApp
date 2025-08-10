import React, { useState, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Switch,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { ThemeContext } from '../theme/ThemeContext';
// Change import from old document picker to new one
import { pick } from '@react-native-documents/picker';
import CustomHeader from '../components/CustomHeader';

const AddResourceScreen = ({ navigation }) => {
  const { theme } = useContext(ThemeContext);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Resource data
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [subject, setSubject] = useState('');
  const [subjectDropdownOpen, setSubjectDropdownOpen] = useState(false);
  const [resourceType, setResourceType] = useState('');
  const [resourceTypeDropdownOpen, setResourceTypeDropdownOpen] = useState(false);
  const [tags, setTags] = useState('');
  const [fileAttached, setFileAttached] = useState(false);
  const [fileName, setFileName] = useState('');
  const [fileSize, setFileSize] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  
  // For validation
  const [errors, setErrors] = useState({});

  // Resource subjects and types (matching existing app data)
  const subjects = [
    { label: 'Operating Systems', value: 'Operating Systems' },
    { label: 'Data Structures', value: 'Data Structures' },
    { label: 'Computer Networks', value: 'Computer Networks' },
    { label: 'Algorithms', value: 'Algorithms' },
    { label: 'Database Systems', value: 'Database Systems' },
    { label: 'Theory of Computation', value: 'Theory of Computation' },
    { label: 'Digital Logic', value: 'Digital Logic' },
    { label: 'Mathematics', value: 'Mathematics' },
  ];

  const resourceTypes = [
    { label: 'PDF Document', value: 'pdf' },
    { label: 'Video', value: 'video' },
    { label: 'Practice Quiz', value: 'quiz' },
    { label: 'Study Notes', value: 'notes' },
    { label: 'YouTube', value: 'youtube' },
  ];

  const validate = () => {
    const newErrors = {};
    
    if (!title.trim()) newErrors.title = 'Title is required';
    if (!description.trim()) newErrors.description = 'Description is required';
    if (!subject) newErrors.subject = 'Subject is required';
    if (!resourceType) newErrors.resourceType = 'Resource type is required';
    
    if ((resourceType === 'video' || resourceType === 'youtube') && !videoUrl.trim()) {
      newErrors.videoUrl = 'Video URL is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Updated document picker implementation using new API
  const handlePickDocument = async () => {
    try {
      const [result] = await pick({
        type: ['application/pdf', 'text/plain'], // Accept PDF and text files
      });
      
      if (result) {
        setFileAttached(true);
        setFileName(result.name || 'Document');
        setFileSize(formatBytes(result.size));
      }
    } catch (err) {
      console.error('Error picking document:', err);
    }
  };

  const formatBytes = (bytes, decimals = 2) => {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(decimals)) + ' ' + sizes[i];
  };

  const handleSubmit = () => {
    if (validate()) {
      setIsSubmitting(true);
      
      // Mock API call
      setTimeout(() => {
        setIsSubmitting(false);
        Alert.alert(
          'Success',
          'Your resource has been submitted for review and will be available once approved.',
          [{ text: 'OK', onPress: () => navigation.goBack() }]
        );
      }, 1500);
    }
  };

  const getInputBackgroundColor = () => {
    return theme.mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)';
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <CustomHeader 
        title="Add Resource" 
        onBack={() => navigation.goBack()} 
      />
      
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.formContainer}>
          {/* Info Card */}
          <View style={[styles.infoCard, { backgroundColor: `${theme.primary}15` }]}>
            <Icon name="information-outline" size={20} color={theme.primary} style={{ marginRight: 8 }} />
            <Text style={{ color: theme.text, flex: 1 }}>
              Contribute to the community by sharing helpful study resources. All submissions will be reviewed before publishing.
            </Text>
          </View>

          {/* Title */}
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: theme.text }]}>Resource Title *</Text>
            <TextInput
              style={[
                styles.input, 
                { 
                  backgroundColor: getInputBackgroundColor(),
                  color: theme.text,
                  borderColor: errors.title ? '#E53935' : 'transparent'
                }
              ]}
              placeholder="Enter a descriptive title"
              placeholderTextColor={`${theme.text}50`}
              value={title}
              onChangeText={setTitle}
            />
            {errors.title && <Text style={styles.errorText}>{errors.title}</Text>}
          </View>

          {/* Subject Dropdown */}
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: theme.text }]}>Subject *</Text>
            <TouchableOpacity
              style={[
                styles.dropdown, 
                { 
                  backgroundColor: getInputBackgroundColor(),
                  borderColor: errors.subject ? '#E53935' : 'transparent'
                }
              ]}
              onPress={() => setSubjectDropdownOpen(!subjectDropdownOpen)}
            >
              <Text style={{ color: subject ? theme.text : `${theme.text}50` }}>
                {subject || 'Select a subject'}
              </Text>
              <Icon 
                name={subjectDropdownOpen ? "chevron-up" : "chevron-down"} 
                size={20} 
                color={theme.text} 
              />
            </TouchableOpacity>
            {errors.subject && <Text style={styles.errorText}>{errors.subject}</Text>}
            
            {subjectDropdownOpen && (
              <View style={[styles.dropdownMenu, { backgroundColor: theme.card }]}>
                {subjects.map((item) => (
                  <TouchableOpacity
                    key={item.value}
                    style={styles.dropdownItem}
                    onPress={() => {
                      setSubject(item.value);
                      setSubjectDropdownOpen(false);
                    }}
                  >
                    <Text style={{ color: theme.text }}>{item.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          {/* Resource Type Dropdown */}
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: theme.text }]}>Resource Type *</Text>
            <TouchableOpacity
              style={[
                styles.dropdown, 
                { 
                  backgroundColor: getInputBackgroundColor(),
                  borderColor: errors.resourceType ? '#E53935' : 'transparent'
                }
              ]}
              onPress={() => setResourceTypeDropdownOpen(!resourceTypeDropdownOpen)}
            >
              <Text style={{ color: resourceType ? theme.text : `${theme.text}50` }}>
                {resourceType ? resourceTypes.find(t => t.value === resourceType)?.label : 'Select resource type'}
              </Text>
              <Icon 
                name={resourceTypeDropdownOpen ? "chevron-up" : "chevron-down"} 
                size={20} 
                color={theme.text} 
              />
            </TouchableOpacity>
            {errors.resourceType && <Text style={styles.errorText}>{errors.resourceType}</Text>}
            
            {resourceTypeDropdownOpen && (
              <View style={[styles.dropdownMenu, { backgroundColor: theme.card }]}>
                {resourceTypes.map((item) => (
                  <TouchableOpacity
                    key={item.value}
                    style={styles.dropdownItem}
                    onPress={() => {
                      setResourceType(item.value);
                      setResourceTypeDropdownOpen(false);
                    }}
                  >
                    <Text style={{ color: theme.text }}>{item.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          {/* Description */}
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: theme.text }]}>Description *</Text>
            <TextInput
              style={[
                styles.textArea, 
                { 
                  backgroundColor: getInputBackgroundColor(),
                  color: theme.text,
                  borderColor: errors.description ? '#E53935' : 'transparent'
                }
              ]}
              placeholder="Provide a detailed description"
              placeholderTextColor={`${theme.text}50`}
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
            {errors.description && <Text style={styles.errorText}>{errors.description}</Text>}
          </View>

          {/* Tags */}
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: theme.text }]}>Tags (comma separated)</Text>
            <TextInput
              style={[
                styles.input, 
                { backgroundColor: getInputBackgroundColor(), color: theme.text }
              ]}
              placeholder="algorithms, sorting, complexity"
              placeholderTextColor={`${theme.text}50`}
              value={tags}
              onChangeText={setTags}
            />
          </View>

          {/* Conditional input based on resource type */}
          {resourceType === 'video' || resourceType === 'youtube' ? (
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: theme.text }]}>Video URL *</Text>
              <TextInput
                style={[
                  styles.input, 
                  { 
                    backgroundColor: getInputBackgroundColor(),
                    color: theme.text,
                    borderColor: errors.videoUrl ? '#E53935' : 'transparent'
                  }
                ]}
                placeholder="YouTube URL"
                placeholderTextColor={`${theme.text}50`}
                value={videoUrl}
                onChangeText={setVideoUrl}
              />
              {errors.videoUrl && <Text style={styles.errorText}>{errors.videoUrl}</Text>}
            </View>
          ) : resourceType === 'pdf' || resourceType === 'notes' ? (
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: theme.text }]}>Attachment *</Text>
              
              <TouchableOpacity
                style={[
                  styles.filePicker,
                  { 
                    backgroundColor: getInputBackgroundColor(),
                    borderColor: errors.file ? '#E53935' : 'transparent'
                  }
                ]}
                onPress={handlePickDocument}
              >
                <Icon name="file-upload" size={24} color={theme.primary} />
                <Text style={{ color: theme.text, marginLeft: 8 }}>
                  {fileAttached ? 'Change file' : 'Select a file'}
                </Text>
              </TouchableOpacity>
              
              {fileAttached && (
                <View style={styles.fileInfo}>
                  <Icon name="file-document" size={20} color={theme.primary} />
                  <View style={{ marginLeft: 8, flex: 1 }}>
                    <Text style={{ color: theme.text }} numberOfLines={1}>{fileName}</Text>
                    <Text style={{ color: `${theme.text}70`, fontSize: 12 }}>{fileSize}</Text>
                  </View>
                  <TouchableOpacity onPress={() => setFileAttached(false)}>
                    <Icon name="close-circle" size={20} color={`${theme.text}70`} />
                  </TouchableOpacity>
                </View>
              )}
              
              {errors.file && <Text style={styles.errorText}>{errors.file}</Text>}
            </View>
          ) : null}

          {/* Visibility */}
          <View style={styles.switchRow}>
            <View>
              <Text style={[styles.label, { color: theme.text }]}>Make publicly available</Text>
              <Text style={{ color: `${theme.text}70`, fontSize: 12 }}>
                Allow other users to see and use this resource
              </Text>
            </View>
            <Switch
              value={isPublic}
              onValueChange={setIsPublic}
              trackColor={{ false: `${theme.text}30`, true: `${theme.primary}70` }}
              thumbColor={isPublic ? theme.primary : `${theme.text}50`}
            />
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            style={[styles.submitButton, { backgroundColor: theme.primary }]}
            onPress={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <>
                <Icon name="upload" size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
                <Text style={styles.submitButtonText}>Submit Resource</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  formContainer: {
    padding: 16,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
  },
  input: {
    height: 48,
    borderRadius: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
  },
  textArea: {
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingTop: 12,
    minHeight: 120,
    borderWidth: 1,
  },
  dropdown: {
    height: 48,
    borderRadius: 8,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
  },
  dropdownMenu: {
    marginTop: 4,
    borderRadius: 8,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    zIndex: 1000,
  },
  dropdownItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  filePicker: {
    height: 48,
    borderRadius: 8,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  fileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    padding: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    borderRadius: 8,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 52,
    borderRadius: 8,
    marginTop: 8,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  errorText: {
    color: '#E53935',
    fontSize: 12,
    marginTop: 4,
  },
});

export default AddResourceScreen;