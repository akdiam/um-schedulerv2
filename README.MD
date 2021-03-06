# ⚡️ umscheduler 

This app allows students at UM to schedule their classes without the sluggishness that comes with schedule building through Wolverine Access. 

## ☄️ How to use
Thanks for checking out umscheduler! Here's a little info that'll help you get the most out of this tool.

1. Add classes to your schedule by navigating to the class you want, adding as many sections as you'd like, and clicking the blue button labeled 'add classes to schedule'
<img width="637" alt="Screen Shot 2020-08-10 at 1 33 52 AM" src="https://user-images.githubusercontent.com/56457896/89754371-9ad1f280-daa9-11ea-90c5-0091a2096bc0.png">

2. Once you've added enough sections to your schedule so that you have multiple options, you'll be able to iterate through your possible schedules with the navigation buttons at the bottom of the schedule
3. If you'd like to remove a class, click on the corresponding blue class button directly beneath the search bar. There will be an option to delete that class from your schedule
<img width="634" alt="Screen Shot 2020-08-10 at 1 32 16 AM" src="https://user-images.githubusercontent.com/56457896/89754307-62321900-daa9-11ea-8f2d-39dd56f839ec.png">

4. To see which sections you've chosen to add to each class, hover your mouse over the class buttons directly beneath the search bar
<img width="244" alt="Screen Shot 2020-08-10 at 1 31 33 AM" src="https://user-images.githubusercontent.com/56457896/89754274-4595e100-daa9-11ea-9c8f-3fd39e6c4ef1.png">


## 🦴 Core features
1. First and foremost, umscheduler is a scheduler generator that gives you **all possible schedules** based on the sections you choose, as well as some constraints listed below
2. umscheduler will automatically detect any conflicts that you have, let you know what they are, and adjust your possible schedules accordingly. **You will never see any time conflicts in any of your schedules**. 
3. umscheduler also takes specific section restrictions into account. For example, for CHEM 130, students registered for Lecture 100 will only be able to register for Discussions 1XX, those registered for Lecture 200 will only be able to register for Discussions 2XX, and so on. There are a lot of really weird ones in the course catalog, but umscheduler takes care of most of them to give you the most accurate possible schedules.
4. Sections that already exist in your list of possible schedules may be silently removed in order to make room for classes you want to add next. However, for any of the classes you've chosen, **there will always be at least one of each section (lec, lab, dis, etc.) remaining per class**. In other words, no class that you add will ever be 'deleted', unless you explicitly delete it yourself. 
5. It's really fun to click through your schedules really fast 

## 🚨 Error and warning messages
If you see this red banner, then **none** of the section type that you tried to add to your schedules could fit. In this particular case, no DIS from CHEM 130 could fit, because of either a time conflict or a section restriction. Red banners will always give you the **class section type** that couldn't be a part of your schedules
<img width="1397" alt="Screen Shot 2020-08-09 at 10 47 43 PM" src="https://user-images.githubusercontent.com/56457896/89748686-656dda80-da92-11ea-94ab-2fe3ec0b9de6.png">

If you see this yellow banner, then only **some** of the section type that you tried to add to your schedules could fit. In this particular case, we're told that CHEM 130 DIS 250 couldn't be added because of either a time conflict or a section restriction. Yellow banners will always give you the **specific class sections** that couldn't be a part of your schedules
<img width="1399" alt="Screen Shot 2020-08-09 at 10 50 24 PM" src="https://user-images.githubusercontent.com/56457896/89748744-bed60980-da92-11ea-807c-de37d52c0452.png">

## 🤒 Issues 
This project relies heavily on the LSA course guide, and the complete course catalog that UM releases publically on their website. Both the course guide and the catalog are HUGE, which is obviously amazing, but it comes with its drawbacks in this application. Unfortunately, because of the sheer size of the resources I'm pulling from, there are many pieces of information missing. For instance, a lot of the lecture/discussion sections don't even have days or times assigned to them yet. This makes visualizing these sections on the calendar impossible, and while they show up when hovering over the class buttons, they can be misleading if you don't see them on your calendar as well

Hopefully next semester's information will be a little more complete, but for now it's just something we have to deal with

##  🛠 Tools

I used React for the front end, and Node/Express for the back end. I also used Python to scrape the class descriptions from the LSA course guide, as well as to generate the links to each class's course guide page and each class's ATLAS page.

## 💣 Difficulties

This was my first project in JS let alone React, so there was a lot to learn, and the structure of this project kinda reflects this. However, I did learn a ton and will take what I learned into whatever project comes up next 🔛🔝🔜✔️

If you'd like to see some of my notes about difficulties that I've come across in this project, check out 'notes.txt' in the home directory!
