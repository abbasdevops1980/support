import { Component, OnInit } from '@angular/core';
import * as XLSX from 'xlsx';
import { ActivatedRoute, Router } from '@angular/router';
import { AdminService } from 'src/app/services/admin.service';
import { AuthenticationService } from 'src/app/services/authentication.service';
import { TimesheetService } from 'src/app/services/timesheet.service';
import { getDateStrFromDateObj } from '../../../helper/clientCommonFunction'
import { MatSnackBar } from '@angular/material';
type AOA = any[][];
export interface pro {
  value: any,
  proid: any
}
@Component({
  selector: 'app-add-missing-timesheet',
  templateUrl: './add-missing-timesheet.component.html',
  styleUrls: ['./add-missing-timesheet.component.scss']
})
export class AddMissingTimesheetComponent implements OnInit {

  data: AOA = [];
  constructor(private adminService: AdminService, private authService: AuthenticationService,
    private snackBar: MatSnackBar, private router: Router, private activatedRoute: ActivatedRoute, ) { }

  willDownload = false;
  pros: pro[] = [
  ];

  userid = window.sessionStorage.getItem('userid');
  ngOnInit() {
  }

  onFileChange(ev) {

    let workBook = null;
    let jsonData = null;
    const reader = new FileReader();
    const file = ev.target.files[0];
    reader.onload = (event) => {
      const data = reader.result;
      workBook = XLSX.read(data, { type: 'binary' });
      jsonData = workBook.SheetNames.reduce((initial, name) => {
        const sheet = workBook.Sheets[name];
        initial[name] = XLSX.utils.sheet_to_json(sheet);
        // this.data = <AOA>(XLSX.utils.sheet_to_json(sheet, { header: 1 }));
        // console.log(sheet, XLSX.utils.sheet_to_json(sheet))
        return initial;
      }, {});
      console.log(jsonData)
      this.getProjects(jsonData)
    }
    reader.readAsBinaryString(file);
  }

  createJson(req_data) {
    // console.log("pros", this.pros)
    var dataArr = []
    for (var mainKey in req_data) {
      for (var key in req_data[mainKey]) {
        var reqData = []
        for (var i = 0; i < this.pros.length; i++) {
          if (req_data[mainKey][key]['ProjectName'].replace(/\s/g, "") == this.pros[i]['value'].replace(/\s/g, "")) {
            req_data[mainKey][key]['proid'] = this.pros[i]['proid']
            req_data[mainKey][key]['ProjectName'] = this.pros[i]['value']
            var dt = req_data[mainKey][key]['Date']
            var y = dt.split("/")[2]
            var m = dt.split("/")[1]
            var d = dt.split("/")[0]
            if (m < 9)
              m = "0" + m
            if (d < 9)
              d = "0" + d
            var req_date = y + "-" + m + "-" + d
            // 5/26/2020 2020-05-26
            reqData.push(req_data[mainKey][key]['Userid'])
            reqData.push(req_date)
            reqData.push(req_data[mainKey][key]['Start'] + ":00")
            reqData.push(req_data[mainKey][key]['End'] + ":00")
            reqData.push(this.pros[i]['proid'])
            if (req_data[mainKey][key]['description'] == undefined)
              reqData.push("")
            else
              reqData.push(req_data[mainKey][key]['description'])
            reqData.push(getDateStrFromDateObj(new Date()))
            reqData.push(getDateStrFromDateObj(new Date()))
          }
        }
        if (req_data[mainKey][key]['Start'] != undefined && req_data[mainKey][key]['End'] != undefined) {
          var dur = this.getDurationForJson(req_data[mainKey][key]['Start'], req_data[mainKey][key]['End'])
          req_data[mainKey][key]['duration'] = dur
          reqData.push(dur)
        }
        // console.log(reqData)
        dataArr.push(reqData)
      }
      // console.log("last", req_data)
    }
    console.log("final", dataArr)
    var req_Json = {}
    req_Json['data'] = dataArr
    req_Json['keys'] = ['user_id', 'entry_date', 'start_time', 'end_time', 'project_id',
      'description', 'created_date', 'updated_date', 'duration']
    // console.log(req_Json)
    // return
    this.adminService.saveMissingTimesheet(req_Json)
      .subscribe(
        res => {
          if (res["statusCode"] == 501) {
            this.openSnackBar(res["message"], 2000)
            this.router.navigate(['/timesheet']);
          }
          else {
            console.log("res", res)
            if (res['statusCode'] == undefined || res['statusCode'] == 200) {
              this.openSnackBar("Excel Uploaded Successfully!", 3000)
              this.router.navigate(['/timesheet']);
            }
            if (res['statusCode'] == "401") {
              localStorage.clear();
              this.router.navigate(['/login']);
            }
          }
        },
        err => console.error(err)
      )
  }

  getProjects(jsonData) {
    var jsonObj = {}
    jsonObj["user_id"] = this.userid
    jsonObj['action'] = "timesheet"
    this.authService.getAllProjForReportOrPlanning(jsonObj).subscribe(
      res => {
        if (res['statusCode'] == "200") {
          console.log("res in pro", res)
          res = res['data']
          var len = res.length;
          this.pros = []
          if (len > 0) {
            for (var i = 0; i < len; i++) {
              if (res[i]['project_code'].split("-")[0] == 'p') {
                this.pros.push({ value: res[i]['project_name'] + "_" + res[i]['project_code_old'], proid: res[i]['id'] })
              }
              else {
                this.pros.push({ value: res[i]['project_name'] + "_" + res[i]['project_code'], proid: res[i]['id'] })
              }
            }

            this.createJson(jsonData)
          }
          else if (len == 0) {
            setTimeout(() => {
              this.router.navigate(['/timesheet']);
            }, 2010)
          }
        }
        if (res['statusCode'] == "500") {
          // this.openSnackBar(res["message"], 2000)
          setTimeout(() => {
            this.router.navigate(['/timesheet']);
          }, 2010)
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

  getDurationForJson(start, end) {
    // console.log(start, end)
    var hms = start;
    var a = hms.split(':');
    var seconds = (+a[0]) * 60 * 60 + (+a[1]) * 60;
    var hm = end;
    var b = hm.split(':');
    var second = (+b[0]) * 60 * 60 + (+b[1]) * 60;
    var result = second - seconds;
    var durationString = this.displayDuration(result)
    return result;
  }

  displayDuration(req_val) {
    var d = req_val;
    const HOUR = 60 * 60;
    const MINUTE = 60;
    var minutesInSeconds = d % HOUR;
    var hours = Math.floor(d / HOUR);
    var minutes = Math.floor(minutesInSeconds / MINUTE)
    var hr, min;
    if (hours < 10) {
      hr = "" + "0" + hours;
    }
    else {
      hr = "" + hours;
    }
    if (minutes < 10) {
      min = "" + "0" + minutes;
    }
    else {
      min = "" + minutes;
    }
    var dur = hr + ":" + min;
    return dur;
  }

  openSnackBar(msg, dur) {
    this.snackBar.open(msg, "Close", {
      duration: dur,
    });
  }
}
