import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  baseurl = "https://todo-list-angular-server.onrender.com/";

  constructor(private client: HttpClient) {}

  // Helper method to get headers with token
  private getAuthHeaders(token: string | null): HttpHeaders {
    let headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });
    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }
    return headers;
  }

  // Auth Methods
  signup(data: any): Observable<any> {
    return this.client.post(`${this.baseurl}signup`, data);
  }

  login(data: any): Observable<any> {
    console.log("Login service called");
    return this.client.post(`${this.baseurl}login`, data);
  }

  logout(data: any): Observable<any> {
    const token = data.token;
    const headers = this.getAuthHeaders(token);
    return this.client.post(`${this.baseurl}logout`, data, { headers });
  }

  // Tasks
  getTasks(token: string): Observable<any> {
    const headers = this.getAuthHeaders(token);
    return this.client.get(`${this.baseurl}user/todo`, { headers });
  }

  getNewTask(token: string): Observable<any> {
    const headers = this.getAuthHeaders(token);
    return this.client.get(`${this.baseurl}user/newtask`, { headers });
  }

  createTask(token: string, taskData: any): Observable<any> {
    const headers = this.getAuthHeaders(token);
    return this.client.post(`${this.baseurl}user/newtask`, taskData, { headers });
  }

  updateTask(token: string, taskId: number, taskData: any): Observable<any> {
    const headers = this.getAuthHeaders(token);
    return this.client.put(`${this.baseurl}user/todo/${taskId}`, taskData, { headers });
  }

  deleteTask(token: string, taskId: number): Observable<any> {
    const headers = this.getAuthHeaders(token);
    return this.client.delete(`${this.baseurl}user/todo/${taskId}`, { headers });
  }
  
}
