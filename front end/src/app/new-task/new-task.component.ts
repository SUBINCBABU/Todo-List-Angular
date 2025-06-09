import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ApiService } from '../api.service';

interface CalendarDay {
  date: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  fullDate: Date;
  selected?: boolean;
}

interface Tag {
  id: number;
  name: string;
  selected: boolean;
}

interface TaskList {
  name: string;
  count: number;
}

@Component({
  selector: 'app-new-task',
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './new-task.component.html',
  styleUrls: ['./new-task.component.css']
})
export class NewTaskComponent implements OnInit {
  // Task properties
  taskName: string = '';
  taskDescription: string = '';
  selectedColor: string = '#007bff';
  selectedDate: Date | null = null;

  // Repeat properties
  repeatEnabled: boolean = false;
  repeatType: string = 'daily';
  selectedDays: string[] = [];
  repeatFrequency: string = 'Never';

  // Calendar properties
  currentMonth: string = '';
  currentYear: number = 0;
  currentDate: Date = new Date();
  calendarDays: CalendarDay[] = [];

  // Color options
  colors: string[] = [
    '#007bff', '#28a745', '#dc3545', '#ffc107', '#6f42c1',
    '#fd7e14', '#20c997', '#e83e8c', '#6c757d', '#17a2b8',
    '#f8f9fa', '#343a40', '#ff6b6b', '#4ecdc4', '#45b7d1',
    '#96ceb4', '#ffeaa7', '#dda0dd', '#98d8c8', '#f7dc6f'
  ];

  // Days of week
  weekDays: string[] = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  // Tags
  availableTags: Tag[] = [
    { id: 1, name: 'Important', selected: false },
    { id: 2, name: 'Urgent', selected: false },
    { id: 3, name: 'Work', selected: false },
    { id: 4, name: 'Personal', selected: false },
    { id: 5, name: 'Health', selected: false },
    { id: 6, name: 'Learning', selected: false }
  ];

  // Task lists for sidebar
  lists: TaskList[] = [
    { name: 'Today', count: 5 },
    { name: 'Scheduled', count: 12 },
    { name: 'All', count: 23 },
    { name: 'Flagged', count: 3 }
  ];



  constructor(private router: Router, private apiService: ApiService) { }

  ngOnInit(): void {
    const token = localStorage.getItem('authToken');

  if (!token) {
   
    this.router.navigate(['/login']);
    return;
  }
  else{
    this.initializeCalendar();
    this.updateRepeatFrequency();
  }
    
  }

  // Calendar methods
  initializeCalendar(): void {
    const today = new Date();
    this.currentDate = new Date(today.getFullYear(), today.getMonth(), 1);
    this.updateCalendar();
  }

  updateCalendar(): void {
    const year = this.currentDate.getFullYear();
    const month = this.currentDate.getMonth();

    this.currentMonth = this.currentDate.toLocaleDateString('en-US', { month: 'long' });
    this.currentYear = year;

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const today = new Date();

    // Get first day of week (Monday = 1, Sunday = 0)
    let startDate = new Date(firstDay);
    const firstDayOfWeek = firstDay.getDay();
    const daysToSubtract = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1;
    startDate.setDate(firstDay.getDate() - daysToSubtract);

    this.calendarDays = [];

    // Generate 42 days (6 weeks)
    for (let i = 0; i < 42; i++) {
      const currentDate = new Date(startDate);
      currentDate.setDate(startDate.getDate() + i);

      const isCurrentMonth = currentDate.getMonth() === month;
      const isToday = this.isSameDate(currentDate, today);
      // Fix: Convert null to undefined to match the interface
      const isSelected = this.selectedDate && this.isSameDate(currentDate, this.selectedDate);

      this.calendarDays.push({
        date: currentDate.getDate(),
        isCurrentMonth,
        isToday,
        fullDate: new Date(currentDate),
        selected: isSelected || undefined // Convert false/null to undefined
      });
    }
  }

  previousMonth(): void {
    this.currentDate.setMonth(this.currentDate.getMonth() - 1);
    this.updateCalendar();
  }

  nextMonth(): void {
    this.currentDate.setMonth(this.currentDate.getMonth() + 1);
    this.updateCalendar();
  }

  selectDate(day: CalendarDay): void {
    if (!day.isCurrentMonth) return;

    // Clear previous selection
    this.calendarDays.forEach(d => d.selected = undefined);

    // Set new selection
    day.selected = true;
    this.selectedDate = new Date(day.fullDate);
  }

  private isSameDate(date1: Date, date2: Date): boolean {
    return date1.getDate() === date2.getDate() &&
      date1.getMonth() === date2.getMonth() &&
      date1.getFullYear() === date2.getFullYear();
  }

  // Color selection
  selectColor(color: string): void {
    this.selectedColor = color;
  }

  // Repeat methods
  toggleRepeat(): void {
    this.updateRepeatFrequency();
  }

  selectRepeatType(type: string): void {
    this.repeatType = type;
    if (type !== 'weekly') {
      this.selectedDays = [];
    }
    this.updateRepeatFrequency();
  }

  toggleDay(day: string): void {
    const index = this.selectedDays.indexOf(day);
    if (index > -1) {
      this.selectedDays.splice(index, 1);
    } else {
      this.selectedDays.push(day);
    }
    this.updateRepeatFrequency();
  }

  isDaySelected(day: string): boolean {
    return this.selectedDays.includes(day);
  }

  private updateRepeatFrequency(): void {
    if (!this.repeatEnabled) {
      this.repeatFrequency = 'Never';
      return;
    }

    switch (this.repeatType) {
      case 'daily':
        this.repeatFrequency = 'Every day';
        break;
      case 'weekly':
        if (this.selectedDays.length === 0) {
          this.repeatFrequency = 'Weekly';
        } else if (this.selectedDays.length === 7) {
          this.repeatFrequency = 'Every day';
        } else {
          this.repeatFrequency = `Every ${this.selectedDays.join(', ')}`;
        }
        break;
      case 'monthly':
        this.repeatFrequency = 'Every month';
        break;
      default:
        this.repeatFrequency = 'Never';
    }
  }

  // Tag methods
  toggleTag(tagId: number): void {
    const tag = this.availableTags.find(t => t.id === tagId);
    if (tag) {
      tag.selected = !tag.selected;
    }
  }

  addNewTag(): void {
    const tagName = prompt('Enter new tag name:');
    if (tagName && tagName.trim()) {
      const newTag: Tag = {
        id: Date.now(),
        name: tagName.trim(),
        selected: true
      };
      this.availableTags.push(newTag);
    }
  }

  
createTask(): void {
  if (!this.taskName.trim()) {
    alert('Please enter a task name');
    return;
  }

  const selectedTags = this.availableTags
    .filter(tag => tag.selected)
    .map(tag => ({ id: tag.id, name: tag.name }));

  const taskData = {
    name: this.taskName.trim(),
    description: this.taskDescription.trim(),
    color: this.selectedColor,
    dueDate: this.selectedDate ? this.selectedDate.toISOString() : null,
    repeat: {
      enabled: this.repeatEnabled,
      type: this.repeatType,
      days: this.selectedDays,
      frequency: this.repeatFrequency
    },
    tags: selectedTags,
    createdAt: new Date().toISOString(),
    completed: false
  };

 const token = localStorage.getItem('authToken');

  if (!token) {
    alert('Authentication required. Please login again.');
    this.router.navigate(['/login']);
    return;
  }

  // Use ApiService instead of direct HTTP call
  this.apiService.createTask(token, taskData).subscribe({
    next: (response) => {
      console.log('Task created successfully:', response);
      alert('Task created successfully!');
      this.resetForm();
      this.router.navigate(['/tasks']); // Navigate back to tasks list
    },
    error: (error) => {
      console.error('Error creating task:', error);
      alert('Error creating task. Please try again.');
    }
  });
}
  private resetForm(): void {
    this.taskName = '';
    this.taskDescription = '';
    this.selectedColor = '#007bff';
    this.selectedDate = null;
    this.repeatEnabled = false;
    this.repeatType = 'daily';
    this.selectedDays = [];
    this.availableTags.forEach(tag => tag.selected = false);
    this.updateCalendar();
    this.updateRepeatFrequency();
  }

  // Navigation methods
  goBack(): void {
    this.router.navigate(['/todo']);
  }

logout() {
    const token = localStorage.getItem('authToken');

    if (token) {
      this.apiService.logout({ token }).subscribe({
        next: (response) => {
          console.log('Logout successful:', response);
          this.clearUserDataAndNavigate();
        },
        error: (error) => {
          console.error('Logout error:', error);
          this.clearUserDataAndNavigate();
        }
      });
    } else {
      this.clearUserDataAndNavigate();
    }
  }

  private clearUserDataAndNavigate() {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userInfo');
    this.router.navigate(['/login']);
    console.log('User logged out successfully');
  }
}