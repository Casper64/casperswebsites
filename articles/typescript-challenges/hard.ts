interface Model {
	name: string;
	age: number;
	locations: string[] | null;
}

type ModelEntries = ['name', string] | ['age', number] | ['locations', string[] | null];

type ObjectFromEntriesInfer<T extends [string, unknown]> = {
	[Key in T[0]]: T extends [Key, infer Value] ? Value : never
}

type RenamedObject<T extends [string, unknown]> = {
	[Key in T[0]as `model_${Key}`]: T extends [Key, infer Value] ? Value : never
}

type Renamed = RenamedObject<ModelEntries>

type ObjectFromEntries<T extends [string, unknown]> = {
	[Entry in T as Entry[0]]: Entry[1]
}

type result = ObjectFromEntries<ModelEntries> // expected to be Model

type ObjectValues<T extends object> = {
	[K in keyof T]: T[K]
}[keyof T]

type Values = ObjectValues<Model>



type EntriesFromObject<T extends object> = {
	[Key in keyof T]: [Key, T[Key]]
}[keyof T]

type Entries = EntriesFromObject<Model>