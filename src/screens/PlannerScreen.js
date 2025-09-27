import React, { useState, useContext, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Modal,
  FlatList,
  Dimensions,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Calendar } from 'react-native-calendars';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { ThemeContext } from '../theme/ThemeContext';
import api from '../services/api'; // Import API service
import { useData } from '../context/DataContext';

const { width } = Dimensions.get('window');

const PlannerScreen = () => {
  const { theme } = useContext(ThemeContext);
  const { subjects, loading: dataLoading, fetchSubjects } = useData();
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split('T')[0],
  );
  const [tasks, setTasks] = useState({});
  const [modalVisible, setModalVisible] = useState(false);
  const [taskTitle, setTaskTitle] = useState('');
  const [taskNotes, setTaskNotes] = useState('');
  const [taskSubject, setTaskSubject] = useState('General');
  const [taskPriority, setTaskPriority] = useState('medium');
  const [editingTask, setEditingTask] = useState(null);
  const [markedDates, setMarkedDates] = useState({});

  // Add state for syllabus integration
  const [allSubjects, setAllSubjects] = useState([]);
  const [topics, setTopics] = useState([]);
  const [subtopics, setSubtopics] = useState([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState(null);
  const [selectedTopicId, setSelectedTopicId] = useState(null);
  const [selectedSubtopicId, setSelectedSubtopicId] = useState(null);

  // Add loading and error states
  const [isLoading, setIsLoading] = useState(false);
  const [isCalendarLoading, setIsCalendarLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // Use the cached subjects data
  useEffect(() => {
    if (subjects && subjects.length > 0) {
      // Add a "General" option for tasks not tied to specific subjects
      const subjectList = [{ id: 'general', name: 'General' }, ...subjects];
      setAllSubjects(subjectList);
    }
  }, [subjects]);

  // Fetch tasks for all dates to mark calendar
  useEffect(() => {
    const fetchAllTasks = async () => {
      setIsCalendarLoading(true);
      try {
        // In a real scenario, you might want to fetch only month view
        // For now, we'll fetch all tasks
        const response = await api.planner.getAllTasks();

        // Group tasks by date for easier access
        const tasksByDate = {};

        if (response.data) {
          response.data.forEach(task => {
            const taskDate = task.date.split('T')[0];

            if (!tasksByDate[taskDate]) {
              tasksByDate[taskDate] = [];
            }

            tasksByDate[taskDate].push(task);
          });

          setTasks(tasksByDate);
          updateMarkedDates(tasksByDate);
        }
      } catch (error) {
        console.error('Error fetching all tasks:', error);
        setError('Failed to load your tasks. Please try again later.');
      } finally {
        setIsCalendarLoading(false);
      }
    };

    fetchAllTasks();
  }, []);

  // Fetch tasks when selected date changes
  useEffect(() => {
    const fetchTasksForDate = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await api.planner.getTasksByDate(selectedDate);

        const updatedTasks = { ...tasks };

        if (response.data) {
          updatedTasks[selectedDate] = response.data;
          setTasks(updatedTasks);
          updateMarkedDates(updatedTasks);
        } else {
          // If no tasks are returned, set an empty array
          updatedTasks[selectedDate] = [];
          setTasks(updatedTasks);
        }
      } catch (error) {
        console.error('Error fetching tasks for date:', error);
        setError('Failed to load tasks for this date. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchTasksForDate();
  }, [selectedDate]);

  // Update calendar marked dates based on tasks
  const updateMarkedDates = taskData => {
    const dates = {};

    Object.keys(taskData).forEach(date => {
      if (taskData[date] && taskData[date].length > 0) {
        // Check if any tasks are high priority
        const hasHighPriority = taskData[date].some(
          task => task.priority === 'high',
        );
        // Count uncompleted tasks
        const incompleteTasks = taskData[date].filter(
          task => !task.completed,
        ).length;

        dates[date] = {
          marked: true,
          dotColor: hasHighPriority ? '#E74C3C' : theme.primary,
          selectedDotColor: '#FFFFFF',
        };

        // If it's the selected date, mark it as selected
        if (date === selectedDate) {
          dates[date] = {
            ...dates[date],
            selected: true,
            selectedColor: theme.primary,
          };
        }
      }
    });

    setMarkedDates(dates);
  };

  const handleDayPress = day => {
    const newSelectedDate = day.dateString;
    setSelectedDate(newSelectedDate);

    // Update marked dates to reflect selection
    const updatedMarkedDates = { ...markedDates };

    // Remove selection from previously selected date
    Object.keys(updatedMarkedDates).forEach(date => {
      if (updatedMarkedDates[date]?.selected) {
        updatedMarkedDates[date] = {
          ...updatedMarkedDates[date],
          selected: false,
        };
      }
    });

    // Add selection to newly selected date
    updatedMarkedDates[newSelectedDate] = {
      ...(updatedMarkedDates[newSelectedDate] || {}),
      selected: true,
      selectedColor: theme.primary,
    };

    setMarkedDates(updatedMarkedDates);
  };

  // Fetch topics when subject changes
  useEffect(() => {
    if (selectedSubjectId && selectedSubjectId !== 'general') {
      const fetchTopics = async () => {
        try {
          const response = await api.academic.getSubjectDetail(
            selectedSubjectId,
          );
          if (response.data && response.data.units) {
            // Flatten topics from all units
            const allTopics = [];
            response.data.units.forEach(unit => {
              unit.topics.forEach(topic => {
                allTopics.push({
                  id: topic.id,
                  name: topic.name,
                  unitId: unit.id,
                  unitName: unit.name,
                });
              });
            });
            setTopics(allTopics);
            setSelectedTopicId(null);
            setSubtopics([]);
            setSelectedSubtopicId(null);
          }
        } catch (error) {
          console.error('Error fetching topics:', error);
          setTopics([]);
        }
      };

      fetchTopics();
    } else {
      // Reset topics and subtopics when "General" is selected
      setTopics([]);
      setSubtopics([]);
      setSelectedTopicId(null);
      setSelectedSubtopicId(null);
    }
  }, [selectedSubjectId]);

  // Fetch subtopics when topic changes
  useEffect(() => {
    if (selectedTopicId) {
      const fetchSubtopics = async () => {
        try {
          // Find the selected topic in our local state
          const selectedTopic = topics.find(t => t.id === selectedTopicId);
          if (selectedTopic) {
            // Get the subject detail to extract subtopics
            const response = await api.academic.getSubjectDetail(
              selectedSubjectId,
            );
            if (response.data && response.data.units) {
              // Find the unit containing our topic
              const unit = response.data.units.find(u =>
                u.topics.some(t => t.id === selectedTopicId),
              );

              if (unit) {
                // Find the topic
                const topic = unit.topics.find(t => t.id === selectedTopicId);
                if (topic && topic.subtopics) {
                  setSubtopics(topic.subtopics);
                  return;
                }
              }
            }
            // If we can't find subtopics, set empty array
            setSubtopics([]);
            setSelectedSubtopicId(null);
          }
        } catch (error) {
          console.error('Error fetching subtopics:', error);
          setSubtopics([]);
        }
      };

      fetchSubtopics();
    } else {
      setSubtopics([]);
      setSelectedSubtopicId(null);
    }
  }, [selectedTopicId, selectedSubjectId, topics]);

  const openAddTaskModal = () => {
    setModalVisible(true);
    setEditingTask(null);
    setTaskTitle('');
    setTaskNotes('');
    setTaskSubject('General');
    setTaskPriority('medium');
    setSelectedSubjectId('general');
    setSelectedTopicId(null);
    setSelectedSubtopicId(null);
  };

  const openEditTaskModal = task => {
    setModalVisible(true);
    setEditingTask(task);
    setTaskTitle(task.title);
    setTaskNotes(task.notes || '');

    // Handle subject, topic and subtopic selection for existing task
    if (task.subject) {
      setTaskSubject(task.subject);

      // Find subject ID from name
      const subject = allSubjects.find(s => s.name === task.subject);
      if (subject) {
        setSelectedSubjectId(subject.id);

        // If task has topicId, set it
        if (task.topicId) {
          setSelectedTopicId(task.topicId);

          // If task has subtopicId, set it
          if (task.subtopicId) {
            setSelectedSubtopicId(task.subtopicId);
          }
        }
      }
    } else {
      setTaskSubject('General');
      setSelectedSubjectId('general');
    }

    setTaskPriority(task.priority || 'medium');
  };

  const handleAddTask = async () => {
    if (!taskTitle.trim()) return;

    setIsSubmitting(true);

    try {
      // Prepare the task data
      const taskData = {
        title: taskTitle.trim(),
        notes: taskNotes.trim(),
        date: selectedDate, // API expects ISO format
        subject: taskSubject,
        priority: taskPriority,
      };

      // Add topic/subtopic IDs if selected
      if (selectedTopicId && selectedTopicId !== 'general') {
        taskData.topicId = selectedTopicId;

        if (selectedSubtopicId) {
          taskData.subtopicId = selectedSubtopicId;
        }
      }

      let response;

      if (editingTask) {
        // Update existing task
        response = await api.planner.updateTask(editingTask.id, taskData);

        // Update the local state
        const updatedTasks = { ...tasks };
        if (updatedTasks[selectedDate]) {
          updatedTasks[selectedDate] = updatedTasks[selectedDate].map(task =>
            task.id === editingTask.id ? { ...task, ...taskData } : task,
          );
          setTasks(updatedTasks);
          updateMarkedDates(updatedTasks);
        }
      } else {
        // Create new task
        response = await api.planner.createTask(taskData);

        // Update the local state
        const updatedTasks = { ...tasks };
        if (!updatedTasks[selectedDate]) {
          updatedTasks[selectedDate] = [];
        }
        updatedTasks[selectedDate].push(response.data);
        setTasks(updatedTasks);
        updateMarkedDates(updatedTasks);
      }

      setModalVisible(false);
    } catch (error) {
      console.error('Error saving task:', error);
      Alert.alert('Error', 'Failed to save the task. Please try again later.', [
        { text: 'OK' },
      ]);
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleTaskCompletion = async taskId => {
    try {
      // Find the task
      const taskToUpdate = tasks[selectedDate].find(task => task.id === taskId);
      if (!taskToUpdate) return;

      // Update optimistically for a better user experience
      const updatedTasks = { ...tasks };
      updatedTasks[selectedDate] = updatedTasks[selectedDate].map(task =>
        task.id === taskId ? { ...task, completed: !task.completed } : task,
      );
      setTasks(updatedTasks);
      updateMarkedDates(updatedTasks);

      // Make API call
      await api.planner.updateTask(taskId, {
        completed: !taskToUpdate.completed,
      });

      // No need to update state again if successful since we already did it optimistically
    } catch (error) {
      console.error('Error toggling task completion:', error);

      // Revert the optimistic update if API call fails
      const revertedTasks = { ...tasks };
      revertedTasks[selectedDate] = revertedTasks[selectedDate].map(task =>
        task.id === taskId ? { ...task, completed: !task.completed } : task,
      );
      setTasks(revertedTasks);
      updateMarkedDates(revertedTasks);

      Alert.alert('Error', 'Failed to update the task. Please try again.', [
        { text: 'OK' },
      ]);
    }
  };

  const deleteTask = async taskId => {
    try {
      // Delete optimistically for a better user experience
      const updatedTasks = { ...tasks };
      updatedTasks[selectedDate] = updatedTasks[selectedDate].filter(
        task => task.id !== taskId,
      );

      // If no tasks left for this date, clean up
      if (updatedTasks[selectedDate].length === 0) {
        delete updatedTasks[selectedDate];
      }

      setTasks(updatedTasks);
      updateMarkedDates(updatedTasks);

      // Make API call
      await api.planner.deleteTask(taskId);

      // No need to update state again if successful
    } catch (error) {
      console.error('Error deleting task:', error);

      // Fetch tasks again to restore correct state if API call fails
      try {
        const response = await api.planner.getTasksByDate(selectedDate);
        const refreshedTasks = { ...tasks };
        refreshedTasks[selectedDate] = response.data || [];
        setTasks(refreshedTasks);
        updateMarkedDates(refreshedTasks);
      } catch (refreshError) {
        console.error(
          'Error refreshing tasks after delete failure:',
          refreshError,
        );
      }

      Alert.alert('Error', 'Failed to delete the task. Please try again.', [
        { text: 'OK' },
      ]);
    }
  };

  const getPriorityColor = priority => {
    switch (priority) {
      case 'high':
        return '#E74C3C';
      case 'medium':
        return '#F39C12';
      case 'low':
        return '#2ECC71';
      default:
        return theme.text;
    }
  };

  const formatDate = dateString => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
    });
  };

  // Find subject name from ID
  const getSubjectNameFromId = subjectId => {
    const subject = allSubjects.find(s => s.id === subjectId);
    return subject ? subject.name : 'General';
  };

  // Find topic name from ID
  const getTopicNameFromId = topicId => {
    const topic = topics.find(t => t.id === topicId);
    return topic ? topic.name : '';
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.background }]}
    >
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.text }]}>Study Planner</Text>
        <TouchableOpacity
          style={[styles.addButton, { backgroundColor: theme.primary }]}
          onPress={openAddTaskModal}
        >
          <Icon name="plus" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <View style={styles.calendarContainer}>
        {isCalendarLoading ? (
          <View
            style={[styles.loadingContainer, { backgroundColor: theme.card }]}
          >
            <ActivityIndicator size="large" color={theme.primary} />
            <Text style={[styles.loadingText, { color: theme.text }]}>
              Loading your schedule...
            </Text>
          </View>
        ) : (
          <Calendar
            current={selectedDate}
            onDayPress={handleDayPress}
            markedDates={markedDates}
            theme={{
              calendarBackground: theme.card,
              textSectionTitleColor: theme.text,
              selectedDayBackgroundColor: theme.primary,
              selectedDayTextColor: '#FFFFFF',
              todayTextColor: theme.primary,
              dayTextColor: theme.text,
              textDisabledColor: `${theme.text}50`,
              dotColor: theme.primary,
              monthTextColor: theme.text,
              indicatorColor: theme.primary,
              textDayFontWeight: '400',
              textMonthFontWeight: 'bold',
              textDayHeaderFontWeight: '500',
              textDayFontSize: 16,
              textMonthFontSize: 16,
              textDayHeaderFontSize: 14,
            }}
          />
        )}
      </View>

      <View style={styles.tasksContainer}>
        <Text style={[styles.dateHeader, { color: theme.text }]}>
          {formatDate(selectedDate)}
        </Text>

        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.primary} />
            <Text style={[styles.loadingText, { color: theme.text }]}>
              Loading tasks...
            </Text>
          </View>
        ) : error ? (
          <View style={styles.errorContainer}>
            <Icon name="alert-circle-outline" size={48} color={theme.error} />
            <Text style={[styles.errorText, { color: theme.error }]}>
              {error}
            </Text>
            <TouchableOpacity
              style={[styles.retryButton, { backgroundColor: theme.primary }]}
              onPress={() => {
                const fetchTasksForDate = async () => {
                  setIsLoading(true);
                  setError(null);

                  try {
                    const response = await api.planner.getTasksByDate(
                      selectedDate,
                    );

                    const updatedTasks = { ...tasks };

                    if (response.data) {
                      updatedTasks[selectedDate] = response.data;
                      setTasks(updatedTasks);
                      updateMarkedDates(updatedMarkedDates);
                    } else {
                      // If no tasks are returned, set an empty array
                      updatedTasks[selectedDate] = [];
                      setTasks(updatedTasks);
                    }
                  } catch (error) {
                    console.error('Error fetching tasks for date:', error);
                    setError(
                      'Failed to load tasks for this date. Please try again.',
                    );
                  } finally {
                    setIsLoading(false);
                  }
                };

                fetchTasksForDate();
              }}
            >
              <Text style={{ color: '#FFFFFF' }}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : !tasks[selectedDate] || tasks[selectedDate].length === 0 ? (
          <View style={styles.emptyContainer}>
            <Icon name="calendar-check" size={64} color={`${theme.text}30`} />
            <Text style={[styles.emptyText, { color: `${theme.text}70` }]}>
              No study tasks planned for this date
            </Text>
            <TouchableOpacity
              style={[styles.emptyButton, { backgroundColor: theme.primary }]}
              onPress={openAddTaskModal}
            >
              <Text style={styles.emptyButtonText}>Add Task</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            data={tasks[selectedDate]}
            keyExtractor={item => item.id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.taskList}
            renderItem={({ item }) => (
              <View style={[styles.taskItem, { backgroundColor: theme.card }]}>
                <TouchableOpacity
                  style={styles.taskCheckbox}
                  onPress={() => toggleTaskCompletion(item.id)}
                >
                  <Icon
                    name={
                      item.completed
                        ? 'checkbox-marked-circle'
                        : 'checkbox-blank-circle-outline'
                    }
                    size={24}
                    color={item.completed ? theme.primary : theme.text}
                  />
                </TouchableOpacity>

                <View style={styles.taskContent}>
                  <View style={styles.taskHeader}>
                    <Text
                      style={[
                        styles.taskTitle,
                        { color: theme.text },
                        item.completed && styles.completedTask,
                      ]}
                    >
                      {item.title}
                    </Text>

                    <View style={styles.taskActions}>
                      <TouchableOpacity
                        style={styles.taskAction}
                        onPress={() => openEditTaskModal(item)}
                      >
                        <Icon name="pencil" size={20} color={theme.text} />
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.taskAction}
                        onPress={() => deleteTask(item.id)}
                      >
                        <Icon name="delete" size={20} color="#E74C3C" />
                      </TouchableOpacity>
                    </View>
                  </View>

                  {item.notes ? (
                    <Text
                      style={[
                        styles.taskNotes,
                        { color: `${theme.text}90` },
                        item.completed && styles.completedTask,
                      ]}
                    >
                      {item.notes}
                    </Text>
                  ) : null}

                  <View style={styles.taskFooter}>
                    <View style={styles.taskMetadata}>
                      <View
                        style={[
                          styles.priorityBadge,
                          { backgroundColor: getPriorityColor(item.priority) },
                        ]}
                      />
                      <Text
                        style={[styles.taskSubject, { color: theme.primary }]}
                      >
                        {item.subject}
                      </Text>

                      {/* Show topic/subtopic if available */}
                      {item.topicId && (
                        <Text
                          style={[
                            styles.taskTopic,
                            { color: `${theme.text}70` },
                          ]}
                        >
                          • {item.topicName || getTopicNameFromId(item.topicId)}
                        </Text>
                      )}
                    </View>
                  </View>
                </View>
              </View>
            )}
          />
        )}
      </View>

      {/* Add/Edit Task Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.card }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>
                {editingTask ? 'Edit Task' : 'Add New Task'}
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Icon name="close" size={24} color={theme.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <Text style={[styles.inputLabel, { color: theme.text }]}>
                Task Title
              </Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    color: theme.text,
                    backgroundColor: `${theme.text}10`,
                    borderColor: `${theme.text}30`,
                  },
                ]}
                value={taskTitle}
                onChangeText={setTaskTitle}
                placeholder="Enter task title"
                placeholderTextColor={`${theme.text}50`}
              />

              <Text style={[styles.inputLabel, { color: theme.text }]}>
                Notes
              </Text>
              <TextInput
                style={[
                  styles.input,
                  styles.textArea,
                  {
                    color: theme.text,
                    backgroundColor: `${theme.text}10`,
                    borderColor: `${theme.text}30`,
                  },
                ]}
                value={taskNotes}
                onChangeText={setTaskNotes}
                placeholder="Add notes (optional)"
                placeholderTextColor={`${theme.text}50`}
                multiline={true}
              />

              <Text style={[styles.inputLabel, { color: theme.text }]}>
                Subject
              </Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.subjectSelector}
              >
                {allSubjects.map(subject => (
                  <TouchableOpacity
                    key={subject.id}
                    style={[
                      styles.subjectOption,
                      { borderColor: `${theme.text}30` },
                      selectedSubjectId === subject.id && {
                        backgroundColor: `${theme.primary}20`,
                        borderColor: theme.primary,
                      },
                    ]}
                    onPress={() => {
                      setSelectedSubjectId(subject.id);
                      setTaskSubject(subject.name);
                      // Clear topic and subtopic when changing subject
                      setSelectedTopicId(null);
                      setSelectedSubtopicId(null);
                    }}
                  >
                    <Text
                      style={[
                        styles.subjectText,
                        {
                          color:
                            selectedSubjectId === subject.id
                              ? theme.primary
                              : theme.text,
                        },
                      ]}
                    >
                      {subject.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              {/* Show topics if a subject other than General is selected */}
              {selectedSubjectId &&
                selectedSubjectId !== 'general' &&
                topics.length > 0 && (
                  <>
                    <Text
                      style={[
                        styles.inputLabel,
                        { color: theme.text, marginTop: 16 },
                      ]}
                    >
                      Topic
                    </Text>
                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      contentContainerStyle={styles.topicSelector}
                    >
                      <TouchableOpacity
                        key="none"
                        style={[
                          styles.topicOption,
                          { borderColor: `${theme.text}30` },
                          !selectedTopicId && {
                            backgroundColor: `${theme.primary}20`,
                            borderColor: theme.primary,
                          },
                        ]}
                        onPress={() => {
                          setSelectedTopicId(null);
                          setSelectedSubtopicId(null);
                        }}
                      >
                        <Text
                          style={[
                            styles.topicText,
                            {
                              color: !selectedTopicId
                                ? theme.primary
                                : theme.text,
                            },
                          ]}
                        >
                          None
                        </Text>
                      </TouchableOpacity>

                      {topics.map(topic => (
                        <TouchableOpacity
                          key={topic.id}
                          style={[
                            styles.topicOption,
                            { borderColor: `${theme.text}30` },
                            selectedTopicId === topic.id && {
                              backgroundColor: `${theme.primary}20`,
                              borderColor: theme.primary,
                            },
                          ]}
                          onPress={() => {
                            setSelectedTopicId(topic.id);
                            // Clear subtopic when changing topic
                            setSelectedSubtopicId(null);
                          }}
                        >
                          <Text
                            style={[
                              styles.topicText,
                              {
                                color:
                                  selectedTopicId === topic.id
                                    ? theme.primary
                                    : theme.text,
                              },
                            ]}
                          >
                            {topic.name}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </>
                )}

              {/* Show subtopics if a topic is selected */}
              {selectedTopicId && subtopics.length > 0 && (
                <>
                  <Text
                    style={[
                      styles.inputLabel,
                      { color: theme.text, marginTop: 16 },
                    ]}
                  >
                    Subtopic
                  </Text>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.subtopicSelector}
                  >
                    <TouchableOpacity
                      key="none"
                      style={[
                        styles.subtopicOption,
                        { borderColor: `${theme.text}30` },
                        !selectedSubtopicId && {
                          backgroundColor: `${theme.primary}20`,
                          borderColor: theme.primary,
                        },
                      ]}
                      onPress={() => {
                        setSelectedSubtopicId(null);
                      }}
                    >
                      <Text
                        style={[
                          styles.subtopicText,
                          {
                            color: !selectedSubtopicId
                              ? theme.primary
                              : theme.text,
                          },
                        ]}
                      >
                        None
                      </Text>
                    </TouchableOpacity>

                    {subtopics.map(subtopic => (
                      <TouchableOpacity
                        key={subtopic.id}
                        style={[
                          styles.subtopicOption,
                          { borderColor: `${theme.text}30` },
                          selectedSubtopicId === subtopic.id && {
                            backgroundColor: `${theme.primary}20`,
                            borderColor: theme.primary,
                          },
                        ]}
                        onPress={() => setSelectedSubtopicId(subtopic.id)}
                      >
                        <Text
                          style={[
                            styles.subtopicText,
                            {
                              color:
                                selectedSubtopicId === subtopic.id
                                  ? theme.primary
                                  : theme.text,
                            },
                          ]}
                        >
                          {subtopic.name}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </>
              )}

              <Text
                style={[
                  styles.inputLabel,
                  { color: theme.text, marginTop: 16 },
                ]}
              >
                Priority
              </Text>
              <View style={styles.prioritySelector}>
                <TouchableOpacity
                  style={[
                    styles.priorityOption,
                    { borderColor: `${theme.text}30` },
                    taskPriority === 'low' && {
                      backgroundColor: '#2ECC7120',
                      borderColor: '#2ECC71',
                    },
                  ]}
                  onPress={() => setTaskPriority('low')}
                >
                  <Icon
                    name="flag-outline"
                    size={20}
                    color={taskPriority === 'low' ? '#2ECC71' : theme.text}
                  />
                  <Text
                    style={[
                      styles.priorityText,
                      {
                        color: taskPriority === 'low' ? '#2ECC71' : theme.text,
                      },
                    ]}
                  >
                    Low
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.priorityOption,
                    { borderColor: `${theme.text}30` },
                    taskPriority === 'medium' && {
                      backgroundColor: '#F39C1220',
                      borderColor: '#F39C12',
                    },
                  ]}
                  onPress={() => setTaskPriority('medium')}
                >
                  <Icon
                    name="flag"
                    size={20}
                    color={taskPriority === 'medium' ? '#F39C12' : theme.text}
                  />
                  <Text
                    style={[
                      styles.priorityText,
                      {
                        color:
                          taskPriority === 'medium' ? '#F39C12' : theme.text,
                      },
                    ]}
                  >
                    Medium
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.priorityOption,
                    { borderColor: `${theme.text}30` },
                    taskPriority === 'high' && {
                      backgroundColor: '#E74C3C20',
                      borderColor: '#E74C3C',
                    },
                  ]}
                  onPress={() => setTaskPriority('high')}
                >
                  <Icon
                    name="flag-variant"
                    size={20}
                    color={taskPriority === 'high' ? '#E74C3C' : theme.text}
                  />
                  <Text
                    style={[
                      styles.priorityText,
                      {
                        color: taskPriority === 'high' ? '#E74C3C' : theme.text,
                      },
                    ]}
                  >
                    High
                  </Text>
                </TouchableOpacity>
              </View>
            </ScrollView>

            <TouchableOpacity
              style={[
                styles.addTaskButton,
                { backgroundColor: theme.primary },
                isSubmitting && { opacity: 0.7 },
              ]}
              onPress={handleAddTask}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.addTaskButtonText}>
                  {editingTask ? 'Update Task' : 'Add Task'}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.5,
  },
  calendarContainer: {
    marginTop: 8,
    marginBottom: 16,
    paddingHorizontal: 16,
    borderRadius: 12,
    paddingVertical: 8,
  },
  tasksContainer: {
    flex: 1,
    paddingHorizontal: 16,
  },
  dateHeader: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    marginTop: 16,
    marginBottom: 24,
    textAlign: 'center',
  },
  emptyButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  emptyButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
  },
  taskList: {
    paddingBottom: 24,
  },
  taskItem: {
    flexDirection: 'row',
    marginBottom: 12,
    borderRadius: 8,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  taskCheckbox: {
    paddingLeft: 16,
    paddingRight: 8,
    paddingVertical: 16,
    justifyContent: 'flex-start',
  },
  taskContent: {
    flex: 1,
    paddingVertical: 12,
    paddingRight: 16,
  },
  taskHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: '500',
    flex: 1,
  },
  completedTask: {
    textDecorationLine: 'line-through',
    opacity: 0.7,
  },
  taskNotes: {
    fontSize: 14,
    marginBottom: 8,
  },
  taskFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  taskMetadata: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  priorityBadge: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  taskSubject: {
    fontSize: 13,
    fontWeight: '500',
  },
  taskTopic: {
    fontSize: 12,
    marginLeft: 4,
  },
  taskDuration: {
    fontSize: 13,
  },
  taskActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  taskAction: {
    padding: 4,
    marginLeft: 8,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingBottom: 24,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  modalBody: {
    padding: 16,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    marginBottom: 16,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  subjectSelector: {
    flexDirection: 'row',
    paddingBottom: 16,
  },
  subjectOption: {
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
  },
  subjectText: {
    fontSize: 14,
    fontWeight: '500',
  },
  topicSelector: {
    flexDirection: 'row',
    paddingBottom: 16,
  },
  topicOption: {
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
  },
  topicText: {
    fontSize: 14,
    fontWeight: '500',
  },
  subtopicSelector: {
    flexDirection: 'row',
    paddingBottom: 16,
  },
  subtopicOption: {
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
  },
  subtopicText: {
    fontSize: 14,
    fontWeight: '500',
  },
  prioritySelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  priorityOption: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    width: '30%',
    justifyContent: 'center',
  },
  priorityText: {
    marginLeft: 6,
    fontSize: 14,
    fontWeight: '500',
  },
  addTaskButton: {
    marginHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  addTaskButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    marginTop: 10,
    marginBottom: 20,
    fontSize: 16,
    textAlign: 'center',
  },
  retryButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
});

export default PlannerScreen;
