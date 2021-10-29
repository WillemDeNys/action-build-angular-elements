import merge from 'deepmerge';
import { createBasicConfig } from '@open-wc/building-rollup';
import typescript from '@rollup/plugin-typescript';
import core from '@actions/core';

const element = process.env.npm_config_element;
const project = process.env.npm_config_project;

const output_folder = (core.getInput('output-folder', { required: false }) || './elements');
const root_folder = (core.getInput('root-folder', { required: false }) || './projects');

const baseConfig = createBasicConfig();

export default merge(baseConfig, {
  input: `./${root_folder}/${project}/${element}/src/${element}.lit.ts`,
  output: {
      dir: `${output_folder}/${element}`,
      format: 'esm',
      entryFileNames: `${element}.js`
  },
  plugins: [typescript({
    tsconfig: `./${root_folder}/${project}/${element}/tsconfig.lit.json`
  })]
});
