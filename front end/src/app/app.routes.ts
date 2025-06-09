import { Routes } from '@angular/router';
import { RegisterComponent } from './register/register.component';
import { LoginComponent } from './login/login.component';
import { TodoComponent } from './todo/todo.component';
import { NewTaskComponent } from './new-task/new-task.component';

export const routes: Routes = [
    {path:"",component:RegisterComponent},
    {path:"login",component:LoginComponent},
    {path:"todo",component:TodoComponent},
     {path:"newtask",component:NewTaskComponent}
];
