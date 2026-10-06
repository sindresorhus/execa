#!/usr/bin/env node
import process from 'node:process';
import {text} from 'node:stream/consumers';
import {getReadStream} from '../helpers/fs.js';

// Every file descriptor is read fully, since exiting with unread data in one of them makes the parent fail with `ECONNRESET` on Linux
const contents = await Promise.all(process.argv.slice(2).map(fdNumber => text(getReadStream(Number(fdNumber)))));
process.stdout.write(contents.join(''));
