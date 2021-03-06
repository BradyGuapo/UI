import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { IDeploy, IDeployResponse } from './interfaces';

@Injectable({
  providedIn: 'root'
})
export class DeployService {
  static fetchDetails(arg0: string): any {
    throw new Error("Method not implemented.");
  }

  deployDetailRoute = '/api/deploy/status/';

  constructor(private http: HttpClient) { }

  fetchDetails(componentId: string): Observable<IDeploy[]> {
    return this.http.get<IDeployResponse>(this.deployDetailRoute + componentId).pipe(map(result => result.result));
  }
}
 