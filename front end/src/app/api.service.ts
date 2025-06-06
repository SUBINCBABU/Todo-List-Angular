import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  baseurl = "https://todo-list-angular.onrender.com/";

  constructor(private client: HttpClient) { }

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

  signup(data: any): Observable<any> {
    return this.client.post(`${this.baseurl}signup`, data);
  }

  login(data: any): Observable<any> {
    console.log("service called");
    return this.client.post(`${this.baseurl}login`, data);
  }


  logout(data: any): Observable<any> {
    const token = data.token;
    const headers = this.getAuthHeaders(token);
    return this.client.post(`${this.baseurl}logout`, data, { headers });
  }


  getTodo(token: string): Observable<any> {
    console.log("get is called");
    
    const headers = this.getAuthHeaders(token);
    return this.client.get(`${this.baseurl}user/todo`, { headers });
  }
   getNewTask(token: string): Observable<any> {
    console.log("get is called");
    
    const headers = this.getAuthHeaders(token);
    return this.client.get(`${this.baseurl}user/newtask`, { headers });
  }
}
