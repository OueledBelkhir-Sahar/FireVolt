import { NgModule  } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CardsComponent } from './cards/cards.component';
import { ConducteursComponent } from './conducteurs/conducteurs.component';
import { FormulaireModule } from "../formulaire/formulaire.module";
import { LocalComponent } from './local/local.component';
import { SuperviseurComponent } from './superviseur/superviseur.component';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzDropDownModule } from 'ng-zorro-antd/dropdown';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzDividerModule } from 'ng-zorro-antd/divider';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { RouterModule } from '@angular/router';
import {NzPopconfirmModule} from 'ng-zorro-antd/popconfirm';
import {MapsModule} from '../maps/maps.module';
import { NotificationComponent } from './notification/notification.component';
import { HistoriqueNotificationComponent } from './historique-notification/historique-notification.component';
import {NzDrawerModule} from 'ng-zorro-antd/drawer';
import {NzFormModule} from 'ng-zorro-antd/form';
import {NzMenuModule} from 'ng-zorro-antd/menu';
import {NzListModule} from 'ng-zorro-antd/list';
import {NzTagModule} from 'ng-zorro-antd/tag';
import {NzSelectModule} from 'ng-zorro-antd/select';
import {DrawersModule} from "../drawers/drawers.module";
import {ModalModule} from "../modal/modal.module";

@NgModule({
  declarations: [
    CardsComponent,
    ConducteursComponent,
    LocalComponent,
    SuperviseurComponent,
    NotificationComponent,
    HistoriqueNotificationComponent,


  ],
    imports: [
        CommonModule, RouterModule,
        NzPopconfirmModule,
        FormulaireModule,
        NzButtonModule,
        NzModalModule,
        BrowserAnimationsModule,
        NzDrawerModule,
        NzFormModule,
        NzDividerModule,
        NzCardModule,
        NzGridModule,
        FormsModule,
        MapsModule,
        NzDropDownModule,
        NzIconModule,
        NzInputModule,
        NzTableModule,
        NzMenuModule,
        CommonModule,
        NzListModule,
        NzTagModule,
        ReactiveFormsModule,
        NzSelectModule, DrawersModule, ModalModule,

    ],
  exports: [
    CardsComponent,
    ConducteursComponent,


  ]
})
export class DashboardsModule { }
