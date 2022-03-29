const fetch = require("cross-fetch");
const chalk = require("chalk");
const inquirer = require("inquirer");
let { createSpinner } = require("nanospinner");

// Be sure to paste your Authorization code (with Bearer included) into the .env file.
// Copy and paste the name of the club you would like to be notified for when it opens.
const checker = "Anime Club!";

const WindowsToaster = require("node-notifier/notifiers/toaster");
const moment = require("moment");

const sleep = (ms = 2000) => new Promise((r) => setTimeout(r, ms));

console.log(
    `hello, my name is ${chalk.bold.blue(
        "herbert"
    )}, and i'm here to help you check classlink ヾ(≧▽≦*)o`
);
console.log(`first, a couple of questions`);
inquirer
    .prompt([
        {
            type: "input",
            name: "queryUrl",
            message: "please give me the url to query.\n",
            validate(input) {
                if (
                    /https:\/\/ftm2prod-api-k8s\.flextimemanager\.com\/ftm\/district\/school\/flex-period\/.*/.test(
                        input
                    )
                ) {
                    return true;
                }

                throw (
                    "this url is invalid. it should be known that the url starts with \n'" +
                    chalk.yellow.italic(
                        "https://ftm2prod-api-k8s.flextimemanager.com/ftm/district/school/flex-period/"
                    ) +
                    `'\nIt should appear when you ${chalk.italic(
                        "select a non-locked club slot."
                    )}`
                );
            },
        },
        {
            type: "input",
            name: "verificationToken",
            message:
                "i'll also need your verification token. otherwise a 401 error will be thrown.",
            validate(input) {
                if (/Bearer [a-zA-z0-9\.-]+/.test(input)) {
                    return true;
                }
                throw `this authentication token is invalid. it should start with ${chalk.bold(
                    "Bearer"
                )} and should contain a ${chalk.italic(
                    "Base-64 encoded token."
                )}.`;
            },
        },
    ])
    .then((answers) => {
        let querySpinner = createSpinner("Querying url...").start();
        fetch(answers.queryUrl, {
            method: "GET",
            headers: {
                Authorization: answers.verificationToken,
            },
        })
            .then(async (response) => {
                let responseJSON = await response.json();
                querySpinner.success({
                    text: "Response received!",
                    mark: chalk.bold.italic.greenBright("ψ(｀∇´)ψ -"),
                });
                let availableClubs = [];
                responseJSON.forEach((club) => {
                    availableClubs.push(club);
                });
                inquirer
                    .prompt([
                        {
                            type: "list",
                            name: "clubSelection",
                            message: `Which club for ${chalk.bold.cyan(
                                availableClubs[0].scheduledDate
                            )} would you like to track?`,
                            choices: availableClubs
                                .filter((a) => {
                                    return (
                                        // a.registeredStudentsCount >=
                                        // a.maxAttendees &&
                                        !a.isRegistered
                                    );
                                })
                                .map(
                                    (a) =>
                                        `${a.title} - (${a.registeredStudentsCount}/${a.maxAttendees})`
                                ),
                        },
                    ])
                    .then((answers2) => {
                        selectedClub = answers2.clubSelection
                            .split("-")[0]
                            .split("");
                        selectedClub.pop();
                        selectedClub = selectedClub.join("");
                        console.log(
                            `great! i'll start tracking ${chalk.yellow.bold(
                                selectedClub
                            )} for changes every ${chalk.cyan.bold(
                                "30 seconds."
                            )}`
                        );
                        let clubInfo = availableClubs.filter(
                            (a) => a.title == selectedClub
                        )[0];
                        let updateSpinner = createSpinner(
                            `testing for updates every 30 seconds...\n\nLast update: ${chalk.cyan.bold(
                                "now"
                            )}\nStatus: ${
                                clubInfo.canRegister
                                    ? chalk.bold.green("open")
                                    : chalk.bold.red("closed")
                            }`
                        ).start();
                        let uuid = clubInfo.uuid;
                        new WindowsToaster().notify(
                            {
                                title: "hello!",
                                message:
                                    "this is herbert. if you can see me, notifications are working! i'll notify you for changes.",
                                id: 1,
                                icon: "./ruski.png",
                                appID: "herbert",
                            },
                            (err, response) => {
                                if (err) {
                                    console.error(err);
                                }
                            }
                        );
                        let lastUpdate = {
                            moment: moment(),
                            currentStatus: clubInfo.canRegister,
                            clubInfo: clubInfo,
                        };
                        setInterval(() => {
                            fetch(answers.queryUrl, {
                                method: "GET",
                                headers: {
                                    Authorization: answers.verificationToken,
                                },
                            })
                                .then(async (response) => {
                                    let responseJSON = await response.json();
                                    let clubInfo = responseJSON.filter(
                                        (a) => a.title == selectedClub
                                    )[0];
                                    let newStatus = clubInfo.canRegister;
                                    if (
                                        lastUpdate.currentStatus !== newStatus
                                    ) {
                                        if (newStatus) {
                                            let postURL = `https://ftm2prod-api-k8s.flextimemanager.com/ftm/district/school/flex-period/activity/scheduled-activity/scheduled-activity-scheduling/${uuid}/student/registration`;
                                            fetch(postURL, {
                                                method: "POST",
                                                headers: {
                                                    Authorization:
                                                        answers.verificationToken,
                                                },
                                            })
                                                .then((a) => {
                                                    console.log(
                                                        `i've successfully signed you up for ${chalk.blue.bold(
                                                            clubInfo.title
                                                        )}!ヾ(•ω•\`)o`
                                                    );
                                                    console.log(
                                                        "well then, my job here is done."
                                                    );
                                                    process.exit(0);
                                                })
                                                .catch((err) => {
                                                    console.error(err);
                                                });
                                        }
                                        lastUpdate = {
                                            moment: moment(),
                                            currentStatus: newStatus,
                                            clubInfo: clubInfo,
                                        };
                                        updateSpinner.update({
                                            text: `testing for updates every 30 seconds...\n\nLast update: ${chalk.cyan.bold(
                                                "now"
                                            )}\nStatus: ${
                                                newStatus
                                                    ? chalk.bold.green("open")
                                                    : chalk.bold.red("closed")
                                            }`,
                                        });
                                        new WindowsToaster().notify(
                                            {
                                                title: newStatus
                                                    ? "hi! great news."
                                                    : "unfortunately...",
                                                message: newStatus
                                                    ? `the club ${
                                                          clubInfo.title
                                                      } now has ${
                                                          clubInfo.maxAttendees -
                                                          clubInfo.registeredStudentsCount
                                                      } vacancies. i'll try to sign you up for it.`
                                                    : `the club ${clubInfo.title} is now full. better luck next time.`,
                                                id: 1,
                                                icon: "./ruski.png",
                                                appID: "herbert",
                                            },
                                            (err, response) => {
                                                if (err) {
                                                    console.error(err);
                                                } else {
                                                    console.log(response);
                                                }
                                            }
                                        );
                                    } else {
                                        if (lastUpdate.currentStatus) {
                                            let postURL = `https://ftm2prod-api-k8s.flextimemanager.com/ftm/district/school/flex-period/activity/scheduled-activity/scheduled-activity-scheduling/${uuid}/student/registration`;
                                            fetch(postURL, {
                                                method: "POST",
                                                headers: {
                                                    Authorization:
                                                        answers.verificationToken,
                                                },
                                            })
                                                .then((a) => {
                                                    console.log(
                                                        `\ni've successfully signed you up for ${chalk.blue.bold(
                                                            clubInfo.title
                                                        )}!ヾ(•ω•\`)o`
                                                    );
                                                    console.log(
                                                        "well then, my job here is done."
                                                    );
                                                    process.exit(0);
                                                })
                                                .catch((err) => {
                                                    console.error(err);
                                                });
                                        }
                                        updateSpinner.update({
                                            text: `testing for updates every 30 seconds...\n\nLast update: ${lastUpdate.moment.fromNow()}\nStatus: ${
                                                lastUpdate.currentStatus
                                                    ? chalk.bold.green("open")
                                                    : chalk.bold.red("closed")
                                            }`,
                                        });
                                    }
                                })
                                .catch((a) => console.error(a));
                        }, 30000);
                    });
            })
            .catch((err) => {
                querySpinner.error({
                    text: "Something went wrong...",
                    mark: "（；´д｀）ゞ",
                });
                console.error(err);
            });
    });

// setInterval(() => {
//     fetch(process.env.URL, {
//         method: "GET",
//         headers: {
//             Authorization: process.env.AUTH,
//         },
//     })
//         .then(async (response) => {
//             let responseJSON = await response.json();
//             responseJSON.forEach((club) => {
//                 console.log(
//                     `${club.title} - ${club.registeredStudentsCount}/${club.maxAttendees}`
//                 );
//             });
//         })
//         .catch((a) => console.log(a));
// }, 10000);
