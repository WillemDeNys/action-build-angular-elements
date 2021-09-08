const core = require('@actions/core');
const fse = require('fs-extra');
const concat = require('concat');
const async = require('async');
const path = require('path');
const exec = require('child_process').exec;

async function run() {
    try {
        core.debug(
            ` Available environment variables:\n -> ${Object.keys(process.env)
                .map(i => i + ' :: ' + process.env[i])
                .join('\n -> ')}`
        );

        // set output folder
        const output_folder = (core.getInput('output-folder', { required: false }) || './elements');
        core.setOutput('output-folder', output_folder)

        // set root folder of projects
        const root_folder = (core.getInput('root-folder', { required: false }) || './projects');

        // set path to project folders
        let projectNames = (core.getInput('scan', { required: false }) || '').split(',')
        projectNames = projectNames.toString() ? projectNames : undefined
        const projectPaths = projectNames ? projectNames.map(dir => path.join(root_folder, dir.trim())) : undefined;

        // set element
        const element = (core.getInput('element', { required: false }) || '');

        // if element provided build single element otherwise scan folders and build all elements
        element ? 
        buildSingleElement(element, defineProjectName(element)) : 
        projectPaths ? 
        buildMultipleElements(projectPaths, projectNames) :
        buildAllElements();

        function buildSingleElement(element, project) {
            exec('npx ng build --configuration production --project ' + element + ' --output-hashing none',
                (err) => {
                    if (err) throw err;
                    else console.log("Finished building: " + value + " concatenating and moving output to " + output_folder);
                    concatenate(value, project);
                });
        }

        function buildMultipleElements(foldersToScan, projects) {
            console.log('Building elements from: ' + projects);
            const elementsToBuild = foldersToScan.flatMap((folder, index) => {
                return fse.readdirSync(folder).flatMap(element => {
                    return { name: element, project: projectNames[index] }
                });
            })
            async.forEachOf(elementsToBuild, (value) => {
                buildSingleElement(value.name, value.project);
            })
        }

        function buildAllElements() {
            console.log('Building all elements');
            const elementsToBuild = fse.readdirSync(root_folder).flatMap((folder) => {
                console.log('project-folder: ' + folder)
                return fse.readdirSync(path.join(root_folder,folder)).flatMap(element => {
                    return { name: element, project: folder}
                })
            })
            async.forEachOf(elementsToBuild, (value) => {
                buildSingleElement(value.name, value.project);
            })
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
                console.log(elementName + " from " + projectName + " is successfully build and ready to be published.")
            } catch (err) {
                console.error(err);
            }
        }

        function defineProjectName(element) {
            return fse.readdirSync(root_folder).find(folder => {
                return fse.readdirSync(path.join(root_folder, folder)).find(elementName => {
                    return elementName === element
                })
            })
        }
    } catch (e) {
        core.setFailed(e.message)
    }
}

run();