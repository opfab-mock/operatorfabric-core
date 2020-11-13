/* Copyright (c) 2018-2020, RTE (http://www.rte-france.com)
 * See AUTHORS.txt
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 * SPDX-License-Identifier: MPL-2.0
 * This file is part of the OperatorFabric project.
 */



package org.lfenergy.operatorfabric.cards.publication.controllers;


import static org.awaitility.Awaitility.await;
import static org.hamcrest.Matchers.hasProperty;
import static org.hamcrest.Matchers.is;



import java.util.List;
import java.util.concurrent.TimeUnit;


import org.assertj.core.api.Assertions;
import org.jeasy.random.EasyRandom;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.lfenergy.operatorfabric.cards.publication.CardPublicationApplication;
import org.lfenergy.operatorfabric.cards.publication.model.CardCreationReportData;
import org.lfenergy.operatorfabric.cards.publication.model.CardPublicationData;
import org.lfenergy.operatorfabric.cards.publication.repositories.ArchivedCardRepositoryForTest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.reactive.AutoConfigureWebTestClient;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;

import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.junit.jupiter.SpringExtension;

import lombok.extern.slf4j.Slf4j;


/**
 * <p></p>
 * Created on 26/10/18
 *
 */
@ExtendWith(SpringExtension.class)
@SpringBootTest(classes = CardPublicationApplication.class)
@AutoConfigureWebTestClient
@ActiveProfiles(profiles = {"native", "test"})
@Slf4j
@Tag("end-to-end")
@Tag("mongo")
class CardControllerShould extends CardControllerShouldBase {


    @Autowired
    private ArchivedCardRepositoryForTest archiveRepository;


    @AfterEach
    public void cleanAfter() {
        cardRepository.deleteAll().subscribe();
        archiveRepository.deleteAll().subscribe();
    }

    @Test
    void createSyncCards() {
        this.webTestClient.post().uri("/cards").accept(MediaType.APPLICATION_JSON)
                .body(generateCards(), CardPublicationData.class)
                .exchange()
                .expectBody(CardCreationReportData.class)
                .value(hasProperty("count", is(5)));
        Assertions.assertThat(cardRepository.count().block()).isEqualTo(4);
        Assertions.assertThat(archiveRepository.count().block()).isEqualTo(5);
    }

    // removes cards
    @Test
    void deleteSynchronously_An_ExistingCard_whenT_ItSIdIsProvided() {

        EasyRandom randomGenerator = instantiateEasyRandom();

        int numberOfCards = 10;
        List<CardPublicationData> cardsInRepository = instantiateCardPublicationData(randomGenerator, numberOfCards);

        cardRepository.saveAll(cardsInRepository).subscribe();


        String existingId = cardsInRepository.get(0).getId();


        String testedId = existingId;
        this.webTestClient.delete().uri("/cards/" + testedId).accept(MediaType.APPLICATION_JSON)
                .exchange()
                .expectStatus().isOk();
        Assertions.assertThat(cardRepository.count().block()).isEqualTo(numberOfCards - 1);

    }
    
    @Test
    void keepTheCardRepository_Untouched_when_ARandomId_isGiven() {

        EasyRandom randomGenerator = instantiateEasyRandom();

        int cardNumber = 10;
        List<CardPublicationData> cardsInRepository = instantiateCardPublicationData(randomGenerator, cardNumber);

        cardRepository.saveAll(cardsInRepository).subscribe();

        await().atMost(5, TimeUnit.SECONDS).untilAsserted(
                () -> {
                    Long block = cardRepository.count().block();
                    Assertions.assertThat(block)
                            .withFailMessage("The number of registered cards should be %d but is %d"
                                    , cardNumber
                                    , block)
                            .isEqualTo(cardNumber);
                }
        );

        String testedId = randomGenerator.nextObject(String.class);
        this.webTestClient.delete().uri("/cards/" + testedId).accept(MediaType.APPLICATION_JSON)
                .exchange()
                .expectStatus().isNotFound();

        Assertions.assertThat(cardRepository.count().block()).isEqualTo(cardNumber);


    }

    @Test
    void deleteUserCardWithUnauthenticatedUser() throws Exception {

        EasyRandom randomGenerator = instantiateEasyRandom();

        int numberOfCards = 1;
        List<CardPublicationData> cardsInRepository = instantiateCardPublicationData(randomGenerator, numberOfCards);

        cardRepository.saveAll(cardsInRepository).subscribe();

        String existingId = cardsInRepository.get(0).getId();

        webTestClient.delete().uri("/cards/userCard/" + existingId).exchange().expectStatus().isUnauthorized();
    }

}
