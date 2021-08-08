import { Component, OnInit, Input, HostBinding, ViewChild, ChangeDetectorRef } from '@angular/core';
import { AdminService } from 'src/app/services/admin.service';
import { AuthenticationService } from 'src/app/services/authentication.service';
import { TimesheetService } from 'src/app/services/timesheet.service';
import { MatPaginator, MatTableDataSource, MatSort, Sort, MatSelect, MatOption, MatSnackBar } from '@angular/material';
import { ExcelDownloadService } from 'src/app/services/excel-download.service';
import { ActivatedRoute, Router, NavigationExtras } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDatepickerInputEvent } from '@angular/material/datepicker';
import { ApplicationStateService } from 'src/app/application-state.service';
import { MomentDateAdapter, MAT_MOMENT_DATE_ADAPTER_OPTIONS } from '@angular/material-moment-adapter';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
import * as _moment from 'moment';
import store from 'src/assets/clientConfig'
import { getDateStrFromDateObj, changeDateToLocale, getLocaleTimeFromDate, getWrokedHrsFromSeconds } from '../../../helper/clientCommonFunction'
import { truncateWithEllipsis } from '@amcharts/amcharts4/.internal/core/utils/Utils';
const moment = _moment;
export const MY_FORMATS = {
  parse: {
    dateInput: 'LL',
  },
  display: {
    dateInput: 'DD/MM/YYYY',
    monthYearLabel: 'YYYY',
    dateA11yLabel: 'LL',
    monthYearA11yLabel: 'YYYY',
  },
};

export interface user {
  value: string;
  userid: any

}
export interface emp {
  value: string;
  id: any

}
export interface pro {
  value: string;
  proid: any

}

export interface category {
  value: string;
  catId: any

}
export interface summaryDataTable {
  hours: any;
  percentage: any;
  type: any;
}

export interface summaryProDataTable {
  hours: any;
  project_name: any;
}

export interface detailedDataTable {
  user_name: any;
  net_available_hrs: any;
  billable_hrs: any;
  pre_sales: any;
  qta_dev: any;
  internal_engg: any;
  competency: any;
  non_billable_hrs: any;
  unaccounted_hrs: any;
  billable_utilization: any
}
@Component({
  selector: 'app-admin-reports',
  templateUrl: './admin-reports.component.html',
  styleUrls: ['./admin-reports.component.scss'],
  providers: [
    {
      provide: DateAdapter,
      useClass: MomentDateAdapter,
      deps: [MAT_DATE_LOCALE, MAT_MOMENT_DATE_ADAPTER_OPTIONS]
    },

    { provide: MAT_DATE_FORMATS, useValue: MY_FORMATS },
  ],
})
export class AdminReportsComponent implements OnInit {
  screen: boolean;
  example: any = [];
  @HostBinding('class') classes = 'row';
  @Input() showNav: string;
  @ViewChild('timesheetPaginator') timesheetPaginator: MatPaginator;
  @ViewChild('timesheetSort') timesheetSort: MatSort;
  @ViewChild('detailedPaginator') detailedPaginator: MatPaginator;
  @ViewChild('detailedSort') detailedSort: MatSort;
  @ViewChild('summaryProPaginator') summaryProPaginator: MatPaginator;
  @ViewChild('summaryProSort') summaryProSort: MatSort;
  @ViewChild('allProSelected') private allProSelected: MatOption;
  @ViewChild('allUserSelected') private allUserSelected: MatOption;
  @ViewChild('allCategorySelected') private allCategorySelected: MatOption;
  @ViewChild('allEmpGrpSelected') private allEmpGrpSelected: MatOption;
  userForm: FormGroup;
  proForm: FormGroup;
  categoryForm: FormGroup
  empGrpForm: FormGroup
  Tabledata: any = {
    user_name: '',
    project_name: '',
  };
  selectedProjectName = [];
  selectedUserName = [];
  selectedCategoryName = []
  selectedEmpGrpName = []
  tabledata: MatTableDataSource<any>;
  summarytabledata: MatTableDataSource<summaryDataTable>;
  detailedtabledata: MatTableDataSource<detailedDataTable>;
  summaryProtabledata: MatTableDataSource<summaryProDataTable>;
  displayedSummaryColumns: string[] = ['reportType', 'hours', 'percentOfHours'];
  displayedProSummaryColumns: string[] = ['project_name', 'hours'];
  displayedColumns: string[] = ['user_name', 'project_name', 'entry_date', 'start_time', 'end_time', 'duration'];
  displayedDetailedColumns: string[] = ['user_name', 'workingDaysHours', 'leavesDaysHours', 'net_available_hrs', 'billable_hrs', 'pre_sales', 'qta_dev', 'internal_engg',
    'competency', 'non_billable_hrs', 'billable_utilization', 'unaccounted_hrs'];
  message: string;
  timesheet: any = {
    start_Date: '',
    end_Date: '',
    user_id: '',
    project_id: '',
    category_id: ''
  };
  users: user[] = [];
  pros: pro[] = [];
  projCatgArr: category[] = []
  empGrp: emp[] = []
  tableMsg: any
  proTableMsg: any
  detailedMsg: any
  summaryMsg: any
  showReportsTable: boolean = false
  showSummaryProTable: boolean = false
  showSummaryTable: boolean = false
  showDetailedTable: boolean = false
  onlyProId = []
  onlyuserId = []
  onlyCategoryId = []
  onlyEmpGrpId = []
  roleid = window.sessionStorage.getItem('role');
  UserId = window.sessionStorage.getItem('userid');
  defaultSelectedUser: any
  defaultSelectedPro: any
  startMinDate: any
  startMaxDate: any
  endMinDate: any
  endMaxDate: any
  showChangedDate: any
  selectedEndDate: any
  selectedStartDate: any
  firstWeek: any
  constructor(private excelService: ExcelDownloadService,
    private applicationStateService: ApplicationStateService,
    private timesheetService: TimesheetService, private adminService: AdminService, private authService: AuthenticationService,
    private router: Router,
    private snackBar: MatSnackBar,
    private formBuilder: FormBuilder,
    private changeDetectorRefs: ChangeDetectorRef) { }

  ngOnInit() {
    this.userForm = this.formBuilder.group({
      userType: ['',],
    });
    this.proForm = this.formBuilder.group({
      proType: ['',],
    });
    this.categoryForm = this.formBuilder.group({
      categoryType: ['',],
    });
    this.empGrpForm = this.formBuilder.group({
      empGrpType: ['',],
    });
    this.getTodaysStartingWeek()
    if (this.applicationStateService.getIsMobileResolution()) {
      this.screen = true
    }
    else
      this.screen = false
  }

  changedDetailedData(realData: any) {
    var tempArr: any = [], tempJson: any = {}
    realData.filter((eachBlk: any) => {
      tempJson = {}
      tempJson['User Name'] = eachBlk['user_name']
      tempJson['Working Hours'] = eachBlk['workingDaysHours']
      tempJson['Leaves Hours'] = eachBlk['leavesDaysHours']
      tempJson['Net Available Hours'] = eachBlk['net_available_hrs']
      tempJson['Billable Hours'] = eachBlk['billable_hrs']
      tempJson['Pre Sales'] = eachBlk['pre_sales']
      tempJson['QTA Development'] = eachBlk['qta_dev']
      tempJson['Internal Engg'] = eachBlk['internal_engg']
      tempJson['Competency'] = eachBlk['competency']
      tempJson['Non Billable Hours'] = eachBlk['non_billable_hrs']
      tempJson['Billable Utilization'] = eachBlk['billable_utilization']
      tempJson['Unaccounted Hours'] = eachBlk['unaccounted_hrs']
      tempArr.push(tempJson)
    })
    return tempArr
  }

  changedSummayProData(realData: any) {
    var tempArr: any = [], tempJson: any = {}
    realData.filter((eachBlk: any) => {
      tempJson = {}
      tempJson['Project Name'] = eachBlk['project_name']
      tempJson['Total Hours'] = eachBlk['hours']
      tempArr.push(tempJson)
    })
    return tempArr
  }

  changedTSData(realData: any) {
    var tempArr: any = [], tempJson: any = {}
    realData.filter((eachBlk: any) => {
      tempJson = {}
      tempJson['User Name'] = eachBlk['user_name']
      tempJson['Project Name'] = eachBlk['project_name']
      tempJson['Entry Date'] = getDateStrFromDateObj(eachBlk['entry_date'])
      tempJson['Start Time'] = getLocaleTimeFromDate(eachBlk['start_time'])
      tempJson['End Time'] = getLocaleTimeFromDate(eachBlk['end_time'])
      tempJson['Worked For'] = getWrokedHrsFromSeconds(eachBlk['workedHrs'])
      tempJson['Description'] = eachBlk['description']

      tempArr.push(tempJson)
    })
    return tempArr
  }

  changedSummaryData(realData: any) {
    var tempArr: any = [], tempJson: any = {}
    realData.filter((eachBlk: any) => {
      tempJson = {}
      tempJson['Work Type'] = eachBlk['type']
      tempJson['Total Hours'] = eachBlk['hours']
      tempJson['Percentage'] = (eachBlk['percent'])

      tempArr.push(tempJson)
    })
    return tempArr
  }

  exportAsXLSX(): void {
    if (this.showReportsTable)
      this.excelService.exportAsExcelFile(this.changedTSData(this.tabledata.data), 'Timesheet Report');
  }

  SummaryReportExcel() {
    this.excelService.exportAsExcelFile(this.changedSummaryData(this.summarytabledata.data), 'Summary Report');
  }

  detailedReportExcel() {
    this.excelService.exportAsExcelFile(this.changedDetailedData(this.detailedtabledata.data), 'Detailed Report');
  }

  summaryProReportExcel() {
    if (this.showSummaryProTable)
      this.excelService.exportAsExcelFile(this.changedSummayProData(this.summaryProtabledata.data), 'Project Effort Report');
  }

  getEmpGroup() {
    this.empGrp = store.empGrpList
    var list = store.empGrpList
    this.selectedEmpGrpName.push(0)
    list.filter((ele: any, idx: any) => {
      var ids = parseInt(ele['id'])
      this.onlyEmpGrpId.push(ids)
      this.selectedEmpGrpName.push(ids)
    })
    this.getusers("all")
  }

  getusers(action) {
    var temp
    if (action == "all")
      temp = this.onlyEmpGrpId
    else {
      if (this.selectedEmpGrpName.length == 0) {
        this.users = []
        this.selectedUserName = []
        this.onlyuserId = []
        return
      }
      else {
        temp = this.selectedEmpGrpName
        var index = temp.indexOf(0);
        if (index > -1) {
          temp.splice(index, 1);
        }
      }
    }
    var jsonObj: any = {}
    jsonObj['grpList'] = temp
    this.adminService.getEmpGrpUsers(jsonObj).subscribe(
      res => {
        if (action == "all")
          this.getProjects();
        if (res['statusCode'] == "200") {
          res = res['data']
          var keys = Object.keys(res);
          var len = keys.length;
          this.users = []
          this.selectedUserName = []
          this.onlyuserId = []
          this.selectedUserName.push(0)
          for (var i = 0; i < len; i++) {
            this.users.push({ value: res[i]['user_name'], userid: res[i]['user_id'] })
            this.onlyuserId.push(res[i]['user_id'])
            this.selectedUserName.push(res[i]['user_id'])
          }
          this.timesheet.user_id = this.onlyuserId
        }
        if (res['statusCode'] == "401") {
          localStorage.clear();
          this.router.navigate(['/login']);
        }
      },
      err => console.error(err)
    );
    return
  }

  getProjects() {
    var jsonObj: any = {}
    jsonObj["user_id"] = this.UserId
    jsonObj["action"] = "report"
    this.authService.getAllProjForReportOrPlanning(jsonObj).subscribe(
      (res: any) => {
        this.getProjectCategory()
        if (res['statusCode'] == "200") {
          res = res['data']
          var len = res.length;
          this.selectedProjectName.push(0)
          for (var i = 0; i < len; i++) {
            if (res[i]['project_code'].split("-")[0] == 'p') {
              this.pros.push({ value: res[i]['project_name'] + "_" + res[i]['project_code_old'], proid: res[i]['id'] })
            }
            else {
              this.pros.push({ value: res[i]['project_name'] + "_" + res[i]['project_code'], proid: res[i]['id'] })
            }
            this.onlyProId.push(res[i]['id'])
            this.selectedProjectName.push(res[i]['id'])
          }
          this.timesheet.project_id = this.onlyProId
        }
        if (res['statusCode'] == "401") {
          localStorage.clear();
          this.router.navigate(['/login']);
        }
      },
      (err: any) => {
        console.error("Error while getProjects ", err)
      }
    )
  }

  getProjectCategory() {
    this.adminService.getAllProjCatg().subscribe(
      res => {
        this.getSummaryTableData()
        if (res['statusCode'] == "200") {
          res = res['data']
          var len = Object.keys(res).length
          for (var i = 0; i < len; i++) {
            this.projCatgArr.push({ catId: res[i]['cat_id'], value: res[i]['p_catg'] })
            this.onlyCategoryId.push(res[i]['cat_id'])
            if (res[i]['p_catg'] == "Billable")
              this.selectedCategoryName.push(this.projCatgArr[i]['catId'])
          }
          this.timesheet.category_id = this.onlyCategoryId
        }
        if (res['statusCode'] == "401") {
          localStorage.clear();
          this.router.navigate(['/login']);
        }
      },
      err => console.error(err)
    );
  }

  selectEmpGrp(selectEmployeeGroup) {
    if (this.allEmpGrpSelected.selected) {
      this.allEmpGrpSelected.deselect();
    }
    if (this.empGrpForm.controls.empGrpType.value.length == this.empGrp.length) {
      this.allEmpGrpSelected.select();
    }
    this.getusers("one")
    return
  }

  checkData(JsonObj) {
    var tempMsg
    var pass = false
    if (JsonObj['user_id'] == 1) {
      if (this.onlyuserId.length == 0 || this.selectedUserName.length == 0) {
        if (this.onlyuserId.length == 0) {
          tempMsg = " No Users Available!"
        }
        if (this.selectedUserName.length == 0) {
          tempMsg = " Please Select a User!"
        }
        pass = true
      }
    }
    if (JsonObj['project_id'] == 1) {
      if (this.onlyProId.length == 0) {
        this.openSnackBar(" No Projects Available!", 5000)
        this.showReportsTable = false
        return false
      }
      if (this.selectedProjectName.length == 0) {
        this.openSnackBar(" Please Select a Project!", 2000)
        this.tableMsg = "Please Select a  Project!"
        this.showReportsTable = false
        return false
      }
      else {
        this.tableMsg = ""
        this.showReportsTable = true
      }
    }
    if (JsonObj['category_id'] == 1) {
      if (this.onlyCategoryId.length == 0) {
        this.openSnackBar(" No Projects Available!", 5000)
        this.showSummaryProTable = false
        return false
      }
      if (this.selectedCategoryName.length == 0) {
        this.openSnackBar("Please Select a Category!", 2000)
        this.proTableMsg = "Please Select a Category!"
        this.showSummaryProTable = false
        return false
      }
      else {
        this.proTableMsg = ""
        this.showSummaryProTable = true
      }
    }
    if (JsonObj['date'] == 1) {
      tempMsg = "Please check the Dates!"
      pass = true
    }
    if (pass) {
      this.openSnackBar(tempMsg, 2000)
      this.showSummaryTable = false
      this.showSummaryProTable = false
      this.showDetailedTable = false
      this.showReportsTable = false
      this.summaryMsg = tempMsg
      this.proTableMsg = tempMsg
      this.tableMsg = tempMsg
      this.detailedMsg = tempMsg
      return false
    }
    return true
  }

  getSummaryTableData() {
    var jsonObj = {}
    jsonObj['start_date'] = this.timesheet.start_Date
    jsonObj['end_date'] = this.timesheet.end_Date
    jsonObj['user_id'] = this.timesheet.user_id
    var checkJson = this.changeCheckJson("summary")
    if (this.checkData(checkJson)) {
      this.summarytabledata = new MatTableDataSource();
      this.adminService.getAdminSummaryReport(jsonObj).subscribe(
        res => {
          this.getSummaryProTable(jsonObj, "all")
          if (res['statusCode'] == "200") {
            this.showSummaryTable = true
            this.summaryMsg = ''
            res = res['data']
            this.summarytabledata = new MatTableDataSource(res as {
              type: '',
              hours: '',
              percentage: '',
            }[]);
          }
          if (res['status'] == "500") {
            this.showSummaryTable = false
            this.summaryMsg = 'No Data Available!'
            this.openSnackBar("Error Occured while getting Summary Table Data!", 5000)
            this.getSummaryProTable(jsonObj, "all")
          }
        },
        err => console.error(err)
      );
    }
  }

  getSummaryProTable(jsonObj, action) {
    var json = jsonObj
    var index1 = this.selectedCategoryName.indexOf(0);
    if (index1 > -1) {
      this.selectedCategoryName.splice(index1, 1);
    }
    json['p_catg_id'] = this.selectedCategoryName
    var checkJson = this.changeCheckJson("summaryPro")
    if (this.checkData(checkJson)) {
      this.summaryProtabledata = new MatTableDataSource()
      this.adminService.getAdminSummaryProjectReport(json).subscribe(
        res => {
          if (action == "all")
            this.getDetailedTableData(jsonObj);
          if (res['statusCode'] == "200") {
            if (res == undefined || Object.keys(res['data']).length == 0) {
              this.proTableMsg = "No Data Available"
              this.showSummaryProTable = false
              return;
            }
            res = res['data']
            for (var i = 0; i < Object.keys(res).length; i++) {
              var str = res[i]['project_code']
              if (str.startsWith("p-")) {
                res[i]['project_code'] = res[i]['project_code_old']
              }
            }
            this.showSummaryProTable = true
            this.proTableMsg = ""
            this.summaryProtabledata = new MatTableDataSource(res as {
              project_name: any,
              hours: any
            }[]);

            if (!this.changeDetectorRefs['destroyed']) {
              this.changeDetectorRefs.detectChanges()
            }
            this.summaryProtabledata.sort = this.summaryProSort;
            const sortState: Sort = { active: 'project_name', direction: 'asc' };
            this.summaryProSort.active = sortState.active;
            this.summaryProSort.direction = sortState.direction;
            this.summaryProSort.sortChange.emit(sortState);
            this.summaryProtabledata.paginator = this.summaryProPaginator;
          }
          if (res['status'] == "500") {
            this.openSnackBar("Error Occured while getting Summary Table Data!", 5000)
            this.getDetailedTableData(jsonObj);
          }
        },
        err => console.error(err)
      );
    }
    else {
      if (action == "all")
        this.getDetailedTableData(jsonObj);
    }
  }

  changeCheckJson(temp) {
    var tempJson = {
      user_id: 0,
      project_id: 0,
      category_id: 0,
      date: 0
    }
    if (temp == "summary" || temp == "detailed") {
      tempJson['user_id'] = 1
      tempJson['project_id'] = 0
      tempJson['category_id'] = 0
      tempJson['date'] = 0
    }
    if (temp == "summaryPro") {
      tempJson['user_id'] = 1
      tempJson['project_id'] = 0
      tempJson['category_id'] = 1
      tempJson['date'] = 0
    }
    if (temp == "tsReport") {
      tempJson['user_id'] = 1
      tempJson['project_id'] = 1
      tempJson['category_id'] = 0
      tempJson['date'] = 0
    }
    if (temp == "date") {
      tempJson['user_id'] = 1
      tempJson['project_id'] = 0
      tempJson['category_id'] = 0
      tempJson['date'] = 1
    }
    return tempJson
  }

  getDetailedTableData(jsonObj) {
    var checkJson = this.changeCheckJson("detailed")
    if (this.checkData(checkJson)) {
      this.detailedtabledata = new MatTableDataSource();
      this.adminService.getAdminDetailedReport(jsonObj).subscribe(
        res => {
          this.getAllData();
          if (res['statusCode'] == "200") {
            res = res['data']
            this.showDetailedTable = true
            this.detailedMsg = ''
            this.detailedtabledata = new MatTableDataSource(res as {
              user_name: any;
              net_available_hrs: any;
              billable_hrs: any;
              pre_sales: any;
              qta_dev: any;
              internal_engg: any;
              competency: any;
              non_billable_hrs: any;
              unaccounted_hrs: any;
              billable_utilization: any
            }[]);
            if (!this.changeDetectorRefs['destroyed']) {
              this.changeDetectorRefs.detectChanges()
            }
            this.detailedtabledata.sort = this.detailedSort;
            const sortState: Sort = { active: 'user_name', direction: 'asc' };
            this.detailedSort.active = sortState.active;
            this.detailedSort.direction = sortState.direction;
            this.detailedSort.sortChange.emit(sortState);
            this.detailedtabledata.paginator = this.detailedPaginator;
          }
          if (res['status'] == "500") {
            this.showDetailedTable = false
            this.detailedMsg = 'No Data Available!'
            this.openSnackBar("Error Occured while getting Summary Table Data!", 5000)
            this.getAllData();
          }
        },
        err => console.error(err)
      );
    }
  }

  selectproid(selectedProject) {
    if (this.allProSelected.selected) {
      this.allProSelected.deselect();
    }
    if (this.proForm.controls.proType.value.length == this.pros.length) {
      this.allProSelected.select();
    }
    this.timesheet.project_id = this.selectedProjectName
    this.getAllData()
    return
  }

  selectuserid(selectUser) {
    if (this.allUserSelected.selected) {
      this.allUserSelected.deselect();
    }
    if (this.userForm.controls.userType.value.length == this.users.length) {
      this.allUserSelected.select();
    }
    this.timesheet.user_id = this.selectedUserName
    return
  }

  selectCategory(selectCat) {
    if (this.allCategorySelected.selected) {
      this.allCategorySelected.deselect();
    }
    if (this.categoryForm.controls.categoryType.value.length == this.projCatgArr.length) {
      this.allCategorySelected.select();
    }
    this.timesheet.user_id = this.selectedUserName

    this.tableMsg = ''
    this.proTableMsg = ''
    var jsonObj = {}
    jsonObj['start_date'] = this.timesheet.start_Date
    jsonObj['end_date'] = this.timesheet.end_Date
    jsonObj['user_id'] = this.timesheet.user_id
    this.getSummaryProTable(jsonObj, "onlyThis")
    return
  }

  openSnackBar(message, dur) {
    this.snackBar.open(message, "Close", {
      duration: dur,
    });
  }

  getTodaysStartingWeek() {
    var dateObj = new Date();
    var dt: any = getDateStrFromDateObj(dateObj)
    var id = dt
    this.timesheetService.getDateRanger(id).subscribe(
      res => {
        if (res['statusCode'] == 200) {
          this.firstWeek = res['data']['thisweekMon']
          this.firstWeek = this.firstWeek.substring(0, 10)
          this.selectedStartDate = this.firstWeek
          this.timesheet.start_Date = this.selectedStartDate
          this.selectedEndDate = res['data']['today']
          this.timesheet.end_Date = res['data']['today']
          this.startMaxDate = res['data']['today']
          this.endMaxDate = res['data']['today']
          this.getEmpGroup()
        }
        if (res['statusCode'] == "401") {
          localStorage.clear();
          this.router.navigate(['/login']);
        }

      },
      err => console.error(err)
    );
    return
  }

  getAllData() {
    var index = this.selectedUserName.indexOf(0);
    if (index > -1) {
      this.selectedUserName.splice(index, 1);
    }
    var index1 = this.selectedProjectName.indexOf(0);
    if (index1 > -1) {
      this.selectedProjectName.splice(index1, 1);
    }
    var jsonObj = {}
    jsonObj['userid'] = this.selectedUserName
    jsonObj['proid'] = this.selectedProjectName
    jsonObj['start_date'] = this.timesheet.start_Date
    jsonObj['end_date'] = this.timesheet.end_Date
    var checkJson = this.changeCheckJson("tsReport")
    if (this.checkData(checkJson)) {
      this.tabledata = new MatTableDataSource()
      this.adminService.getSpecData(jsonObj).subscribe(
        (res: any) => {
          if (res['statusCode'] == "200") {
            if (res == undefined || Object.keys(res['status']).length == 0) {
              this.showReportsTable = false
              this.tableMsg = "No Data Available"
              return;
            }
            this.showReportsTable = true
            this.tableMsg = ''
            res = changeDateToLocale({ "res": res['status'] })
            this.tableMsg = ''
            this.tabledata = new MatTableDataSource(res as {
              user_name: '',
              project_name: '',
              workedHrs: 0
            }[]);
            if (!this.changeDetectorRefs['destroyed']) {
              this.changeDetectorRefs.detectChanges()
            }
            this.tabledata.sort = this.timesheetSort;
            const sortState: Sort = { active: 'entry_date', direction: 'asc' };
            this.timesheetSort.active = sortState.active;
            this.timesheetSort.direction = sortState.direction;
            this.timesheetSort.sortChange.emit(sortState);
            this.tabledata.paginator = this.timesheetPaginator;
          }
          if (res['statusCode'] == "500") {
            this.openSnackBar("Error Occured while getting Table Data!", 5000)
          }
        },
        err => console.error(err)
      );
    }
  }

  changedStartDate(type: string, event: MatDatepickerInputEvent<Date>) {
    this.endMinDate = event.value
    var check = moment(event.value, 'DD/MM/YYYY');
    var day = check.format('DD')
    var month = check.format('MM')
    var year = check.format('YYYY')
    this.timesheet.start_Date = year + "-" + month + "-" + day
  }

  changedEndDate(type: string, event: MatDatepickerInputEvent<Date>) {
    this.startMaxDate = event.value
    var check = moment(event.value, 'DD/MM/YYYY');
    var day = check.format('DD')
    var month = check.format('MM')
    var year = check.format('YYYY')
    this.timesheet.end_Date = year + "-" + month + "-" + day
  }

  changedDate() {
    if (this.timesheet.start_Date > this.timesheet.end_Date) {
      this.openSnackBar("Please check the Dates", 5000)
      var checkJson = this.changeCheckJson("date")
      this.checkData(checkJson)
      return
    }
    this.getSummaryTableData()
    return
  }

  getDuration(res) {
    return this.getDurationString(Math.round(res / 60));
  }

  getDurationString(value) {
    if (value == null) {
      return "00:00"
    }
    var str
    if (value > 9) {
      if (value > 59) {
        var hrs = Math.floor(value / 60)
        value = value % 60

        if (hrs < 10) {
          str = "0" + hrs + ":"
          if (value < 10) {
            str += "0" + value
          }
          else {
            str += value
          }
        }
        else {
          str = hrs + ":"
          if (value < 10) {
            str += "0" + value
          }
          else {
            str += value
          }
        }

      }
      else {
        str = "00:" + value;
      }
    }
    else {
      str = "00:0" + value
    }
    return str
  }

  toggleAllProSelection() {
    if (this.allProSelected.selected) {
      this.proForm.controls.proType
        .patchValue([...this.pros.map(item => item.proid), 0]);
      this.timesheet.project_id = this.onlyProId
      this.getAllData()
      return
    } else {
      this.proForm.controls.proType.patchValue([]);
      var checkJson = this.changeCheckJson("tsReport")
      this.checkData(checkJson)
    }

  }

  toggleAllUserSelection() {
    if (this.allUserSelected.selected) {
      this.userForm.controls.userType
        .patchValue([...this.users.map(item => item.userid), 0]);
      this.timesheet.user_id = this.onlyuserId
      return

    } else {
      this.userForm.controls.userType.patchValue([]);
    }

  }

  toggleAllCategorySelection() {
    if (this.allCategorySelected.selected) {
      this.categoryForm.controls.categoryType
        .patchValue([...this.projCatgArr.map(item => item.catId), 0]);
      var jsonObj = {}
      jsonObj['start_date'] = this.timesheet.start_Date
      jsonObj['end_date'] = this.timesheet.end_Date
      jsonObj['user_id'] = this.timesheet.user_id
      this.getSummaryProTable(jsonObj, "onlyThis")
      return
    } else {
      this.categoryForm.controls.categoryType.patchValue([]);
      var checkJson = this.changeCheckJson("summaryPro")
      this.checkData(checkJson)
    }

  }

  toggleAllEmpGrpSelection() {
    if (this.allEmpGrpSelected.selected) {
      this.empGrpForm.controls.empGrpType
        .patchValue([...this.empGrp.map(item => item.id), 0]);
      this.getusers("one")
      return

    } else {
      this.empGrpForm.controls.empGrpType.patchValue([]);
      this.users = []
      this.selectedUserName = []
      this.onlyuserId = []
    }
  }

  applyDetailedFilter(filterValue: string) {
    this.detailedtabledata.filter = filterValue.trim().toLowerCase();
  }

  applyTimesheetFilter(filterValue: string) {
    this.tabledata.filter = filterValue.trim().toLowerCase();
  }

  applyProCategoryFilter(filterValue: string) {
    this.summaryProtabledata.filter = filterValue.trim().toLowerCase();
  }
}
