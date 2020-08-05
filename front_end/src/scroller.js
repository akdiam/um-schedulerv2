import React from 'react';
import InfiniteScroll from 'react-infinite-scroll-component';
import {ClassNames} from './ClassNames';
import Button from '@material-ui/core/Button'
import Select from 'react-select'
import makeAnimated from 'react-select/animated'
import ClassListing from './FA2020';
import ClassDescs from './class_descs_FA2020'
import ClassLinks from './class_links_FA2020'
import TestCal from './TestCal'
import moment from 'moment'
import Moment from 'moment'
import {extendMoment} from 'moment-range';
import TextField from '@material-ui/core/TextField'
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import ExpandLessIcon from '@material-ui/icons/ExpandLess';
import Grid from '@material-ui/core/Grid'
import PublicIcon from '@material-ui/icons/Public';
import HttpsIcon from '@material-ui/icons/Https';
import GitHubIcon from '@material-ui/icons/GitHub';
import Alert from '@material-ui/lab/Alert';

const buttonStyle = {
    padding: 25,
    right: 0,
};

const scrollerboxes = {
    borderRadius: 0,
    height: 40,
    margin: 1,
    padding: 5,
}

const spacingStyle = {
    padding: 15,
}

const animatedComponents = makeAnimated();

let can_go_back = true;
export default class Scroller extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            ClassNames,
            value: {label: 'Default value', key: '01'},
            showSubjs: true,
            showClassList: false,
            showClassDesc: false,

            // eg ("AEROSP, EECS, PSYCH")
            CurrentSubj: '',

            // array containing one of each catalog number (eg 101, 110, etc) (json obj)
            FilteredClassList: [],
            // array containing every class in a given subject (json obj)
            CompleteClassList: [],
            // array containing every class of a given course catalog num (json obj)
            SpecificClassList: [],

            // array of json objects for each specifically selected class
            LecArray: [],
            DiscArray: [],
            LabArray: [],
            SemArray: [],
            RecArray: [],

            // displays of items in each dropdown menu
            LecDisplays: null,
            DiscDisplays: null,
            LabDisplays: null,
            SemDisplays: null,
            RecDisplays: null,
            openClosedDisplays: [],

            // course number (eg 183, 280, 281)
            SelectedClass: null,

            // name of currently selected class
            FullSelectedClass: null,
            LecToGenerate: null,

            // containers of selections of dropdown menus
            SelectedLecs: [],
            SelectedDiscs: [],
            SelectedLabs: [],
            SelectedSems: [],
            SelectedRecs: [],

            // container of all selected classes to go on schedule
            ScheduledClasses: [],

            // container of displayed classes on sched/all classes on sched
            selectedIntervals: [],
            allIntervals: [],
            allSelectedIntervals: [],
            timeIntervals: [],
            curr_index: 0,
            numSchedules: 1,

            // searches
            current_search: '',

            // show description
            show_desc: true,

            // alert message
            no_overall_sections: "Oops! Couldn't add any ",
            some_overall_sections: "Oops! Couldn't add ",
        };

        this.handleChange = this.handleChange.bind(this);
        this.handleClick = this.handleClick.bind(this);
        this.handleBack = this.handleBack.bind(this);
        this.handleNext = this.handleNext.bind(this);
        this.handlePrev = this.handlePrev.bind(this);
    }

    fetchClassData = async(classname) => {
        return await fetch(`${process.env.REACT_APP_SERVER_URL}/${classname}`)
            .then(res => {
              return res.json()
            })
            //.then(class_info => {return class_info})
    }
    componentDidMount = () => {
        let classname = this.state.CurrentSubj+this.state.SelectedClass;
        this.fetchClassData(classname)
    }
    
    // handle returning the objects that are part of the dropdown menus
    handleDisplay = (section, real_openclose) => {
        let index = real_openclose.findIndex(sec => {
            return sec.class_no === section['Class Nbr']
        })
        let open_display = "? "
        if (index !== -1 && real_openclose[index].open_seats === 0) {
            open_display = `🔴(${real_openclose[index].open_seats}) | `
        } 
        if (index !== -1 && real_openclose[index].open_seats > 0) {
            open_display = `🟢(${real_openclose[index].open_seats}) | `
        }

        let disp_obj = {};
        disp_obj["value"] = section['Class Nbr']
        disp_obj["label"] = open_display + "Section " + section['Section'] + " | "
        + section['M']+section['T']+section['W']+section['TH']+section['F']
        + " | " + section['Time'] + " | " + section['Class Nbr'] + " | " + section['Location']
        disp_obj["time"] = section['Time']
        let thurs = ''
        if (section['TH'] === 'TH') {
            thurs = 'R'
        }
        disp_obj["days"] = section['M']+section['T']+section['W']+thurs+section['F']
        disp_obj["section"] = section['Section']
        disp_obj["location"] = section['Location']
        return disp_obj;
    }

    // formats time slots for events on calendar
    formatTime = unformattedTime => {
        if (unformattedTime === "ARR") {
            return null
        }

        let start = unformattedTime.substr(0, unformattedTime.indexOf('-'))
        let end = unformattedTime.split(/[- ABCDEFGHIJKLMNOPQRSTUVWXYZ]/)[1]
        console.log(end)
        let ampm = unformattedTime.split(/[- 0123456789]/).slice(-1)[0]
        console.log(ampm)
        let start_hour
        let start_min
        let end_hour
        let end_min
        if (start.includes("30")) {
            let hour = start.substr(0, start.indexOf("30"));
            start_hour = parseInt(hour);
            start_min = 30
        } else {
            start_hour = parseInt(start);
            start_min = 0;
        }
        if (end.includes("30")) {
            let hour = end.substr(0, end.indexOf("30"));
            end_hour = parseInt(hour);
            end_min = 30
        } else {
            end_hour = parseInt(end);
            end_min = 0;
        }

        if (start_hour >= 8 && start_hour <= 12 && end_hour > 0 && end_hour <= 9 && ampm === "PM") {
            end_hour += 12;
        } if (start_hour > 0 && start_hour <= 8 && ampm === "PM") {
            start_hour += 12;
            end_hour += 12;
        }

        let start_obj = {}
        let end_obj = {}
        start_obj["hour"] = start_hour;
        start_obj["min"] = start_min;
        end_obj["hour"] = end_hour;
        end_obj["min"] = end_min;
        return ({ 
            start_obj, end_obj
        })
    }

    formatDays = unformattedDays => {
        let days = [];
        if (unformattedDays.includes('M')) {
            days.push(1)
        }
        if (unformattedDays.includes('T')) {
            days.push(2)
        }
        if (unformattedDays.includes('W')) {
            days.push(3)
        }
        if (unformattedDays.includes('R')) {
            days.push(4)
        }
        if (unformattedDays.includes('F')) {
            days.push(5)
        }
        return days
    }

    // used in handleAdd - setting up format for actual events to be displayed on calendar

    // push all sections into a temp array
    // include the formatted timeslot of each obj with its corresponding section
    // set the corresponding key of obj to the collected sections
    handleScheduling = selected_list => {
        let innerobj = {}
        let class_arr = []
        for(let i = 0; i < selected_list.length; ++i) {
            innerobj["description"] = selected_list[i];
            innerobj["timeslot"] = this.formatTime(selected_list[i]['time'])
            innerobj["days"] = this.formatDays(selected_list[i]['days'])
            innerobj["section"] = selected_list[i]['section']
            innerobj["location"] = selected_list[i]['location']
            class_arr.push(innerobj);
            innerobj = {};
            console.log(this.formatTime(selected_list[i]['time']))
        }
        // set the corresponding key of obj to the collected sections
        return class_arr
    }

    // adds all intervals of a class's lectures/discussions/labs/sems/recs to interval_arr
    // used in handleAdd
    addAllIntervals = (unformattedIntervals, class_name, class_type) => {
        let innerobj = {}
        let interval_arr_out = []
        let interval_arr_in = []
        for (let i = 0; i < unformattedIntervals.length; ++i) {
            let no_days = false;
            let no_time = false;
            if (unformattedIntervals[i]['days'].length === 0) {
                no_time = true;
            }
            if (unformattedIntervals[i]['time'] === 'ARR') {
                no_days = true;
            }
            for (let j = 0; j < unformattedIntervals[i]['days'].length; ++j) {
                innerobj['uid'] = class_name
                innerobj['start'] = moment({h: unformattedIntervals[i]['timeslot']['start_obj']['hour'], 
                                            m: unformattedIntervals[i]['timeslot']['start_obj']['min']})
                                            .day(unformattedIntervals[i]['days'][j])
                innerobj['end'] = moment({h: unformattedIntervals[i]['timeslot']['end_obj']['hour'], 
                                            m: unformattedIntervals[i]['timeslot']['end_obj']['min']})
                                            .day(unformattedIntervals[i]['days'][j])
                innerobj['value'] = class_name + " " + class_type + " " + unformattedIntervals[i]['section']
                + " ID: " + unformattedIntervals[i]['description']['value'] + " " + unformattedIntervals[i]['location']
                interval_arr_in.push(innerobj)
                innerobj = {}
            }
            // if there are no days scheduled
            if (!no_time && !no_days) {
                interval_arr_out.push(interval_arr_in)
            }
            interval_arr_in = [];
        }
        return interval_arr_out
    }

    // checks for conflicts between two time slots
    check_conflicts = (start_time1, end_time1, start_time2, end_time2) => {
        const mom = extendMoment(Moment);
        let date1 = [start_time1, end_time1];
        let date2 = [start_time2, end_time2];
        let range1 = mom.range(date1);
        let range2 = mom.range(date2);
        if (range1.overlaps(range2)) {
            return true;
        }
        return false;
    }

    // add to array of all selectedIntervals 
    update_selectedIntervals = (all_schedules, interval_obj, type) => {
        let conflict_counter = 0;
        let missing_classes = '';
        let classes_to_remove = [];
        //let noconflict_counter = 0;
        // set up selected intervals
        let new_all = []
        if (interval_obj.length === 0) {
            return [all_schedules, true, classes_to_remove]
        }

        if (all_schedules.length === 0) {
            console.log('true')
            for (let i = 0; i < interval_obj.length; ++i) {
                let inner_arr = [];
                for (let j = 0; j < interval_obj[i].length; ++j) {
                    inner_arr.push(interval_obj[i][j])
                }
                new_all.push(inner_arr)
            }
            return [new_all, true, classes_to_remove]
        } 
        // add to existing selected intervals
        else {
            // over container of all intervals 
            for (let k = 0; k < interval_obj.length; ++k) {
                //(allSelectedIntervals)
                let inner_conflict_counter = 0;
                for (let i = 0; i < all_schedules.length; ++i) {
                    // over each specific selectedInterval
                    let has_conflict = false;
                    for (let j = 0; j < all_schedules[i].length; ++j) {
                        // over each time interval within the interval_obj
                        for (let h = 0; h < interval_obj[k].length; ++h) {
                            if (this.check_conflicts(all_schedules[i][j]['start'], all_schedules[i][j]['end'], 
                                                    interval_obj[k][h]['start'], interval_obj[k][h]['end'])) {
                                has_conflict = true;
                            } 
                        }
                    } 
                    if (!has_conflict) {
                        let concatted_sched = all_schedules[i].concat(interval_obj[k])
                        new_all.push(concatted_sched)
                        //++noconflict_counter
                    } 
                    else {
                        ++inner_conflict_counter
                        //can_add = false;
                    }
                }
                if (inner_conflict_counter === all_schedules.length) {
                    ++conflict_counter
                    if (!missing_classes.includes(interval_obj[k][0]['value'])) {
                        missing_classes += (interval_obj[k][0]['value'] + ', ')
                        classes_to_remove.push(interval_obj[k][0]['value'])
                    }
                } 
            }
        }
        if (conflict_counter === interval_obj.length) {
            //alert(`Couldn't add any ${type} that you selected to your schedule because all brought conflicts`)
            return [all_schedules, false, classes_to_remove];
        } 
        else {
            if (missing_classes.length === 0) {
                return [new_all, true, classes_to_remove];
            } else {
                //alert(`Couldn't add ${missing_classes} to your schedule because they brought conflicts`)
                return [new_all, true, classes_to_remove];
            }
        }
    }

    // handle clicks on the scroller
    // async because we want to wait for class data api to return w data before proceeding when showing class data
    handleClick = async(event) => {
        //let event_copy = event;
        // if the user clicks on a subject...
        if (this.state.showSubjs && !this.state.showClassList && !this.state.showClassDesc) {
            // filters relevant classes 
            let subj_to_find = '(' + event.target.innerText + ')';
            let relevant_classes = ClassListing.filter(subj => subj['Subject'].includes(subj_to_find));
            
            // filters duplicate catalog numbers 
            let seen_nbrs = {}
            const filtered_classes = relevant_classes.filter(subj => {
                if (subj['Catalog Nbr'] in seen_nbrs) {
                    return false;
                } else {
                    seen_nbrs[subj['Catalog Nbr']] = true;
                    return true;
                }
            })

            // sets state after updating information
            this.setState({
                showSubjs: false,
                showClassList: true,
                CurrentSubj: event.target.innerText,
                FilteredClassList: filtered_classes,
                CompleteClassList: relevant_classes,
                current_search: '',
            })
        } 
        //let class_num = event.currentTarget.id;
        // if the user clicks on a class...
        if (this.state.showClassList) {
            let specific_class_list = this.state.CompleteClassList.filter(subj => subj['Catalog Nbr'] === event.currentTarget.id)
            const lecs = specific_class_list.filter(subj => subj['Component'] === 'LEC')
            const discs = specific_class_list.filter(subj => subj['Component'] === 'DIS')
            const labs = specific_class_list.filter(subj => subj['Component'] === 'LAB')
            const sems = specific_class_list.filter(subj => subj['Component'] === 'SEM')
            const recs = specific_class_list.filter(subjs => subjs['Component'] === 'REC')

            let temp_lec = [];
            let temp_disc = [];
            let temp_lab = [];
            let temp_sems = [];
            let temp_recs = [];

            // event can't be used in asynchronous calls so we need to make references first
            let class_num = event.currentTarget.id;
            let class_name = event.currentTarget.innerText
            
            let openclose_temp = [];

            // wait until this is done, then proceed with the rest of the logic (await)
            // this fetches all of the open/close data from the course guide
            can_go_back = false;
            await this.fetchClassData(this.state.CurrentSubj+class_num.trim())
                .then(class_data => {
                    openclose_temp.push(class_data);
                }); 
            

            can_go_back = true;
            //console.table(openclose_temp[0])
            let real_openclose = openclose_temp[0]
        
            // gathering info to send to dropdown menus to display
            for (let i = 0; i < lecs.length; ++i) {
                let disp_obj = this.handleDisplay(lecs[i], real_openclose)
                temp_lec.push(disp_obj);
            }
            for (let i = 0; i < discs.length; ++i) {
                let disp_obj = this.handleDisplay(discs[i], real_openclose)
                temp_disc.push(disp_obj);
            }
            for (let i = 0; i < labs.length; ++i) {
                let disp_obj = this.handleDisplay(labs[i], real_openclose)
                temp_lab.push(disp_obj);
            }
            for (let i = 0; i < sems.length; ++i) {
                let disp_obj = this.handleDisplay(sems[i], real_openclose)
                temp_sems.push(disp_obj);
            }
            for (let i = 0; i < recs.length; ++i) {
                let disp_obj = this.handleDisplay(recs[i], real_openclose)
                temp_recs.push(disp_obj);
            }

            // update state
            this.setState({
                showClassList: true,
                showCourseDesc: true,
                LecArray: lecs,
                DiscArray: discs,
                LabArray: labs,
                SemArray: sems,
                RecArray: recs,
                SelectedClass: class_num,
                SpecificClassList: specific_class_list,
                LecDisplays: temp_lec,
                DiscDisplays: temp_disc,
                LabDisplays: temp_lab,
                SemDisplays: temp_sems,
                RecDisplays: temp_recs,
                FullSelectedClass: class_name,
                SelectedLecs: [],
                SelectedDiscs: [],
                SelectedLabs: [],
                SelectedSems: [],
                SelectedRecs: [],
                openClosedDisplays: openclose_temp[0],
                show_desc: true,
                no_overall_sections: "Oops! Couldn't add any ",
                some_overall_sections: "Oops! Couldn't add ",
            })
        } 
    }

    // updates the appropriate state arrays 
    // when class times are selected
    handleChange = (value, action) => {
        console.log(action.name)
        if (action.name === 'lecs') {
            this.setState({SelectedLecs:value})
        } if (action.name === 'disc') {
            this.setState({SelectedDiscs:value})
        } if (action.name === 'lab') {
            console.log(action.name)
            console.log(value)
            this.setState({SelectedLabs:value})
        } if (action.name === 'sem') {
            this.setState({SelectedSems:value})
        } if (action.name === 'rec') {
            this.setState({SelectedRecs:value})
        }
    }

    handleBack = () => {
        if (can_go_back) {
            this.setState({
                showSubjs: true,
                showClassDesc: false,
                showClassList: false,
                showCourseDesc: false,
                FullSelectedClass: null,
                SelectedLecs: [],
                SelectedDiscs: [],
                SelectedLabs: [],
                SelectedSems: [],
                SelectedRecs: [],
                LecDisplays: null,
                DiscDisplays: null,
                LabDisplays: null,
                SemDisplays: null,
                RecDisplays: null,
                FullSelectedClass: null,
                SpecificClassList: null,
                CurrentSubj: null,
                FilteredClassList: null,
                CompleteClassList: null,
                SpecificClassList: null,
                SelectedClass: null,
                LecArray: [],
                DiscArray: [],
                LabArray: [],
                SemArray: [],
                RecArray: [],
                current_search: '',
                show_desc: true,
                no_overall_sections: "Oops! Couldn't add any ",
                some_overall_sections: "Oops! Couldn't add ",
            })
        }
    }

    // adds selected values to an array called ScheduledClasses
    handleAdd = () => {
        // add all of the selected options to the calendar display array
        let obj = {};
        let intervalObj = {};
        let potentialSelected = [];
        let tempAll = ''
        let tempWarn = ''

        // seriously keeps track of all selected
        let temp_allSelectedIntervals = this.state.allSelectedIntervals

        obj["class"] = this.state.CurrentSubj+this.state.SelectedClass;
        intervalObj["class"] = this.state.CurrentSubj+this.state.SelectedClass;
        // push all of the selected class info into the scheduled classes container in state
        if (this.state.SelectedLecs !== null && this.state.SelectedLecs.length !== 0) {
            obj["lecs"]=this.handleScheduling(this.state.SelectedLecs);
            // set up selectedInterval (currently displayed classes)
            // add everything selected lec into all intervals, choose first of those to actually display
            intervalObj["LEC"] = this.addAllIntervals(obj["lecs"], obj["class"], "LEC") 
            let temp = this.update_selectedIntervals(temp_allSelectedIntervals, intervalObj["LEC"], "LEC")
            temp_allSelectedIntervals = temp[0]

            // if these lectures didn't fit, don't include them in allintervals or scheduledclasses
            // this helps when a class is deleted so no surprise conflicts are made when rescheduling
            if (!temp[1]) {
                console.log("asdasdasdasd")
                tempAll += "LEC, "
                console.log(tempAll)
                delete obj["lecs"]
                delete intervalObj["LEC"]
            } else {
                if (temp[2].length !== 0) {
                    for (let i = 0; i < temp[2].length; ++i) {
                        tempWarn += (temp[2][i] + ", ")
                        intervalObj["LEC"] = intervalObj["LEC"].filter(subj => subj[0]['value'] !== temp[2][i])
                    }
                }
            }
        }
        if (this.state.SelectedDiscs !== null && this.state.SelectedDiscs.length !== 0) {
            obj["discs"]=this.handleScheduling(this.state.SelectedDiscs);
            intervalObj["DIS"] = this.addAllIntervals(obj["discs"], obj["class"], "DIS")
            let temp = this.update_selectedIntervals(temp_allSelectedIntervals, intervalObj["DIS"], "DIS")
            temp_allSelectedIntervals = temp[0]
            if (!temp[1]) {
                tempAll += "DIS, "
                delete obj["discs"]
                delete intervalObj["DIS"]
            } else {
                if (temp[2].length !== 0) {
                    for (let i = 0; i < temp[2].length; ++i) {
                        tempWarn += (temp[2][i] + ", ")
                        intervalObj["DIS"] = intervalObj["DIS"].filter(subj => subj[0]['value'] !== temp[2][i])
                    }
                }
            }
        }
        if (this.state.SelectedLabs !== null && this.state.SelectedLabs.length !== 0) {
            obj["labs"]=this.handleScheduling(this.state.SelectedLabs);
            intervalObj["LAB"] = this.addAllIntervals(obj["labs"], obj["class"], "LAB")
            let temp = this.update_selectedIntervals(temp_allSelectedIntervals, intervalObj["LAB"], "LAB")
            temp_allSelectedIntervals = temp[0]
            if (!temp[1]) {
                tempAll += "LAB, "
                delete obj["labs"]
                delete intervalObj["LAB"]
            } else {
                if (temp[2].length !== 0) {
                    for (let i = 0; i < temp[2].length; ++i) {
                        tempWarn += (temp[2][i] + ", ")
                        intervalObj["LAB"] = intervalObj["LAB"].filter(subj => subj[0]['value'] !== temp[2][i])
                    }
                }
            }
        }
        if (this.state.SelectedSems !== null && this.state.SelectedSems.length !== 0) {
            obj["sems"]=this.handleScheduling(this.state.SelectedSems);
            intervalObj["SEM"] = this.addAllIntervals(obj["sems"], obj["class"], "SEM")
            let temp = this.update_selectedIntervals(temp_allSelectedIntervals, intervalObj["SEM"], "SEM")
            temp_allSelectedIntervals = temp[0]
            if (!temp[1]) {
                tempAll += "SEM, "
                delete obj["sems"]
                delete intervalObj["SEM"]
            } else {
                if (temp[2].length !== 0) {
                    for (let i = 0; i < temp[2].length; ++i) {
                        tempWarn += (temp[2][i] + ", ")
                        intervalObj["SEM"] = intervalObj["SEM"].filter(subj => subj[0]['value'] !== temp[2][i])
                    }
                }
            }
        }
        if (this.state.SelectedRecs !== null && this.state.SelectedRecs.length !== 0) {
            obj["recs"]=this.handleScheduling(this.state.SelectedRecs);
            intervalObj["REC"] = this.addAllIntervals(obj["recs"], obj["class"], "REC")
            let temp = this.update_selectedIntervals(temp_allSelectedIntervals, intervalObj["REC"], "REC")
            temp_allSelectedIntervals = temp[0]
            if (!temp[1]) {
                tempAll += "REC, "
                delete obj["recs"]
                delete intervalObj["REC"]
            } else {
                if (temp[2].length !== 0) {
                    for (let i = 0; i < temp[2].length; ++i) {
                        tempWarn += (temp[2][i] + ", ")
                        intervalObj["REC"] = intervalObj["REC"].filter(subj => subj[0]['value'] !== temp[2][i])
                    }
                }
            }
        }

        // if everything is empty, avoid changing the state because nothing needs to be modified
        if (!('lecs' in obj) && !('discs' in obj) && !('labs' in obj) && !('sems' in obj) && !('recs' in obj)) {
            //obj = {}
            this.setState({
                no_overall_sections: "Oops! Couldn't add any " + tempAll,
                some_overall_sections: "Oops! Couldn't add " + tempWarn,
            })
            return
        }
        // if everything is empty, avoid changing the state because nothing needs to be modified
        if (!('LEC' in intervalObj) && !('DIS' in intervalObj) && !('LAB' in intervalObj) 
        && !('REC' in intervalObj) && !('SEM' in intervalObj)) {
            //intervalObj = {}
            this.setState({
                no_overall_sections: "Oops! Couldn't add any " + tempAll,
                some_overall_sections: "Oops! Couldn't add " + tempWarn,
            })
            return
        }

        let new_sched_size = temp_allSelectedIntervals.length;
        if (new_sched_size === 0) {
            new_sched_size = 1
        }
        // update state
        this.setState({
            SelectedLecs: [],
            SelectedDiscs: [],
            SelectedLabs: [],
            SelectedSems: [],
            SelectedRecs: [],
            ScheduledClasses: this.state.ScheduledClasses.concat(obj),
            allIntervals: this.state.allIntervals.concat(intervalObj),
            selectedIntervals: temp_allSelectedIntervals[0],
            allSelectedIntervals: temp_allSelectedIntervals,
            numSchedules: new_sched_size,
            curr_index: 0,
            no_overall_sections: "Oops! Couldn't add any " + tempAll,
            some_overall_sections: "Oops! Couldn't add " + tempWarn,
        })
    }

    // deleting a class from the calendar
    handleDel = () => {
        let fullname = this.state.FullSelectedClass;
        let new_array = this.state.ScheduledClasses.filter(subj => fullname.includes(subj['class']) === false)
        let new_array_all_intervals = this.state.allIntervals.filter(subj => fullname.includes(subj['class']) === false)
        let new_selected_intervals, new_num_sched

        let filtered_scheds = []
        // remake all possible schedules
        for (let i = 0; i < new_array_all_intervals.length; ++i) {
            if ('lecs' in new_array[i]) {
                let temp = this.update_selectedIntervals(filtered_scheds, new_array_all_intervals[i]['LEC'])
                filtered_scheds = temp[0]
            }
            if (('discs') in new_array[i]) {
                let temp = this.update_selectedIntervals(filtered_scheds, new_array_all_intervals[i]['DIS'])
                filtered_scheds = temp[0]
            }
            if (('labs') in new_array[i]) {
                let temp = this.update_selectedIntervals(filtered_scheds, new_array_all_intervals[i]['LAB'])
                filtered_scheds = temp[0]
            }
            if (('sems') in new_array[i]) {
                let temp = this.update_selectedIntervals(filtered_scheds, new_array_all_intervals[i]['SEM'])
                filtered_scheds = temp[0]
            }
            if (('recs') in new_array[i]) {
                let temp = this.update_selectedIntervals(filtered_scheds, new_array_all_intervals[i]['REC'])
                filtered_scheds = temp[0]
            } 
        }

        if (filtered_scheds.length !== 0) {
            new_selected_intervals = filtered_scheds[0]
            new_num_sched = filtered_scheds.length
        } else {
            new_selected_intervals = []
            new_num_sched = 1
        }

        this.setState({
            ScheduledClasses: new_array,
            allIntervals: new_array_all_intervals,
            selectedIntervals: new_selected_intervals,
            allSelectedIntervals: filtered_scheds,
            curr_index: 0,
            numSchedules: new_num_sched,
            no_overall_sections: "Oops! Couldn't add any ",
            some_overall_sections: "Oops! Couldn't add ",
        })
    }

    // previous permutation
    handlePrev = () => {
        let new_curr_index 
        if (this.state.curr_index === 0) {
            new_curr_index = this.state.numSchedules - 1
        } else {
            new_curr_index = this.state.curr_index - 1
        }
        this.setState({
            curr_index: new_curr_index,
            selectedIntervals: this.state.allSelectedIntervals[new_curr_index],
        })
    }

    // next permutation
    handleNext = () => {
        let new_curr_index
        if (this.state.curr_index + 1 === this.state.numSchedules) {
            new_curr_index = 0
        } else {
            new_curr_index = this.state.curr_index + 1
        }
        this.setState({
            curr_index: new_curr_index,
            selectedIntervals: this.state.allSelectedIntervals[new_curr_index],
        })
    }

    handleEvClick = async(event) => {
        // get complete_class_list
        let inner_text = event.target.innerText.replace(/[0-9]/g, '').trim()
        let subj_to_find = '(' + inner_text + ')';
        let relevant_classes = ClassListing.filter(subj => subj['Subject'].includes(subj_to_find));
        // filters duplicate catalog numbers 
        let seen_nbrs = {}
        const filtered_classes = relevant_classes.filter(subj => {
            if (subj['Catalog Nbr'] in seen_nbrs) {
                return false;
            } else {
                seen_nbrs[subj['Catalog Nbr']] = true;
                return true;
            }
        })

        let inner_num = event.target.innerText.match(/\d+/)[0].trim()
        let specific_class_list = relevant_classes.filter(subj => subj['Catalog Nbr'] === " "+inner_num)
        console.table(specific_class_list)
        let description = specific_class_list[0]['Course Title']
        const lecs = specific_class_list.filter(subj => subj['Component'] === 'LEC')
        const discs = specific_class_list.filter(subj => subj['Component'] === 'DIS')
        const labs = specific_class_list.filter(subj => subj['Component'] === 'LAB')
        const sems = specific_class_list.filter(subj => subj['Component'] === 'SEM')
        const recs = specific_class_list.filter(subjs => subjs['Component'] === 'REC')

        let temp_lec = [];
        let temp_disc = [];
        let temp_lab = [];
        let temp_sems = [];
        let temp_recs = [];
        
        let openclose_temp = [];

        // wait until this is done, then proceed with the rest of the logic (await)
        // this fetches all of the open/close data from the course guide
        can_go_back = false;
        await this.fetchClassData(inner_text+inner_num)
            .then(class_data => {
                openclose_temp.push(class_data);
            }); 
        can_go_back = true;
        //console.table(openclose_temp[0])
        let real_openclose = openclose_temp[0]
    
        // gathering info to send to dropdown menus to display
        for (let i = 0; i < lecs.length; ++i) {
            let disp_obj = this.handleDisplay(lecs[i], real_openclose)
            temp_lec.push(disp_obj);
        }
        for (let i = 0; i < discs.length; ++i) {
            let disp_obj = this.handleDisplay(discs[i], real_openclose)
            temp_disc.push(disp_obj);
        }
        for (let i = 0; i < labs.length; ++i) {
            let disp_obj = this.handleDisplay(labs[i], real_openclose)
            temp_lab.push(disp_obj);
        }
        for (let i = 0; i < sems.length; ++i) {
            let disp_obj = this.handleDisplay(sems[i], real_openclose)
            temp_sems.push(disp_obj);
        }
        for (let i = 0; i < recs.length; ++i) {
            let disp_obj = this.handleDisplay(recs[i], real_openclose)
            temp_recs.push(disp_obj);
        }
        let full_class_name = inner_text + " " + inner_num + ": " + description
        full_class_name = full_class_name.toUpperCase()
        this.setState({
            showSubjs: false,
            showClassList: true,
            showCourseDesc: true,
            CurrentSubj: inner_text,
            FilteredClassList: filtered_classes,
            CompleteClassList: relevant_classes,
            LecArray: lecs,
            DiscArray: discs,
            LabArray: labs,
            SemArray: sems,
            RecArray: recs,
            SelectedClass: " "+inner_num,
            SpecificClassList: specific_class_list,
            LecDisplays: temp_lec,
            DiscDisplays: temp_disc,
            LabDisplays: temp_lab,
            SemDisplays: temp_sems,
            RecDisplays: temp_recs,
            FullSelectedClass: full_class_name,
            SelectedLecs: [],
            SelectedDiscs: [],
            SelectedLabs: [],
            SelectedSems: [],
            SelectedRecs: [],
            openClosedDisplays: openclose_temp[0],
            no_overall_sections: "Oops! Couldn't add any ",
            some_overall_sections: "Oops! Couldn't add ",
        })

    }

    handleSearch = event => {
        this.setState({
            current_search: event.target.value,
        })
    }

    handleExpand = () => {
        this.setState({
            show_desc: !this.state.show_desc
        })
    }

    handleCG = () => {
        let cg_url_obj = ClassLinks[this.state.CurrentSubj].filter(subj => subj['num'] === parseInt(this.state.SelectedClass))
        let actual_cg_url = cg_url_obj[0]['cg']
        window.open(actual_cg_url)
    }

    handleATLAS = () => {
        let art_url_obj = ClassLinks[this.state.CurrentSubj].filter(subj => subj['num'] === parseInt(this.state.SelectedClass))
        let actual_art_url = art_url_obj[0]['art']
        window.open(actual_art_url)
    }

    showSource = () => {
        window.open('https://github.com/akdiam/um-schedulerv2')
    }

    handleNoAlert = () => {
        this.setState({
            no_overall_sections: "Oops! Couldn't add any ",
        })
    }

    handleSomeAlert = () => {
        this.setState({
            some_overall_sections: "Oops! Couldn't add ",
        })
    }

    render() {
        let displayed_scroller;
        let add_rm_buttons;
        let lecture_choices;
        let disc_choices;
        let lab_choices;
        let sem_choices;
        let rec_choices;
        let class_header;
        let back_btn;
        let del_btn;    
        let nextprev = 
        <div className = "btn"> 
            <Button variant="contained" className="backbtn" onClick={this.handlePrev}>Back</Button>
            <div className = "pages">{this.state.curr_index+1}/{this.state.numSchedules}</div>
            <Button variant="contained" className="forbtn" onClick={this.handleNext}>Next</Button>
        </div>
        let class_btns;
        let search_bar;
        //no_overall_sections: "Oops! Couldn't add any ",
        //some_overall_sections: "Oops! Couldn't add ",
        let no_alert;
        let some_alert;
        if (this.state.no_overall_sections !== "Oops! Couldn't add any ") {
            window.scrollTo(0, 0)
            no_alert = <Alert onClose={this.handleNoAlert} severity="error">
                {this.state.no_overall_sections}from {this.state.FullSelectedClass} because all of these create conflict with your current schedule(s). Consider rearranging your schedule, or adding other sections if possible!
                </Alert>
        }
        if (this.state.some_overall_sections !== "Oops! Couldn't add ") {
            window.scrollTo(0, 0)
            some_alert = <Alert onClose={this.handleSomeAlert} severity="warning">
                {this.state.some_overall_sections}because all of these sections create conflict with your current schedule(s). Consider rearranging your schedule, or adding other sections if possible!
                </Alert>
        }
        
        if (this.state.ScheduledClasses.length !== 0) {
            class_btns = 
            <div>
                {this.state.ScheduledClasses.map((item, index) => (
                    <Button color = "primary" variant="outlined" size="medium" onClick={this.handleEvClick}>
                        {item.class}
                    </Button>
                ))}
                <hr/>
            </div>
        }
        

        {/* controls the display for subject listing */}
        if (this.state.showSubjs && !this.state.showClassList && !this.state.showClassDesc) {
            search_bar = 
            <form>
                <TextField size="small" variant="outlined" id="search_subj" label="Search for a Subject" onChange={this.handleSearch}/> 
            </form>

            let filtered_classnames = this.state.ClassNames.filter(indiv => {
                return indiv.toLowerCase().includes(this.state.current_search.toLowerCase())
            })

            displayed_scroller = <InfiniteScroll
            dataLength={filtered_classnames.length}
            hasMore={false}
            height={270}
            >
            {filtered_classnames.map((name, index) => (
                <div style = {scrollerboxes} key = {index} value = {name}>
                    <Button fullWidth variant="outlined" size="large" onClick = {this.handleClick}>{name}</Button> 
                </div>
            ))}
            </InfiniteScroll>
        } 
        
        {/* controls the display for specific class listings */}
        if (this.state.showClassList && !this.state.showSubjs && !this.state.showCourseDesc) {
            search_bar = 
            <form>
                <TextField size="small" variant="outlined" id="search_class" label="Search for a Class" onChange={this.handleSearch}/> 
            </form>

            back_btn = 
            <Button variant="contained" size="small" onClick={this.handleBack} color="secondary" id="back">
                Back to Subjects
            </Button>

            let filtered_list = this.state.FilteredClassList.filter(indiv => {
                let full_name = this.state.CurrentSubj+indiv['Catalog Nbr']+" "+indiv['Course Title']
                return full_name.toLowerCase().includes(this.state.current_search)
            })

            displayed_scroller = <InfiniteScroll
            dataLength={filtered_list.length}
            hasMore={false}
            height={270}
            >
            {filtered_list.map((item, index) => (
                <div style = {scrollerboxes} key = {index} value = {item}>
                    <Button fullWidth variant="outlined" size="large" id={item['Catalog Nbr']} onClick = {this.handleClick}>
                        {this.state.CurrentSubj} {item['Catalog Nbr']}: {item['Course Title']}
                    </Button> 
                </div>
            ))}
            </InfiniteScroll>
        }
        
        {/* controls the display for class descriptions and add/remove btn */}
        if (this.state.showClassList && this.state.showCourseDesc) {
            search_bar = 
            <form>
                <TextField size="small" variant="outlined" id="search_class" label="Search for a Class" onChange={this.handleSearch}/> 
            </form>

            back_btn = 
            <Button variant="contained" size="small" onClick={this.handleBack} color="secondary" id="back">
                Back to Subjects
            </Button>
            
            let description = ClassDescs[this.state.CurrentSubj].filter(subj => subj['num'] === parseInt(this.state.SelectedClass))
            
            if (this.state.show_desc) {
                class_header = 
                <Grid container spacing = {3}>
                    <Grid item xs justify = "flex-start" direction = "column">
                        <strong id="fullname">{this.state.FullSelectedClass}</strong>
                        <p id="descriptions">{this.state.SpecificClassList[0]['Units']} credits. {description[0]['desc']}</p>
                    </Grid>
                    <Grid item xs = {3} direction="column" justify="space-between" alignItems="center">
                        <Button variant="outlined" size="small" color="secondary" startIcon={<ExpandLessIcon/>} onClick={this.handleExpand}>Less</Button>
                        <Grid>
                            <Button variant="outlined" size="small" color="primary" startIcon={<PublicIcon/>} onClick={this.handleCG}>Course Guide</Button>
                            <Button variant="outlined" size="small" color="primary" startIcon={<HttpsIcon/>} onClick={this.handleATLAS}>ATLAS</Button>
                        </Grid>
                    </Grid>
                </Grid>
            } else {
                class_header = 
                <Grid container spacing = {3}>
                    <Grid item xs justify = "flex-start" direction = "column">
                        <strong id="fullname">{this.state.FullSelectedClass}</strong>
                    </Grid>
                    <Grid item xs = {3}>
                        <Button variant="outlined" size="small" color="secondary" startIcon={<ExpandMoreIcon/>} onClick={this.handleExpand}>More</Button>
                    </Grid>
                </Grid>
            }
            

            let filtered_list = this.state.FilteredClassList.filter(indiv => {
                let full_name = this.state.CurrentSubj+indiv['Catalog Nbr']+" "+indiv['Course Title']
                return full_name.toLowerCase().includes(this.state.current_search)
            })

            displayed_scroller = 
            <InfiniteScroll
            dataLength={filtered_list.length}
            hasMore={false}
            height={270}
            >
            {filtered_list.map((item, index) => (
                <div style = {scrollerboxes} key = {index} value = {item}>
                    <Button fullWidth variant="outlined" size="large" id={item['Catalog Nbr']} onClick = {this.handleClick}>
                        {this.state.CurrentSubj} {item['Catalog Nbr']}: {item['Course Title']}
                    </Button> 
                </div>
            ))}
            </InfiniteScroll>

            {/*checking to see if selected class is already in scheduled class to decide what to render*/}
            let already_in_scheduled = false;
            for (let i = 0; i < this.state.ScheduledClasses.length; ++i) {
                if (this.state.FullSelectedClass.includes(this.state.ScheduledClasses[i]['class'])){
                    already_in_scheduled = true;
                }
            }

            {/* if class is already in schedule, don't let user choose the class again/hide selector */}
            if (already_in_scheduled) {
                del_btn = 
                <div style={buttonStyle}>
                    <Button variant="contained" color="secondary" onClick={this.handleDel}>
                        Delete Class From to Schedule
                    </Button>
                </div>
            } 
            //otherwise, display the selector and let user add class to their schedule
            else {
                {/*if lecarray isn't empty, create an object to be displayed showing the options*/}
                if (this.state.LecArray !== undefined && this.state.LecArray.length !== 0) {
                    lecture_choices = 
                    <div>
                        <i style={spacingStyle}>Lectures (choose at least one):</i>
                        <Select
                            value={this.state.SelectedLecs}
                            defaltValue={this.state.SelectedLecs}
                            options={this.state.LecDisplays}
                            closeMenuOnSelect={false}
                            components={animatedComponents}
                            onChange={this.handleChange}
                            placeholder="Select a lecture(s)"
                            name="lecs"
                            isMulti
                        />
                    </div>
                } if (this.state.DiscArray !== undefined && this.state.DiscArray.length !== 0) {
                    disc_choices = 
                    <div>
                        <i style={spacingStyle}>Discussions (choose at least one):</i>
                        <Select
                            value={this.state.SelectedDiscs}
                            defaultValue={this.state.SelectedDiscs}
                            options={this.state.DiscDisplays}
                            closeMenuOnSelect={false}
                            components={animatedComponents}
                            onChange={this.handleChange}
                            placeholder="Select a discussion(s)"
                            name="disc"
                            isMulti
                        />
                    </div>
                } if (this.state.LabArray !== undefined && this.state.LabArray.length !== 0) {
                    lab_choices = 
                    <div>
                        <i style={spacingStyle}>Labs (choose at least one):</i>
                        <Select
                            value={this.state.SelectedLabs}
                            defaultValue={this.state.SelectedLabs}
                            options={this.state.LabDisplays}
                            closeMenuOnSelect={false}
                            components={animatedComponents}
                            onChange={this.handleChange}
                            placeholder="Select a lab(s)"
                            name="lab"
                            isMulti
                        />
                    </div>
                } if (this.state.SemArray !== undefined && this.state.SemArray.length !== 0) {
                    sem_choices = 
                    <div>
                        <i style={spacingStyle}>Seminars (choose at least one):</i>
                        <Select
                            value={this.state.SelectedSems}
                            defaultValue={this.state.SelectedSems}
                            options={this.state.SemDisplays}
                            closeMenuOnSelect={false}
                            components={animatedComponents}
                            onChange={this.handleChange}
                            placeholder="Select a seminar(s)"
                            name="sem"
                            isMulti
                        />
                    </div>
                }
                if (this.state.RecArray !== undefined && this.state.RecArray.length !== 0) {
                    rec_choices = 
                    <div>
                        <i style={spacingStyle}>Recitations (choose at least one):</i>
                        <Select
                            value={this.state.SelectedRecs}
                            defaultValue={this.state.SelectedRecs}
                            options={this.state.RecDisplays}
                            closeMenuOnSelect={false}
                            components={animatedComponents}
                            onChange={this.handleChange}
                            placeholder="Select a recitation(s)"
                            name="rec"
                            isMulti
                        />
                    </div>
                }
                add_rm_buttons = 
                    <div style={buttonStyle}>
                        <Button variant="contained" color="primary" onClick={this.handleAdd}>
                            Add Sections to Schedule
                        </Button>
                    </div>
                }
        }

        return (
            <div>
                <div className="banner">
                {no_alert}
                {some_alert}
                </div>
                <div className = "left-div">
                    {/* SEARCH FOR CLASS */}
                    <div id="top-row">
                        <h3 style={{textAlign:'center'}}>umich scheduler (w/    no conflicts)</h3>
                        <p id="blurb">add as many sections as you want, let the scheduler do the rest of the work for you!</p>
                        <Button variant="outlined" color="primary" startIcon={<GitHubIcon/>} onClick={this.showSource}>Source</Button>
                    </div>
                    
                    {search_bar}
                    
                    {/*HEADER FOR SCROLLER*/}
                    <hr/>
                    
                    {/* SCROLLER ITSELF*/}
                    {class_btns}
                    {back_btn}
                    {displayed_scroller}

                    <hr/>
                    {/* BUTTONS FOR ADDING OR REMOVING A CLASS*/}
                    {class_header}
                    {lecture_choices}
                    {disc_choices}
                    {lab_choices}
                    {sem_choices}
                    {rec_choices}
                    {add_rm_buttons}
                    {del_btn}
                </div>
                <div className = "right-div">
                    <TestCal
                    selectedIntervals={this.state.selectedIntervals}
                    onEventClick={this.handleEvClick}/>
                    {nextprev}
                </div>
            </div>
        );
    }
}