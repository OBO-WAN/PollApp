import { Component } from '@angular/core';

interface SurveySummary {
  readonly id: number;
  readonly category: string;
  readonly title: string;
  readonly daysRemaining: number;
}

@Component({
  selector: 'app-home',
  imports: [],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class Home {
  protected readonly endingSoonSurveys: SurveySummary[] = [
    {
      id: 1,
      category: 'Team activities',
      title: 'Let’s Plan the Next Team Event Together',
      daysRemaining: 1,
    },
    {
      id: 2,
      category: 'Health & Wellness',
      title: 'Fit & wellness survey!',
      daysRemaining: 2,
    },
    {
      id: 3,
      category: 'Gaming & Entertainment',
      title: 'Gaming habits and favorite games!',
      daysRemaining: 3,
    },
  ].sort((first, second) => first.daysRemaining - second.daysRemaining);
}