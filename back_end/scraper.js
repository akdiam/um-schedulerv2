const request = require("request-promise")
const cheerio = require("cheerio");

const section_ten = ["AEROSP205","PHYSICS136", "PHYSICS141", "PHYSICS236", "MATH215", "ALA 170", "EEB372", "ENVIRON372", "PSYCH305"]
const section_two = ["BIOLOGY120", "AAS338", "ALA322", "ALA370", "AMCULT103", "AMCULT213", "AMCULT311", "BIOLOGY117", "COMPLIT376", "EARTH106", "EARTH109",
                    "EARTH 112", "EARTH113", "EARTH218", "EARTH223", "ENGLISH317", "ENVIRON233", "ENVIRON304", "HISTART393", "HISTORY407", "HISTORY491",
                    "INSTHUM311", "IOE425", "ITALIAN101", "LATINOAM213", "MATH424", "PAT201", "PORTUG280", "PSYCH121", "PSYCH324", "RCHUMS425", "RCHUMS426",
                    "SLAVIC470", "SOC324", "SPANISH381", "SPANISH420", "SPANISH426", "STATS412", "STATS449", "TCHNCLCM380", "UC390"]
const section_hunnid = ["APPPHYS 576", "ECON101", "ECON102", "ECON251", "ENGR151", "MATSCIE220", "MATSCIE250", "STATS206", "STATS250"]
const section_ooo = ["CEE211", "CEE265", "CEE312", "CEE351", "CEE365", "CEE412", "CEE413"]
const section_three = ["AAS104", "AAS290", "AMCULT358", "ANTHRCULT458", "DIGITAL258", "DIGITAL358", "EEB401", "ENVIRON139", "FRENCH103", "FTVM366", "JUDAIC150",
                        "RCARTS290", "SPANISH289"]
const section_six = ["AAS495"]
const section_twenty = ["MATH216"]
// this gets the class info for a class in an easy to read format (open/closed data for all sections)
fos = (input) => (async() => {
    const class_name = input;
    let class_page = `https://www.lsa.umich.edu/cg/cg_detail.aspx?content=2310${class_name}001&termArray=f_20_2310"`;
    //let class_page = '';
    if (class_name.includes("CHEM")) {
        class_page =  `https://www.lsa.umich.edu/cg/cg_detail.aspx?content=2310${class_name}100&termArray=f_20_2310"`;
    } 
    if (section_ten.includes(class_name)) {
        class_page = `https://www.lsa.umich.edu/cg/cg_detail.aspx?content=2310${class_name}010&termArray=f_20_2310"`
    }
    if (section_two.includes(class_name)) {
        class_page = `https://www.lsa.umich.edu/cg/cg_detail.aspx?content=2310${class_name}002&termArray=f_20_2310"`
    }
    if (section_ooo.includes(class_name)) {
        class_page = `https://www.lsa.umich.edu/cg/cg_detail.aspx?content=2310${class_name}101&termArray=f_20_2310"`
    }
    if (section_hunnid.includes(class_name)) {
        class_page = `https://www.lsa.umich.edu/cg/cg_detail.aspx?content=2310${class_name}100&termArray=f_20_2310"`
    }
    if (section_three.includes(class_name)) {
        class_page = `https://www.lsa.umich.edu/cg/cg_detail.aspx?content=2310${class_name}003&termArray=f_20_2310"`
    }
    if (section_six.includes(class_name)) {
        class_page = `https://www.lsa.umich.edu/cg/cg_detail.aspx?content=2310${class_name}006&termArray=f_20_2310"`
    }
    if (section_twenty.includes(class_name)) {
        class_page = `https://www.lsa.umich.edu/cg/cg_detail.aspx?content=2310${class_name}020&termArray=f_20_2310"`
    }
    
    const response = await request({
        uri: class_page,
        headers: {
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9",
            "Accept-Encoding": "gzip, deflate, br",
            "Accept-Language": "en-US,en;q=0.9"
        },
        gzip: true, 
    });

    // class_data contains all the enrollment data we need for each section of a specific class
    let class_data = []
    
    // titles of each of the infos we get from each section
    let titles = ['Section', 'Instruction Mode', 'Class No', 'Enroll Stat', 'Open Seats', 'Wait List'];

    // load selector
    let $ = cheerio.load(response)
    // each course section has its info hidden in this path of divs 
    let course_schedule = $('div[id="ClassSchedule"] > div[id="classScheduleBody"] > div[class="panel-body"] > div[class="row clsschedulerow toppadding_main bottompadding_main"] > div[class="col-md-12"] > div[class="row"]')
    .each((i, item) => {
        const $item = $(item);

        // for each section, push all elements into new_inner array
        const new_inner = {}
        let counter = 0;

        // iterate through all of the divs named 'col-md-1': they're where the necessary info lies
        let other = $item.find('div.col-md-1').each((j, inner_text) => {
            const $content = $(inner_text);
            let actual_content = $content.text().trim()
            new_inner[titles[counter]] = actual_content
            ++counter;
        });

        //what's actually important to us:
        let relevant_info = {}
        relevant_info['class_no'] = parseInt(new_inner['Class No'].match(/\d+/)[0]);
        relevant_info['open_seats'] = parseInt(new_inner['Open Seats'].match(/\d+/)[0]);

        class_data.push(relevant_info)
    })  

    return class_data
})();

module.exports = {
    fos
};
