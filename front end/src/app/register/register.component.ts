import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ApiService } from '../api.service';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule], // Remove FormsModule since we're using reactive forms
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css']
})
export class RegisterComponent implements OnInit {
  registerForm!: FormGroup;

  constructor(
    private fb: FormBuilder,
    private service: ApiService,
    private router: Router,
    private route: ActivatedRoute
  ) { }

  ngOnInit(): void {
    this.initForm();
    this.animateBackground();
  }

  initForm(): void {
    this.registerForm = this.fb.group({
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  onSubmit(): void {
    if (this.registerForm.valid) {
      const { name, email, password } = this.registerForm.value;
     
      console.log('Registration submitted', { name, email, password });
      const signupData = {
        name: name.trim(),
        email: email.trim(),
        password: password.trim()
      };

      this.service.signup(signupData).subscribe({
        next: (data: any) => {
          console.log("Registration data:", data);
          if (data?.message === "successfully registered") {
            // alert('Registration successful! Welcome to Listify, ' + name + '!');
            this.registerForm.reset();
            // Navigate to login page after successful registration
            this.router.navigateByUrl("/login");
          } else {
            alert("Registration failed. Please try again.");
          }
        },
        error: (error) => {
          console.error("Registration error:", error);
          if (error.status === 409) {
            alert("Email already exists. Please use a different email.");
          } else if (error.status === 400) {
            alert("Invalid registration data. Please check your inputs.");
          } else {
            alert("An error occurred during registration. Please try again.");
          }
        }
      });
    } else {
      this.markFormGroupTouched(this.registerForm);
      alert('Please fill in all required fields correctly.');
    }
  }

  onSocialLogin(platform: string): void {
    alert(`${platform} login would be implemented here`);
  }

  // Helper to trigger validation visuals
  markFormGroupTouched(formGroup: FormGroup): void {
    Object.values(formGroup.controls).forEach(control => {
      control.markAsTouched();
      if ((control as any).controls) {
        this.markFormGroupTouched(control as FormGroup);
      }
    });
  }

  private animateBackground(): void {
    const bgSvg = document.querySelector('.bg-svg svg') as HTMLElement;
    if (bgSvg) {
      let offset = 0;
      setInterval(() => {
        offset += 0.5;
        bgSvg.style.transform = `translateY(${Math.sin(offset * 0.01) * 10}px)`; // Fixed: Added missing * operator
      }, 50);
    }
  }
}