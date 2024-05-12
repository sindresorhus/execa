import type {Options} from './arguments/options.js';

// Message when the `serialization` option is `'advanced'`
type AdvancedMessage =
	| string
	| number
	| boolean
	| null
	| object;

// Message when the `serialization` option is `'json'`
type JsonMessage =
	| string
	| number
	| boolean
	| null
	| readonly JsonMessage[]
	| {readonly [key: string | number]: JsonMessage};

/**
Type of messages exchanged between a process and its subprocess using `sendMessage()`, `getOneMessage()` and `getEachMessage()`.

This requires the `ipc` option to be `true`. The type of `message` depends on the `serialization` option.
*/
export type Message<
	Serialization extends Options['serialization'] = Options['serialization'],
> = Serialization extends 'json' ? JsonMessage : AdvancedMessage;

// IPC methods in subprocess
/**
Send a `message` to the parent process.

This requires the `ipc` option to be `true`. The type of `message` depends on the `serialization` option.
*/
export function sendMessage(message: Message): Promise<void>;

/**
Receive a single `message` from the parent process.

This requires the `ipc` option to be `true`. The type of `message` depends on the `serialization` option.
*/
export function getOneMessage(): Promise<Message>;

/**
Iterate over each `message` from the parent process.

This requires the `ipc` option to be `true`. The type of `message` depends on the `serialization` option.
*/
export function getEachMessage(): AsyncIterableIterator<Message>;

// IPC methods in the current process
export type IpcMethods<
	IpcOption extends Options['ipc'],
	Serialization extends Options['serialization'],
> = IpcOption extends true
	? {
		/**
		Send a `message` to the subprocess.

		This requires the `ipc` option to be `true`. The type of `message` depends on the `serialization` option.
		*/
		sendMessage(message: Message<Serialization>): Promise<void>;

		/**
		Receive a single `message` from the subprocess.

		This requires the `ipc` option to be `true`. The type of `message` depends on the `serialization` option.
		*/
		getOneMessage(): Promise<Message<Serialization>>;

		/**
		Iterate over each `message` from the subprocess.

		This requires the `ipc` option to be `true`. The type of `message` depends on the `serialization` option.
		*/
		getEachMessage(): AsyncIterableIterator<Message<Serialization>>;
	}
	// Those methods only work if the `ipc` option is `true`.
	// At runtime, they are actually defined, in order to provide with a nice error message.
	// At type check time, they are typed as `never` to prevent calling them.
	: {
		sendMessage: never;
		getOneMessage: never;
		getEachMessage: never;
	};
