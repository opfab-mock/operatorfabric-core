/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

package org.lfenergy.operatorfabric.cards.model;

import lombok.*;

import java.util.HashMap;
import java.util.Map;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class I18nData implements I18n {
    private String key;
    @Singular private Map<String,String> parameters = new HashMap<>();

    public I18n copy(){
        return I18nData.builder()
           .key(this.getKey())
           .parameters(this.getParameters())
           .build();
    }
}