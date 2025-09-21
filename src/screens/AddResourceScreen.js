import React, { useState, useContext, useEffect } from 'react';
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
  Modal,
  Image,
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
  const [resourceTypeDropdownOpen, setResourceTypeDropdownOpen] =
    useState(false);
  const [tags, setTags] = useState('');
  const [fileAttached, setFileAttached] = useState(false);
  const [fileName, setFileName] = useState('');
  const [fileSize, setFileSize] = useState('');
  const [fileUri, setFileUri] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [youtubeContentType, setYoutubeContentType] = useState('video');
  const [youtubePreview, setYoutubePreview] = useState(null);
  const [filePickerVisible, setFilePickerVisible] = useState(false);

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
    { label: 'PDF Document', value: 'pdf', icon: 'file-pdf-box' },
    { label: 'Video', value: 'video', icon: 'video' },
    { label: 'Practice Quiz', value: 'quiz', icon: 'help-circle' },
    { label: 'Study Notes', value: 'notes', icon: 'note-text' },
    { label: 'YouTube', value: 'youtube', icon: 'youtube' },
  ];

  const youtubeContentTypes = [
    { label: 'Single Video', value: 'video', icon: 'youtube' },
    { label: 'Playlist', value: 'playlist', icon: 'playlist-play' },
    { label: 'Channel', value: 'channel', icon: 'account-circle' },
  ];

  // Document file types
  const documentTypes = [
    {
      label: 'PDF Document',
      value: 'pdf',
      mimeType: 'application/pdf',
      icon: 'file-pdf-box',
    },
    {
      label: 'Text Document',
      value: 'txt',
      mimeType: 'text/plain',
      icon: 'file-document',
    },
    {
      label: 'Word Document',
      value: 'docx',
      mimeType:
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      icon: 'file-word',
    },
    {
      label: 'PowerPoint',
      value: 'pptx',
      mimeType:
        'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      icon: 'file-powerpoint',
    },
  ];

  useEffect(() => {
    // Reset YouTube content type when resource type changes
    if (resourceType === 'youtube') {
      setYoutubeContentType('video');
    }

    // Clear errors when input changes
    setErrors({});
  }, [resourceType]);

  // YouTube URL validation and preview
  useEffect(() => {
    if (videoUrl && resourceType === 'youtube') {
      // Reset preview while validating
      setYoutubePreview(null);

      // Simple validation
      if (videoUrl.includes('youtube.com') || videoUrl.includes('youtu.be')) {
        // Mock preview - in a real app, you'd fetch actual video/playlist details
        let previewData = null;

        if (youtubeContentType === 'video') {
          previewData = {
            type: 'video',
            title: 'YouTube Video Preview',
            thumbnail: 'https://i.ytimg.com/vi/dQw4w9WgXcQ/maxresdefault.jpg',
            duration: '10:15',
          };
        } else if (youtubeContentType === 'playlist') {
          previewData = {
            type: 'playlist',
            title: 'YouTube Playlist Preview',
            thumbnail: 'https://i.ytimg.com/vi/dQw4w9WgXcQ/maxresdefault.jpg',
            videoCount: 12,
          };
        } else if (youtubeContentType === 'channel') {
          previewData = {
            type: 'channel',
            title: 'Channel Name',
            thumbnail:
              'https://yt3.googleusercontent.com/ytc/APkrFKbpSojje_-tkBQecNtFuPdSCrg3ZT0FhaYjln9k0g=s176-c-k-c0x00ffffff-no-rj',
            subscriberCount: '1.2M',
          };
        }

        setYoutubePreview(previewData);
      }
    }
  }, [videoUrl, youtubeContentType, resourceType]);

  const validate = () => {
    const newErrors = {};

    if (!title.trim()) newErrors.title = 'Title is required';
    if (!description.trim()) newErrors.description = 'Description is required';
    if (!subject) newErrors.subject = 'Subject is required';
    if (!resourceType) newErrors.resourceType = 'Resource type is required';

    if (
      (resourceType === 'video' || resourceType === 'youtube') &&
      !videoUrl.trim()
    ) {
      newErrors.videoUrl = 'Video URL is required';
    }

    if ((resourceType === 'pdf' || resourceType === 'notes') && !fileAttached) {
      newErrors.file = 'Please attach a file';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Updated document picker implementation
  const handlePickDocument = async mimeType => {
    try {
      setFilePickerVisible(false);

      const options = {
        type: Array.isArray(mimeType) ? mimeType : [mimeType],
      };

      const [result] = await pick(options);

      if (result) {
        setFileAttached(true);
        setFileName(result.name || 'Document');
        setFileSize(formatBytes(result.size));
        setFileUri(result.uri || '');
      }
    } catch (err) {
      console.error('Error picking document:', err);

      // Only show alert if it's not a user cancellation
      if (err.code !== 'DOCUMENT_PICKER_CANCELED') {
        Alert.alert('Error', 'Failed to pick document. Please try again.');
      }
    }
  };

  const formatBytes = (bytes, decimals = 2) => {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return (
      parseFloat((bytes / Math.pow(k, i)).toFixed(decimals)) + ' ' + sizes[i]
    );
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
          [{ text: 'OK', onPress: () => navigation.goBack() }],
        );
      }, 1500);
    }
  };

  const getInputBackgroundColor = () => {
    return theme.mode === 'dark'
      ? 'rgba(255, 255, 255, 0.05)'
      : 'rgba(0, 0, 0, 0.05)';
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.background }]}
    >
      <CustomHeader
        title="Add Resource"
        navigation={navigation}
        onBack={() => navigation.goBack()}
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.formContainer}>
          {/* Info Card */}
          <View
            style={[styles.infoCard, { backgroundColor: `${theme.primary}15` }]}
          >
            <Icon
              name="information-outline"
              size={20}
              color={theme.primary}
              style={{ marginRight: 8 }}
            />
            <Text style={{ color: theme.text, flex: 1 }}>
              Contribute to the community by sharing helpful study resources.
              All submissions will be reviewed before publishing.
            </Text>
          </View>

          {/* Title */}
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: theme.text }]}>
              Resource Title *
            </Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: getInputBackgroundColor(),
                  color: theme.text,
                  borderColor: errors.title ? '#E53935' : 'transparent',
                },
              ]}
              placeholder="Enter a descriptive title"
              placeholderTextColor={`${theme.text}50`}
              value={title}
              onChangeText={setTitle}
            />
            {errors.title && (
              <Text style={styles.errorText}>{errors.title}</Text>
            )}
          </View>

          {/* Subject Dropdown */}
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: theme.text }]}>Subject *</Text>
            <TouchableOpacity
              style={[
                styles.dropdown,
                {
                  backgroundColor: getInputBackgroundColor(),
                  borderColor: errors.subject ? '#E53935' : 'transparent',
                },
              ]}
              onPress={() => setSubjectDropdownOpen(!subjectDropdownOpen)}
            >
              <Text style={{ color: subject ? theme.text : `${theme.text}50` }}>
                {subject || 'Select a subject'}
              </Text>
              <Icon
                name={subjectDropdownOpen ? 'chevron-up' : 'chevron-down'}
                size={20}
                color={theme.text}
              />
            </TouchableOpacity>
            {errors.subject && (
              <Text style={styles.errorText}>{errors.subject}</Text>
            )}

            {subjectDropdownOpen && (
              <View
                style={[styles.dropdownMenu, { backgroundColor: theme.card }]}
              >
                {subjects.map(item => (
                  <TouchableOpacity
                    key={item.value}
                    style={[
                      styles.dropdownItem,
                      { borderBottomColor: `${theme.text}10` },
                    ]}
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
            <Text style={[styles.label, { color: theme.text }]}>
              Resource Type *
            </Text>
            <TouchableOpacity
              style={[
                styles.dropdown,
                {
                  backgroundColor: getInputBackgroundColor(),
                  borderColor: errors.resourceType ? '#E53935' : 'transparent',
                },
              ]}
              onPress={() =>
                setResourceTypeDropdownOpen(!resourceTypeDropdownOpen)
              }
            >
              {resourceType ? (
                <View style={styles.selectedResourceType}>
                  <Icon
                    name={
                      resourceTypes.find(t => t.value === resourceType)?.icon ||
                      'file'
                    }
                    size={18}
                    color={theme.primary}
                    style={{ marginRight: 8 }}
                  />
                  <Text style={{ color: theme.text }}>
                    {resourceTypes.find(t => t.value === resourceType)?.label}
                  </Text>
                </View>
              ) : (
                <Text style={{ color: `${theme.text}50` }}>
                  Select resource type
                </Text>
              )}
              <Icon
                name={resourceTypeDropdownOpen ? 'chevron-up' : 'chevron-down'}
                size={20}
                color={theme.text}
              />
            </TouchableOpacity>
            {errors.resourceType && (
              <Text style={styles.errorText}>{errors.resourceType}</Text>
            )}

            {resourceTypeDropdownOpen && (
              <View
                style={[styles.dropdownMenu, { backgroundColor: theme.card }]}
              >
                {resourceTypes.map(item => (
                  <TouchableOpacity
                    key={item.value}
                    style={[
                      styles.dropdownItem,
                      { borderBottomColor: `${theme.text}10` },
                    ]}
                    onPress={() => {
                      setResourceType(item.value);
                      setResourceTypeDropdownOpen(false);
                    }}
                  >
                    <Icon
                      name={item.icon}
                      size={18}
                      color={theme.primary}
                      style={{ marginRight: 8 }}
                    />
                    <Text style={{ color: theme.text }}>{item.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          {/* Description */}
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: theme.text }]}>
              Description *
            </Text>
            <TextInput
              style={[
                styles.textArea,
                {
                  backgroundColor: getInputBackgroundColor(),
                  color: theme.text,
                  borderColor: errors.description ? '#E53935' : 'transparent',
                },
              ]}
              placeholder="Provide a detailed description"
              placeholderTextColor={`${theme.text}50`}
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
            {errors.description && (
              <Text style={styles.errorText}>{errors.description}</Text>
            )}
          </View>

          {/* Tags */}
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: theme.text }]}>
              Tags (comma separated)
            </Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: getInputBackgroundColor(),
                  color: theme.text,
                },
              ]}
              placeholder="algorithms, sorting, complexity"
              placeholderTextColor={`${theme.text}50`}
              value={tags}
              onChangeText={setTags}
            />
          </View>

          {/* Conditional input based on resource type */}
          {resourceType === 'youtube' && (
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: theme.text }]}>
                YouTube Content Type
              </Text>

              <View style={styles.youtubeTypeSelector}>
                {youtubeContentTypes.map(type => (
                  <TouchableOpacity
                    key={type.value}
                    style={[
                      styles.youtubeTypeButton,
                      youtubeContentType === type.value && [
                        styles.youtubeTypeButtonActive,
                        {
                          borderColor: theme.primary,
                          backgroundColor: `${theme.primary}15`,
                        },
                      ],
                    ]}
                    onPress={() => setYoutubeContentType(type.value)}
                  >
                    <Icon
                      name={type.icon}
                      size={20}
                      color={
                        youtubeContentType === type.value
                          ? theme.primary
                          : `${theme.text}70`
                      }
                      style={{ marginRight: 6 }}
                    />
                    <Text
                      style={{
                        color:
                          youtubeContentType === type.value
                            ? theme.primary
                            : theme.text,
                        fontWeight:
                          youtubeContentType === type.value ? '600' : 'normal',
                      }}
                    >
                      {type.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text
                style={[styles.label, { color: theme.text, marginTop: 16 }]}
              >
                {youtubeContentType === 'video'
                  ? 'YouTube Video URL *'
                  : youtubeContentType === 'playlist'
                  ? 'YouTube Playlist URL *'
                  : 'YouTube Channel URL *'}
              </Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: getInputBackgroundColor(),
                    color: theme.text,
                    borderColor: errors.videoUrl ? '#E53935' : 'transparent',
                  },
                ]}
                placeholder={
                  youtubeContentType === 'video'
                    ? 'https://youtu.be/videoId'
                    : youtubeContentType === 'playlist'
                    ? 'https://youtube.com/playlist?list=playlistId'
                    : 'https://youtube.com/c/channelName'
                }
                placeholderTextColor={`${theme.text}50`}
                value={videoUrl}
                onChangeText={setVideoUrl}
              />
              {errors.videoUrl && (
                <Text style={styles.errorText}>{errors.videoUrl}</Text>
              )}

              {youtubePreview && (
                <View
                  style={[
                    styles.youtubePreview,
                    { backgroundColor: `${theme.card}` },
                  ]}
                >
                  <Image
                    source={{ uri: youtubePreview.thumbnail }}
                    style={styles.youtubeThumbnail}
                  />
                  <View style={styles.youtubePreviewInfo}>
                    <Text
                      style={[
                        styles.youtubePreviewTitle,
                        { color: theme.text },
                      ]}
                      numberOfLines={2}
                    >
                      {youtubePreview.title}
                    </Text>
                    <View style={styles.youtubePreviewMeta}>
                      <Icon
                        name={
                          youtubeContentType === 'video'
                            ? 'youtube'
                            : youtubeContentType === 'playlist'
                            ? 'playlist-play'
                            : 'account-circle'
                        }
                        size={14}
                        color={
                          youtubeContentType === 'video'
                            ? '#FF0000'
                            : theme.primary
                        }
                      />
                      <Text
                        style={[
                          styles.youtubePreviewMetaText,
                          { color: `${theme.text}80` },
                        ]}
                      >
                        {youtubeContentType === 'video'
                          ? youtubePreview.duration
                          : youtubeContentType === 'playlist'
                          ? `${youtubePreview.videoCount} videos`
                          : `${youtubePreview.subscriberCount} subscribers`}
                      </Text>
                    </View>
                  </View>
                </View>
              )}
            </View>
          )}

          {resourceType === 'video' && resourceType !== 'youtube' && (
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: theme.text }]}>
                Video URL *
              </Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: getInputBackgroundColor(),
                    color: theme.text,
                    borderColor: errors.videoUrl ? '#E53935' : 'transparent',
                  },
                ]}
                placeholder="https://example.com/video.mp4"
                placeholderTextColor={`${theme.text}50`}
                value={videoUrl}
                onChangeText={setVideoUrl}
              />
              {errors.videoUrl && (
                <Text style={styles.errorText}>{errors.videoUrl}</Text>
              )}
            </View>
          )}

          {(resourceType === 'pdf' || resourceType === 'notes') && (
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: theme.text }]}>
                Attachment *
              </Text>

              <TouchableOpacity
                style={[
                  styles.filePicker,
                  {
                    backgroundColor: getInputBackgroundColor(),
                    borderColor: errors.file ? '#E53935' : 'transparent',
                  },
                ]}
                onPress={() => setFilePickerVisible(true)}
              >
                <Icon name="file-upload" size={24} color={theme.primary} />
                <Text style={{ color: theme.text, marginLeft: 8 }}>
                  {fileAttached ? 'Change file' : 'Select a file'}
                </Text>
              </TouchableOpacity>

              {fileAttached && (
                <View
                  style={[
                    styles.fileInfo,
                    { backgroundColor: `${theme.text}10` },
                  ]}
                >
                  <Icon
                    name={
                      fileUri.endsWith('.pdf')
                        ? 'file-pdf-box'
                        : fileUri.endsWith('.doc') || fileUri.endsWith('.docx')
                        ? 'file-word'
                        : fileUri.endsWith('.ppt') || fileUri.endsWith('.pptx')
                        ? 'file-powerpoint'
                        : 'file-document'
                    }
                    size={24}
                    color={theme.primary}
                  />
                  <View style={{ marginLeft: 12, flex: 1 }}>
                    <Text style={{ color: theme.text }} numberOfLines={1}>
                      {fileName}
                    </Text>
                    <Text
                      style={{
                        color: `${theme.text}70`,
                        fontSize: 12,
                        marginTop: 2,
                      }}
                    >
                      {fileSize}
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={styles.removeFileButton}
                    onPress={() => {
                      setFileAttached(false);
                      setFileName('');
                      setFileSize('');
                      setFileUri('');
                    }}
                  >
                    <Icon
                      name="close-circle"
                      size={20}
                      color={`${theme.text}70`}
                    />
                  </TouchableOpacity>
                </View>
              )}

              {errors.file && (
                <Text style={styles.errorText}>{errors.file}</Text>
              )}
            </View>
          )}

          {/* Visibility */}
          <View style={styles.switchRow}>
            <View>
              <Text style={[styles.label, { color: theme.text }]}>
                Make publicly available
              </Text>
              <Text style={{ color: `${theme.text}70`, fontSize: 12 }}>
                Allow other users to see and use this resource
              </Text>
            </View>
            <Switch
              value={isPublic}
              onValueChange={setIsPublic}
              trackColor={{
                false: `${theme.text}30`,
                true: `${theme.primary}70`,
              }}
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
                <Icon
                  name="upload"
                  size={20}
                  color="#FFFFFF"
                  style={{ marginRight: 8 }}
                />
                <Text style={styles.submitButtonText}>Submit Resource</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* File Type Picker Modal */}
      <Modal
        visible={filePickerVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setFilePickerVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setFilePickerVisible(false)}
        >
          <View style={[styles.modalContent, { backgroundColor: theme.card }]}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>
              Select File Type
            </Text>

            {documentTypes.map(docType => (
              <TouchableOpacity
                key={docType.value}
                style={[
                  styles.fileTypeOption,
                  { borderBottomColor: `${theme.text}10` },
                ]}
                onPress={() => handlePickDocument(docType.mimeType)}
              >
                <Icon
                  name={docType.icon}
                  size={24}
                  color={theme.primary}
                  style={{ marginRight: 12 }}
                />
                <Text style={{ color: theme.text }}>{docType.label}</Text>
              </TouchableOpacity>
            ))}

            <TouchableOpacity
              style={[styles.cancelButton, { borderColor: `${theme.text}30` }]}
              onPress={() => setFilePickerVisible(false)}
            >
              <Text style={{ color: theme.text }}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
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
  selectedResourceType: {
    flexDirection: 'row',
    alignItems: 'center',
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
    flexDirection: 'row',
    alignItems: 'center',
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
    padding: 12,
    borderRadius: 8,
  },
  removeFileButton: {
    padding: 4,
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
  youtubeTypeSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  youtubeTypeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'transparent',
    flex: 1,
    marginHorizontal: 4,
  },
  youtubeTypeButtonActive: {
    borderWidth: 1,
  },
  youtubePreview: {
    marginTop: 16,
    borderRadius: 8,
    overflow: 'hidden',
  },
  youtubeThumbnail: {
    width: '100%',
    height: 180,
    resizeMode: 'cover',
  },
  youtubePreviewInfo: {
    padding: 12,
  },
  youtubePreviewTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  youtubePreviewMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  youtubePreviewMetaText: {
    fontSize: 12,
    marginLeft: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    width: '100%',
    borderRadius: 12,
    padding: 16,
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
    textAlign: 'center',
  },
  fileTypeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  cancelButton: {
    marginTop: 16,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 1,
  },
});

export default AddResourceScreen;
