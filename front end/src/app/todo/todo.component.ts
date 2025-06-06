import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ApiService } from '../api.service';

interface Task {
  id: number;
  text: string;
  completed: boolean;
  category: 'today' | 'daily' | 'study';
  createdAt: Date;
}

interface List {
  name: string;
  count: number;
  icon: string;
  color: string;
}

@Component({
  selector: 'app-todo',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './todo.component.html',
  styleUrls: ['./todo.component.css']
})
export class TodoComponent implements OnInit {
  currentDate: Date = new Date();
  selectedDate: Date = new Date();
  currentMonth: string = '';
  currentYear: number = 0;

  tasks: Task[] = [];

  lists: List[] = [
    { name: 'Daily Routine', count: 0, icon: '🌅', color: '#4CAF50' },
    { name: 'Study', count: 0, icon: '📚', color: '#2196F3' }
  ];

  calendarDays: any[] = [];
  months: string[] = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  newTaskText: string = '';
  showAddTask: boolean = false;
  selectedCategory: 'today' | 'daily' | 'study' = 'today';

  constructor(private router: Router, private apiService: ApiService) {}

  ngOnInit() {
    this.initializeCalendar();
    this.updateDateDisplay();

    const token = localStorage.getItem('authToken');

    if (!token) {
      console.warn("No token found. Redirecting to login...");
      this.router.navigate(['/login']);
      return;
    }

    this.apiService.getTodo(token).subscribe({
      next: (res) => {
        console.log("Todos fetched from server:", res);

        // If backend sends array of todos under "todos" key
        if (Array.isArray(res.todos)) {
          this.tasks = res.todos.map((t: any) => ({
            id: t.id || Date.now(), // or proper ID from DB
            text: t.text,
            completed: t.completed,
            category: t.category,
            createdAt: new Date(t.createdAt)
          }));
          this.updateListCounts();
        }
      },
      error: (err) => {
        console.error("Failed to fetch todos:", err);
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
    startDate.setDate(startDate.getDate() - firstDay.getDay());

    this.calendarDays = [];

    for (let i = 0; i < 42; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);

      this.calendarDays.push({
        date: date.getDate(),
        fullDate: new Date(date),
        isCurrentMonth: date.getMonth() === month,
        isToday: this.isToday(date),
        isSelected: this.isSameDate(date, this.selectedDate)
      });
    }
  }

  updateDateDisplay() {
    this.currentMonth = this.months[this.currentDate.getMonth()];
    this.currentYear = this.currentDate.getFullYear();
  }

  isToday(date: Date): boolean {
    return this.isSameDate(date, new Date());
  }

  isSameDate(date1: Date, date2: Date): boolean {
    return date1.getDate() === date2.getDate() &&
      date1.getMonth() === date2.getMonth() &&
      date1.getFullYear() === date2.getFullYear();
  }

  selectDate(day: any) {
    if (day.isCurrentMonth) {
      this.selectedDate = new Date(day.fullDate);
      this.calendarDays.forEach(d => d.isSelected = false);
      day.isSelected = true;
    }
  }

  previousMonth() {
    this.currentDate.setMonth(this.currentDate.getMonth() - 1);
    this.initializeCalendar();
    this.updateDateDisplay();
  }

  nextMonth() {
    this.currentDate.setMonth(this.currentDate.getMonth() + 1);
    this.initializeCalendar();
    this.updateDateDisplay();
  }

  getTodayTasks(): Task[] {
    return this.tasks.filter(task => task.category === 'today');
  }

  getTodayTaskCount(): number {
    return this.getTodayTasks().length;
  }

  toggleTask(taskId: number) {
    const task = this.tasks.find(t => t.id === taskId);
    if (task) {
      task.completed = !task.completed;
    }
  }

  addTask() {
    if (this.newTaskText.trim()) {
      const newTask: Task = {
        id: Date.now(),
        text: this.newTaskText.trim(),
        completed: false,
        category: this.selectedCategory,
        createdAt: new Date()
      };

      this.tasks.push(newTask);
      this.newTaskText = '';
      this.showAddTask = false;
      this.updateListCounts();
    }
  }

  deleteTask(taskId: number) {
    this.tasks = this.tasks.filter(task => task.id !== taskId);
    this.updateListCounts();
  }

  updateListCounts() {
    this.lists[0].count = this.tasks.filter(t => t.category === 'daily').length;
    this.lists[1].count = this.tasks.filter(t => t.category === 'study').length;
  }

  toggleAddTask() {
    this.showAddTask = !this.showAddTask;
    if (!this.showAddTask) {
      this.newTaskText = '';
    }
  }

  navigateToNewTask() {
    this.router.navigate(['/newtask']);
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
