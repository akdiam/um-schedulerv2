const request = require("request-promise")
const cheerio = require("cheerio");

// this gets the class info for a class in an easy to read format (open/closed data for all sections)
fos = (input) => (async() => {
    const class_name = input;
    let class_page = '';
    if (class_name.includes("CHEM")) {
        class_page =  `https://www.lsa.umich.edu/cg/cg_detail.aspx?content=2310${class_name}100&termArray=f_20_2310"`;
    } else {
        class_page = `https://www.lsa.umich.edu/cg/cg_detail.aspx?content=2310${class_name}001&termArray=f_20_2310"`;
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
