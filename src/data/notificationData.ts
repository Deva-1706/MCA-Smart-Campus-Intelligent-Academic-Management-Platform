import { NotificationItem } from '../types';

export const NOTIFICATIONS: NotificationItem[] = [
  {
    id: 'notif-1',
    title: 'Assignment 1 Evaluated: 28/30 Marks',
    message: 'Faculty Advisor HCASICAN has reviewed your submission for "Propositional Logic, Truth Tables & Normal Forms". Feedback: Excellent derivation of CNF and inductive proofs.',
    category: 'Assignment',
    timestamp: '2 hours ago',
    read: false,
    actionPage: 'assignments',
    priority: 'High'
  },
  {
    id: 'notif-2',
    title: 'New AI Study Pack Generated: Data Structures',
    message: 'AI PDF extractor compiled 2-mark, 5-mark and 10-mark model answers for MCA-435C1B Unit 2: AVL Trees & Binary Search Trees.',
    category: 'Material',
    timestamp: 'Yesterday',
    read: false,
    actionPage: 'materials',
    priority: 'Normal'
  },
  {
    id: 'notif-3',
    title: 'Mid-Semester Examination Schedule Published',
    message: 'MCA Semester 1 Mid-Term Assessments commence November 24, 2026. Hall Ticket verified for Devanath N (Roll No: P26CA125).',
    category: 'Examination',
    timestamp: '2 days ago',
    read: true,
    actionPage: 'examinations',
    priority: 'High'
  },
  {
    id: 'notif-4',
    title: 'Python Lab Milestone Reached',
    message: 'Congratulations! You successfully resolved test cases for the Binary Search Tree Validator problem.',
    category: 'Academic',
    timestamp: '3 days ago',
    read: true,
    actionPage: 'coding-lab',
    priority: 'Normal'
  },
  {
    id: 'notif-5',
    title: 'Faculty Advisor Review: HCASICAN',
    message: 'Academic Progress Advisory meeting scheduled for MCA Semester 1 Batch A students. Maintain your current 8.92 projected SGPA.',
    category: 'System',
    timestamp: '5 days ago',
    read: true,
    actionPage: 'reports',
    priority: 'Normal'
  }
];
