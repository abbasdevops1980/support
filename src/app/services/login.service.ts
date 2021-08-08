import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import { Router } from '@angular/router'

import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class LoginService {

  constructor(private http: HttpClient, private router: Router) { }

  login(userDetails: any) {
    return this.http.post(`/api/common/login`, userDetails);
  }
  changePassword(userDetails: any) {
    return this.http.post(`/api/common/changePassword`, userDetails);
  }
  resetPassword(userDetails) {
    return this.http.post(`/api/common/resetPassword`, userDetails);
  }
  forgotPassword(userDetails: any) {
    return this.http.post(`/api/common/forgotPassword`, userDetails);
  }

  logout(): void {
    this.http.post('/api/common/logout', { tp: "user" })
      .subscribe(
        res => {
          localStorage.clear();
          sessionStorage.clear();
          this.router.navigateByUrl('/')
        },
        err => console.error(err)
      );
  }



}
