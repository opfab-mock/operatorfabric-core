/* Copyright (c) 2018-2020, RTE (http://www.rte-france.com)
 * See AUTHORS.txt
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 * SPDX-License-Identifier: MPL-2.0
 * This file is part of the OperatorFabric project.
 */


import {Menu} from '@ofModel/menu.model';

export interface MenuState {
    menu: Menu[];
    loading: boolean;
    error: string;
    selected_iframe_url: string;
}

export const menuInitialState: MenuState = {
    menu: [],
    loading: false,
    error: null,
    selected_iframe_url: null
};
