/* Copyright (c) 2020, RTE (http://www.rte-france.com)
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */


import {async, ComponentFixture, getTestBed, TestBed} from '@angular/core/testing';


import {CardComponent} from './card.component';
import {getOneRandomLightCard, getRandomAlphanumericValue} from '@tests/helpers';
import {RouterTestingModule} from '@angular/router/testing';
import {TranslateLoader, TranslateModule, TranslateService} from '@ngx-translate/core';
import {Store, StoreModule} from '@ngrx/store';
import {appReducer, AppState} from '@ofStore/index';
import {HttpClientTestingModule} from '@angular/common/http/testing';
import {ThirdsI18nLoaderFactory, ThirdsService} from '@ofServices/thirds.service';
import {ServicesModule} from '@ofServices/services.module';
import {Router} from '@angular/router';
import 'moment/locale/fr';
import {TimeService} from '@ofServices/time.service';
import {I18nService} from '@ofServices/i18n.service';
import {ActionComponent} from '../action/action.component';
import {NgbModule} from '@ng-bootstrap/ng-bootstrap';
import SpyObj = jasmine.SpyObj;
import createSpyObj = jasmine.createSpyObj;
import { AddActionsAppear } from '@ofStore/actions/card.actions';

describe('CardComponent', () => {
    let lightCardDetailsComp: CardComponent;
    let fixture: ComponentFixture<CardComponent>;
    let store: Store<AppState>;
    let router: SpyObj<Router>;
    let injector: TestBed;
    let translateService: TranslateService;
    let i18nService: I18nService;

    beforeEach(async(() => {
        const routerSpy = createSpyObj('Router', ['navigate']);
        TestBed.configureTestingModule({
            imports: [
                HttpClientTestingModule,
                ServicesModule,
                StoreModule.forRoot(appReducer),
                RouterTestingModule,
                HttpClientTestingModule,
                TranslateModule.forRoot({
                    loader: {
                        provide: TranslateLoader,
                        useFactory: ThirdsI18nLoaderFactory,
                        deps: [ThirdsService]
                    },
                    useDefaultLang: false
                }),
                NgbModule
            ],
            declarations: [CardComponent, ActionComponent],
            providers: [
                {provide: store, useClass: Store},
                {provide: Router, useValue: routerSpy},
                ThirdsService,
                {provide: 'TimeEventSource', useValue: null},
                TimeService, I18nService
            ]}).compileComponents();
        store = TestBed.get(Store);
        spyOn(store, 'dispatch').and.callThrough();
        // avoid exceptions during construction and init of the component
        injector = getTestBed();
        translateService = injector.get(TranslateService);
        translateService.addLangs(['en', 'fr']);
        translateService.setDefaultLang('en');
        // translateService.use("en");
        i18nService = injector.get(I18nService);
        i18nService.changeLocale('en', 'Europe/Paris');

    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(CardComponent);
        lightCardDetailsComp = fixture.debugElement.componentInstance;
        router = TestBed.get(Router);
    });
    it('should create and display minimal light card information', () => {
        const lightCard = getOneRandomLightCard();
        // extract expected data
        const id = lightCard.id;
        const uid = lightCard.uid;
        const title = lightCard.title.key;
        const summaryValue = lightCard.summary.key;
        const publisher = lightCard.publisher;
        const version = lightCard.publisherVersion;

        lightCardDetailsComp.lightCard = lightCard;

        fixture.detectChanges();

        expect(fixture.nativeElement.querySelector('.card-title').innerText).toEqual(publisher + '.' + version + '.' + title);
        expect(fixture.nativeElement.querySelector('.card-body > p')).toBeFalsy();
    });
    it('should select card', () => {
        const lightCard = getOneRandomLightCard();

        router.navigate.and.callThrough();

        lightCardDetailsComp.lightCard = lightCard;
        lightCardDetailsComp.ngOnInit();
        fixture.detectChanges();

        expect(lightCardDetailsComp.open).toBeFalsy();
        lightCardDetailsComp.select();
        expect(router.navigate).toHaveBeenCalledWith(['/' + lightCardDetailsComp.currentPath, 'cards', lightCard.id]);
    });
    it('should select card and set the appear array', () => {
        const lightCard = getOneRandomLightCard();
        lightCardDetailsComp.lightCard = lightCard;
        lightCardDetailsComp.ngOnInit();
        fixture.detectChanges();

        expect(lightCardDetailsComp.open).toBeFalsy();
        lightCardDetailsComp.select();
        expect(store.dispatch).toHaveBeenCalled();
        expect(store.dispatch).toHaveBeenCalledWith(new AddActionsAppear(lightCard.id));
    });

    it('should handle non existent timestamp with an empty string', () => {
        const expectedEmptyString = lightCardDetailsComp.handleDate(undefined);
        expect(expectedEmptyString).toEqual('');
    });

    it( 'should handle timestamp in English', () => {
        i18nService.changeLocale('en', 'Europe/Paris');
        const timeStampFor5June2019at10AM = 1559721600000;
        const FiveJune2019at10AMDateString = lightCardDetailsComp.handleDate(timeStampFor5June2019at10AM);
        expect(FiveJune2019at10AMDateString).toEqual('06/05/2019 10:00 AM');
        });

    it( 'should handle timestamp in French', () => {
        i18nService.changeLocale('fr', 'Europe/Paris');
        const timeStampFor5June2019at10AM = 1559721600000;
        const FiveJune2019at10AMDateString = lightCardDetailsComp.handleDate(timeStampFor5June2019at10AM);
        expect(FiveJune2019at10AMDateString).toEqual('05/06/2019 10:00');
        });

    it('should return an empty string if NONE is configured', () => {
        const lightCard = getOneRandomLightCard();
        const expectedEmptyDisplayedDate = lightCardDetailsComp.computeDisplayedDates('NONE', lightCard);
        expect(expectedEmptyDisplayedDate).toEqual('');
        });
    it('should return interval if BUSINESS is configured', () => {
        const lightCard = getOneRandomLightCard();
        const expectedBuisnessInterval = lightCardDetailsComp.computeDisplayedDates('BUSINESS', lightCard);
        verifyCorrectInterval(expectedBuisnessInterval);
    });

    function verifyCorrectInterval(testedString: string) {
        const minimalLengthOfDisplayDateWithStartAndEndDateInEnglishLocale = 39;
        const maximalLengthOfDisplayDateWithStartAndEndDateInEnglishLocale = 41;
        verifyCorrectString(testedString, minimalLengthOfDisplayDateWithStartAndEndDateInEnglishLocale
            , maximalLengthOfDisplayDateWithStartAndEndDateInEnglishLocale);
    }

    function verifyCorrectString(testedString: string, min: number, max: number) {
        expect(testedString).toBeTruthy();
        const testedLength = testedString.length;
        expect(testedLength).toBeGreaterThanOrEqual(min);
        expect(testedLength).toBeLessThanOrEqual(max);
    }

    it('should return interval if there is no configuration', () => {
        const lightCard = getOneRandomLightCard();
        const expectedBusinessInterVal = lightCardDetailsComp.computeDisplayedDates(undefined, lightCard);
        verifyCorrectInterval(expectedBusinessInterVal);
    });

    it('should return interval with unexpected configuration', () => {
        const lightCard = getOneRandomLightCard();
        const expectedBusinessInterVal = lightCardDetailsComp.computeDisplayedDates(getRandomAlphanumericValue(12), lightCard);
        verifyCorrectInterval(expectedBusinessInterVal);
    });

    it( 'should return a single date with LTTD configuration', () => {
       const expectDate = lightCardDetailsComp.computeDisplayedDates('LTTD', getOneRandomLightCard());
       verifyCorrectString(expectDate, 18, 20);
    });

    it( 'should return a single date with BUSINESS_START configuration', () => {
        const expectDate = lightCardDetailsComp.computeDisplayedDates('BUSINESS_START', getOneRandomLightCard());
        verifyCorrectString(expectDate, 18, 20);
    });

    it( 'should return a single date with PUBLICATION configuration', () => {
        const expectDate = lightCardDetailsComp.computeDisplayedDates('PUBLICATION', getOneRandomLightCard());
        verifyCorrectString(expectDate, 18, 20);
    });

});
