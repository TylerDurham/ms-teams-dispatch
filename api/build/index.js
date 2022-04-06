const pkg = require('../package.json');
const fs = require('fs');
const chalk  = require("chalk");
const style = chalk.bold.green;

const incrementBuildNumber = () => {
    const oldVersion = pkg["version"];
    const version = oldVersion.split(".");
    const buildNumber = parseInt(version.pop());
    version.push(buildNumber + 1);
    newVersion = (version.join("."));
    pkg["version"] = newVersion;
    fs.writeFile("./package.json", JSON.stringify(pkg, null, "  "), (err) => {
        
        if (err) {
            console.error(err);
            return;
        }

        console.log(`> ${style('package.json')} version incremented from '${style(oldVersion)}' to '${style(newVersion)}'.`);
    });
}

incrementBuildNumber();