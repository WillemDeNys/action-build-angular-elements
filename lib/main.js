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
        console.log("Found following projects to build: ", projectNames);

        for (let i = 0; i < projectNames.length; i++) {
            exec('npx ng build --configuration production --project ' + projectNames[i] + ' --output-hashing none',
                function (err, stdout, stderr) {
                    if (err) throw err;
                    else console.log("finished building: " + projectNames[i] + " concatenating output now...");
                    concatenate(projectNames[i]);
                });
        }

        async function concatenate(projectName) {
            const files = [
                "./dist/" + projectName + "/runtime.js",
                "./dist/" + projectName + "/polyfills.js",
                "./dist/" + projectName + "/main.js",
            ];
            try {
                await fse.ensureDir(output_folder + "/" + projectName)
                await concat(files, output_folder + "/" + projectName + "/" + projectName + ".js");
                await fse.copyFile(scan + "/" + projectName + "/package.json", output_folder + "/" + projectName + "/package.json");
            } catch (err) { 
                console.error(err);
            }
        }
    } catch (e) {
        core.setFailed(e.message)
    }
}

run();