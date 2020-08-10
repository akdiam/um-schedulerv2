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
import {EdgeCases} from './edge_cases'
import moment from 'moment'
import Moment from 'moment'
import { extendMoment } from 'moment-range';
import TextField from '@material-ui/core/TextField'
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import ExpandLessIcon from '@material-ui/icons/ExpandLess';
import Grid from '@material-ui/core/Grid'
import PublicIcon from '@material-ui/icons/Public';
import HttpsIcon from '@material-ui/icons/Https';
import HelpIcon from '@material-ui/icons/Help';
import Alert from '@material-ui/lab/Alert';
import Tooltip from '@material-ui/core/Tooltip';

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
            selectedIntervalz: [],
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
        this.handleBack = this.handleBack.bind(this);
        this.handleEvClick = this.handleEvClick.bind(this);
        this.handleDisplay = this.handleDisplay.bind(this);
        this.handleAdd = this.handleAdd.bind(this);
    }

    controller = new AbortController()
    //mySignal = this.controller.signal;
    is_loading = false;
    is_loading_btn = false;

    componentDidMount = () => {
        this.restoreLocalStorage()
        let classname = this.state.CurrentSubj+this.state.SelectedClass;
        this.fetchClassData(classname)
        
        window.addEventListener(
            "beforeunload",
            this.saveToLocalStorage.bind(this)
        );
    }

    componentWillUnmount = () => {
        window.removeEventListener(
            "beforeunload",
            this.saveToLocalStorage.bind(this)
        );
    
        // saves if component has a chance to unmount
        this.saveToLocalStorage();
    }

    handleMoments = (unformatted_selected) => {
        for (let i = 0; i < unformatted_selected.length; ++i) {
            let end_hr = moment(unformatted_selected[i]['end']).hours()
            let end_day = moment(unformatted_selected[i]['end']).days()
            let end_min = moment(unformatted_selected[i]['end']).minute()
            let start_hr = moment(unformatted_selected[i]['start']).hours()
            let start_day = moment(unformatted_selected[i]['start']).days()
            let start_min = moment(unformatted_selected[i]['start']).minute()
            unformatted_selected[i]['start'] = moment({h: start_hr, m: start_min}).day(start_day);
            unformatted_selected[i]['end'] = moment({h: end_hr, m: end_min}).day(end_day);
        }
        return unformatted_selected;
    }

    handleAllSelectedMoments = (all_unformatted_selected) => {
        for (let i = 0; i < all_unformatted_selected.length; ++i) {
            for (let k = 0; k < all_unformatted_selected[i].length; ++k) {
                let end_hr = moment(all_unformatted_selected[i][k]['end']).hours()
                let end_day = moment(all_unformatted_selected[i][k]['end']).days()
                let end_min = moment(all_unformatted_selected[i][k]['end']).minute()
                let start_hr = moment(all_unformatted_selected[i][k]['start']).hours()
                let start_day = moment(all_unformatted_selected[i][k]['start']).days()
                let start_min = moment(all_unformatted_selected[i][k]['start']).minute()
                all_unformatted_selected[i][k]['start'] = moment({h: start_hr, m: start_min}).day(start_day);
                all_unformatted_selected[i][k]['end'] = moment({h: end_hr, m: end_min}).day(end_day);
            }
        }
        return all_unformatted_selected
    }

    handleTimeInIntervals = (all_unformatted_intervals) => {
        for (let i = 0; i < all_unformatted_intervals.length; ++i) {
            for (let key in all_unformatted_intervals[i]) {
                if (typeof all_unformatted_intervals[i][key] !== 'string') {
                    for (let outer_i = 0; outer_i < all_unformatted_intervals[i][key].length; ++outer_i) {
                        for (let inner_i = 0; inner_i < all_unformatted_intervals[i][key][outer_i].length; ++inner_i) {
                            let end_hr = moment(all_unformatted_intervals[i][key][outer_i][inner_i]['end']).hours()
                            let end_day = moment(all_unformatted_intervals[i][key][outer_i][inner_i]['end']).days()
                            let end_min = moment(all_unformatted_intervals[i][key][outer_i][inner_i]['end']).minute()
                            let start_hr = moment(all_unformatted_intervals[i][key][outer_i][inner_i]['start']).hours()
                            let start_day = moment(all_unformatted_intervals[i][key][outer_i][inner_i]['start']).days()
                            let start_min = moment(all_unformatted_intervals[i][key][outer_i][inner_i]['start']).minute()
                            all_unformatted_intervals[i][key][outer_i][inner_i]['start'] = moment({h: start_hr, m: start_min}).day(start_day);
                            all_unformatted_intervals[i][key][outer_i][inner_i]['end'] = moment({h: end_hr, m: end_min}).day(end_day);
                        }
                    }
                }
            }
        }
        return all_unformatted_intervals
    }

    restoreLocalStorage = () => { 
        // because of the way the moments from localstorage are stringified, the formatting gets super
        // messed up and i have to call all these handle formatting functions in this function 

        let unformatted_selected = JSON.parse(localStorage.getItem('selectedIntervalz'))
        let all_unformatted_selected = JSON.parse(localStorage.getItem('allSelectedIntervals'))
        let formatted_selected = []
        if (unformatted_selected) {
            formatted_selected = this.handleMoments(unformatted_selected)
        }
        let all_formatted_selected = []
        if (all_unformatted_selected) {
            all_formatted_selected = this.handleAllSelectedMoments(all_unformatted_selected)
        }

        let real_scheduled = []
        if (JSON.parse(localStorage.getItem('ScheduledClasses'))) {
            real_scheduled = JSON.parse(localStorage.getItem('ScheduledClasses'))
        }

        let real_all = []
        let all_unformatted_intervals = JSON.parse(localStorage.getItem('allIntervals'))
        if (all_unformatted_intervals) {
            real_all = this.handleTimeInIntervals(all_unformatted_intervals)
        }

        let real_curr = 0
        if (JSON.parse(localStorage.getItem('curr_index'))) {
            real_curr = JSON.parse(localStorage.getItem('curr_index'))
        }

        let real_num = 1
        if (JSON.parse(localStorage.getItem('numSchedules'))) {
            real_num = JSON.parse(localStorage.getItem('numSchedules'))
        }

        this.setState({
            ScheduledClasses: real_scheduled,
            selectedIntervalz: formatted_selected,
            allIntervals: real_all,
            allSelectedIntervals: all_formatted_selected,
            curr_index: real_curr,
            numSchedules: real_num,
        })
    }
    
    saveToLocalStorage = () => {
        // for every item in React state
        localStorage.setItem('ScheduledClasses', JSON.stringify(this.state.ScheduledClasses))
        localStorage.setItem('selectedIntervalz', JSON.stringify(this.state.selectedIntervalz))
        localStorage.setItem('allIntervals', JSON.stringify(this.state.allIntervals))
        localStorage.setItem('allSelectedIntervals', JSON.stringify(this.state.allSelectedIntervals))
        localStorage.setItem('curr_index', JSON.stringify(this.state.curr_index))
        localStorage.setItem('numSchedules', JSON.stringify(this.state.numSchedules))
    }

    fetchClassData = async(classname) => {
        return await fetch(`${process.env.REACT_APP_SERVER_URL}/${classname}`, {signal: this.controller.signal})
            .then(res => {
              return res.json()
            })
            .catch(error => {
                console.error(error);
            })
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
        let ampm = unformattedTime.split(/[- 0123456789]/).slice(-1)[0]
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

    check_forgotten = (potential, new_all) => {
        let forgotten_classes = []
        //for (let potential_class in potential) {
        for (let i = 0; i < potential.length; ++i) { 
            let class_in_sched = false;
            //for (let indiv_sched in new_all) {
            for (let j = 0; j < new_all.length; ++j) { 
                //for (let slot in indiv_sched) {
                for (let k = 0; k < new_all[j].length; ++k) { 
                    if (new_all[j][k]['value'] === potential[i]) {
                        class_in_sched = true;
                        continue;
                    }
                }
            }
            if (!class_in_sched) {
                forgotten_classes.push(potential[i])
            }
        }
        return forgotten_classes
    }

    // return true if this is an edgecase, return false otherwise
    // class one is the lec, class two is the dis/lab
    is_edgecase = (class_one, class_two) => {
        let one_uid = class_one['uid']
        let two_uid = class_two['uid']
        if (one_uid !== two_uid) {
            return false
        }
        if (!(one_uid in EdgeCases)) {
            return false
        }
        if (one_uid in EdgeCases) {
            for (let key in EdgeCases[one_uid]) {
                // if val of class one includes 'lec 010' or whatever
                if (class_one['value'].includes(key)) {
                    for (let i = 0; i < EdgeCases[one_uid][key].length; ++i) {
                        if (class_two['value'].includes(EdgeCases[one_uid][key][i])) {
                            return false
                        }
                    }   
                }
            }
        } 
        return true
    }

    // add to array of all selectedIntervals 
    update_selectedIntervals = (all_schedules, interval_obj, type) => {
        let conflict_counter = 0;
        let edgecase_counter = 0;
        let missing_classes = '';
        let classes_to_remove = [];
        let unadded = []
        let forgotten_classes = []
        let new_all = []
        if (interval_obj.length === 0) {
            return [all_schedules, true, classes_to_remove, forgotten_classes]
        }

        if (all_schedules.length === 0) {
            for (let i = 0; i < interval_obj.length; ++i) {
                let inner_arr = [];
                for (let j = 0; j < interval_obj[i].length; ++j) {
                    inner_arr.push(interval_obj[i][j])
                }
                new_all.push(inner_arr)
            }
            return [new_all, true, classes_to_remove, forgotten_classes]
        } 
        // add to existing selected intervals
        else {
            // over container of all intervals 
            for (let k = 0; k < interval_obj.length; ++k) {
                //(allSelectedIntervals)
                let inner_conflict_counter = 0;
                let inner_edgecase_counter = 0;
                for (let i = 0; i < all_schedules.length; ++i) {
                    // over each specific selectedInterval
                    let has_conflict = false;
                    let has_edgecase = false;
                    for (let j = 0; j < all_schedules[i].length; ++j) {
                        // over each time interval within the interval_obj
                        for (let h = 0; h < interval_obj[k].length; ++h) {
                            if (this.check_conflicts(all_schedules[i][j]['start'], all_schedules[i][j]['end'], 
                                                    interval_obj[k][h]['start'], interval_obj[k][h]['end'])) {
                                has_conflict = true;
                            } 
                            if (this.is_edgecase(all_schedules[i][j], interval_obj[k][h])) {
                                has_edgecase = true;
                            }
                        }
                    } 
                    if (!has_conflict && !has_edgecase) {
                        let concatted_sched = all_schedules[i].concat(interval_obj[k])
                        new_all.push(concatted_sched)
                        //++noconflict_counter
                    } 
                    else {
                        if (has_conflict) {
                            ++inner_conflict_counter
                            for (let o = 0; o < all_schedules[i].length; ++o) {
                                if (!(all_schedules[i][o]['value'] in unadded)) {
                                    unadded.push(all_schedules[i][o]['value'])
                                }
                            }
                        }
                        if (has_edgecase) {
                            ++inner_edgecase_counter
                            for (let o = 0; o < all_schedules[i].length; ++o) {
                                if (!(all_schedules[i][o]['value'] in unadded)) {
                                    unadded.push(all_schedules[i][o]['value'])
                                }
                            }
                        }
                    }
                }
                if (inner_conflict_counter === all_schedules.length) {
                    ++conflict_counter
                    if (!missing_classes.includes(interval_obj[k][0]['value'])) {
                        missing_classes += (interval_obj[k][0]['value'] + ', ')
                        classes_to_remove.push(interval_obj[k][0]['value'])
                    }
                } 
                if (inner_edgecase_counter === all_schedules.length) {
                    ++edgecase_counter
                    if (!missing_classes.includes(interval_obj[k][0]['value'])) {
                        missing_classes += (interval_obj[k][0]['value'] + ', ')
                        classes_to_remove.push(interval_obj[k][0]['value'])
                    }
                }
            }
        }
        if (conflict_counter === interval_obj.length || edgecase_counter === interval_obj.length) {
            //alert(`Couldn't add any ${type} that you selected to your schedule because all brought conflicts`)
            return [all_schedules, false, classes_to_remove, forgotten_classes];
        } 
        else {
            forgotten_classes = this.check_forgotten(unadded, new_all)
            if (missing_classes.length === 0) {
                return [new_all, true, classes_to_remove, forgotten_classes];
            } else {
                //alert(`Couldn't add ${missing_classes} to your schedule because they brought conflicts`)
                return [new_all, true, classes_to_remove, forgotten_classes];
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
                //can_proceed: true,
            })
        } 
        //let class_num = event.currentTarget.id;
        // if the user clicks on a class...
        if (this.state.showClassList) {
            if (this.is_loading) {
                this.controller.abort()
                this.controller = new AbortController()
            }

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

            this.is_loading = true;
            await this.fetchClassData(this.state.CurrentSubj+class_num.trim(), { signal: this.controller.signal })
                .then(class_data => {
                    openclose_temp.push(class_data);
                }); 
            this.is_loading = false;
            
            if (openclose_temp[0]) {
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
    }

    // updates the appropriate state arrays 
    // when class times are selected
    handleChange = (value, action) => {
        if (action.name === 'lecs') {
            this.setState({SelectedLecs:value})
        } if (action.name === 'disc') {
            this.setState({SelectedDiscs:value})
        } if (action.name === 'lab') {
            this.setState({SelectedLabs:value})
        } if (action.name === 'sem') {
            this.setState({SelectedSems:value})
        } if (action.name === 'rec') {
            this.setState({SelectedRecs:value})
        }
    }

    // backkkkkkkk
    handleBack = () => {
        this.controller.abort()
        this.controller = new AbortController()
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
            show_desc: false,
            no_overall_sections: "Oops! Couldn't add any ",
            some_overall_sections: "Oops! Couldn't add ",
            //can_proceed: false,
        })
        
    }

    // deletes classes that are no longer available (because of conflicts) from allIntervals
    // called in handleAdd()
    deleteIntervals = (temp_allintervals, forgotten_nodupes) => {

        // takes in (forgotten_nodupes), which is an array of classes that are no longer in schedules after this add
        for (let k=0; k<forgotten_nodupes.length; ++k) {
            for (let i=0; i<temp_allintervals.length; ++i) {
                // filter all classes that aren't in forgotten_nodupes
                if ('LEC' in temp_allintervals[i]) {
                    temp_allintervals[i]['LEC'] = temp_allintervals[i]['LEC'].filter(subj => subj[0]['value'] !== forgotten_nodupes[k])
                }
                if ('DIS' in temp_allintervals[i]) {
                    temp_allintervals[i]['DIS'] = temp_allintervals[i]['DIS'].filter(subj => subj[0]['value'] !== forgotten_nodupes[k])
                }   
                if ('LAB' in temp_allintervals[i]) {
                    temp_allintervals[i]['LAB'] = temp_allintervals[i]['LAB'].filter(subj => subj[0]['value'] !== forgotten_nodupes[k])
                }   
                if ('SEM' in temp_allintervals[i]) {
                    temp_allintervals[i]['SEM'] = temp_allintervals[i]['SEM'].filter(subj => subj[0]['value'] !== forgotten_nodupes[k])
                }   
                if ('REC' in temp_allintervals[i]) {
                    temp_allintervals[i]['REC'] = temp_allintervals[i]['REC'].filter(subj => subj[0]['value'] !== forgotten_nodupes[k])
                }   
            }
        }
        return temp_allintervals
    }

    // deletes classes that are no longer available (because of conflicts) from ScheduledClasses
    // called in handleAdd()
    deleteScheduled = (temp_scheduled, forgotten_nodupes) => {

        for (let k=0; k<forgotten_nodupes.length; ++k) {
            for (let i=0; i<temp_scheduled.length; ++i) {
                if ('lecs' in temp_scheduled[i]) {
                    temp_scheduled[i]['lecs'] = temp_scheduled[i]['lecs'].filter(subj => forgotten_nodupes[k].includes(subj['description']['value']) === false)
                }
                if ('discs' in temp_scheduled[i]) {
                    temp_scheduled[i]['discs'] = temp_scheduled[i]['discs'].filter(subj => forgotten_nodupes[k].includes(subj['description']['value']) === false)
                }   
                if ('labs' in temp_scheduled[i]) {
                    temp_scheduled[i]['labs'] = temp_scheduled[i]['labs'].filter(subj => forgotten_nodupes[k].includes(subj['description']['value']) === false)
                }   
                if ('sems' in temp_scheduled[i]) {
                    temp_scheduled[i]['sems'] = temp_scheduled[i]['sems'].filter(subj => forgotten_nodupes[k].includes(subj['description']['value']) === false)
                }   
                if ('recs' in temp_scheduled[i]) {
                    temp_scheduled[i]['recs'] = temp_scheduled[i]['recs'].filter(subj => forgotten_nodupes[k].includes(subj['description']['value']) === false)
                }   
            }
        }
        return temp_scheduled
    }

    deleteMetaIntervalObj = (intervalObj, indiv_forgotten) => {
        if ('LEC' in intervalObj) {
            intervalObj['LEC'] = intervalObj['LEC'].filter(subj => subj[0]['value'] !== indiv_forgotten)
        }
        return intervalObj
    }

    deleteMetaObj = (obj, indiv_forgotten) => {
        if ('lecs' in obj) {
            obj['lecs'] = obj['lecs'].filter(subj => indiv_forgotten.includes(subj['description']['value'].toString()) === false)
        }
        return obj
    }

    // adds selected values to an array called ScheduledClasses
    handleAdd = () => {
        // add all of the selected options to the calendar display array
        let obj = {};
        let intervalObj = {};
        let tempAll = ''
        let tempWarn = ''
        let types = []
        let forgotten = []
        let temp_allintervals = this.state.allIntervals
        let temp_scheduled = this.state.ScheduledClasses
        // seriously keeps track of all selected
        let temp_allSelectedIntervals = this.state.allSelectedIntervals
        obj["class"] = this.state.CurrentSubj+this.state.SelectedClass;
        intervalObj["class"] = this.state.CurrentSubj+this.state.SelectedClass;
        // push all of the selected class info into the scheduled classes container in state
        if (this.state.SelectedLecs !== null && this.state.SelectedLecs.length !== 0) {
            types.push('lecs')
            obj["lecs"]=this.handleScheduling(this.state.SelectedLecs);
            // set up selectedInterval (currently displayed classes)
            // add everything selected lec into all intervals, choose first of those to actually display
            intervalObj["LEC"] = this.addAllIntervals(obj["lecs"], obj["class"], "LEC") 
            let temp = this.update_selectedIntervals(temp_allSelectedIntervals, intervalObj["LEC"], "LEC")
            temp_allSelectedIntervals = temp[0]

            // if these lectures didn't fit, don't include them in allintervals or scheduledclasses
            // this helps when a class is deleted so no surprise conflicts are made when rescheduling
            // update tempAll warning string
            if (!temp[1]) {
                tempAll += "LEC, "
                delete obj["lecs"]
                delete intervalObj["LEC"]
            } else {
                // if there were classes the user selected that couldn't be added, filter that from both obj and intervalObj
                // also add the classes to tempWarn warning string
                if (temp[2].length !== 0) {
                    for (let i = 0; i < temp[2].length; ++i) {
                        tempWarn += (temp[2][i] + ", ")
                        intervalObj["LEC"] = intervalObj["LEC"].filter(subj => subj[0]['value'] !== temp[2][i])
                        obj['lecs'] = obj['lecs'].filter(subj => temp[2][i].includes(subj['description']['value']) === false)
                    }
                }
                // if there were pre-existing classes that got removed because they all conflicted, 
                // concat those with forgotten to keep track for the hover info on the class buttons
                if (temp[3].length !== 0) {
                    forgotten = forgotten.concat(temp[3])
                }
            }
        }
        if (this.state.SelectedDiscs !== null && this.state.SelectedDiscs.length !== 0) {
            types.push('discs')
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
                        obj['discs'] = obj['discs'].filter(subj => temp[2][i].includes(subj['description']['value']) === false)
                    }
                }
                if (temp[3].length !== 0) {
                    forgotten = forgotten.concat(temp[3])
                }
            }
        }
        if (this.state.SelectedLabs !== null && this.state.SelectedLabs.length !== 0) {
            types.push('labs')
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
                        obj['labs'] = obj['labs'].filter(subj => temp[2][i].includes(subj['description']['value']) === false)
                    }
                }
                if (temp[3].length !== 0) {
                    forgotten = forgotten.concat(temp[3])
                }
            }
        }
        if (this.state.SelectedSems !== null && this.state.SelectedSems.length !== 0) {
            types.push('sems')
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
                        obj['sems'] = obj['sems'].filter(subj => temp[2][i].includes(subj['description']['value']) === false)
                    }
                }
                if (temp[3].length !== 0) {
                    forgotten = forgotten.concat(temp[3])
                }
            }
        }
        if (this.state.SelectedRecs !== null && this.state.SelectedRecs.length !== 0) {
            types.push('recs')
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
                        obj['recs'] = obj['recs'].filter(subj => temp[2][i].includes(subj['description']['value']) === false)
                    }
                }
                if (temp[3].length !== 0) {
                    forgotten = forgotten.concat(temp[3])
                }
            }
        }

        // if everything is empty, avoid changing the state because nothing needs to be modified
        if (!('lecs' in obj) && !('discs' in obj) && !('labs' in obj) && !('sems' in obj) && !('recs' in obj)) {
            // tell user what sections/classes couldn't be added
            this.setState({
                no_overall_sections: "Oops! Couldn't add any " + tempAll,
                some_overall_sections: "Oops! Couldn't add " + tempWarn,
            })
            return
        }
        // if everything is empty, avoid changing the state because nothing needs to be modified
        if (!('LEC' in intervalObj) && !('DIS' in intervalObj) && !('LAB' in intervalObj) 
        && !('REC' in intervalObj) && !('SEM' in intervalObj)) {
            // tell user what sections/classes couldn't be added
            this.setState({
                no_overall_sections: "Oops! Couldn't add any " + tempAll,
                some_overall_sections: "Oops! Couldn't add " + tempWarn,
            })
            return
        }
        
        // removes 'forgotten' classes (that don't exist anymore because of conflicts)
        // from allIntervals and ScheduledClasses
        if (forgotten.length !== 0) {
            let forgotten_nodupes = []
            for (let i = 0; i < forgotten.length; ++i) {
                if (!(forgotten_nodupes.includes(forgotten[i]))) {
                    forgotten_nodupes.push(forgotten[i])
                }
            }

            for (let i = 0; i < forgotten_nodupes.length; ++i) {
                if (forgotten_nodupes[i].includes(this.state.CurrentSubj+this.state.SelectedClass)) {
                    intervalObj = this.deleteMetaIntervalObj(intervalObj, forgotten_nodupes[i])
                    obj = this.deleteMetaObj(obj, forgotten_nodupes[i])
                }
            }
            temp_allintervals = this.deleteIntervals(temp_allintervals, forgotten)
            temp_scheduled = this.deleteScheduled(temp_scheduled, forgotten)
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
            ScheduledClasses: temp_scheduled.concat(obj),
            allIntervals: temp_allintervals.concat(intervalObj),
            selectedIntervalz: temp_allSelectedIntervals[0],
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
            if (('lecs') in new_array[i]) {
                let temp = this.update_selectedIntervals(filtered_scheds, new_array_all_intervals[i]['LEC'], "LEC")
                filtered_scheds = temp[0]
            }   
            if (('discs') in new_array[i]) {
                let temp = this.update_selectedIntervals(filtered_scheds, new_array_all_intervals[i]['DIS'], "DIS")
                filtered_scheds = temp[0]
            }
            if (('labs') in new_array[i]) {
                let temp = this.update_selectedIntervals(filtered_scheds, new_array_all_intervals[i]['LAB'], "LAB")
                filtered_scheds = temp[0]
            }
            if (('sems') in new_array[i]) {
                let temp = this.update_selectedIntervals(filtered_scheds, new_array_all_intervals[i]['SEM'], "SEM")
                filtered_scheds = temp[0]
            }
            if (('recs') in new_array[i]) {
                let temp = this.update_selectedIntervals(filtered_scheds, new_array_all_intervals[i]['REC'], "REC")
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
            selectedIntervalz: new_selected_intervals,
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
            selectedIntervalz: this.state.allSelectedIntervals[new_curr_index],
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
            selectedIntervalz: this.state.allSelectedIntervals[new_curr_index],
        })
    }

    // if a user clicks on a class button
    handleEvClick = async(event) => {
        if (this.is_loading_btn) {
            this.controller.abort()
            this.controller = new AbortController()
        }

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
        this.is_loading_btn = true;
        await this.fetchClassData(inner_text+inner_num, {signal: this.controller.signal})
            .then(class_data => {
                openclose_temp.push(class_data);
            }); 
        this.is_loading_btn = false;
        
        if (openclose_temp[0]) {
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
                show_desc: true,
                openClosedDisplays: openclose_temp[0],
                no_overall_sections: "Oops! Couldn't add any ",
                some_overall_sections: "Oops! Couldn't add ",
            })
        }
        

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
        window.open('https://github.com/akdiam/um-schedulerv2#%EF%B8%8F-umscheduler')
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

    updateToolTip = item => {
        let tool_tip = ''
        if ('lecs' in item) {
            tool_tip += "Lectures: "
            for (let i = 0; i < item['lecs'].length; ++i) {
                if (i === item['lecs'].length - 1) {
                    tool_tip += (item['lecs'][i]['section'] + '\n')
                } else {
                    tool_tip += (item['lecs'][i]['section'] + ', ')
                }   
            }
        }
        if ('discs' in item) {
            tool_tip += "Discussions: "
            for (let i = 0; i < item['discs'].length; ++i) {
                if (i === item['discs'].length - 1) {
                    tool_tip += (item['discs'][i]['section'] + '\n')
                } else {
                    tool_tip += (item['discs'][i]['section'] + ', ')
                }   
            }
        }
        if ('labs' in item) {
            tool_tip += "Labs: "
            for (let i = 0; i < item['labs'].length; ++i) {
                if (i === item['labs'].length - 1) {
                    tool_tip += (item['labs'][i]['section'] + '\n')
                } else {
                    tool_tip += (item['labs'][i]['section'] + ', ')
                }   
            }
        }
        if ('sems' in item) {
            tool_tip += "Seminars: "
            for (let i = 0; i < item['sems'].length; ++i) {
                if (i === item['sems'].length - 1) {
                    tool_tip += (item['sems'][i]['section'] + '\n')
                } else {
                    tool_tip += (item['sems'][i]['section'] + ', ')
                }   
            }
        }
        if ('recs' in item) {
            tool_tip += "Recitations: "
            for (let i = 0; i < item['recs'].length; ++i) {
                if (i === item['recs'].length - 1) {
                    tool_tip += (item['recs'][i]['section'] + '\n')
                } else {
                    tool_tip += (item['recs'][i]['section'] + ', ')
                }   
            }
        } 
        return tool_tip;
    }

    handleSubmit = event => {
        event.preventDefault();
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
        let cal = <TestCal
        selectedIntervals={this.state.selectedIntervalz}
        onEventClick={this.handleEvClick}/>
        // sdsd

        if (this.state.no_overall_sections !== "Oops! Couldn't add any ") {
            window.scrollTo(0, 0)
            no_alert = <Alert onClose={this.handleNoAlert} severity="error">
                {this.state.no_overall_sections}from {this.state.FullSelectedClass} because all of these create conflict with your current schedule(s). 
                This could be because of either time conflicts or section number incompatiblities. Check the course guide if you're unsure of this class's section compatibilities.
                </Alert>
        }
        if (this.state.some_overall_sections !== "Oops! Couldn't add ") {
            window.scrollTo(0, 0)
            some_alert = <Alert onClose={this.handleSomeAlert} severity="warning">
                {this.state.some_overall_sections}because all of these sections create conflict with your current schedule(s). 
                This could be because of either time conflicts or section number incompatiblities. Check the course guide if you're unsure of this class's section compatibilities.
                </Alert>
        }
        
        if (this.state.ScheduledClasses.length !== 0) {
            class_btns = 
            <div>
                {this.state.ScheduledClasses.map((item, index) => (
                    <Tooltip title={this.updateToolTip(item)} placement="top" key={index}>
                        <Button color = "primary" variant="outlined" size="medium" onClick={this.handleEvClick} key={index}>
                            {item.class}
                        </Button>
                    </Tooltip>
                ))}
                <hr/>
            </div>
        }
        

        {/* controls the display for subject listing */}
        if (this.state.showSubjs && !this.state.showClassList && !this.state.showClassDesc) {
            search_bar = 
            <form onSubmit={this.handleSubmit}>
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
            <form onSubmit={this.handleSubmit}>
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
            <form onSubmit={this.handleSubmit}> 
                <TextField size="small" variant="outlined" id="search_class" label="Search for a Class" onChange={this.handleSearch}/> 
            </form>

            back_btn = 
            <Button variant="contained" size="small" onClick={this.handleBack} color="secondary" id="back">
                Back to Subjects
            </Button>

            let description = ClassDescs[this.state.CurrentSubj].filter(subj => subj['num'] === parseInt(this.state.SelectedClass))
            
            if (this.state.show_desc) {
                class_header = 
                <Grid container >
                    <Grid item xs /*justify = "flex-start" direction = "column"*/>
                        <strong id="fullname">{this.state.FullSelectedClass}</strong>
                        <p id="descriptions">{this.state.SpecificClassList[0]['Units']} credits. {description[0]['desc']}</p>
                    </Grid>
                    <Grid item xs = {3} /*direction="column" justify="space-between" alignItems="center"*/>
                        <Button variant="outlined" size="small" color="secondary" startIcon={<ExpandLessIcon/>} onClick={this.handleExpand}>Less</Button>
                        <Grid>
                            <Button variant="outlined" size="small" color="primary" startIcon={<PublicIcon/>} onClick={this.handleCG}>Course Guide</Button>
                            <Button variant="outlined" size="small" color="primary" startIcon={<HttpsIcon/>} onClick={this.handleATLAS}>ATLAS</Button>
                        </Grid>
                    </Grid>
                </Grid>
            } else {
                class_header = 
                <Grid container >
                    <Grid item xs /*justify = "flex-start" direction = "column"*/>
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
                        <h3 style={{textAlign:'center'}}>umscheduler</h3>
                        <p id="blurb">schedule building made easy</p>
                        <Button variant="outlined" color="primary" startIcon={<HelpIcon/>} onClick={this.showSource}>Help me</Button>
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
                    {cal}
                    {nextprev}
                </div>
            </div>
        );
    }
}