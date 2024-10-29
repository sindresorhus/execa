import {version} from 'node:process';

export const majorNodeVersion = Number(version.split('.')[0].slice(1));
