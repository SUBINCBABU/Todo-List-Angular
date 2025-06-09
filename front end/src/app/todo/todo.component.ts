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

interface Task {
  taskId:number;
  id: number;
  name: string;
  description: string;
  color: string;
  dueDate: string | null;
  completed: boolean;
  repeat: {
    enabled: boolean;
    type: string;
    days: string[];
    frequency: string;
  };
  tags: { id: number; name: string }[];
  createdAt: string;
  priority?: 'low' | 'medium' | 'high';
}

interface TaskList {
  name: string;
  count: number;
  icon?: string;
}

interface Filter {
  status: 'all' | 'pending' | 'completed';
  priority: 'all' | 'low' | 'medium' | 'high';
  dueDate: 'all' | 'today' | 'week' | 'overdue';
  tag: string;
}

@Component({
  selector: 'app-todo',
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './todo.component.html',
  styleUrls: ['./todo.component.css']
})
export class TodoComponent implements OnInit {
  // Task properties
  tasks: Task[] = [];
  filteredTasks: Task[] = [];
  selectedTasks: number[] = [];

  // View properties
  viewMode: 'list' | 'grid' | 'calendar' = 'list';
  sortBy: 'name' | 'dueDate' | 'priority' | 'created' = 'dueDate';
  sortOrder: 'asc' | 'desc' = 'asc';

  // Filter properties
  currentFilter: Filter = {
    status: 'all',
    priority: 'all',
    dueDate: 'all',
    tag: 'all'
  };

  // Search properties
  searchQuery: string = '';

  // Calendar properties
  currentMonth: string = '';
  currentYear: number = 0;
  currentDate: Date = new Date();
  calendarDays: CalendarDay[] = [];
  selectedDate: Date | null = null;

  // Loading and UI states
  isLoading: boolean = false;
  showFilters: boolean = false;
  showBulkActions: boolean = false;

  // Task lists for sidebar
  lists: TaskList[] = [
    { name: 'Today', count: 0, icon: '📅' },
    { name: 'Scheduled', count: 0, icon: '⏰' },
    { name: 'All', count: 0, icon: '📋' },
    { name: 'Flagged', count: 0, icon: '🚩' },
    { name: 'Completed', count: 0, icon: '✅' }
  ];

  // Available tags for filtering
  availableTags: { id: number; name: string; count: number }[] = [];

  // Stats
  stats = {
    total: 0,
    completed: 0,
    pending: 0,
    overdue: 0,
    completionRate: 0
  };
// Add this method to your TodoComponent class

selectQuickList(listName: string): void {
  // Clear existing filters first
  this.clearFilters();
  
  // Apply specific filters based on the list name
  switch (listName) {
    case 'Today':
      this.currentFilter.dueDate = 'today';
      break;
    case 'Scheduled':
      this.currentFilter.dueDate = 'week';
      break;
    case 'All':
      // Keep all filters as 'all' (already cleared)
      break;
    case 'Flagged':
      this.currentFilter.priority = 'high';
      break;
    case 'Completed':
      this.currentFilter.status = 'completed';
      break;
  }
  
  this.applyFilters();
}
  constructor(private router: Router, private apiService: ApiService) { }

  ngOnInit(): void {
    const token = localStorage.getItem('authToken');

    if (!token) {
      this.router.navigate(['/login']);
      return;
    } else {
      this.initializeCalendar();
      this.loadTasks();
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
    const today = new Date();

    let startDate = new Date(firstDay);
    const firstDayOfWeek = firstDay.getDay();
    const daysToSubtract = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1;
    startDate.setDate(firstDay.getDate() - daysToSubtract);

    this.calendarDays = [];

    for (let i = 0; i < 42; i++) {
      const currentDate = new Date(startDate);
      currentDate.setDate(startDate.getDate() + i);

      const isCurrentMonth = currentDate.getMonth() === month;
      const isToday = this.isSameDate(currentDate, today);
      const isSelected = this.selectedDate && this.isSameDate(currentDate, this.selectedDate);

      this.calendarDays.push({
        date: currentDate.getDate(),
        isCurrentMonth,
        isToday,
        fullDate: new Date(currentDate),
        selected: isSelected || undefined
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

    this.calendarDays.forEach(d => d.selected = undefined);
    day.selected = true;
    this.selectedDate = new Date(day.fullDate);
    this.filterTasksByDate();
  }

  private isSameDate(date1: Date, date2: Date): boolean {
    return date1.getDate() === date2.getDate() &&
      date1.getMonth() === date2.getMonth() &&
      date1.getFullYear() === date2.getFullYear();
  }

  // Task CRUD operations
  loadTasks(): void {
    this.isLoading = true;
    const token = localStorage.getItem('authToken');

    if (!token) {
      this.router.navigate(['/login']);
      return;
    }

    this.apiService.getTasks(token).subscribe({
      next: (response: any) => {
        this.tasks = response.tasks || response || [];
        this.applyFilters();
        this.updateStats();
        this.updateListCounts();
        this.extractTags();
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading tasks:', error);
        this.isLoading = false;
        if (error.status === 401) {
          this.router.navigate(['/login']);
        }
      }
    });
  }

  toggleTaskCompletion(task: Task): void {
    task.completed = !task.completed;
    this.updateTask(task);
  }

  updateTask(task: Task): void {
    console.log("updateTask(task: Task): void {",task);
    
    const token = localStorage.getItem('authToken');
    if (!token) return;

    this.apiService.updateTask(token, task.id, task).subscribe({
      next: (response) => {
        console.log('Task updated successfully:', response);
        this.updateStats();
        this.updateListCounts();
      },
      error: (error) => {
        console.error('Error updating task:', error);
        task.completed = !task.completed; // Revert on error
      }
    });
  }

  deleteTask(taskId: number): void {
    console.log("task",taskId);
    
    if (!confirm('Are you sure you want to delete this task?')) return;

    const token = localStorage.getItem('authToken');
    if (!token) return;

    this.apiService.deleteTask(token, taskId).subscribe({
      next: (response) => {
        console.log('Task deleted successfully:', response);
        this.tasks = this.tasks.filter(task => task.id !== taskId);
        this.applyFilters();
        this.updateStats();
        this.updateListCounts();
      },
      error: (error) => {
        console.error('Error deleting task:', error);
      }
    });
  }

  // Bulk operations
  toggleTaskSelection(taskId: number): void {
    const index = this.selectedTasks.indexOf(taskId);
    if (index > -1) {
      this.selectedTasks.splice(index, 1);
    } else {
      this.selectedTasks.push(taskId);
    }
    this.showBulkActions = this.selectedTasks.length > 0;
  }

  selectAllTasks(): void {
    if (this.selectedTasks.length === this.filteredTasks.length) {
      this.selectedTasks = [];
    } else {
      this.selectedTasks = this.filteredTasks.map(task => task.id);
    }
    this.showBulkActions = this.selectedTasks.length > 0;
  }

  bulkDeleteTasks(): void {
    if (!confirm(`Are you sure you want to delete ${this.selectedTasks.length} tasks?`)) return;

    const token = localStorage.getItem('authToken');
    if (!token) return;

    const deletePromises = this.selectedTasks.map(taskId =>
      this.apiService.deleteTask(token, taskId).toPromise()
    );

    Promise.all(deletePromises).then(() => {
      this.tasks = this.tasks.filter(task => !this.selectedTasks.includes(task.id));
      this.selectedTasks = [];
      this.showBulkActions = false;
      this.applyFilters();
      this.updateStats();
      this.updateListCounts();
    }).catch(error => {
      console.error('Error deleting tasks:', error);
    });
  }

  bulkCompleteTasksToggle(): void {
    const token = localStorage.getItem('authToken');
    if (!token) return;

    const selectedTaskObjects = this.tasks.filter(task => this.selectedTasks.includes(task.id));
    const allCompleted = selectedTaskObjects.every(task => task.completed);

    selectedTaskObjects.forEach(task => {
      task.completed = !allCompleted;
      this.updateTask(task);
    });

    this.selectedTasks = [];
    this.showBulkActions = false;
  }

  // Filtering and searching
  applyFilters(): void {
    let filtered = [...this.tasks];

    // Search filter
    if (this.searchQuery.trim()) {
      const query = this.searchQuery.toLowerCase();
      filtered = filtered.filter(task =>
        task.name.toLowerCase().includes(query) ||
        task.description.toLowerCase().includes(query) ||
        task.tags.some(tag => tag.name.toLowerCase().includes(query))
      );
    }

    // Status filter
    if (this.currentFilter.status !== 'all') {
      filtered = filtered.filter(task =>
        this.currentFilter.status === 'completed' ? task.completed : !task.completed
      );
    }

    // Priority filter
    if (this.currentFilter.priority !== 'all') {
      filtered = filtered.filter(task => task.priority === this.currentFilter.priority);
    }

    // Due date filter
    if (this.currentFilter.dueDate !== 'all') {
      const today = new Date();
      const weekFromNow = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);

      filtered = filtered.filter(task => {
        if (!task.dueDate) return false;
        const dueDate = new Date(task.dueDate);

        switch (this.currentFilter.dueDate) {
          case 'today':
            return this.isSameDate(dueDate, today);
          case 'week':
            return dueDate <= weekFromNow && dueDate >= today;
          case 'overdue':
            return dueDate < today && !task.completed;
          default:
            return true;
        }
      });
    }

    // Tag filter
    if (this.currentFilter.tag !== 'all') {
      filtered = filtered.filter(task =>
        task.tags.some(tag => tag.name === this.currentFilter.tag)
      );
    }

    // Date filter (from calendar selection)
    if (this.selectedDate) {
      filtered = filtered.filter(task => {
        if (!task.dueDate) return false;
        return this.isSameDate(new Date(task.dueDate), this.selectedDate!);
      });
    }

    // Sort tasks
    this.sortTasks(filtered);
    this.filteredTasks = filtered;
  }

  sortTasks(tasks: Task[]): void {
    tasks.sort((a, b) => {
      let comparison = 0;

      switch (this.sortBy) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'dueDate':
          const aDate = a.dueDate ? new Date(a.dueDate).getTime() : 0;
          const bDate = b.dueDate ? new Date(b.dueDate).getTime() : 0;
          comparison = aDate - bDate;
          break;
        case 'priority':
          const priorityOrder = { 'high': 3, 'medium': 2, 'low': 1 };
          const aPriority = priorityOrder[a.priority || 'low'];
          const bPriority = priorityOrder[b.priority || 'low'];
          comparison = bPriority - aPriority;
          break;
        case 'created':
          comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          break;
      }

      return this.sortOrder === 'asc' ? comparison : -comparison;
    });
  }

  filterTasksByDate(): void {
    this.applyFilters();
  }

  clearFilters(): void {
    this.currentFilter = {
      status: 'all',
      priority: 'all',
      dueDate: 'all',
      tag: 'all'
    };
    this.searchQuery = '';
    this.selectedDate = null;
    this.updateCalendar();
    this.applyFilters();
  }

  // Utility methods
  updateStats(): void {
    this.stats.total = this.tasks.length;
    this.stats.completed = this.tasks.filter(task => task.completed).length;
    this.stats.pending = this.stats.total - this.stats.completed;
    this.stats.overdue = this.tasks.filter(task =>
      task.dueDate && new Date(task.dueDate) < new Date() && !task.completed
    ).length;
    this.stats.completionRate = this.stats.total > 0 ?
      Math.round((this.stats.completed / this.stats.total) * 100) : 0;
  }

  updateListCounts(): void {
    const today = new Date();
    const weekFromNow = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);

    this.lists[0].count = this.tasks.filter(task =>
      task.dueDate && this.isSameDate(new Date(task.dueDate), today)
    ).length;

    this.lists[1].count = this.tasks.filter(task =>
      task.dueDate && new Date(task.dueDate) <= weekFromNow
    ).length;

    this.lists[2].count = this.tasks.length;
    this.lists[3].count = this.tasks.filter(task => task.priority === 'high').length;
    this.lists[4].count = this.tasks.filter(task => task.completed).length;
  }

  extractTags(): void {
    const tagMap = new Map<string, number>();

    this.tasks.forEach(task => {
      task.tags.forEach(tag => {
        tagMap.set(tag.name, (tagMap.get(tag.name) || 0) + 1);
      });
    });

    this.availableTags = Array.from(tagMap.entries()).map(([name, count], index) => ({
      id: index,
      name,
      count
    }));
  }

  getPriorityIcon(priority?: string): string {
    switch (priority) {
      case 'high': return '🔴';
      case 'medium': return '🟡';
      case 'low': return '🟢';
      default: return '⚪';
    }
  }

  getTasksForDate(date: Date): Task[] {
    return this.tasks.filter(task =>
      task.dueDate && this.isSameDate(new Date(task.dueDate), date)
    );
  }

  isTaskOverdue(task: Task): boolean {
    if (!task.dueDate || task.completed) return false;
    return new Date(task.dueDate) < new Date();
  }

  // Navigation methods
  navigateToNewTask(): void {
    this.router.navigate(['/newtask']);
  }

  editTask(task: Task): void {
    this.router.navigate(['/edit-task', task.id]);
  }

  // View mode methods
  setViewMode(mode: 'list' | 'grid' | 'calendar'): void {
    this.viewMode = mode;
  }

  setSortBy(field: 'name' | 'dueDate' | 'priority' | 'created'): void {
    if (this.sortBy === field) {
      this.sortOrder = this.sortOrder === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortBy = field;
      this.sortOrder = 'asc';
    }
    this.applyFilters();
  }

  // Logout method
  logout(): void {
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

  private clearUserDataAndNavigate(): void {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userInfo');
    this.router.navigate(['/login']);
    console.log('User logged out successfully');
  }


  
}