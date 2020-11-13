/* Copyright (c) 2018-2020, RTEI (http://www.rte-international.com)
 * See AUTHORS.txt
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 * SPDX-License-Identifier: MPL-2.0
 * This file is part of the OperatorFabric project.
 */

import { Component, OnInit } from '@angular/core';
import {
  NgbModalOptions,
  ModalDismissReasons,
  NgbModal
} from '@ng-bootstrap/ng-bootstrap';
import { Store } from '@ngrx/store';
import { CrudService } from '@ofServices/crud-service';
import { AppState } from '@ofStore/index';
import { buildSettingsOrConfigSelector } from '@ofStore/selectors/settings.x.config.selectors';
import { DataTableShareService } from 'app/modules/admin/services/data.service';
import { Observable, Subject, Subscription } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  // tslint:disable-next-line: component-selector
  selector: 'of-table',
  templateUrl: './oftable.component.html'
})

export class OfTableComponent implements OnInit {

  page = 1;
  itemsPerPage = 5;
  maxSize = 1000;
  numPages = 1;
  length = 0;
  columns: Array<any> = [];
  rows: Array<any> = [];
  data: Array<any> = [];
  firstText: string;
  lastText: string;
  prevText: string;
  nextText: string;
  protected crudService: CrudService;
  protected actions = {
    edit: '<a class="btn btn-primary"><em class="fas fa-pen-square"></em></a>',
    delete: '<a class="btn btn-primary"><em class="far fa-trash-alt"></em></a>'
  };
  config: any = {
    paging: true,
    sorting: { columns: this.columns },
    filtering: { filterString: '' },
    className: ['table-striped', 'table-bordered', 'table-hover', 'table-dark'],
  };
  modalComponent: any;
  addLabel: string;
  lineLabel: string;
  filterAll: any;

  protected modalOptions: NgbModalOptions = {
    backdrop: 'static',
    backdropClass: 'customBackdrop',
  };

  protected closeResult: string;
  private destroy$: Subject<void> = new Subject<void>();

  constructor(
    protected modalService: NgbModal,
    protected dataService: DataTableShareService,
    protected store: Store<AppState>
  ) { }

  typeModal: string;

  ngOnInit() {
    this.crudService.getAll().pipe(takeUntil(this.destroy$)).subscribe((response) => {
      this.data = response;
      // tslint:disable-next-line: no-console
      console.info('All items table was loaded totally and successfully total ' + this.data.length);
      this.onChangeTable(this.config);
      this.subscribeTable();
      /*;*/
    });
  }


  onCellClick(data: any): any {
    const column = data.column;
    if (column === 'edit') {
      const modalRef = this.modalService.open(this.modalComponent);
      modalRef.componentInstance.row = data['row'];
      modalRef.componentInstance.type = this.typeModal;
    }
    if (column === 'delete') {
      this.openDeleteConfirmationDialog(data['row']);
    }
  }

  createNewItem(): void {
    const modalRef = this.modalService.open(this.modalComponent);
    modalRef.componentInstance.type = this.typeModal;
  }

  openDeleteConfirmationDialog(row: any): any { }

  public onChangeTable(config: any, page: any = { page: this.page, itemsPerPage: this.itemsPerPage }): any {
    if (config.filtering) {
      Object.assign(this.config.filtering, config.filtering);
    }

    if (config.sorting) {
      Object.assign(this.config.sorting, config.sorting);
    }

    const filteredData = this.changeFilter(this.data, this.config);
    const sortedData = this.changeSort(filteredData, this.config);
    this.rows = page && config.paging ? this.changePage(page, sortedData) : sortedData;
    this.length = sortedData.length;
  }

  deleteItem(id: string, key: string): Subscription {
    return this.crudService.deleteById(id).pipe(takeUntil(this.destroy$)).subscribe(() => {
      const itemIndex = this.data.findIndex((item) => item[key] === id);
      this.data.splice(itemIndex, 1);
      this.onChangeTable(this.config);
      this.dataService.changeUsers(true);

    });
  }

  getObservableRow(): Observable<any> {
    return null;
  }

  protected subscribeTable(): void {
    //refresh edited row event
    this.getObservableRow().pipe(takeUntil(this.destroy$)).subscribe((row) => {
      if (row) {
        let itemIndex = -1;
        if (row.login) {
          itemIndex = this.data.findIndex((item) => item.login === row.login);
        } else {
          itemIndex = this.data.findIndex((item) => item.id === row.id);
        }

        if (itemIndex >= 0) {
          this.data[itemIndex] = row;
        } else {
          this.data.push(row);
        }
        this.onChangeTable(this.config);
      }
    });
  }

  open(content) {
    this.modalService.open(content, this.modalOptions).result.then(
      (result) => {
        this.closeResult = `Closed with: ${result}`;
      },
      (reason) => {
        this.closeResult = `Dismissed ${this.getDismissReason(reason)}`;
      }
    );
  }

  private getDismissReason(reason: any): string {
    if (reason === ModalDismissReasons.ESC) {
      return 'by pressing ESC';
    } else if (reason === ModalDismissReasons.BACKDROP_CLICK) {
      return 'by clicking on a backdrop';
    } else {
      return `with: ${reason}`;
    }
  }

  public changePage(page: any, data: Array<any> = this.data): Array<any> {
    const start = (page.page - 1) * page.itemsPerPage;
    const end = page.itemsPerPage > -1 ? (start + page.itemsPerPage) : data.length;
    return data.slice(start, end);
  }

  public changeSort(data: any, config: any): any {
    if (!config.sorting) {
      return data;
    }

    const columns = this.config.sorting.columns || [];
    let columnName: string = void 0;
    let sort: string = void 0;

    for (let i = 0; i < columns.length; i++) {
      if (columns[i].sort !== '' && columns[i].sort !== false) {
        columnName = columns[i].name;
        sort = columns[i].sort;
      }
    }

    if (!columnName) {
      return data;
    }

    // simple sorting
    return data.sort((previous: any, current: any) => {
      if (previous[columnName] > current[columnName]) {
        return sort === 'desc' ? -1 : 1;
      } else if (previous[columnName] < current[columnName]) {
        return sort === 'asc' ? -1 : 1;
      }
      return 0;
    });
  }

  public changeFilter(data: any, config: any): any {
    let filteredData: Array<any> = data;
    this.columns.forEach((column: any) => {
      if (column.filtering) {
        filteredData = filteredData.filter((item: any) => {
          if (!item[column.name]) {
            item[column.name] = '';
          }
          return item[column.name]
            .toString()
            .match(column.filtering.filterString);
        });
      }
    });

    if (!config.filtering) {
      return filteredData;
    }

    if (config.filtering.columnName) {
      return filteredData.filter((item: any) =>
        item[config.filtering.columnName].match(
          this.config.filtering.filterString
        )
      );
    }

    const tempArray: Array<any> = [];
    filteredData.forEach((item: any) => {
      let flag = false;
      this.columns.forEach((column: any) => {
        if (column.name === 'edit') {
          item[column.name] = this.actions['edit'];
        }
        if (column.name === 'delete') {
          item[column.name] = this.actions['delete'];
        }
        if (
          item[column.name].toString().match(this.config.filtering.filterString)
        ) {
          flag = true;
        }
      });
      if (flag) {
        tempArray.push(item);
      }
    });

    filteredData = tempArray;

    return filteredData;
  }


  protected getLocale(): Observable<string> {
    return this.store.select(buildSettingsOrConfigSelector('locale'));
  }

}
