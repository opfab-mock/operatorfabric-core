/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

package org.lfenergy.operatorfabric.cards.consultation.model;

import lombok.*;
import org.lfenergy.operatorfabric.cards.model.I18n;
import org.lfenergy.operatorfabric.cards.model.Input;
import org.lfenergy.operatorfabric.cards.model.InputEnum;
import org.lfenergy.operatorfabric.cards.model.ParameterListItem;

import java.util.ArrayList;
import java.util.List;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class InputConsultationData implements Input {
    private InputEnum type;
    private String name;
    private I18n label;
    private String value;
    private Boolean mandatory;
    private Integer maxLength;
    private Integer rows;
    @Singular
    private List< ? extends ParameterListItem> values = new ArrayList<>();
    @Singular
    private List<String> selectedValues = new ArrayList<>();
    @Singular
    private List<String> unSelectedValues = new ArrayList<>();
}