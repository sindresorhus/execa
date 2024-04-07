import {getStdio} from '../helpers/stdio.js';
import {noopGenerator} from '../helpers/generator.js';

export const endOptionStream = ({stream}) => {
	stream.end();
};

export const destroyOptionStream = ({stream, error}) => {
	stream.destroy(error);
};

export const destroySubprocessStream = ({subprocess, fdNumber, error}) => {
	subprocess.stdio[fdNumber].destroy(error);
};

export const getStreamStdio = (fdNumber, stream, useTransform) =>
	getStdio(fdNumber, [stream, useTransform ? noopGenerator(false) : 'pipe']);
