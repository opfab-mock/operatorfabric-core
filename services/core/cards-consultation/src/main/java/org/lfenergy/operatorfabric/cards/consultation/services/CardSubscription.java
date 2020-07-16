/* Copyright (c) 2018-2020, RTE (http://www.rte-france.com)
 * See AUTHORS.txt
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 * SPDX-License-Identifier: MPL-2.0
 * This file is part of the OperatorFabric project.
 */



package org.lfenergy.operatorfabric.cards.consultation.services;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.Builder;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.extern.slf4j.Slf4j;
import net.minidev.json.JSONArray;
import net.minidev.json.JSONObject;
import net.minidev.json.parser.JSONParser;
import net.minidev.json.parser.ParseException;
import org.lfenergy.operatorfabric.users.model.CurrentUserWithPerimeters;
import org.springframework.amqp.core.*;
import org.springframework.amqp.rabbit.connection.ConnectionFactory;
import org.springframework.amqp.rabbit.listener.MessageListenerContainer;
import org.springframework.amqp.rabbit.listener.SimpleMessageListenerContainer;
import reactor.core.publisher.EmitterProcessor;
import reactor.core.publisher.Flux;
import reactor.core.publisher.FluxSink;

import java.time.Instant;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;

/**
 * <p>This object manages subscription to AMQP exchange</p>
 *
 * <p>Two exchanges are used, {@link #groupExchange} and {@link #userExchange}.
 * See amqp.xml resource file ([project]/services/core/cards-publication/src/main/resources/amqp.xml)
 * for their exact configuration</p>
 *
 *
 */
@Slf4j
@EqualsAndHashCode
public class CardSubscription {
    public static final String GROUPS_SUFFIX = "Groups";
    public static final String DELETE_OPERATION = "DELETE";
    private String userQueueName;
    private String groupQueueName;
    private long current = 0;
    @Getter
    private CurrentUserWithPerimeters currentUserWithPerimeters;
    @Getter
    private String id;
    @Getter
    private Flux<String> publisher;
    private Flux<String> amqpPublisher;
    private EmitterProcessor<String> externalPublisher;
    private Flux<String> externalFlux;
    private FluxSink<String> externalSink;
    private AmqpAdmin amqpAdmin;
    private DirectExchange userExchange;
    private FanoutExchange groupExchange;
    private ConnectionFactory connectionFactory;
    private MessageListenerContainer userMlc;
    private MessageListenerContainer groupMlc;
    @Getter
    private Instant startingPublishDate;
    @Getter
    private boolean cleared = false;
    private final String clientId;

    /**
     * Constructs a card subscription and init access to AMQP exchanges
     * @param user connected user
     * @param clientId id of client (generated by ui)
     * @param doOnCancel a runnable to call on subscription cancellation
     * @param amqpAdmin AMQP management component
     * @param userExchange configured exchange for user messages
     * @param groupExchange configured exchange for group messages
     * @param connectionFactory AMQP connection  factory to instantiate listeners
     */
    @Builder
    public CardSubscription(CurrentUserWithPerimeters currentUserWithPerimeters,
                            String clientId,
                            Runnable doOnCancel,
                            AmqpAdmin amqpAdmin,
                            DirectExchange userExchange,
                            FanoutExchange groupExchange,
                            ConnectionFactory connectionFactory) {
        if (currentUserWithPerimeters != null)
            this.id = computeSubscriptionId(currentUserWithPerimeters.getUserData().getLogin(), clientId);
        this.currentUserWithPerimeters = currentUserWithPerimeters;
        this.amqpAdmin = amqpAdmin;
        this.userExchange = userExchange;
        this.groupExchange = groupExchange;
        this.connectionFactory = connectionFactory;
        this.clientId = clientId;
        if (currentUserWithPerimeters != null) {
            this.userQueueName = computeSubscriptionId(currentUserWithPerimeters.getUserData().getLogin(), this.clientId);
            this.groupQueueName = computeSubscriptionId(currentUserWithPerimeters.getUserData().getLogin() + GROUPS_SUFFIX, this.clientId);
        }
    }

    public static String computeSubscriptionId(String prefix, String clientId) {
        return prefix + "#" + clientId;
    }

    /**
     * <ul>
     * <li>Create a user queue and a group topic queue</li>
     * <li>Associate queues to message {@link MessageListenerContainer}.</li>
     * <li>Creates a amqpPublisher {@link Flux} to publish AMQP messages to</li>
     * </ul>
     * <p>
     * Listeners starts on {@link Flux} subscription.
     * </p>
     * <p>On subscription cancellation triggers doOnCancel</p>
     * @param doOnCancel
     */
    public void initSubscription(Runnable doOnCancel) {
        createUserQueue();
        createGroupQueue();
        this.userMlc = createMessageListenerContainer(this.userQueueName);
        this.groupMlc = createMessageListenerContainer(groupQueueName);
        amqpPublisher = Flux.create(emitter -> {
            registerListener(userMlc, emitter,this.currentUserWithPerimeters.getUserData().getLogin());
            registerListenerForGroups(groupMlc, emitter,this.currentUserWithPerimeters.getUserData().getLogin()+ GROUPS_SUFFIX);
            emitter.onRequest(v -> {
                log.info("STARTING subscription");
                log.info("LISTENING to messages on User[{}] queue",this.currentUserWithPerimeters.getUserData().getLogin());
                userMlc.start();
                log.info("LISTENING to messages on Group[{}Groups] queue",this.currentUserWithPerimeters.getUserData().getLogin());
                groupMlc.start();
                startingPublishDate = Instant.now();
            });
            emitter.onDispose(()->{
                log.info("DISPOSING amqp publisher");
                doOnCancel.run();
            });
        });
        this.externalPublisher = EmitterProcessor.create();
        this.externalSink = this.externalPublisher.sink();
        this.amqpPublisher = amqpPublisher
                .doOnError(t->log.error("ERROR on amqp publisher",t))
                .doOnComplete(()->log.info("COMPLETE amqp Publisher"))
                .doOnCancel(()->log.info("CANCELED amqp publisher"));
        this.externalFlux = this.externalPublisher
                .doOnError(t->log.error("ERROR on external publisher",t))
                .doOnComplete(()->log.info("COMPLETE external Publisher"))
                .doOnCancel(()->log.info("CANCELED external publisher"));
        this.publisher = amqpPublisher.mergeWith(externalFlux)
                .doOnError(t->log.error("ERROR on merged publisher",t))
                .doOnComplete(()->log.info("COMPLETE merged publisher"))
                .doOnCancel(()->log.info("CANCELED merged publisher"));
    }

    /**
     * Creates a message listener which publishes messages to {@link FluxSink}
     *
     * @param userMlc
     * @param emitter
     * @param queueName
     */
    private void registerListener(MessageListenerContainer userMlc, FluxSink<String> emitter, String queueName) {
        userMlc.setupMessageListener(message -> {
            log.info("PUBLISHING message from  {}",queueName);
            emitter.next(new String(message.getBody()));

        });
    }

    private void registerListenerForGroups(MessageListenerContainer groupMlc, FluxSink<String> emitter, String queueName) {
        groupMlc.setupMessageListener(message -> {

            String messageBody = new String(message.getBody());
            if (checkIfUserMustReceiveTheCard(messageBody)){
                log.info("PUBLISHING message from {}",queueName);
                emitter.next(messageBody);
            }
            else {  // In case of ADD or UPDATE, we send a delete card operation (to delete the card from the feed, more information in OC-297)
                String deleteMessage = createDeleteCardMessageForUserNotRecipient(messageBody);
                if (! deleteMessage.isEmpty())
                    emitter.next(deleteMessage);
            }
        });
    }

    /**
     * Constructs a non durable queue to userExchange using user login as binding, queue name
     * is [user login]#[client id]
     * @return
     */
    private Queue createUserQueue() {
        log.info("CREATE User[{}] queue",this.currentUserWithPerimeters.getUserData().getLogin());
        Queue queue = QueueBuilder.nonDurable(this.userQueueName).build();
        amqpAdmin.declareQueue(queue);
        Binding binding = BindingBuilder
           .bind(queue)
           .to(this.userExchange)
           .with(this.currentUserWithPerimeters.getUserData().getLogin());
        amqpAdmin.declareBinding(binding);
        log.info("CREATED User[{}] queue",this.userQueueName);
        return queue;
    }

    /**
     * <p>Constructs a non durable queue to groupExchange using queue name
     * [user login]Groups#[client id].</p>
     * @return
     */
    private Queue createGroupQueue() {
        log.info("CREATE Group[{}Groups] queue",this.currentUserWithPerimeters.getUserData().getLogin());
        Queue queue = QueueBuilder.nonDurable(this.groupQueueName).build();
        amqpAdmin.declareQueue(queue);

        Binding binding = BindingBuilder.bind(queue).to(groupExchange);
        amqpAdmin.declareBinding(binding);

        log.info("CREATED Group[{}Groups] queue",this.groupQueueName);
        return queue;
    }

    /**
     * Stops associated {@link MessageListenerContainer} and delete queues
     */
    public void clearSubscription() {
        log.info("STOPPING User[{}] queue",this.userQueueName);
        this.userMlc.stop();
        amqpAdmin.deleteQueue(this.userQueueName);
        log.info("STOPPING Group[{}Groups] queue",this.groupQueueName);
        this.groupMlc.stop();
        amqpAdmin.deleteQueue(this.groupQueueName);
        this.cleared = true;
    }

    /**
     *
     * @return true if associated AMQP listeners are still running
     */
    public boolean checkActive(){
        boolean userActive = userMlc == null || userMlc.isRunning();
        boolean groupActive = groupMlc == null || groupMlc.isRunning();
        return userActive && groupActive;
    }


    /**
     * Create a {@link MessageListenerContainer} for the specified queue
     * @param queueName AMQP queue name
     * @return listener container for the specified queue
     */
    public MessageListenerContainer createMessageListenerContainer(String queueName) {

        SimpleMessageListenerContainer mlc = new SimpleMessageListenerContainer(connectionFactory);
        mlc.addQueueNames(queueName);
        mlc.setAcknowledgeMode(AcknowledgeMode.AUTO);

        return mlc;
    }

    public void updateRange() {
        startingPublishDate = Instant.now();
    }

    public void publishInto(Flux<String> fetchOldCards) {
        fetchOldCards.subscribe(next->this.externalSink.next(next));
    }

    public String createDeleteCardMessageForUserNotRecipient(String messageBody){
        try {
            JSONObject obj = (JSONObject) (new JSONParser(JSONParser.MODE_PERMISSIVE)).parse(messageBody);
            String typeOperation = (obj.get("type") != null) ? (String) obj.get("type") : "";

            if (typeOperation.equals("ADD") || typeOperation.equals("UPDATE")){
                JSONArray cards = (JSONArray) obj.get("cards");
                JSONObject cardsObj = (cards != null) ? (JSONObject) cards.get(0) : null;    //there is always only one card in the array
                String idCard = (cardsObj != null) ? (String) cardsObj.get("id") : "";

                obj.replace("type", DELETE_OPERATION);
                obj.appendField("cardIds", Arrays.asList(idCard));
                return obj.toJSONString();
            }
        }
        catch(ParseException e){ log.error("ERROR during received message parsing", e); }

        return "";
    }

    /**
     * @param messageBody message body received from rabbitMQ
     * @return true if the message received must be seen by the connected user.
     * Rules for receiving cards :
     *     1) If the card is sent to entity A and group B, then to receive it,
     *        the user must be part of A AND (be part of B OR have the right for the process/state of the card)
     *     2) If the card is sent to entity A only, then to receive it, the user must be part of A and have the right for the process/state of the card
     *     3) If the card is sent to group B only, then to receive it, the user must be part of B
     */
    public boolean checkIfUserMustReceiveTheCard(final String messageBody){
        try {
            List<String> processStateList = new ArrayList<>();
            if (currentUserWithPerimeters.getComputedPerimeters() != null)
                currentUserWithPerimeters.getComputedPerimeters().forEach(perimeter ->
                        processStateList.add(perimeter.getProcess() + "." + perimeter.getState()));

            JSONObject obj = (JSONObject) (new JSONParser(JSONParser.MODE_PERMISSIVE)).parse(messageBody);
            JSONArray groupRecipientsIdsArray = (JSONArray) obj.get("groupRecipientsIds");
            JSONArray entityRecipientsIdsArray = (JSONArray) obj.get("entityRecipientsIds");
            JSONArray cards = (JSONArray) obj.get("cards");
            String typeOperation = (obj.get("type") != null) ? (String) obj.get("type") : "";

            JSONObject cardsObj = (cards != null) ? (JSONObject) cards.get(0) : null;    //there is always only one card in the array

            String processStateKey = (cardsObj != null) ? cardsObj.get("process") + "." + cardsObj.get("state") : "";

            List<String> userGroups = currentUserWithPerimeters.getUserData().getGroups();
            List<String> userEntities = currentUserWithPerimeters.getUserData().getEntities();

            if (entityRecipientsIdsArray == null || entityRecipientsIdsArray.isEmpty()) //card sent to group only
                return checkInCaseOfCardSentToGroupOnly(userGroups, groupRecipientsIdsArray);

            if (groupRecipientsIdsArray == null || groupRecipientsIdsArray.isEmpty())   //card sent to entity only
                return checkInCaseOfCardSentToEntityOnly(userEntities, entityRecipientsIdsArray, typeOperation,
                                                         processStateKey, processStateList);

            //card sent to entity and group
            return checkInCaseOfCardSentToEntityAndGroup(userEntities, userGroups, entityRecipientsIdsArray,
                                                         groupRecipientsIdsArray, typeOperation, processStateKey,
                                                         processStateList);
        }
        catch(ParseException e){ log.error("ERROR during received message parsing", e); }
        return false;
    }

    boolean checkInCaseOfCardSentToGroupOnly(List<String> userGroups, JSONArray groupRecipientsIdsArray) {
        return (userGroups != null) && (groupRecipientsIdsArray != null)
                && !Collections.disjoint(userGroups, groupRecipientsIdsArray);
    }

    boolean checkInCaseOfCardSentToEntityOnly(List<String> userEntities, JSONArray entityRecipientsIdsArray,
                                             String typeOperation, String processStateKey,
                                             List<String> processStateList) {
        if (typeOperation.equals(DELETE_OPERATION))
            return (userEntities != null) && (!Collections.disjoint(userEntities, entityRecipientsIdsArray));

        return (userEntities != null) && (!Collections.disjoint(userEntities, entityRecipientsIdsArray))
                && (!Collections.disjoint(Arrays.asList(processStateKey), processStateList));
    }

    boolean checkInCaseOfCardSentToEntityAndGroup(List<String> userEntities, List<String> userGroups,
                                                  JSONArray entityRecipientsIdsArray, JSONArray groupRecipientsIdsArray,
                                                  String typeOperation, String processStateKey, List<String> processStateList) {
        if (typeOperation.equals(DELETE_OPERATION))
            return ((userEntities != null) && (userGroups != null)
                    && !Collections.disjoint(userEntities, entityRecipientsIdsArray)
                    && !Collections.disjoint(userGroups, groupRecipientsIdsArray))
                    ||
                    ((userEntities != null) && !Collections.disjoint(userEntities, entityRecipientsIdsArray));

        return ((userEntities != null) && (userGroups != null)
                && !Collections.disjoint(userEntities, entityRecipientsIdsArray)
                && !Collections.disjoint(userGroups, groupRecipientsIdsArray))
                ||
                ((userEntities != null)
                        && !Collections.disjoint(userEntities, entityRecipientsIdsArray)
                        && !Collections.disjoint(Arrays.asList(processStateKey), processStateList));
    }
}
