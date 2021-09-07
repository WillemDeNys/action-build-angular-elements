const core = require('@actions/core');
const fse = require('fs-extra');
const concat = require('concat');
const exec = require('child_process').exec;

async function run() {
    try {
        core.debug(
            ` Available environment variables:\n -> ${Object.keys(process.env)
                .map(i => i + ' :: ' + process.env[i])
                .join('\n -> ')}`
        );

        const scan = (core.getInput('scan', { required: false }) || './projects');
        const output_folder = (core.getInput('output-folder', { required: false }) || './elements');
        core.setOutput('output-folder', output_folder)
        const projectNames = fse.readdirSync(scan);
        console.log("Found following projects: ", projectNames);

        for (let i = 0; i < projectNames.length; i++) {
            var elementNames = fse.readdirSync(scan + "/" + projectNames[i]);
            console.log("Elements found inside " + projectNames[i] + ": " + elementNames);
            for (let j = 0; j < elementNames.length; j++) {
                exec('npx ng build --configuration production --project ' + elementNames[j] + ' --output-hashing none',
                    function (err, stdout, stderr) {
                        if (err) throw err;
                        else console.log("finished building: " + elementNames[j] + " concatenating output now...");
                        concatenate(elementNames[j], projectNames[i]);
                    });
            }
        }

        async function concatenate(elementName, projectName) {
            const files = [
                "./dist/" + elementName + "/runtime.js",
                "./dist/" + elementName + "/polyfills.js",
                "./dist/" + elementName + "/main.js",
            ];
            try {
                await fse.ensureDir(output_folder + "/" + elementName)
                await concat(files, output_folder + "/" + elementName + "/" + elementName + ".js");
                await fse.copyFile(scan + "/" + projectName + "/" + elementName + "/package.json", output_folder + "/" + elementName + "/package.json");
            } catch (err) { 
                console.error(err);
            }
        }
    } catch (e) {
        core.setFailed(e.message)
    }
}

run();