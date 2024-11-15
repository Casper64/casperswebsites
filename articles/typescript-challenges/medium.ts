type Arr = ['1', '2', '3']

// intuitive solution
type TupleToUnion<T extends readonly unknown[]> = T extends (infer Union)[] ? Union : never

// simplest solution
type TupleToUnion<T extends readonly unknown[]> = T[number]

// recursive solution
type TupleToUnion<T extends readonly unknown[]> = T extends [infer First, ...infer Rest]
	? First | TupleToUnion<Rest>
	: never

type Test = TupleToUnion<Arr> // expected to be '1' | '2' | '3'

