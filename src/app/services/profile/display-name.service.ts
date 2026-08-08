import { Injectable } from '@angular/core';
import {
  adjectives,
  animals,
  colors,
  uniqueNamesGenerator,
} from 'unique-names-generator';

@Injectable({
  providedIn: 'root',
})
export class DisplayNameService {
  generate(): string {
    return uniqueNamesGenerator({
      dictionaries: [colors, adjectives, animals],
      length: 3,
      separator: ' ',
      style: 'capital',
    });
  }
}
