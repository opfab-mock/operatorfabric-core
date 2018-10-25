/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import {ActionReducerMap, createFeatureSelector, createSelector, MetaReducer} from '@ngrx/store';
import * as fromRouter from '@ngrx/router-store';
import {AppState} from './app.interface';
import {reducer as cardReducer} from './card/card.reducer';
import {reducer as authenticationReducer} from './authentication/authentication.reducer';
import {reducer as cardOperationReducer} from './card-operation/card-operation.reducer';
import {environment} from '@env/environment';
import {storeFreeze} from 'ngrx-store-freeze';

export const appReducer: ActionReducerMap<AppState> = {
  router: fromRouter.routerReducer,
  card: cardReducer,
  cardOperation: cardOperationReducer,
  authentication: authenticationReducer
};

export const selectRouterState = createFeatureSelector<fromRouter.RouterReducerState>('router');
export const getCurrentUrl = createSelector(selectRouterState,
  (router) => router.state && router.state.url);

export const appMetaReducers: MetaReducer<AppState>[] = !environment.production
? [storeFreeze]
  : [];