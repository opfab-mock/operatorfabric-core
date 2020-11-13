/* Copyright (c) 2018-2020, RTE (http://www.rte-france.com)
 * See AUTHORS.txt
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 * SPDX-License-Identifier: MPL-2.0
 * This file is part of the OperatorFabric project.
 */



import {Component, OnInit} from '@angular/core';
import { Observable } from 'rxjs';
import { Store } from '@ngrx/store';
import { AppState } from '@ofStore/index';
import { selectSubscriptionOpen } from '@ofStore/selectors/cards-subscription.selectors';
import { ConfigService} from "@ofServices/config.service";
import { ChangeReadSort } from '@ofStore/actions/feed.actions';

@Component({
  selector: 'of-filters',
  templateUrl: './filters.component.html',
  styleUrls: ['./filters.component.scss']
})
export class FiltersComponent implements OnInit {

  hideAckFilter: boolean;
  hideTags: boolean;
  hideTimerTags: boolean;
  cardsSubscriptionOpen$ : Observable<boolean>;
  filterByPublishDate : boolean = true;
  hideReadSort: boolean;
  hideSeveritySort: boolean;

  constructor(private store: Store<AppState>,private  configService: ConfigService) { }

  ngOnInit() {
    this.hideTags = this.configService.getConfigValue('settings.tags.hide',false);
    this.hideTimerTags = this.configService.getConfigValue('feed.card.hideTimeFilter',false);
    this.hideAckFilter = this.configService.getConfigValue('feed.card.hideAckFilter',false);
    this.hideReadSort = this.configService.getConfigValue('feed.card.hideReadSort',false);
    this.hideSeveritySort = this.configService.getConfigValue('feed.card.hideSeveritySort',false);
    this.cardsSubscriptionOpen$ = this.store.select(selectSubscriptionOpen);
    
    // When time line is hide , we use a date filter by business date and not publish date
    this.filterByPublishDate = !this.configService.getConfigValue('feed.timeline.hide',false);
    // Change default readSort 
    if (this.hideReadSort) {
      this.store.dispatch(new ChangeReadSort());
    }
  }


}
