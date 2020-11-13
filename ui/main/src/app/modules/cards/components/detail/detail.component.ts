/* Copyright (c) 2018-2020, RTE (http://www.rte-france.com)
 * See AUTHORS.txt
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 * SPDX-License-Identifier: MPL-2.0
 * This file is part of the OperatorFabric project.
 */


import {
    AfterViewChecked,
    Component,
    DoCheck,
    ElementRef,
    Input,
    OnChanges,
    OnDestroy,
    OnInit,
    TemplateRef,
    ViewChild
} from '@angular/core';
import {Card, CardForPublishing} from '@ofModel/card.model';
import {ProcessesService} from '@ofServices/processes.service';
import {HandlebarsService} from '../../services/handlebars.service';
import {DomSanitizer, SafeHtml, SafeResourceUrl} from '@angular/platform-browser';
import {Response} from '@ofModel/processes.model';
import {DetailContext} from '@ofModel/detail-context.model';
import {Store} from '@ngrx/store';
import {AppState} from '@ofStore/index';
import {selectAuthenticationState} from '@ofSelectors/authentication.selectors';
import {selectGlobalStyleState} from '@ofSelectors/global-style.selectors';
import {UserContext} from '@ofModel/user-context.model';
import {map, skip,take, takeUntil} from 'rxjs/operators';
import {fetchLightCard, selectLastCards} from '@ofStore/selectors/feed.selectors';
import {CardService} from '@ofServices/card.service';
import {Observable, Subject, zip} from 'rxjs';
import {LightCard, Severity} from '@ofModel/light-card.model';
import {AppService, PageType} from '@ofServices/app.service';
import {User} from '@ofModel/user.model';
import {Map} from '@ofModel/map';
import {RightsEnum, userRight} from '@ofModel/userWithPerimeters.model';
import {UpdateALightCard} from '@ofStore/actions/light-card.actions';
import {UserService} from '@ofServices/user.service';
import {EntitiesService} from '@ofServices/entities.service';
import {Entity} from '@ofModel/entity.model';
import {NgbModal} from '@ng-bootstrap/ng-bootstrap';
import {NgbModalRef} from '@ng-bootstrap/ng-bootstrap/modal/modal-ref';
import {ConfigService} from '@ofServices/config.service';
import {State as CardState} from '@ofModel/processes.model';
import { Router } from '@angular/router';


declare const templateGateway: any;

class Message {
    text: string;
    display: boolean;
    color: ResponseMsgColor;
}

class EntityMessage {
    name: string;
    color: EntityMsgColor;
}

class FormResult {
    valid: boolean;
    errorMsg: string;
    formData: any;
}

const enum ResponseI18nKeys {
    FORM_ERROR_MSG = 'response.error.form',
    SUBMIT_ERROR_MSG = 'response.error.submit',
    SUBMIT_SUCCESS_MSG = 'response.submitSuccess',
    BUTTON_TITLE = 'response.btnTitle'
}

const enum AckI18nKeys {
    BUTTON_TEXT_ACK = 'cardAcknowledgment.button.ack',
    BUTTON_TEXT_UNACK = 'cardAcknowledgment.button.unack',
    ERROR_MSG = 'response.error.ack'
}

const enum AckButtonColors {
    PRIMARY = 'btn-primary',
    DANGER = 'btn-danger'
}

const enum ResponseMsgColor {
    GREEN = 'alert-success',
    RED = 'alert-danger'
}

const enum EntityMsgColor {
    GREEN = 'green',
    ORANGE = '#ff6600'
}

@Component({
    selector: 'of-detail',
    templateUrl: './detail.component.html',
    styleUrls: ['./detail.component.scss']
})
export class DetailComponent implements OnChanges, OnInit, OnDestroy, AfterViewChecked, DoCheck {

    @Input() cardState: CardState;
    @Input() card: Card;
    @Input() childCards: Card[];
    @Input() user: User;
    @Input() currentPath: string;

    @ViewChild('cardDeletedWithNoErrorPopup', null) cardDeletedWithNoErrorPopupRef: TemplateRef<any>;
    @ViewChild('impossibleToDeleteCardPopup', null) impossibleToDeleteCardPopupRef: TemplateRef<any>;

    public isActionEnabled = false;
    public lttdExpiredIsTrue: boolean;
    public isDeleteOrEditCardAllowed = false;


    unsubscribe$: Subject<void> = new Subject<void>();
    public hrefsOfCssLink = new Array<SafeResourceUrl>();
    private _listEntitiesToRespond = new Array<EntityMessage>();
    private _htmlContent: SafeHtml;
    private _userContext: UserContext;
    private _lastCards$: Observable<LightCard[]>;
    private _responseData: Response;
    private _acknowledgementAllowed: boolean;
    message: Message = {display: false, text: undefined, color: undefined};

    modalRef: NgbModalRef;

    public displayDeleteResult = false;

    constructor(private element: ElementRef,
                private businessconfigService: ProcessesService,
                private handlebars: HandlebarsService,
                private sanitizer: DomSanitizer,
                private store: Store<AppState>,
                private cardService: CardService,
                private _appService: AppService,
                private userService: UserService,
                private entitiesService: EntitiesService,
                private modalService: NgbModal,
                private configService: ConfigService,
                private router: Router) {
        this.store.select(selectAuthenticationState).subscribe(authState => {
            this._userContext = new UserContext(
                authState.identifier,
                authState.token,
                authState.firstName,
                authState.lastName
            );
        });
        this.reloadTemplateWhenGlobalStyleChange();
    }

    open(content) {
        this.modalRef = this.modalService.open(content);
    }

    // -------------------------- [OC-980] -------------------------- //
    adaptTemplateSize() {
        const cardTemplate = document.getElementById('div-card-template');
        if (!!cardTemplate) {
            const diffWindow = cardTemplate.getBoundingClientRect();
            const divMsg = document.getElementById('div-detail-msg');
            const divBtn = document.getElementById('div-detail-btn');

            let cardTemplateHeight = window.innerHeight - diffWindow.top;
            if (divMsg) {
                cardTemplateHeight -= divMsg.scrollHeight + 35;
            }
            if (divBtn) {
                cardTemplateHeight -= divBtn.scrollHeight + 50;
            }

            cardTemplate.style.maxHeight = `${cardTemplateHeight}px`;
            cardTemplate.style.overflowX = 'hidden';
        }
    }

    ngAfterViewChecked() {
        this.adaptTemplateSize();
        window.onresize = this.adaptTemplateSize;
        window.onload = this.adaptTemplateSize;
    }

    // -------------------------------------------------------------- //

    ngOnInit() {

        if (this._appService.pageType === PageType.FEED) {

            this.setEntitiesToRespond();

            this._lastCards$ = this.store.select(selectLastCards);

            this._lastCards$
                .pipe(
                    takeUntil(this.unsubscribe$),
                    map(lastCards =>
                        lastCards.filter(card =>
                            card.parentCardId === this.card.id &&
                            !this.childCards.map(childCard => childCard.uid).includes(card.uid))
                    ),
                    map(childCards => childCards.map(c => this.cardService.loadCard(c.id)))
                )
                .subscribe(childCardsObs => {
                    zip(...childCardsObs)
                        .pipe(takeUntil(this.unsubscribe$), map(cards => cards.map(cardData => cardData.card)))
                        .subscribe(newChildCards => {

                            const reducer = (accumulator, currentValue) => {
                                accumulator[currentValue.id] = currentValue;
                                return accumulator;
                            };

                            this.childCards = Object.values({
                                ...this.childCards.reduce(reducer, {}),
                                ...newChildCards.reduce(reducer, {}),
                            });

                            templateGateway.childCards = this.childCards;
                            this.setEntitiesToRespond();
                            templateGateway.applyChildCards();
                        });
                });
        }
        this.markAsReadIfNecessary();
    }

    ngDoCheck() {
        this.checkLttdExpired();
    }

    checkLttdExpired(): void {
        this.lttdExpiredIsTrue = (this.card.lttd != null && Math.floor((this.card.lttd - new Date().getTime()) / 1000) <= 0);
    }

    get i18nPrefix() {
        return `${this.card.process}.${this.card.processVersion}.`;
    }

    get isButtonsActivated() {
        return !((this._appService.pageType === PageType.ARCHIVE) || (this._appService.pageType === PageType.CALENDAR));
    }


    get responseDataParameters(): Map<string> {
        return this._responseData.btnText ? this._responseData.btnText.parameters : undefined;
    }

    get btnColor(): string {
        return this.businessconfigService.getResponseBtnColorEnumValue(this._responseData.btnColor);
    }

    get btnText(): string {
        return this._responseData.btnText ?
            this.i18nPrefix + this._responseData.btnText.key : ResponseI18nKeys.BUTTON_TITLE;
    }

    get responseDataExists(): boolean {
        return this._responseData != null && this._responseData !== undefined;
    }

    get btnAckText(): string {
        return this.card.hasBeenAcknowledged ? AckI18nKeys.BUTTON_TEXT_UNACK : AckI18nKeys.BUTTON_TEXT_ACK;
    }

    get btnAckColor(): string {
        return this.card.hasBeenAcknowledged ? AckButtonColors.DANGER : AckButtonColors.PRIMARY;
    }

    get isAcknowledgementAllowed(): boolean {
        return this._acknowledgementAllowed ? this._acknowledgementAllowed : false;
    }

    submitResponse() {

        const formResult: FormResult = templateGateway.validyForm();

        if (formResult.valid) {

            const card: CardForPublishing = {
                publisher: this.user.entities[0],
                publisherType: 'ENTITY',
                processVersion: this.card.processVersion,
                process: this.card.process,
                processInstanceId: `${this.card.processInstanceId}_${this.user.entities[0]}`,
                state: this._responseData.state,
                startDate: this.card.startDate,
                endDate: this.card.endDate,
                severity: Severity.INFORMATION,
                entityRecipients: this.card.entityRecipients,
                userRecipients: this.card.userRecipients,
                groupRecipients: this.card.groupRecipients,
                externalRecipients: this._responseData.externalRecipients,
                title: this.card.title,
                summary: this.card.summary,
                data: formResult.formData,
                recipient: this.card.recipient,
                parentCardId: this.card.id,
                initialParentCardUid: this.card.uid
            };

            this.cardService.postCard(card)
                .pipe(takeUntil(this.unsubscribe$))
                .subscribe(
                    rep => {
                        if (rep['count'] === 0 && rep['message'].includes('Error')) {
                            this.displayMessage(ResponseI18nKeys.SUBMIT_ERROR_MSG);
                            console.error(rep);

                        } else {
                            console.log(rep);
                            this.displayMessage(ResponseI18nKeys.SUBMIT_SUCCESS_MSG, ResponseMsgColor.GREEN);
                        }
                    },
                    err => {
                        this.displayMessage(ResponseI18nKeys.SUBMIT_ERROR_MSG);
                        console.error(err);
                    }
                );

        } else {
            (formResult.errorMsg && formResult.errorMsg !== '') ?
                this.displayMessage(formResult.errorMsg) :
                this.displayMessage(ResponseI18nKeys.FORM_ERROR_MSG);
        }
    }

    private displayMessage(text: string, color: ResponseMsgColor = ResponseMsgColor.RED) {
        this.message = {
            text: text,
            color: color,
            display: true
        };
    }

    acknowledge() {
        if (this.card.hasBeenAcknowledged) {
            this.cardService.deleteUserAcknowledgement(this.card.uid).subscribe(resp => {
                if (resp.status === 200 || resp.status === 204) {
                    this.card = {...this.card, hasBeenAcknowledged: false};
                    this.updateAcknowledgementOnLightCard(false);
                } else {
                    console.error('the remote acknowledgement endpoint returned an error status(%d)', resp.status);
                    this.displayMessage(AckI18nKeys.ERROR_MSG);
                }
            });
        } else {
            this.cardService.postUserAcknowledgement(this.card.uid).subscribe(resp => {
                if (resp.status === 201 || resp.status === 200) {
                    this.updateAcknowledgementOnLightCard(true);
                    this.closeDetails();
                } else {
                    console.error('the remote acknowledgement endpoint returned an error status(%d)', resp.status);
                    this.displayMessage(AckI18nKeys.ERROR_MSG);
                }
            });
        }
    }

    updateAcknowledgementOnLightCard(hasBeenAcknowledged: boolean) {
        this.store.select(fetchLightCard(this.card.id)).pipe(take(1))
            .subscribe((lightCard: LightCard) => {
                const updatedLighCard = {...lightCard, hasBeenAcknowledged: hasBeenAcknowledged};
                this.store.dispatch(new UpdateALightCard({card: updatedLighCard}));
            });
    }

    markAsReadIfNecessary() {
        if (this.card.hasBeenRead === false) {
            this.cardService.postUserCardRead(this.card.uid).subscribe(resp => {
                if (resp.status === 201 || resp.status === 200) {
                    this.updateReadOnLightCard(true);
                }
            });
        }
    }

    updateReadOnLightCard(hasBeenRead: boolean) {
        this.store.select(fetchLightCard(this.card.id)).pipe(take(1))
            .subscribe((lightCard: LightCard) => {
                const updatedLighCard = {...lightCard, hasBeenRead: hasBeenRead};
                this.store.dispatch(new UpdateALightCard({card: updatedLighCard}));
            });
    }

    closeDetails() {
        this._appService.closeDetails(this.currentPath);
    }

    // for certain types of template , we need to reload it to take into account
    // the new css style (for example with chart done with chart.js)
    private reloadTemplateWhenGlobalStyleChange() {
        this.store.select(selectGlobalStyleState)
            .pipe(takeUntil(this.unsubscribe$), skip(1))
            .subscribe(style => this.initializeHandlebarsTemplates());
    }

    ngOnChanges(): void {
        this.initializeHrefsOfCssLink();
        this.initializeHandlebarsTemplates();
        this.markAsReadIfNecessary();
        this.setIsDeleteOrEditCardAllowed();
        this.message = {display: false, text: undefined, color: undefined};
        if (this._responseData != null && this._responseData !== undefined) {
            this.setEntitiesToRespond();
            this.setIsActionEnabled();
        }

    }

    private setEntitiesToRespond() {
        this._listEntitiesToRespond = new Array<EntityMessage>();
        if (this.card.entitiesAllowedToRespond) {
            this.card.entitiesAllowedToRespond.forEach(entity => {
                const entityName = this.getEntityName(entity);
                if (entityName) {
                    this._listEntitiesToRespond.push(
                        {
                            name: entityName.name,
                            color: this.checkEntityAnswered(entity) ? EntityMsgColor.GREEN : EntityMsgColor.ORANGE
                        });
                }
            });
        }
    }

    private setIsActionEnabled() {
        const checkPerimeterForResponseCard = this.configService.getConfigValue('checkPerimeterForResponseCard');

        if (checkPerimeterForResponseCard === false)
            this.isActionEnabled = this.isUserInEntityAllowedToRespond();
        else
            this.isActionEnabled = (this.isUserInEntityAllowedToRespond() && this.doesTheUserHavePermissionToRespond());
    }

    private setIsDeleteOrEditCardAllowed() {
        this.isDeleteOrEditCardAllowed = this.doesTheUserHavePermissionToDeleteOrEditCard();
    }





    private isUserInEntityAllowedToRespond(): boolean {
        if (this.card.entitiesAllowedToRespond) return this.card.entitiesAllowedToRespond.includes(this.user.entities[0]);
        else return false;
    }


    private doesTheUserHavePermissionToRespond(): boolean {
        let permission = false;
        this.userService.getCurrentUserWithPerimeters().computedPerimeters.forEach(perim => {
            if ((perim.process === this.card.process) && (perim.state === this._responseData.state)
                && (this.compareRightAction(perim.rights, RightsEnum.Write)
                    || this.compareRightAction(perim.rights, RightsEnum.ReceiveAndWrite))) {
                permission = true;
                return true;
            }
        });
        return permission;
    }

    /* 1st check : card.publisherType == ENTITY
       2nd check : the card has been sent by an entity of the user connected
       3rd check : the user has the Write access to the process/state of the card */
    private doesTheUserHavePermissionToDeleteOrEditCard(): boolean {
        let permission = false;
        const userWithPerimeters = this.userService.getCurrentUserWithPerimeters();

        if ((this.card.publisherType === 'ENTITY') && (userWithPerimeters.userData.entities.includes(this.card.publisher))) {
            userWithPerimeters.computedPerimeters.forEach(perim => {
                if ((perim.process === this.card.process) &&
                    (perim.state === this.card.state)
                    && (this.compareRightAction(perim.rights, RightsEnum.Write)
                        || this.compareRightAction(perim.rights, RightsEnum.ReceiveAndWrite))) {
                    permission = true;
                    return true;
                }
            });
        }
        return permission;
    }

    private compareRightAction(userRights: RightsEnum, rightsAction: RightsEnum): boolean {
        return (userRight(userRights) - userRight(rightsAction)) === 0;
    }

    get listEntitiesToRespond() {
        return this._listEntitiesToRespond;
    }

    getEntityName(id: string): Entity {
        return this.entitiesService.getEntities().find(entity => entity.id === id);
    }

    checkEntityAnswered(entity: string): boolean {
        return this.childCards.some(childCard => childCard.publisher === entity);
    }

    private initializeHrefsOfCssLink() {
        const styles = this.cardState.details[0].styles;
        this.hrefsOfCssLink = new Array<SafeResourceUrl>();
        if (!!styles) {
            const process = this.card.process;
            const processVersion = this.card.processVersion;
            styles.forEach(style => {
                const cssUrl = this.businessconfigService.computeBusinessconfigCssUrl(process, style, processVersion);
                // needed to instantiate href of link for css in component rendering
                const safeCssUrl = this.sanitizer.bypassSecurityTrustResourceUrl(cssUrl);
                this.hrefsOfCssLink.push(safeCssUrl);
            });
        }
    }



    private initializeHandlebarsTemplates() {

        templateGateway.childCards = this.childCards;
        this._responseData = this.cardState.response;
        this._acknowledgementAllowed = this.cardState.acknowledgementAllowed;
        const templateName = this.cardState.details[0].templateName;
        if (!!templateName) {
            this.handlebars.executeTemplate(templateName,
                new DetailContext(this.card, this._userContext, this._responseData))
                .subscribe(
                    html => {
                        this._htmlContent = this.sanitizer.bypassSecurityTrustHtml(html);
                        setTimeout(() => { // wait for DOM rendering
                            this.reinsertScripts();
                        }, 10);
                    }, () => {
                        console.log('WARNING impossible to load template ', templateName);
                        this._htmlContent = this.sanitizer.bypassSecurityTrustHtml('');
                    }
                );
        } else console.log('WARNING No template for state ', this.card.state);
    }

    get htmlContent() {
        return this._htmlContent;
    }

    reinsertScripts(): void {
        const scripts = <HTMLScriptElement[]>this.element.nativeElement.getElementsByTagName('script');
        const scriptsInitialLength = scripts.length;
        for (let i = 0; i < scriptsInitialLength; i++) {
            const script = scripts[i];
            const scriptCopy = document.createElement('script');
            scriptCopy.type = script.type ? script.type : 'text/javascript';
            if (script.innerHTML) {
                scriptCopy.innerHTML = script.innerHTML;
            }
            scriptCopy.async = false;
            script.parentNode.replaceChild(scriptCopy, script);
        }
    }

    confirmDeleteCard(): void {
        this.cardService.deleteCard(this.card)
            .subscribe(
                resp => {
                    const status = resp.status;

                    this.modalRef.close();
                    if (status === 200) {
                        this.closeDetails();
                        this.open(this.cardDeletedWithNoErrorPopupRef);
                    } else {
                        console.log('Impossible to delete card , error status from service : ', status);
                        this.open(this.impossibleToDeleteCardPopupRef);
                    }
                },
                err => {
                    console.error('Error when deleting card :', err);
                    this.modalRef.close();
                    this.open(this.impossibleToDeleteCardPopupRef);
                }
            );
    }

    declineDeleteCard(): void {
        this.modalRef.dismiss();
    }

    editCard(): void {
        this.router.navigate(['/usercard', this.card.id]);
    }

    ngOnDestroy() {
        templateGateway.childCards = [];
        this.unsubscribe$.next();
        this.unsubscribe$.complete();
    }

    areActionsDisplayed(): boolean {
        const currentPageType = this._appService.pageType;
        return currentPageType !== PageType.MONITORING && currentPageType !== PageType.CALENDAR;
    }
}
