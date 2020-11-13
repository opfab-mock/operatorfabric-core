/* Copyright (c) 2018-2020, RTEI (http://www.rte-international.com)
 * See AUTHORS.txt
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 * SPDX-License-Identifier: MPL-2.0
 * This file is part of the OperatorFabric project.
 */

import { ErrorHandler, NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { AdminComponent } from './admin.component';
import { PaginationModule } from 'ngx-bootstrap/pagination';
import { AdminRoutingModule } from './admin-rooting.module';
import { TranslateModule } from '@ngx-translate/core';
import { AppErrorHandler } from 'app/common/error/app-error-handler';
import { OfUsersTableComponent } from './components/ngtable/users/ofuserstable.component';
import { OfGroupsTableComponent } from './components/ngtable/groups/of-groups-table.component';
import { OfEntitiesTableComponent } from './components/ngtable/entities/of-entities-table.component';
import { OfTableComponent } from './components/ngtable/oftable/oftable.component';
import { Ng2TableModule } from 'ng2-table';
import { EditUsermodalComponent } from './components/editmodal/users/edit-user-modal.component';
import { ConfirmationDialogComponent } from './components/confirmation-dialog/confirmation-dialog.component';
import { MatInputModule, MatSelectModule } from '@angular/material';
import { EditEntityGroupModalComponent } from './components/editmodal/groups-entities/edit-entity-group-modal.component';



@NgModule({
  declarations: [
    AdminComponent,
    OfUsersTableComponent,
    OfGroupsTableComponent,
    OfEntitiesTableComponent,
    OfTableComponent,
    EditUsermodalComponent,
    ConfirmationDialogComponent,
    EditEntityGroupModalComponent
  ],


  entryComponents: [
    EditUsermodalComponent,
    ConfirmationDialogComponent,
    EditEntityGroupModalComponent
  ],


  imports: [
    FormsModule
    , ReactiveFormsModule
    , AdminRoutingModule
    , PaginationModule.forRoot()
    , CommonModule
    , MatSelectModule
    , MatInputModule
    , TranslateModule
    , Ng2TableModule
  ],
  providers: [{ provide: ErrorHandler, useClass: AppErrorHandler }]
})
export class AdminModule { }

