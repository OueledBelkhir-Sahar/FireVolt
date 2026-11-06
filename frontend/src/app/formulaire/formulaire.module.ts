import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AddconducteurComponent } from './addconducteur/addconducteur.component';
import { ReactiveFormsModule } from '@angular/forms';
import { FormsModule } from '@angular/forms';
import { AddLocalComponent } from './add-local/add-local.component';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { AddSuperviseurComponent } from './add-superviseur/add-superviseur.component';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { AddNotificationComponent } from './add-notification/add-notification.component';
import {NzOptionComponent, NzSelectComponent} from "ng-zorro-antd/select";
import { AddGeofenceComponent } from './add-geofence/add-geofence.component';
import { AssocierConducteurComponent } from './associer-conducteur/associer-conducteur.component';
import { NzRadioModule } from 'ng-zorro-antd/radio';

@NgModule({
  declarations: [
    AddconducteurComponent,
    AddLocalComponent,
    AddSuperviseurComponent,
    AddNotificationComponent,
    AddGeofenceComponent,
    AssocierConducteurComponent,

  ],
    imports: [
      NzRadioModule,
        CommonModule,
        ReactiveFormsModule,
        FormsModule,
        NzButtonModule,
        NzModalModule,
        ReactiveFormsModule,
      NzFormModule,
      NzInputModule,
      NzOptionComponent,
      NzSelectComponent
    ],
    exports: [
        AddconducteurComponent,
        AddLocalComponent,
        AddSuperviseurComponent,
        AddNotificationComponent,
        AddGeofenceComponent,
        AssocierConducteurComponent
    ],


})
export class FormulaireModule { }
