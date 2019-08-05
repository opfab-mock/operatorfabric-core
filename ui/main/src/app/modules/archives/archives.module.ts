/* Copyright (c) 2018, RTE (http://www.rte-france.com)
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {ArchivesRoutingModule} from './archives-routing.module';
import { ArchiveListPageComponent } from './components/archive-list/archive-list-page/archive-list-page.component';
import {ArchivesComponent} from './archives.component';
import {ArchiveListComponent} from './components/archive-list/archive-list.component';
import {CardsModule} from '../cards/cards.module';
import {ListFilterComponent} from './components/archive-filters/list-filter/list-filter.component';
import { ArchiveFiltersComponent } from './components/archive-filters/archive-filters.component';
import {TranslateModule} from '@ngx-translate/core';
import { ArchiveService } from '@ofServices/archive.service';
import { MultiFilterComponent } from './components/archive-filters/multi-filter/multi-filter.component';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    ArchivesRoutingModule,
    CardsModule,
    TranslateModule,
  ],
  declarations: [
    ArchivesComponent,
    ArchiveListComponent,
    ListFilterComponent,
    ArchiveFiltersComponent,
    MultiFilterComponent,
    ArchiveListPageComponent
  ],
  providers: [
    ArchiveService
  ]
})
export class ArchivesModule { }
