import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ViewEncapsulation } from '@angular/core';

@Component({
  selector: 'app-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './modal.component.html',
  styleUrls: ['./modal.component.css'],
  encapsulation: ViewEncapsulation.None  // Add this line
})
export class ModalComponent {
  @Input() isOpen: boolean = false;   // 👈 use this property
  @Input() title: string = '';
  @Output() close = new EventEmitter<void>();
  @Output() save = new EventEmitter<void>();

  onSave() {
    this.save.emit();
  }

  onClose() {
    this.close.emit();
  }
}
