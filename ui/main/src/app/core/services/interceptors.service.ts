/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import {Injectable} from "@angular/core";
import {HttpEvent, HttpHandler, HttpInterceptor, HttpRequest} from "@angular/common/http";
import {Observable} from "rxjs";
import {AuthenticationService} from "@core/services/authentication.service";

@Injectable()
export class TokenInjector implements HttpInterceptor {
  constructor(private authenticationService: AuthenticationService) {
  }

  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    console.log(`url requested: ${request.url}`);
    const notCheckTokenRequest = !request.url.endsWith('check_token');
    if (notCheckTokenRequest) {
      const update = {
        setHeaders: {
          'Authorization': `Bearer ${this.authenticationService.extractToken()}`,
          'Content-type': 'application/json'
        }
      };
      request = request.clone(update);
    }
    return next.handle(request);
  }
}