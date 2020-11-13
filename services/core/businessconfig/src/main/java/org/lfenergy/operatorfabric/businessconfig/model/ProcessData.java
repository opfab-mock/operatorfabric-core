/* Copyright (c) 2018-2020, RTE (http://www.rte-france.com)
 * See AUTHORS.txt
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 * SPDX-License-Identifier: MPL-2.0
 * This file is part of the OperatorFabric project.
 */


package org.lfenergy.operatorfabric.businessconfig.model;

import lombok.*;
import lombok.extern.slf4j.Slf4j;

import java.util.HashMap;
import java.util.Map;

/**
 * Process Model, documented at {@link Process}
 *
 * {@inheritDoc}
 *
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Slf4j
public class ProcessData implements Process {

  private String id;
  private String name;
  private String version;
  @Singular("stateData")
  private Map<String, ProcessStatesData> statesData;
  private ProcessUiVisibilityData uiVisibility;

  @Override
  public Map<String, ? extends ProcessStates> getStates(){
    return statesData;
  }

  @Override
  public ProcessUiVisibility getUiVisibility(){
    return uiVisibility;
  }

  @Override
  public void setStates(Map<String, ? extends ProcessStates> statesData){
    this.statesData = new HashMap<>((Map<String, ProcessStatesData>) statesData);
  }

  @Override
  public void setUiVisibility(ProcessUiVisibility uiVisibilityData){
    this.uiVisibility = (ProcessUiVisibilityData) uiVisibilityData;
  }

}
