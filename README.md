# herbert
a tool to automatically track and sign up for flextime

### warning: this tool requires you to be able to inspect element in order to inspect http calls, and this only works on Windows.

this project uses **node.js and npm**

upon downloading this folder, be sure to have both node.js and npm installed.

then:
1. ensure your terminal is located in the right folder
2. run `npm install`
3. run `node index.js`
4. follow the onscreen steps

the url and the authentication token are found as such:

head to the day you would like to track and query, ensuring that the blue 'Join Activity' button is available. (e.g if you would like to query April 7th clubs, go to the Day tab and scroll down to the iSTEM 9 & 10 section.)

open your inspect element (`ctrl + shift + I` or `right-click + Inspect`)

head to the network tab located in the top row next to Sources.

click on the blue 'Join Activity' button. you should be able to see a series of HTTP calls in the 'Network' panel.

search for the HTTP call starting with `scheduled-activity`, a request URL starting with `https://ftm2prod-api-k8s.flextimemanager.com/ftm/district/school/flex-period/`, and with `GET`.

when you find the HTTP call fitting all criteria, copy the Request URL section (right click + Copy Value), and scroll down until you find the 'Request Headers' section, in which you'll also need the Authorization value. Copy that as well.

paste these values into the program when requested.
