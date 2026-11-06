import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DeviceModalComponent } from './device-modal/device-modal.component';
import {NzModalModule} from 'ng-zorro-antd/modal';
import {DrawersModule} from '../drawers/drawers.module';

@NgModule({
  declarations: [
    DeviceModalComponent
  ],
  imports: [
    CommonModule,
    NzModalModule,
    DrawersModule,


  ],
  exports: [DeviceModalComponent]
})
export class ModalModule { }
