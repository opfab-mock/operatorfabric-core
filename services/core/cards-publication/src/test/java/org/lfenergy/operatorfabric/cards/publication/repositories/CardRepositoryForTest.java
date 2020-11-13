/* Copyright (c) 2018-2020, RTE (http://www.rte-france.com)
 * See AUTHORS.txt
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 * SPDX-License-Identifier: MPL-2.0
 * This file is part of the OperatorFabric project.
 */



package org.lfenergy.operatorfabric.cards.publication.repositories;

import org.lfenergy.operatorfabric.cards.publication.model.CardPublicationData;
import org.springframework.data.mongodb.repository.ReactiveMongoRepository;
import org.springframework.stereotype.Repository;
import reactor.core.publisher.Mono;

/**
 * <p>Auto generated spring mongo reactive repository to access Card collection</p>
 *
 */
@Repository
public interface CardRepositoryForTest extends ReactiveMongoRepository<CardPublicationData,String> {

    public Mono<CardPublicationData> findByProcessInstanceId(String processInstanceId);
    
    public Mono<CardPublicationData> findByUid(String Uid);

    public Mono<CardPublicationData> findById(String id);
}
