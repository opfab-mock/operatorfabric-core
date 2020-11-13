package org.lfenergy.operatorfabric.cards.publication.kafka.command;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.lfenergy.operatorfabric.avro.CardCommand;
import org.lfenergy.operatorfabric.avro.CommandType;
import org.lfenergy.operatorfabric.cards.publication.model.CardPublicationData;
import org.lfenergy.operatorfabric.cards.publication.services.CardProcessingService;
import org.springframework.stereotype.Component;

@Slf4j
@RequiredArgsConstructor
@Component
public class DeleteCardCommandHandler extends BaseCommandHandler implements CommandHandler {

    private final CardProcessingService cardProcessingService;

    @Override
    public CommandType getCommandType() {
        return CommandType.DELETE_CARD;
    }

    @Override
    public void executeCommand(CardCommand cardCommand) {
        log.debug("Received Kafka DELETE CARD with processInstanceId {}, taskId {} and variables: {}",
                cardCommand.getProcessInstanceId(), cardCommand.getProcess(), cardCommand.getCard().getData());

        CardPublicationData card = buildCardPublicationData(cardCommand);
        if (card != null) {
            cardProcessingService.deleteCard(card.getProcessInstanceId());
        }
    }
}
