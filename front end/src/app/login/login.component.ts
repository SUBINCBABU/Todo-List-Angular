import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormsModule, ReactiveFormsModule, NgForm } from '@angular/forms';
import { ApiService } from '../api.service';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {

  constructor(
    private fb: FormBuilder,
    private service: ApiService,
    private router: Router,
    private route: ActivatedRoute
  ) { }

  ngOnInit(): void {
    this.animateBackground();
  }

  onSubmit(form: NgForm): void {
    if (form.valid) {
      const email = form.value.email;
      const password = form.value.password;
      const rememberMe = form.value.rememberMe;

      const loginData = {
        email,
        password,
        rememberMe
      };

      console.log('Attempting login with:', loginData);

      this.service.login(loginData).subscribe({
        next: (data: any) => {
          console.log('Login success', data);

          if (data.message === 'Login successful' && data.token) {
            console.log('Token received:', data.token);

            localStorage.setItem('authToken', data.token);

            if (data.user) {
              localStorage.setItem('userInfo', JSON.stringify(data.user));
            }

            this.router.navigateByUrl('/todo');
          } else {
            console.log('Unexpected response:', data);
            alert('Login failed. Please try again.');
          }
        },
        error: (error) => {
          console.error('Login error:', error);

          if (error.status === 401) {
            alert('Invalid email or password.');
          } else if (error.status === 400) {
            alert('Please check your input and try again.');
          } else if (error.status === 500) {
            alert('Server error. Please try again later.');
          } else {
            alert('An error occurred. Please try again.');
          }
        }
      });

      form.resetForm();
    } else {
      alert('Please fill in all required fields.');
    }
  }

  onSocialLogin(platform: string): void {
    console.log(`${platform} login clicked`);
    alert(`${platform} login would be implemented here`);
  }

  onForgotPassword(): void {
    console.log('Forgot password clicked');
    alert('Forgot password functionality would be implemented here');
  }

  private animateBackground(): void {
    const svgElement = document.querySelector('.bg-svg svg');
    if (svgElement) {
      let offset = 0;
      setInterval(() => {
        offset += 0.5;
        (svgElement as HTMLElement).style.transform = `translateY(${Math.sin(offset * 0.01) * 10}px)`;
      }, 50);
    }
  }
}
