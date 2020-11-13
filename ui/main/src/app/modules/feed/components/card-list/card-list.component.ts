/* Copyright (c) 2018-2020, RTE (http://www.rte-france.com)
 * See AUTHORS.txt
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 * SPDX-License-Identifier: MPL-2.0
 * This file is part of the OperatorFabric project.
 */


import {Component, Input, OnInit} from '@angular/core';
import {LightCard} from '@ofModel/light-card.model';
import {Observable} from 'rxjs';
import {ResizableComponent} from 'app/modules/utilities/components/resizable/resizable.component';

@Component({
    selector: 'of-card-list',
    templateUrl: './card-list.component.html',
    styleUrls: ['./card-list.component.scss']
})
export class CardListComponent extends ResizableComponent implements OnInit {

    @Input() public lightCards: LightCard[];
    @Input() public selection: Observable<string>;

    constructor() {
        super();
    }

    ngOnInit(): void {
    }
}
