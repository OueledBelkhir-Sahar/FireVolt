import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MapHomeComponent } from './map-home/map-home.component';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzDrawerModule } from 'ng-zorro-antd/drawer';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzListModule } from 'ng-zorro-antd/list';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzMenuModule } from 'ng-zorro-antd/menu';
import { NzDropDownModule } from 'ng-zorro-antd/dropdown';
import {  CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ReactiveFormsModule } from '@angular/forms';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { FormulaireModule } from "../formulaire/formulaire.module";
import {ModalModule} from '../modal/modal.module';
import {DrawersModule} from '../drawers/drawers.module';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { ToastrModule } from 'ngx-toastr';

@NgModule({
    declarations: [
        MapHomeComponent,

    ],
    exports: [
        MapHomeComponent,
    ],
  imports: [
    BrowserAnimationsModule,
    ToastrModule.forRoot({
      positionClass: 'toast-top-center', // En haut de la page
      timeOut: 3000
    }),
    ModalModule,
    FormulaireModule,
    NzMenuModule,
    NzDropDownModule,
    FormsModule,
    CommonModule,
    NzButtonModule,
    NzModalModule,
    NzDrawerModule,
    NzFormModule,
    NzInputModule,
    NzListModule,
    NzTagModule,
    ReactiveFormsModule,
    NzSelectModule,
    DrawersModule,
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]

})
export class MapsModule { }
