import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GeofenceComponent } from './geofence/geofence.component';
import {NzButtonComponent} from "ng-zorro-antd/button";
import {NzColDirective, NzRowDirective} from "ng-zorro-antd/grid";
import {NzDrawerComponent} from "ng-zorro-antd/drawer";
import {NzFormControlComponent, NzFormDirective, NzFormItemComponent, NzFormLabelComponent} from "ng-zorro-antd/form";
import {NzInputDirective} from "ng-zorro-antd/input";
import {NzOptionComponent, NzSelectComponent} from "ng-zorro-antd/select";
import {NzWaveDirective} from "ng-zorro-antd/core/wave";
import {ReactiveFormsModule} from "@angular/forms";
import { NzDrawerModule } from 'ng-zorro-antd/drawer';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzPopconfirmModule } from 'ng-zorro-antd/popconfirm';
import { NzButtonModule } from 'ng-zorro-antd/button';



@NgModule({
  declarations: [
    GeofenceComponent
  ],
    imports: [
      NzButtonModule,
      NzPopconfirmModule,
      NzIconModule,
      NzDrawerModule,
        CommonModule,
        NzButtonComponent,
        NzColDirective,
        NzDrawerComponent,
        NzFormControlComponent,
        NzFormDirective,
        NzFormItemComponent,
        NzFormLabelComponent,
        NzInputDirective,
        NzOptionComponent,
        NzRowDirective,
        NzSelectComponent,
        NzWaveDirective,
        ReactiveFormsModule
    ],
  exports :[
    GeofenceComponent
  ]
})
export class DrawersModule { }
