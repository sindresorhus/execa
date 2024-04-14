export type Not<Value extends boolean> = Value extends true ? false : true;

export type And<First extends boolean, Second extends boolean> = First extends true ? Second : false;

export type Or<First extends boolean, Second extends boolean> = First extends true ? true : Second;

export type Unless<Condition extends boolean, ThenValue, ElseValue = never> = Condition extends true ? ElseValue : ThenValue;

export type AndUnless<Condition extends boolean, ThenValue, ElseValue = unknown> = Condition extends true ? ElseValue : ThenValue;
