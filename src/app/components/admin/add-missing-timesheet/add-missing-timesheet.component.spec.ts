import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { AddMissingTimesheetComponent } from './add-missing-timesheet.component';

describe('AddMissingTimesheetComponent', () => {
  let component: AddMissingTimesheetComponent;
  let fixture: ComponentFixture<AddMissingTimesheetComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ AddMissingTimesheetComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AddMissingTimesheetComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
