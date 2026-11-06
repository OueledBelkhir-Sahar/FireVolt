import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment.development';
import { BehaviorSubject } from 'rxjs';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
dayjs.extend(utc);

export interface Session {
  id?: number;
  name: string;
}

@Injectable({
  providedIn: 'root'
})
export class LayoutService {
  // Déterminer les dates en fonction de la période sélectionnée
   getPeriodDates(period: string): { from: string, to: string } {
    const now = dayjs().utc();
    let from = now.startOf('day');
    let to = now.endOf('day');

    switch (period) {
      case 'yesterday':
        const yesterday = now.subtract(1, 'day');
        from = yesterday.startOf('day');
        to = yesterday.endOf('day');
        break;
      case 'this_week':
        from = now.startOf('week');
        to = now.endOf('week');
        break;
      case 'last_week':
        const lastWeek = now.subtract(1, 'week');
        from = lastWeek.startOf('week');
        to = lastWeek.endOf('week');
        break;
      case 'this_month':
        from = now.startOf('month');
        to = now.endOf('month');
        break;
      case 'last_month':
        const lastMonth = now.subtract(1, 'month');
        from = lastMonth.startOf('month');
        to = lastMonth.endOf('month');
        break;
      case 'custom':
        const custom = this.getCustomPeriod();
        if (custom) {
          from = dayjs(custom.from);
          to = dayjs(custom.to);
        }
        break;
    }

    console.log(`[Période: ${period}]`, `From: ${from.toISOString()}`, `To: ${to.toISOString()}`);

    return {
      from: from.toISOString(),
      to: to.toISOString()
    };
  }


  // Période sélectionnée (today, this_week, etc.)
  private periodSubject = new BehaviorSubject<string>('today');
  period$ = this.periodSubject.asObservable();

  // Dates pour la période personnalisée
  private customPeriod: { from: string, to: string } | null = null;

  constructor(private http: HttpClient) { }

  getSession() {
    return this.http.get<Session>(`${environment.apiURL}auth/me`);
  }

  // Setter pour les périodes standards
  setPeriod(period: string) {
    this.periodSubject.next(period);
    if (period !== 'custom') {
      this.customPeriod = null; // reset des anciennes dates custom
    }
  }

  // Setter pour période personnalisée
  setCustomPeriod(dates: { from: string, to: string }) {
    this.customPeriod = dates;
    this.periodSubject.next('custom');
  }

  // Getter utilisé dans le MapComponent
  getCustomPeriod(): { from: string, to: string } | null {
    return this.customPeriod;
  }
}

