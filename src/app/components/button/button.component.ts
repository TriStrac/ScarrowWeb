import { Component, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-button',
  templateUrl: './button.component.html',
  styleUrls: ['./button.component.css']
})
export class ButtonComponent {
  @Input() type: 'save' | 'add' | 'edit' | 'delete' = 'save'; // button type
  @Input() label: string = ''; // button text
  @Input() icon?: string; // optional SVG path or icon class
  @Output() action = new EventEmitter<void>(); // emit click event

  onClick() {
    this.action.emit();
  }
}
