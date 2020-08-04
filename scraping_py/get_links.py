# RUN THIS TO GET LINKS TO ALL CLASSES IN CG AND IN ATLAS

import json

with open('FA2020.json') as f:
    data = json.load(f)

class_names = ["AAS", "AERO", "AEROSP", "AES", "ALA", "AMCULT", "ANATOMY", "ANTHRARC", "ANTHRBIO", "ANTHRCUL", "APPPHYS", "ARABAM", 
            "ARABIC", "ARCH", "ARMENIAN", "ARTDES", "ARTSADMN", "ASIAN", "ASIANLAN", "ASIANPAM", "ASTRO", "AUTO", "BA", "BCS", 
            "BIOINF", "BIOLCHEM", "BIOLOGY", "BIOMEDE", "BIOPHYS", "BIOSTAT", "CATALAN", "CEE", "CHE", "CHEM", "CJS", "CLARCH", 
            "CLCIV", "CLIMATE", "CMPLXSYS", "COGSCI", "COMM", "COMP", "COMPLIT", "CSP", "CZECH", "DANCE", "DATASCI", "DIGITAL", 
            "DUTCH", "EARTH", "EAS", "ECON", "EDCURINS", "EDUC", "EEB", "EECS", "ELI", "ENGLISH", "ENGR", "ENS", "ENSCEN", "ENVIRON", 
            "ES", "ESENG", "FRENCH", "FTVM", "GEOG", "GERMAN", "GREEK", "GREEKMOD", "GTBOOKS", "HEBREW", "HISTART", "HISTORY", "HONORS", 
            "HS", "HUMGEN", "INSTHUM", "INTLSTD", "INTMED", "IOE", "ISLAM", "ITALIAN", "JAZZ", "JUDAIC", "KINESLGY", "KRSTD", "LACS", 
            "LATIN", "LATINOAM", "LING", "LSWA", "MACROMOL", "MATH", "MATSCIE", "MCDB", "MECHENG", "MEDCHEM", "MELANG", "MEMS", "MENAS", 
            "MFG", "MICROBIOL", "MIDEAST", "MILSCI", "MKT", "MOVESCI", "MUSEUMS", "MUSICOL", "MUSMETH", "MUSTHTRE", "NATIVEAM", "NAVARCH",
            "NAVSCI", "NERS", "NURS", "ORGSTUDY", "PAT", "PATH", "PERSIAN", "PHARMACY", "PHARMSCI", "PHIL", "PHRMACOL", "PHYSICS", "PHYSIOL", 
            "PIBS", "POLISH", "POLSCI", "PORTUG", "PPE", "PSYCH", "PUBHLTH", "PUBPOL", "QMSS", "RCARTS", "RCASL", "RCCORE", "RCHUMS", "RCIDIV", 
            "RCLANG", "RCMUSIC", "RCNSCI", "RCSSCI", "REEES", "RELIGION", "ROMLANG", "ROMLING", "RUSSIAN", "SCAND", "SEAS", "SI", "SLAVIC", "SOC", 
            "SPACE", "SPANISH", "STATS", "STDABRD", "STRATEGY", "TCHNCLCM", "THEORY", "THTREMUS", "TO", "TURKISH", "UARTS", "UC", "UKR", "URP", 
            "WGS", "WRITING", "YIDDISH"]

class_dict = {}
for indiv_class in class_names:
    seen_nums = []
    for unit in data:
        if '('+indiv_class+')' in unit['Subject']:
            if int(unit['Catalog Nbr']) not in seen_nums:
                seen_nums.append(int(unit['Catalog Nbr']))
    class_dict[indiv_class] = seen_nums

links_dict = {}
for indiv_class in class_dict:
    inner_arr = []
    for num in class_dict[indiv_class]: 
        inner_dict = {}
        inner_dict['num'] = num
        inner_dict['cg'] = 'https://www.lsa.umich.edu/cg/cg_detail.aspx?content=2310'+indiv_class+str(num)+'001&termArray=f_20_2310'
        if indiv_class == "CHEM":
            inner_dict['cg'] = 'https://www.lsa.umich.edu/cg/cg_detail.aspx?content=2310'+indiv_class+str(num)+'100&termArray=f_20_2310'
        inner_dict['art'] = 'https://atlas.ai.umich.edu/course/'+indiv_class+'%20'+str(num)+'/'
        inner_arr.append(inner_dict)
    links_dict[indiv_class] = inner_arr

with open('class_links_FA2020.json', 'w') as fp:
    json.dump(links_dict, fp)

