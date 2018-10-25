/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

package org.lfenergy.operatorfabric.cards.repositories;

import org.lfenergy.operatorfabric.cards.model.ArchivedCardData;
import org.springframework.data.mongodb.repository.ReactiveMongoRepository;
import org.springframework.stereotype.Repository;
import reactor.core.publisher.Flux;

/**
 * <p></p>
 * Created on 24/07/18
 *
 * @author davibind
 */
@Repository
public interface ArchivedCardRepository extends ReactiveMongoRepository<ArchivedCardData,String> {

    public Flux<ArchivedCardData> findByProcessId(String processId);
}