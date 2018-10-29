/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { CardModule } from './card.module';

describe('CardModule', () => {
  let cardOperationsModule: CardModule;

  beforeEach(() => {
    cardOperationsModule = new CardModule();
  });

  it('should create an instance', () => {
    expect(cardOperationsModule).toBeTruthy();
  });
});