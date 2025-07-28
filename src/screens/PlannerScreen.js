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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Calendar } from 'react-native-calendars';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { ThemeContext } from '../theme/ThemeContext';

const { width } = Dimensions.get('window');

const PlannerScreen = () => {
  const { theme } = useContext(ThemeContext);
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

  // Subject options
  const subjects = [
    'General',
    'Operating Systems',
    'Data Structures',
    'Computer Networks',
    'Algorithms',
    'Database Systems',
    'Theory of Computation',
    'Digital Logic',
    'Mathematics',
  ];

  // Initialize with mock data
  useEffect(() => {
    const initialTasks = {
      [new Date().toISOString().split('T')[0]]: [
        {
          id: '1',
          title: 'Review Process Scheduling Algorithms',
          notes: 'Focus on Round Robin, SJF, and FCFS',
          subject: 'Operating Systems',
          priority: 'high',
          completed: false,
          duration: '2 hours',
        },
        {
          id: '2',
          title: 'Solve practice problems on Binary Trees',
          notes: 'At least 5 problems from the question bank',
          subject: 'Data Structures',
          priority: 'medium',
          completed: true,
          duration: '1.5 hours',
        },
      ],
      // Add a task for tomorrow's date
      [new Date(new Date().setDate(new Date().getDate() + 1))
        .toISOString()
        .split('T')[0]]: [
        {
          id: '3',
          title: 'Watch lecture on TCP/IP Protocol',
          notes: '',
          subject: 'Computer Networks',
          priority: 'medium',
          completed: false,
          duration: '1 hour',
        },
      ],
    };

    setTasks(initialTasks);
    updateMarkedDates(initialTasks);
  }, []);

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
      if (updatedMarkedDates[date].selected) {
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

  const openAddTaskModal = () => {
    setModalVisible(true);
    setEditingTask(null);
    setTaskTitle('');
    setTaskNotes('');
    setTaskSubject('General');
    setTaskPriority('medium');
  };

  const openEditTaskModal = task => {
    setModalVisible(true);
    setEditingTask(task);
    setTaskTitle(task.title);
    setTaskNotes(task.notes);
    setTaskSubject(task.subject);
    setTaskPriority(task.priority);
  };

  const handleAddTask = () => {
    if (!taskTitle.trim()) return;

    const newTask = {
      id: editingTask ? editingTask.id : Date.now().toString(),
      title: taskTitle.trim(),
      notes: taskNotes.trim(),
      subject: taskSubject,
      priority: taskPriority,
      completed: editingTask ? editingTask.completed : false,
      duration: '1 hour', // Default duration
    };

    const updatedTasks = { ...tasks };

    if (!updatedTasks[selectedDate]) {
      updatedTasks[selectedDate] = [];
    }

    if (editingTask) {
      // Update existing task
      updatedTasks[selectedDate] = updatedTasks[selectedDate].map(task =>
        task.id === editingTask.id ? newTask : task,
      );
    } else {
      // Add new task
      updatedTasks[selectedDate].push(newTask);
    }

    setTasks(updatedTasks);
    updateMarkedDates(updatedTasks);
    setModalVisible(false);
  };

  const toggleTaskCompletion = taskId => {
    const updatedTasks = { ...tasks };

    if (updatedTasks[selectedDate]) {
      updatedTasks[selectedDate] = updatedTasks[selectedDate].map(task =>
        task.id === taskId ? { ...task, completed: !task.completed } : task,
      );

      setTasks(updatedTasks);
    }
  };

  const deleteTask = taskId => {
    const updatedTasks = { ...tasks };

    if (updatedTasks[selectedDate]) {
      updatedTasks[selectedDate] = updatedTasks[selectedDate].filter(
        task => task.id !== taskId,
      );

      if (updatedTasks[selectedDate].length === 0) {
        delete updatedTasks[selectedDate];
      }

      setTasks(updatedTasks);
      updateMarkedDates(updatedTasks);
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
      </View>

      <View style={styles.tasksContainer}>
        <Text style={[styles.dateHeader, { color: theme.text }]}>
          {formatDate(selectedDate)}
        </Text>

        {!tasks[selectedDate] || tasks[selectedDate].length === 0 ? (
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
                    </View>

                    <Text
                      style={[
                        styles.taskDuration,
                        { color: `${theme.text}70` },
                      ]}
                    >
                      {item.duration}
                    </Text>
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
                {subjects.map(subject => (
                  <TouchableOpacity
                    key={subject}
                    style={[
                      styles.subjectOption,
                      { borderColor: `${theme.text}30` },
                      taskSubject === subject && {
                        backgroundColor: `${theme.primary}20`,
                        borderColor: theme.primary,
                      },
                    ]}
                    onPress={() => setTaskSubject(subject)}
                  >
                    <Text
                      style={[
                        styles.subjectText,
                        {
                          color:
                            taskSubject === subject
                              ? theme.primary
                              : theme.text,
                        },
                      ]}
                    >
                      {subject}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <Text style={[styles.inputLabel, { color: theme.text }]}>
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
              style={[styles.addTaskButton, { backgroundColor: theme.primary }]}
              onPress={handleAddTask}
            >
              <Text style={styles.addTaskButtonText}>
                {editingTask ? 'Update Task' : 'Add Task'}
              </Text>
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
});

export default PlannerScreen;
