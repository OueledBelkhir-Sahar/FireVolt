import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { LoginComponent } from './login/login.component';
import { MapComponent } from './map/map.component';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { RouterModule } from '@angular/router';
import { DashboardsModule } from './dashboards/dashboards.module';
import { FormulaireModule } from "./formulaire/formulaire.module";
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { NzDropDownModule } from 'ng-zorro-antd/dropdown';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzBreadCrumbModule } from 'ng-zorro-antd/breadcrumb';
import { NzLayoutModule } from 'ng-zorro-antd/layout';
import { NzMenuModule } from 'ng-zorro-antd/menu';
import { UserOutline, VideoCameraOutline, UploadOutline } from '@ant-design/icons-angular/icons';
import {registerLocaleData} from '@angular/common';
import fr from '@angular/common/locales/fr';
const icons = [UserOutline, VideoCameraOutline, UploadOutline];
import { provideNzI18n, fr_FR } from 'ng-zorro-antd/i18n';
import {LayoutComponent} from './layout/layout.component';
registerLocaleData(fr);
import { NzAvatarModule } from 'ng-zorro-antd/avatar';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzSpaceModule } from 'ng-zorro-antd/space';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { MenuService } from 'ng-zorro-antd/menu';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzInputNumberLegacyModule } from 'ng-zorro-antd/input-number-legacy';
import { SessionInterceptor } from './services/session-interceptor.service';
import { MapsModule } from './maps/maps.module';
import {NzNotificationModule} from 'ng-zorro-antd/notification';

@NgModule({
  declarations: [
    AppComponent,
    LoginComponent,
    LayoutComponent,
    MapComponent,

  ],
  imports: [
    HttpClientModule,
    BrowserModule,
    AppRoutingModule, NzDatePickerModule, NzGridModule, NzInputNumberLegacyModule,
    FormsModule,MapsModule,NzIconModule,
    RouterModule, NzSelectModule, NzSpaceModule, NzIconModule,
    DashboardsModule,
    FormulaireModule,
    NzButtonModule,
    BrowserAnimationsModule,
    FormsModule, NzButtonModule, NzDropDownModule, NzIconModule, NzInputModule, NzTableModule,
    NzBreadCrumbModule, NzMenuModule, NzLayoutModule,
    NzIconModule.forRoot(icons), NzAvatarModule,
    NzDropDownModule,
    NzMenuModule,
    NzNotificationModule
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  providers: [{
    provide: HTTP_INTERCEPTORS,
    useClass: SessionInterceptor,
    multi: true // Ajoute cet intercepteur à la chaîne des intercepteurs HTTP
  },
    provideNzI18n(fr_FR),
    MenuService,
  ],
  bootstrap: [AppComponent],

  exports: [
      ]
})
export class AppModule { }
