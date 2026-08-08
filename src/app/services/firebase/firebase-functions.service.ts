import { Injectable, inject } from '@angular/core';
import { Functions, httpsCallable } from '@angular/fire/functions';

import { CloudFunctionName } from '../../constants/cloud-function-names';

@Injectable({
  providedIn: 'root',
})
export class FirebaseFunctionsService {
  private readonly functions = inject(Functions);

  call<TResult>(name: CloudFunctionName, data?: unknown): Promise<TResult> {
    const callable = httpsCallable<unknown, TResult>(this.functions, name);

    return callable(data).then((result) => result.data);
  }
}
