import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'groupByDate',
  standalone: true // ✅ since you’re using standalone components
})
export class GroupByDatePipe implements PipeTransform {
  transform(logs: any[]): { date: string; logs: any[] }[] {
    if (!logs) return [];

    const grouped: { [date: string]: any[] } = {};

    logs.forEach(log => {
      const dateKey = new Date(log.date).toDateString();
      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      grouped[dateKey].push(log);
    });

    return Object.keys(grouped).map(date => ({
      date,
      logs: grouped[date]
    }));
  }
}
