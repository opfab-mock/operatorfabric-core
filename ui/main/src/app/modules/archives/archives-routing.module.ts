/* Copyright (c) 2018-2020, RTE (http://www.rte-france.com)
 * See AUTHORS.txt
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 * SPDX-License-Identifier: MPL-2.0
 * This file is part of the OperatorFabric project.
 */


import {NgModule} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';
import {ArchivesComponent} from './archives.component';
import {CloseableCardDetailsComponent} from '../cards/components/card-details/closeable-card-details.component';
import {DetailComponent} from '../cards/components/detail/detail.component';

const routes: Routes = [
    {
        path: '',
        component: ArchivesComponent,
        children: [
            {
                path: 'cards',
                children: [
                    {
                        path: '',
                        component: CloseableCardDetailsComponent,
                    },
                    {
                        path: ':cid',
                        component: CloseableCardDetailsComponent,
                        children: [
                            {
                                path: 'details/:did',
                                component: DetailComponent
                            }
                        ]
                    }]
            }
        ]
    }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class ArchivesRoutingModule {
}
