import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TsFormComponent } from './ts-form.component';

describe('TsFormComponent', () => {
  let component: TsFormComponent;
  let fixture: ComponentFixture<TsFormComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ TsFormComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TsFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
