import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ApiService } from '../api.service';

interface TaskTag {
  id: string;
  name: string;
  selected: boolean;
}

interface Task {
  id: number;
  name: string;
  description: string;
  color: string;
  tags: string[];
  repeat: {
    enabled: boolean;
    type: 'daily' | 'weekly' | 'monthly';
    days?: string[];
    frequency?: string;
  };
  createdAt: Date;
}

@Component({
  selector: 'app-new-task',
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './new-task.component.html',
  styleUrls: ['./new-task.component.css']
})
export class NewTaskComponent implements OnInit {
  currentDate: Date = new Date();
  currentMonth: string = '';
  currentYear: number = 0;
  calendarDays: any[] = [];

  months: string[] = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  // Task form data
  taskName: string = '';
  taskDescription: string = '';
  selectedColor: string = '#10B981'; // Default green color

  // Color palette
  colors: string[] = [
    '#D1FAE5', '#A855F7', '#F87171', '#67E8F9',
    '#FDE047', '#10B981', '#06B6D4', '#3B82F6',
    '#8B5CF6', '#EC4899', '#F43F5E', '#EF4444'
  ];

  // Repeat settings
  repeatEnabled: boolean = false;
  repeatType: 'daily' | 'weekly' | 'monthly' = 'weekly';
  selectedDays: string[] = [];
  repeatFrequency: string = 'Every week';

  weekDays: string[] = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  // Available tags
  availableTags: TaskTag[] = [
    { id: 'daily-routine', name: 'Daily Routine', selected: true },
    { id: 'study-routine', name: 'Study Routine', selected: false }
  ];

  // Lists data (from sidebar)
  lists = [
    { name: 'Today', count: 2 },
    { name: 'Daily Routine', count: 1 },
    { name: 'Study', count: 0 }
  ];

  constructor(private router: Router, private apiService: ApiService) { }

ngOnInit() {
  this.initializeCalendar();

  const token = localStorage.getItem('authToken');

  if (!token) {
    console.warn("No token found. Redirecting to login...");
    this.router.navigate(['/login']);
    return;
  }

  // Optionally, you could call getNewTask or getTodo depending on your API design
  this.apiService.getNewTask(token).subscribe({
    next: (res) => {
      console.log("Tasks fetched from server:", res);

      // Assuming the response has tasks in res.tasks or adjust accordingly
      if (Array.isArray(res.tasks)) {
        // If your API task structure matches your Task interface, map directly
        // Otherwise adjust properties as needed
        // Example mapping:
        // id, name -> text, description, color, tags, etc.
        // Here you adapt it to your actual data structure.

        // Example (basic mapping for demonstration):
        // this.tasks = res.tasks.map((t: any) => ({
        //   id: t.id || Date.now(),
        //   name: t.name,
        //   description: t.description,
        //   color: t.color,
        //   tags: t.tags,
        //   repeat: t.repeat,
        //   createdAt: new Date(t.createdAt)
        // }));

        // For now, just logging or store it in a variable for your use.
        // You can add a tasks array to this component to store them.

        // Example:
        // this.tasks = res.tasks;

      }
    },
    error: (err) => {
      console.error("Failed to fetch tasks:", err);
      if (err.status === 401) {
        this.router.navigate(['/login']);
      }
    }
  });
}



  initializeCalendar() {
    const year = this.currentDate.getFullYear();
    const month = this.currentDate.getMonth();

    this.currentMonth = this.months[month];
    this.currentYear = year;

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);

    // Adjust to start from Monday
    const dayOfWeek = firstDay.getDay();
    const daysToSubtract = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    startDate.setDate(firstDay.getDate() - daysToSubtract);

    this.calendarDays = [];

    for (let i = 0; i < 42; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);

      this.calendarDays.push({
        date: date.getDate(),
        fullDate: new Date(date),
        isCurrentMonth: date.getMonth() === month,
        isToday: this.isToday(date),
        isSelected: false
      });
    }
  }

  isToday(date: Date): boolean {
    const today = new Date();
    return date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear();
  }

  previousMonth() {
    this.currentDate.setMonth(this.currentDate.getMonth() - 1);
    this.initializeCalendar();
  }

  nextMonth() {
    this.currentDate.setMonth(this.currentDate.getMonth() + 1);
    this.initializeCalendar();
  }

  selectColor(color: string) {
    this.selectedColor = color;
  }

  toggleRepeat() {
    this.repeatEnabled = !this.repeatEnabled;
    if (!this.repeatEnabled) {
      this.selectedDays = [];
    }
  }

  selectRepeatType(type: 'daily' | 'weekly' | 'monthly') {
    this.repeatType = type;
    this.selectedDays = [];
    this.updateRepeatFrequency();
  }

  toggleDay(day: string) {
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

  updateRepeatFrequency() {
    if (this.repeatType === 'daily') {
      this.repeatFrequency = 'Every day';
    } else if (this.repeatType === 'weekly') {
      if (this.selectedDays.length === 0) {
        this.repeatFrequency = 'Every week';
      } else if (this.selectedDays.length === 1) {
        this.repeatFrequency = `Every ${this.selectedDays[0]}`;
      } else {
        this.repeatFrequency = `Every week on ${this.selectedDays.join(', ')}`;
      }
    } else if (this.repeatType === 'monthly') {
      this.repeatFrequency = 'Every month';
    }
  }

  toggleTag(tagId: string) {
    const tag = this.availableTags.find(t => t.id === tagId);
    if (tag) {
      tag.selected = !tag.selected;
    }
  }

  addNewTag() {
    // Logic to add new tag - could open a modal or prompt
    const newTagName = prompt('Enter new tag name:');
    if (newTagName && newTagName.trim()) {
      const newTag: TaskTag = {
        id: newTagName.toLowerCase().replace(/\s+/g, '-'),
        name: newTagName.trim(),
        selected: true
      };
      this.availableTags.push(newTag);
    }
  }

  createTask() {
    if (!this.taskName.trim()) {
      alert('Please enter a task name');
      return;
    }

    const selectedTags = this.availableTags
      .filter(tag => tag.selected)
      .map(tag => tag.name);

    const newTask: Task = {
      id: Date.now(),
      name: this.taskName.trim(),
      description: this.taskDescription.trim(),
      color: this.selectedColor,
      tags: selectedTags,
      repeat: {
        enabled: this.repeatEnabled,
        type: this.repeatType,
        days: this.selectedDays,
        frequency: this.repeatFrequency
      },
      createdAt: new Date()
    };

    // Here you would typically save the task to a service
    console.log('New task created:', newTask);

    // Navigate back to the main todo page
    this.router.navigate(['/todo']);
  }

  goBack() {
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