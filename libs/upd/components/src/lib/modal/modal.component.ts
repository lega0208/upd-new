import { Component, inject, Input } from '@angular/core';
import { NgbModal, ModalDismissReasons } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'upd-modal',
  templateUrl: './modal.component.html',
  styleUrls: ['./modal.component.scss'],
})
export class ModalComponent<T> {
  private modalService = inject(NgbModal);

  @Input() modalTitle = '';
  @Input() buttonTitle = '';
  @Input() modalContent = '';

  closeResult = '';

  open(content: any) {
    this.modalService
      .open(content, { ariaLabelledBy: 'modal-basic-title' })
  }

}
